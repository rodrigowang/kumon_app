/**
 * Tipos para Detector de Hesitação
 */

/**
 * Classificação da velocidade de resposta
 *
 * - fast: Resposta rápida e fluente (<5s)
 * - slow: Resposta mais demorada, mas sem hesitação (5-15s)
 * - hesitant: Sem interação por muito tempo (>15s ou sem desenhar por >10s)
 */
export type ResponseSpeed = 'fast' | 'slow' | 'hesitant';

/**
 * Estado do timer de hesitação
 *
 * @property isRunning - Se o timer está ativo
 * @property startTime - Timestamp de início (Date.now())
 * @property lastInteractionTime - Última vez que criança interagiu com canvas
 * @property elapsedMs - Tempo decorrido desde início (ms)
 */
export interface HesitationTimerState {
  isRunning: boolean;
  startTime: number | null;
  lastInteractionTime: number | null;
  elapsedMs: number;
}

/**
 * Resultado da análise de hesitação
 *
 * @property speed - Classificação da velocidade
 * @property timeMs - Tempo total levado
 * @property shouldShowHint - Se deve exibir dica de ajuda
 * @property inactivityMs - Tempo sem interação com canvas
 */
export interface HesitationAnalysis {
  speed: ResponseSpeed;
  timeMs: number;
  shouldShowHint: boolean;
  inactivityMs: number;
}

/**
 * Configuração dos thresholds de hesitação
 *
 * Valores padrão baseados em pesquisas sobre tempo de resposta infantil:
 * - Crianças de 7 anos em maestria: <5s (automático)
 * - Criança pensando: 5-15s (normal)
 * - Criança travada: >15s total ou >10s sem desenhar (precisa ajuda)
 */
export interface HesitationConfig {
  /** Limite para "fast" (ms) - padrão: 5000ms (5s) */
  fastThresholdMs: number;

  /** Limite para "slow" (ms) - padrão: 15000ms (15s) */
  slowThresholdMs: number;

  /** Limite de inatividade para mostrar dica (ms) - padrão: 10000ms (10s) */
  inactivityHintThresholdMs: number;
}

/**
 * Configuração padrão de hesitação
 *
 * Baseada em:
 * - Kumon: maestria = resposta automática (<5s)
 * - Psicologia cognitiva: working memory infantil ~7-15s
 * - UX infantil: >10s sem ação = frustração iminente
 */
export const DEFAULT_HESITATION_CONFIG: HesitationConfig = {
  fastThresholdMs: 5000, // 5 segundos
  slowThresholdMs: 15000, // 15 segundos
  inactivityHintThresholdMs: 10000, // 10 segundos
};
