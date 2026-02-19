import { create } from 'zustand';
import { MasteryTracker } from '../lib/progression';
import type { MasteryLevel, ExerciseResult } from '../types';

// Tipos
export type CPAPhase = 'concrete' | 'pictorial' | 'abstract';

export interface SessionData {
  startTime: number;
  attempts: number;
  correctAnswers: number;
  mistakes: number;
}

export interface OCRStatus {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
}

export type OCRFeedbackState = 'idle' | 'confirming' | 'retry' | 'validating';

export interface OCRFeedbackData {
  digit: number | null;
  confidence: number;
}

export interface GameState {
  currentExercise: string | null;
  cpaPhase: CPAPhase;
  level: number;
  sessionData: SessionData | null;
  ocrStatus: OCRStatus;
  ocrFeedbackState: OCRFeedbackState;
  ocrFeedbackData: OCRFeedbackData | null;
  ocrFailedAttempts: number;

  // Maestria e progressão
  currentLevel: MasteryLevel;
  masteryTracker: MasteryTracker;

  // Estatísticas da sessão
  sessionStats: {
    totalExercises: number;
    correct: number;
    incorrect: number;
    fastCount: number;
    slowCount: number;
    hesitantCount: number;
  };
  lastProgressionDecision: string;
}

interface GameActions {
  setOCRStatus: (status: OCRStatus) => void;
  setOCRFeedbackState: (state: OCRFeedbackState, data?: OCRFeedbackData | null) => void;
  clearOCRFeedback: () => void;
  incrementOCRFailedAttempts: () => void;
  resetOCRFailedAttempts: () => void;

  // Ações de progressão
  submitExercise: (result: ExerciseResult) => void;
  resetProgress: () => void;
}

// Nível inicial (Small Steps — primeiro passo)
const INITIAL_LEVEL: MasteryLevel = {
  operation: 'addition',
  maxResult: 5,
  cpaPhase: 'abstract',
};

// Store
export const useGameStore = create<GameState & GameActions>((set, get) => ({
  currentExercise: null,
  cpaPhase: 'concrete',
  level: 1,
  sessionData: null,
  ocrStatus: {
    isReady: false,
    isLoading: true,
    error: null,
  },
  ocrFeedbackState: 'idle',
  ocrFeedbackData: null,
  ocrFailedAttempts: 0,

  // Estado de progressão
  currentLevel: INITIAL_LEVEL,
  masteryTracker: new MasteryTracker(INITIAL_LEVEL),
  sessionStats: {
    totalExercises: 0,
    correct: 0,
    incorrect: 0,
    fastCount: 0,
    slowCount: 0,
    hesitantCount: 0,
  },
  lastProgressionDecision: 'maintain',

  // Actions OCR (mantidas)
  setOCRStatus: (status: OCRStatus) => set({ ocrStatus: status }),
  setOCRFeedbackState: (state: OCRFeedbackState, data?: OCRFeedbackData | null) =>
    set({
      ocrFeedbackState: state,
      ocrFeedbackData: data ?? null
    }),
  clearOCRFeedback: () =>
    set({
      ocrFeedbackState: 'idle',
      ocrFeedbackData: null
    }),
  incrementOCRFailedAttempts: () =>
    set((state) => ({ ocrFailedAttempts: state.ocrFailedAttempts + 1 })),
  resetOCRFailedAttempts: () => set({ ocrFailedAttempts: 0 }),

  // Action principal: submeter exercício e atualizar progressão
  submitExercise: (result: ExerciseResult) => {
    const { masteryTracker, currentLevel } = get();

    // 1. Adicionar resultado ao tracker
    masteryTracker.addResult(result);

    // 2. Analisar progressão
    const analysis = masteryTracker.analyze();

    // 3. Atualizar estatísticas da sessão
    set((state) => ({
      sessionStats: {
        totalExercises: state.sessionStats.totalExercises + 1,
        correct: state.sessionStats.correct + (result.correct ? 1 : 0),
        incorrect: state.sessionStats.incorrect + (result.correct ? 0 : 1),
        fastCount: state.sessionStats.fastCount + (result.speed === 'fast' ? 1 : 0),
        slowCount: state.sessionStats.slowCount + (result.speed === 'slow' ? 1 : 0),
        hesitantCount: state.sessionStats.hesitantCount + (result.speed === 'hesitant' ? 1 : 0),
      },
      lastProgressionDecision: analysis.decision,
    }));

    // 4. Aplicar decisão de progressão
    if (analysis.decision !== 'maintain' && analysis.newLevel) {
      console.log('📈 Mudança de nível detectada:', {
        decision: analysis.decision,
        from: currentLevel,
        to: analysis.newLevel,
        reason: analysis.reason,
      });

      masteryTracker.updateLevel(analysis.newLevel);
      set({ currentLevel: analysis.newLevel });

      // TODO: Mostrar feedback visual na UI (toast/modal "Novo desafio!")
    }
  },

  // Resetar progresso (para debug/testes)
  resetProgress: () => {
    const newTracker = new MasteryTracker(INITIAL_LEVEL);
    set({
      currentLevel: INITIAL_LEVEL,
      masteryTracker: newTracker,
      sessionStats: {
        totalExercises: 0,
        correct: 0,
        incorrect: 0,
        fastCount: 0,
        slowCount: 0,
        hesitantCount: 0,
      },
      lastProgressionDecision: 'maintain',
    });
  },
}));
