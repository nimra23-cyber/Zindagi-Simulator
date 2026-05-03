/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlayerStats {
  money: number;
  health: number;
  stress: number;
}

export interface Scenario {
  scenario: string;
  choices: string[];
}

export interface ChoiceResult {
  result: string;
  money: number;
  health: number;
  stress: number;
}

export interface GameSummary {
  summary: string;
  money: number;
  health: number;
  stress: number;
}

export type Language = 'english' | 'urdu';

export type GameState = 
  | 'start' 
  | 'loading_scenario' 
  | 'presenting_scenario' 
  | 'processing_choice' 
  | 'showing_result' 
  | 'game_over';
