import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { calculateSessionCoins } from '../lib/coinCalculator';
import type { MasteryLevel, ExerciseResult, GameMode } from '../types';
import { DEFAULT_GAME_MODE, DIFFICULTY_MAX_RESULT } from '../types';

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
  /** Exercícios resolvidos com velocidade 'fast' — usado para o multiplicador x2 de moedas */
  fastCount: number;
  startTime: number;
}

export interface SessionSummary {
  correct: number;
  incorrect: number;
  total: number;
  durationMs: number;
  starsEarned: number;
  accuracy: number;
  /** Moedas ganhas nesta sessão (base × multiplicador) */
  coinsEarned: number;
  /** true se o multiplicador x2 de velocidade foi ativado (≥7 respostas rápidas) */
  speedBonus: boolean;
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

  // Nível atual (derivado do GameMode selecionado)
  currentLevel: MasteryLevel;

  // Modo selecionado pela criança (persistido)
  selectedMode: GameMode;

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

  /** @deprecated Mantido para compatibilidade com localStorage existente */
  subtractionBannerSeen: boolean;
  /** @deprecated Mantido para compatibilidade com localStorage existente */
  multiDigitBannerSeen: boolean;
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
  /** @deprecated Mantido para compatibilidade */
  dismissSubtractionBanner: () => void;
  /** @deprecated Mantido para compatibilidade */
  dismissMultiDigitBanner: () => void;

  // Ações de sessão (rodada de 10 exercícios)
  startSession: (mode?: GameMode) => void;
  /** Retorna true se a sessão acabou (10 exercícios) */
  isSessionComplete: () => boolean;
  endSession: () => SessionSummary;

  /** Atualiza o modo selecionado pela criança */
  setSelectedMode: (mode: GameMode) => void;
}

/**
 * Converte GameMode → MasteryLevel para compatibilidade com generateProblem
 */
function gameModeToLevel(mode: GameMode): MasteryLevel {
  return {
    operation: mode.operation,
    maxResult: DIFFICULTY_MAX_RESULT[mode.difficulty],
    cpaPhase: 'abstract',
  };
}

// Nível inicial derivado do GameMode padrão
const INITIAL_LEVEL: MasteryLevel = gameModeToLevel(DEFAULT_GAME_MODE);

// Store com persistência
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
  currentExercise: null,
  cpaPhase: 'concrete' as CPAPhase,
  level: 1,
  sessionData: null,
  ocrStatus: {
    isReady: false,
    isLoading: true,
    error: null,
  },
  ocrFeedbackState: 'idle' as OCRFeedbackState,
  ocrFeedbackData: null,
  ocrFailedAttempts: 0,

  // Estado de progressão
  currentLevel: INITIAL_LEVEL,
  selectedMode: DEFAULT_GAME_MODE,
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
    fastCount: 0,
    startTime: 0,
  },
  lastSessionSummary: null,

  totalStars: 0,
  subtractionBannerSeen: false,
  multiDigitBannerSeen: false,

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

  // Atualiza o modo selecionado e o currentLevel derivado
  setSelectedMode: (mode: GameMode) => {
    set({
      selectedMode: mode,
      currentLevel: gameModeToLevel(mode),
    });
  },

  // Action principal: submeter exercício e atualizar estatísticas
  // Sem progressão automática — nível é fixo conforme GameMode selecionado
  submitExercise: (result: ExerciseResult) => {
    set((state) => ({
      sessionStats: {
        totalExercises: state.sessionStats.totalExercises + 1,
        correct: state.sessionStats.correct + (result.correct ? 1 : 0),
        incorrect: state.sessionStats.incorrect + (result.correct ? 0 : 1),
        fastCount: state.sessionStats.fastCount + (result.speed === 'fast' ? 1 : 0),
        slowCount: state.sessionStats.slowCount + (result.speed === 'slow' ? 1 : 0),
        hesitantCount: state.sessionStats.hesitantCount + (result.speed === 'hesitant' ? 1 : 0),
      },
      lastProgressionDecision: 'maintain',
      // Atualizar sessão atual
      sessionRound: {
        ...state.sessionRound,
        exerciseIndex: state.sessionRound.exerciseIndex + 1,
        correct: state.sessionRound.correct + (result.correct ? 1 : 0),
        incorrect: state.sessionRound.incorrect + (result.correct ? 0 : 1),
        fastCount: state.sessionRound.fastCount + (result.speed === 'fast' ? 1 : 0),
      },
    }));
  },

  // Iniciar nova sessão com modo selecionado
  startSession: (mode?: GameMode) => {
    const gameMode = mode ?? get().selectedMode;
    set({
      selectedMode: gameMode,
      currentLevel: gameModeToLevel(gameMode),
      sessionRound: {
        isActive: true,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        fastCount: 0,
        startTime: Date.now(),
      },
    });
  },

  // Verificar se a sessão está completa
  isSessionComplete: () => {
    const { sessionRound } = get();
    return sessionRound.isActive && sessionRound.exerciseIndex >= SESSION_SIZE;
  },

  // Encerrar sessão, calcular estrelas e moedas
  endSession: () => {
    const { sessionRound, currentLevel } = get();

    if (!sessionRound.isActive) {
      console.warn('[endSession] Chamada ignorada — sessão não está ativa');
      return {
        correct: 0, incorrect: 0, total: 0, durationMs: 0,
        starsEarned: 0, accuracy: 0, coinsEarned: 0, speedBonus: false,
      };
    }

    const total = sessionRound.exerciseIndex;
    const accuracy = total > 0 ? sessionRound.correct / total : 0;
    const durationMs = Date.now() - sessionRound.startTime;

    // Premiação em estrelas: +1 por completar, +2 se ≥80%, +3 se 100%
    let starsEarned = 1;
    if (accuracy >= 1) {
      starsEarned = 3;
    } else if (accuracy >= 0.8) {
      starsEarned = 2;
    }

    // Premiação em moedas para o bichinho virtual
    const { totalCoins, speedBonus } = calculateSessionCoins(
      sessionRound.correct,
      sessionRound.fastCount,
      currentLevel,
    );

    const summary: SessionSummary = {
      correct: sessionRound.correct,
      incorrect: sessionRound.incorrect,
      total,
      durationMs,
      starsEarned,
      accuracy,
      coinsEarned: totalCoins,
      speedBonus,
    };

    set((state) => ({
      sessionRound: {
        isActive: false,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        fastCount: 0,
        startTime: 0,
      },
      lastSessionSummary: summary,
      totalStars: state.totalStars + starsEarned,
    }));

    return summary;
  },

  dismissSubtractionBanner: () => set({ subtractionBannerSeen: true }),
  dismissMultiDigitBanner: () => set({ multiDigitBannerSeen: true }),

  // Resetar progresso (para debug/testes)
  resetProgress: () => {
    set({
      currentLevel: INITIAL_LEVEL,
      selectedMode: DEFAULT_GAME_MODE,
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
      subtractionBannerSeen: false,
      multiDigitBannerSeen: false,
      sessionRound: {
        isActive: false,
        exerciseIndex: 0,
        correct: 0,
        incorrect: 0,
        fastCount: 0,
        startTime: 0,
      },
      lastSessionSummary: null,
    });
  },
    }),
    {
      name: 'kumon-game-storage',
      storage: createJSONStorage(() => localStorage),
      // Salvar apenas campos serializáveis
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        selectedMode: state.selectedMode,
        sessionStats: state.sessionStats,
        lastProgressionDecision: state.lastProgressionDecision,
        totalStars: state.totalStars,
        lastSessionSummary: state.lastSessionSummary,
        subtractionBannerSeen: state.subtractionBannerSeen,
        multiDigitBannerSeen: state.multiDigitBannerSeen,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('[useGameStore] Erro ao hidratar:', error);
            return;
          }

          if (state) {
            // Se temos selectedMode salvo, derivar currentLevel dele
            if (state.selectedMode) {
              state.currentLevel = gameModeToLevel(state.selectedMode);
            }
            console.log('[useGameStore] Estado hidratado. Modo:', state.selectedMode);
          }
        };
      },
    }
  )
);
