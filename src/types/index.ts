// TypeScript types e interfaces globais do projeto
// Serão definidas conforme as specs de cada feature

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Exercise {
  // Será definido conforme spec
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Progress {
  // Será definido conforme spec
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface Settings {
  // Será definido conforme spec
}

// Sistema de Progressão (Kumon + CPA)
export type {
  CpaPhase,
  Operation,
  ProblemResult,
  MasteryLevel,
} from './progression';

// Problemas Matemáticos
export type { Problem } from './problem';

// Detector de Hesitação
export type {
  ResponseSpeed,
  HesitationTimerState,
  HesitationAnalysis,
  HesitationConfig,
} from './hesitation';
export { DEFAULT_HESITATION_CONFIG } from './hesitation';

// Algoritmo de Maestria
export type {
  ExerciseResult,
  ProgressionDecision,
  MasteryAnalysis,
  MasteryConfig,
} from './mastery';
export {
  DEFAULT_MASTERY_CONFIG,
  MICROLEVEL_PROGRESSION,
  CPA_PROGRESSION,
} from './mastery';

// Seleção de Nível (GameMode)
export type {
  OperationMode,
  DifficultyLevel,
  GameMode,
} from './gameMode';
export {
  DIFFICULTY_MAX_RESULT,
  DIFFICULTY_COINS,
  DEFAULT_GAME_MODE,
} from './gameMode';
