import { create } from 'zustand';
import type { CPAPhase } from './useGameStore';

// Tipos
export interface HistoryEntry {
  exerciseId: string;
  timestamp: number;
  wasCorrect: boolean;
  attempts: number;
  cpaPhase: CPAPhase;
}

export interface ProgressState {
  history: HistoryEntry[];
  stars: Record<string, number>;
  unlockedLevels: number[];
}

// Store
export const useProgressStore = create<ProgressState>(() => ({
  history: [],
  stars: {},
  unlockedLevels: [1],
}));
