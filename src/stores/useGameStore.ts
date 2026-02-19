import { create } from 'zustand';

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
}

interface GameActions {
  setOCRStatus: (status: OCRStatus) => void;
  setOCRFeedbackState: (state: OCRFeedbackState, data?: OCRFeedbackData | null) => void;
  clearOCRFeedback: () => void;
  incrementOCRFailedAttempts: () => void;
  resetOCRFailedAttempts: () => void;
}

// Store
export const useGameStore = create<GameState & GameActions>((set) => ({
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
}));
