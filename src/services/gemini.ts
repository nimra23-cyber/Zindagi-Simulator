/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerStats, Scenario, ChoiceResult, Language, GameSummary } from "../types";

const SCENARIOS_EN: Scenario[] = [
  {
    scenario: "It is a hot morning and your fan stopped working. The repair shop wants five hundred rupees.",
    choices: [
      "I will pay for the repair.",
      "I will use a hand fan to save money.",
      "I will try to fix it myself."
    ]
  },
  {
    scenario: "Your son needs a new notebook for school. It costs two hundred rupees.",
    choices: [
      "I will buy the notebook now.",
      "I will ask him to wait until next week.",
      "I will borrow a notebook from a neighbor."
    ]
  },
  {
    scenario: "Prices of flour and oil have gone up again. You have very little left in the kitchen.",
    choices: [
      "I will buy basic rations today.",
      "I will skip one meal to save money.",
      "I will look for a cheaper store far away."
    ]
  },
  {
    scenario: "Your boss asks you to work late tonight. You are already feeling very tired.",
    choices: [
      "I will work late for extra money.",
      "I will go home to rest.",
      "I will ask for a small advance instead."
    ]
  }
];

const SCENARIOS_UR: Scenario[] = [
  {
    scenario: "Garmi ki subha hai aur aap ka pankha kharab ho gaya hai. Mistri panch sau rupay mang raha hai.",
    choices: [
      "Main pankha theek karwa leta hoon.",
      "Main hath wala pankha istemal karunga.",
      "Main khud theek karne ki koshish karta hoon."
    ]
  },
  {
    scenario: "Aap ke bete ko school ke liye nayi notebook chahiye. Do sau rupay ki aye gi.",
    choices: [
      "Main abhi notebook khareed leta hoon.",
      "Main usay aglay haftay tak rukhtay hoon.",
      "Main parosi se purani mangta hoon."
    ]
  },
  {
    scenario: "Aata aur tail mazeed mehnga ho gaya hai. Kitchen mein bohot kam saaman bacha hai.",
    choices: [
      "Main aaj rashan khareed leta hoon.",
      "Main ek waqt ka khana chorr deta hoon.",
      "Main door kisi sasti dukaan par jata hoon."
    ]
  }
];

export async function generateScenario(_history: any[], language: Language): Promise<Scenario> {
  const pool = language === 'english' ? SCENARIOS_EN : SCENARIOS_UR;
  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export async function processChoice(
  choice: string, 
  currentStats: PlayerStats, 
  _scenario: string,
  _history: any[],
  language: Language
): Promise<ChoiceResult> {
  // Deterministic but realistic logic
  let moneyChange = 0;
  let healthChange = 0;
  let stressChange = 0;
  let resultText = "";

  if (language === 'english') {
    if (choice.includes("pay") || choice.includes("buy")) {
      moneyChange = -300;
      stressChange = -10;
      resultText = "You spent some money, but life is a bit easier now.";
    } else if (choice.includes("wait") || choice.includes("save") || choice.includes("hand fan")) {
      moneyChange = 0;
      stressChange = +15;
      resultText = "You saved money, but the heat and pressure are increasing.";
    } else {
      moneyChange = -50;
      healthChange = -5;
      stressChange = +5;
      resultText = "It was a difficult struggle, but you managed somehow.";
    }
  } else {
    // Urdu logic
    if (choice.includes("khareed") || choice.includes("theek")) {
      moneyChange = -300;
      stressChange = -10;
      resultText = "Paisa kharch hua, lekin thori sukoon mila.";
    } else if (choice.includes("sabar") || choice.includes("bachat") || choice.includes("hath wala")) {
      moneyChange = 0;
      stressChange = +15;
      resultText = "Paisa bacha liya, lekin mushkil barh gayi hai.";
    } else {
      moneyChange = -50;
      healthChange = -5;
      stressChange = +5;
      resultText = "Kaafi mushkil kaam tha, par guzara ho gaya.";
    }
  }

  return {
    result: resultText,
    money: currentStats.money + moneyChange,
    health: currentStats.health + healthChange,
    stress: currentStats.stress + stressChange
  };
}

export async function generateSummary(_history: any[], stats: PlayerStats, language: Language): Promise<GameSummary> {
  const summary = language === 'english' 
    ? "The journey of struggle continues. Life is hard but your spirit is resilient."
    : "Zindagi ki larayi jari hai. Halat mushkil hain par aap ne himmat nahi hari.";
    
  return {
    summary,
    money: stats.money,
    health: stats.health,
    stress: stats.stress
  };
}
