import { create } from 'zustand';

// Tipos
export type CPAPhase = 'concrete' | 'pictorial' | 'abstract';

export interface SessionData {
  startTime: number;
  attempts: number;
  correctAnswers: number;
  mistakes: number;
}

export interface GameState {
  currentExercise: string | null;
  cpaPhase: CPAPhase;
  level: number;
  sessionData: SessionData | null;
}

// Store
export const useGameStore = create<GameState>(() => ({
  currentExercise: null,
  cpaPhase: 'concrete',
  level: 1,
  sessionData: null,
}));
