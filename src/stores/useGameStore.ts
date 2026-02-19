import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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

export const SESSION_SIZE = 10;

export interface SessionRound {
  isActive: boolean;
  exerciseIndex: number;
  correct: number;
  incorrect: number;
  startTime: number;
}

export interface SessionSummary {
  correct: number;
  incorrect: number;
  total: number;
  durationMs: number;
  starsEarned: number;
  accuracy: number;
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

  // Estatísticas globais (acumuladas)
  sessionStats: {
    totalExercises: number;
    correct: number;
    incorrect: number;
    fastCount: number;
    slowCount: number;
    hesitantCount: number;
  };
  lastProgressionDecision: string;

  // Sessão atual (rodada de 10 exercícios)
  sessionRound: SessionRound;
  lastSessionSummary: SessionSummary | null;

  // Progresso geral
  totalStars: number;
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

  // Ações de sessão (rodada de 10 exercícios)
  startSession: () => void;
  /** Retorna true se a sessão acabou (10 exercícios) */
  isSessionComplete: () => boolean;
  endSession: () => SessionSummary;
}

// Nível inicial (Small Steps — primeiro passo)
const INITIAL_LEVEL: MasteryLevel = {
  operation: 'addition',
  maxResult: 5,
  cpaPhase: 'abstract',
};

// Store com persistência
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
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

  // Sessão atual
  sessionRound: {
    isActive: false,
    exerciseIndex: 0,
    correct: 0,
    incorrect: 0,
    startTime: 0,
  },
  lastSessionSummary: null,

  totalStars: 0,

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

    // 3. Atualizar estatísticas globais + sessão atual
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
      // Atualizar sessão atual
      sessionRound: {
        ...state.sessionRound,
        exerciseIndex: state.sessionRound.exerciseIndex + 1,
        correct: state.sessionRound.correct + (result.correct ? 1 : 0),
        incorrect: state.sessionRound.incorrect + (result.correct ? 0 : 1),
      },
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

  // Iniciar nova sessão (rodada de 10 exercícios)
  startSession: () => {
    set({
      sessionRound: {
        isActive: true,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        startTime: Date.now(),
      },
    });
  },

  // Verificar se a sessão está completa
  isSessionComplete: () => {
    const { sessionRound } = get();
    return sessionRound.isActive && sessionRound.exerciseIndex >= SESSION_SIZE;
  },

  // Encerrar sessão e calcular estrelas
  endSession: () => {
    const { sessionRound } = get();
    const total = sessionRound.exerciseIndex;
    const accuracy = total > 0 ? sessionRound.correct / total : 0;
    const durationMs = Date.now() - sessionRound.startTime;

    // Premiação: +1 por completar, +2 se ≥80%, +3 se 100%
    let starsEarned = 1; // completou sessão
    if (accuracy >= 1) {
      starsEarned = 3;
    } else if (accuracy >= 0.8) {
      starsEarned = 2;
    }

    const summary: SessionSummary = {
      correct: sessionRound.correct,
      incorrect: sessionRound.incorrect,
      total,
      durationMs,
      starsEarned,
      accuracy,
    };

    set((state) => ({
      sessionRound: {
        isActive: false,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        startTime: 0,
      },
      lastSessionSummary: summary,
      totalStars: state.totalStars + starsEarned,
    }));

    return summary;
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
      totalStars: 0,
      sessionRound: {
        isActive: false,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        startTime: 0,
      },
      lastSessionSummary: null,
    });
  },
    }),
    {
      name: 'kumon-game-storage',
      storage: createJSONStorage(() => localStorage),
      // Salvar apenas campos serializáveis (MasteryTracker será reconstruído)
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        sessionStats: state.sessionStats,
        lastProgressionDecision: state.lastProgressionDecision,
        totalStars: state.totalStars,
        lastSessionSummary: state.lastSessionSummary,
      }),
      // Reconstruir MasteryTracker após hidratação
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[useGameStore] Erro ao hidratar:', error);
            return;
          }

          if (state) {
            // Reconstruir tracker com o nível salvo
            const tracker = new MasteryTracker(state.currentLevel);
            state.masteryTracker = tracker;
            console.log('[useGameStore] Estado hidratado com sucesso. Nível:', state.currentLevel);
          }
        };
      },
    }
  )
);
