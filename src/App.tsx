/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Wallet, Brain, Sparkles, RefreshCcw, AlertTriangle, Languages, Power, Volume2, VolumeX } from 'lucide-react';
import { StatBar } from './components/StatBar';
import { ChoiceButton } from './components/ChoiceButton';
import { generateScenario, processChoice, generateSummary } from './services/gemini';
import { PlayerStats, Scenario, ChoiceResult, GameState, Language } from './types';

const INITIAL_STATS: PlayerStats = {
  money: 1000,
  health: 80,
  stress: 20
};

export default function App() {
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [gameState, setGameState] = useState<GameState>('start');
  const [language, setLanguage] = useState<Language>('english');
  const [currentScenario, setCurrentScenario] = useState<Scenario | null>(null);
  const [choiceResult, setChoiceResult] = useState<ChoiceResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [day, setDay] = useState(1);
  const [journeySummary, setJourneySummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);

  const speak = useCallback((text: string, cancel = false) => {
    if (!isVoiceEnabled) return;
    if (cancel) window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'english' ? 'en-US' : 'hi-IN';
    utterance.rate = 0.95;
    window.speechSynthesis.speak(utterance);
  }, [isVoiceEnabled, language]);

  const loadNewScenario = useCallback(async (currentHistory: any[], currentDay: number, currentLang: Language) => {
    setGameState('loading_scenario');
    try {
      const scenario = await generateScenario(currentHistory, currentLang);
      setCurrentScenario(scenario);
      setGameState('presenting_scenario');
      
      setHistory(prev => [...prev, { role: 'model', parts: [{ text: `Day ${currentDay}: ${JSON.stringify(scenario)}` }] }]);
    } catch (error: any) {
      console.error("Error loading scenario:", error);
      setGameState('game_over');
    }
  }, []);

  const startGame = () => {
    setStats(INITIAL_STATS);
    setHistory([]);
    setDay(1);
    setJourneySummary(null);
    setIsGeneratingSummary(false);
    setChoiceResult(null);
    setCurrentScenario(null);
    loadNewScenario([], 1, language);
  };

  const endGame = async (finalHistory: any[], finalStats: PlayerStats) => {
    setGameState('game_over');
    setIsGeneratingSummary(true);
    try {
      // Add a marker in history that the game was ended explicitly if it wasn't a death
      const summaryResult = await generateSummary(finalHistory, finalStats, language);
      setJourneySummary(summaryResult.summary);
      setStats({
        money: summaryResult.money,
        health: summaryResult.health,
        stress: summaryResult.stress
      });
    } catch (error: any) {
      console.error("Error generating summary:", error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const quitGame = () => {
    const quittingHistory = [
      ...history,
      { role: 'user', parts: [{ text: "end game/quit" }] }
    ];
    setHistory(quittingHistory);
    endGame(quittingHistory, stats);
  };

  const handleChoiceSelect = async (choice: string) => {
    if (!currentScenario) return;
    
    setGameState('processing_choice');
    try {
      const result = await processChoice(choice, stats, currentScenario.scenario, history, language);
      setChoiceResult(result);
      
      const nextStats = {
        money: Math.max(0, result.money),
        health: Math.min(100, Math.max(0, result.health)),
        stress: Math.min(100, Math.max(0, result.stress))
      };
      
      setStats(nextStats);

      const updatedHistory = [
        ...history, 
        { role: 'user', parts: [{ text: `Choice: ${choice}` }] },
        { role: 'model', parts: [{ text: JSON.stringify(result) }] }
      ];
      setHistory(updatedHistory);

      if (nextStats.health < 20 || nextStats.money <= 0 || nextStats.stress >= 100) {
        endGame(updatedHistory, nextStats);
      } else {
        setGameState('showing_result');
      }
    } catch (error: any) {
      console.error("Error processing choice:", error);
      setGameState('game_over');
    }
  };

  const nextTurn = () => {
    const nextDay = day + 1;
    setDay(nextDay);
    setChoiceResult(null);
    loadNewScenario(history, nextDay, language);
  };

  useEffect(() => {
    if (stats.health < 20 || stats.money <= 0 || stats.stress >= 100) {
      if (gameState !== 'game_over' && gameState !== 'start' && gameState !== 'loading_scenario') {
        endGame(history, stats);
      }
    }
  }, [stats, gameState, history]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'english' ? 'urdu' : 'english');
    window.speechSynthesis.cancel();
  };

  const toggleVoice = () => {
    setIsVoiceEnabled(prev => !prev);
    if (isVoiceEnabled) window.speechSynthesis.cancel();
  };

  useEffect(() => {
    if (gameState === 'presenting_scenario' && currentScenario) {
      window.speechSynthesis.cancel();
      speak(currentScenario.scenario);
      
      // Queue choices with slight pauses
      currentScenario.choices.forEach((choice) => {
        speak(choice);
      });
    }
  }, [gameState, currentScenario, speak]);

  useEffect(() => {
    if (gameState === 'showing_result' && choiceResult) {
      speak(choiceResult.result, true);
    }
  }, [gameState, choiceResult, speak]);

  useEffect(() => {
    if (gameState === 'game_over' && journeySummary) {
      speak(journeySummary, true);
    }
  }, [gameState, journeySummary, speak]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto">
      {/* HUD / Stats Bar */}
      {gameState !== 'start' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full grid grid-cols-1 md:grid-cols-5 gap-4 mb-8 p-6 rounded-2xl card-gradient items-center"
        >
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{language === 'english' ? 'Time' : 'Waqt'}</span>
            <span className="text-xl font-serif text-accent-orange">Day {day}</span>
          </div>
          <StatBar 
            label={language === 'english' ? 'Money' : 'Paisa'} 
            value={stats.money} 
            max={5000} 
            color="bg-pakistan-green" 
            isCurrency={true}
            icon={<Wallet className="w-4 h-4 text-pakistan-green" />} 
          />
          <StatBar 
            label={language === 'english' ? 'Health' : 'Sehat'} 
            value={stats.health} 
            max={100} 
            color="bg-red-500" 
            icon={<Heart className="w-4 h-4 text-red-500" />} 
          />
          <StatBar 
            label={language === 'english' ? 'Stress' : 'Zehni Bojh'} 
            value={stats.stress} 
            max={100} 
            color="bg-accent-orange" 
            icon={<Brain className="w-4 h-4 text-accent-orange" />} 
          />
          <div className="flex justify-end gap-2">
            <button 
              onClick={toggleVoice}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              title="Toggle Voice"
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4 text-accent-orange" /> : <VolumeX className="w-4 h-4 text-white/40" />}
            </button>
            <button 
              onClick={toggleLanguage}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors border border-white/10"
              title="Switch Language"
            >
              <Languages className="w-4 h-4 text-white/60" />
            </button>
            {gameState !== 'game_over' && (
              <button 
                onClick={quitGame}
                className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors border border-red-500/20"
                title="End Game"
              >
                <Power className="w-4 h-4 text-red-500/60" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Main Game Area */}
      <div className="w-full flex-grow flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {gameState === 'start' && (
            <motion.div 
              key="start"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-8"
              id="start-screen"
            >
              <div className="space-y-4">
                <motion.h1 
                   className="text-5xl md:text-8xl font-serif italic text-accent-orange font-bold drop-shadow-xl"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  Zindagi Simulator
                </motion.h1>
                <p className="text-xl md:text-2xl text-white/60 font-light tracking-wide max-w-lg mx-auto">
                  {language === 'english' 
                    ? 'A survival simulation of daily life in Pakistan.' 
                    : 'Pakistan mein guzara karne ki aik pur-asar kahani.'}
                </p>
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  id="btn-start-game"
                  onClick={startGame}
                  className="px-12 py-4 bg-pakistan-green hover:bg-pakistan-green/80 text-white rounded-full text-xl font-bold tracking-widest uppercase transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(0,102,0,0.3)]"
                >
                  {language === 'english' ? 'Begin Your Story' : 'Apni Kahani Shuru Karein'}
                </button>

                <div className="flex items-center gap-3 bg-white/5 p-1 rounded-full border border-white/10">
                  <button 
                    onClick={() => setLanguage('english')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'english' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    ENGLISH
                  </button>
                  <button 
                    onClick={() => setLanguage('urdu')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === 'urdu' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                  >
                    URDU
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {gameState === 'loading_scenario' && (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-6"
              id="loading-screen"
            >
              <div className="relative">
                <RefreshCcw className="w-16 h-16 text-accent-orange animate-spin duration-[3000ms]" />
                <Sparkles className="w-6 h-6 text-white absolute top-0 right-0 animate-pulse" />
              </div>
              <p className="text-white/40 font-mono tracking-tighter uppercase text-sm animate-pulse">
                {language === 'english' ? 'Simulating life...' : 'Zindagi ke faisle ho rahe hain...'}
              </p>
            </motion.div>
          )}

          {gameState === 'presenting_scenario' && currentScenario && (
            <motion.div 
              key="scenario"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
              id="scenario-container"
            >
              <div className="space-y-4 text-center md:text-left">
                <span className="inline-block px-3 py-1 bg-accent-orange/20 text-accent-orange rounded-full text-[10px] uppercase font-bold tracking-widest border border-accent-orange/30">
                  {language === 'english' ? 'New Day' : 'Naya Din'}
                </span>
                <h2 className="text-2xl md:text-3xl font-serif leading-relaxed text-balance">
                  {currentScenario.scenario}
                </h2>
              </div>
              
              <div className="grid grid-cols-1 gap-4 mt-8">
                {currentScenario.choices.map((choice, idx) => (
                  <ChoiceButton 
                    key={idx} 
                    text={choice} 
                    delay={idx * 0.12}
                    onClick={() => handleChoiceSelect(choice)} 
                  />
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'processing_choice' && (
            <motion.div 
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center"
              id="processing-screen"
            >
              <p className="text-xl font-serif italic text-white/50">
                {language === 'english' ? 'Deciding your fate...' : 'Taqdeer likhi ja rahi hai...'}
              </p>
            </motion.div>
          )}

          {gameState === 'showing_result' && choiceResult && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="w-full card-gradient p-8 md:p-12 rounded-3xl space-y-8 relative overflow-hidden"
              id="result-container"
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-orange/5 blur-3xl rounded-full" />
              
              <div className="space-y-6 text-center">
                <Sparkles className="w-8 h-8 text-accent-orange mx-auto opacity-50" />
                <p className="text-xl md:text-2xl font-medium leading-relaxed italic text-balance">
                  {choiceResult.result}
                </p>
              </div>

              <div className="flex justify-center">
                <button 
                  id="btn-next-day"
                  onClick={nextTurn}
                  className="group flex items-center gap-3 px-8 py-3 rounded-full border border-white/20 hover:border-accent-orange transition-all hover:bg-white/5 active:scale-95"
                >
                  <span className="font-bold tracking-widest uppercase">{language === 'english' ? 'Next Day' : 'Agla Din'}</span>
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'game_over' && (
            <motion.div 
              key="game_over"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center p-8 md:p-12 card-gradient rounded-3xl border-red-500/30 border-2"
              id="game-over-screen"
            >
              <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6" />
              <h2 className="text-3xl md:text-4xl font-serif font-bold text-red-500 mb-4">
                {language === 'english' ? 'Guzara Mushkil Ho Gaya' : 'Zindagi ne Thaka Diya'}
              </h2>
              
              <AnimatePresence mode="wait">
                {isGeneratingSummary ? (
                  <motion.div 
                    key="generating"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="py-4"
                  >
                    <p className="text-white/40 italic">
                      {language === 'english' ? 'Finalizing your journey...' : 'Kahani ka ikhtitam ho raha hai...'}
                    </p>
                  </motion.div>
                ) : journeySummary ? (
                  <motion.div 
                    key="summary"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/10 p-6 md:p-8 rounded-2xl border border-white/10 mb-8"
                  >
                     <p className="text-lg md:text-xl font-serif leading-relaxed italic text-balance text-white/90">
                      "{journeySummary}"
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-white/60 mb-8 max-w-md mx-auto">
                    {language === 'english' ? 'The weight of life in Pakistan was too much to bear.' : 'Pakistan mein guzara karna bohot mushkil ho gaya.'}
                  </p>
                )}
              </AnimatePresence>
              
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 flex justify-between md:flex-col md:items-start p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-white/40 uppercase text-[10px] font-bold">{language === 'english' ? 'Days Survived' : 'Kitnay Din'}</span>
                  <span className="font-bold">{day} {language === 'english' ? 'Days' : 'Din'}</span>
                </div>
                <div className="flex-1 flex justify-between md:flex-col md:items-start p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-white/40 uppercase text-[10px] font-bold">{language === 'english' ? 'Final Assets' : 'Akhri Jama-Poonji'}</span>
                  <span className="font-bold text-pakistan-green">Rs. {stats.money}</span>
                </div>
                <div className="flex-1 flex justify-between md:flex-col md:items-start p-3 bg-white/5 rounded-xl border border-white/10">
                  <span className="text-white/40 uppercase text-[10px] font-bold">{language === 'english' ? 'Health' : 'Sehat'}</span>
                  <span className="font-bold text-red-400">{stats.health}%</span>
                </div>
              </div>

              <button 
                id="btn-restart"
                onClick={startGame}
                className="w-full md:w-auto px-10 py-4 bg-white text-black font-black uppercase tracking-widest hover:bg-white/80 transition-colors rounded-full"
              >
                {language === 'english' ? 'Try Again, Resilient Soul' : 'Dobara Koshish Karein'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Branding */}
      <footer className="mt-auto pt-8 pb-4 text-[10px] uppercase tracking-[0.5em] text-white/20 font-bold">
        Zindagi Simulator • AI Engine
      </footer>
    </div>
  );
}

// Internal reusable Icon helper
function ChevronRight(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}

