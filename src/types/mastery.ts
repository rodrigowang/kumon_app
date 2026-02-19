/**
 * Tipos para Algoritmo de Maestria
 */

import type { ResponseSpeed, ProblemResult, MasteryLevel } from './index';

/**
 * Resultado individual de um exercício (para buffer)
 *
 * @property correct - Se acertou
 * @property speed - Velocidade da resposta (fast/slow/hesitant)
 * @property timeMs - Tempo levado (ms)
 * @property attempts - Tentativas até acertar
 * @property timestamp - Quando foi resolvido
 */
export interface ExerciseResult {
  correct: boolean;
  speed: ResponseSpeed;
  timeMs: number;
  attempts: number;
  timestamp: number; // Date.now()
}

/**
 * Decisão de progressão
 *
 * - advance_microlevel: Aumentar maxResult (ex: 5→10)
 * - advance_cpa_phase: Avançar fase CPA (concrete→pictorial→abstract)
 * - maintain: Manter nível atual, variar exercícios
 * - regress_microlevel: Diminuir maxResult (ex: 10→5)
 * - regress_cpa_phase: Regredir fase CPA (abstract→pictorial→concrete)
 * - regress_to_baseline: Voltar ao nível mais básico da operação
 */
export type ProgressionDecision =
  | 'advance_microlevel'
  | 'advance_cpa_phase'
  | 'maintain'
  | 'regress_microlevel'
  | 'regress_cpa_phase'
  | 'regress_to_baseline';

/**
 * Resultado da análise de maestria
 *
 * @property decision - Decisão de progressão
 * @property reason - Motivo da decisão (para feedback)
 * @property newLevel - Novo nível sugerido (se houver mudança)
 * @property streak - Sequências atuais (corretos, erros, fast, slow)
 * @property shouldGiveSpecialFeedback - Se deve dar feedback especial (3+ erros)
 */
export interface MasteryAnalysis {
  decision: ProgressionDecision;
  reason: string;
  newLevel: MasteryLevel | null;
  streak: {
    correct: number;
    incorrect: number;
    fast: number;
    slow: number;
  };
  shouldGiveSpecialFeedback: boolean;
}

/**
 * Configuração do algoritmo de maestria
 */
export interface MasteryConfig {
  /** Tamanho do buffer circular (padrão: 10) */
  bufferSize: number;

  /** Acertos rápidos consecutivos para avançar micro-nível (padrão: 5) */
  fastStreakToAdvanceMicro: number;

  /** Acertos lentos consecutivos para manter nível (padrão: 5) */
  slowStreakToMaintain: number;

  /** Acertos consecutivos para avançar fase CPA (padrão: 5) */
  correctStreakToAdvanceCpa: number;

  /** Erros consecutivos para regredir micro-nível (padrão: 3) */
  errorStreakToRegressMicro: number;

  /** Erros consecutivos para regredir fase CPA (padrão: 3) */
  errorStreakToRegressCpa: number;

  /** Erros consecutivos para regredir ao baseline (padrão: 10) */
  errorStreakToRegressBaseline: number;
}

/**
 * Configuração padrão do algoritmo de maestria
 *
 * Baseada em:
 * - Método Kumon: maestria = 5 acertos consecutivos
 * - Small Steps: micro-progressões frequentes
 * - Prevenção de frustração: regressão rápida após 3 erros
 */
export const DEFAULT_MASTERY_CONFIG: MasteryConfig = {
  bufferSize: 10,
  fastStreakToAdvanceMicro: 5,
  slowStreakToMaintain: 5,
  correctStreakToAdvanceCpa: 5,
  errorStreakToRegressMicro: 3,
  errorStreakToRegressCpa: 3,
  errorStreakToRegressBaseline: 10,
};

/**
 * Progressão de micro-níveis (maxResult)
 *
 * Para cada operação, define a sequência de maxResult
 */
export const MICROLEVEL_PROGRESSION = {
  addition: [5, 10, 15, 20],
  subtraction: [5, 10, 15, 20],
} as const;

/**
 * Progressão de fases CPA
 */
export const CPA_PROGRESSION = ['concrete', 'pictorial', 'abstract'] as const;
