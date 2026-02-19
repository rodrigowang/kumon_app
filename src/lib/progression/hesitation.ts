/**
 * Detector de Hesitação
 *
 * Mede tempo de resposta e detecta quando criança está travada.
 * Baseado em princípios do método Kumon (maestria = resposta automática)
 * e psicologia cognitiva infantil.
 */

import type {
  HesitationTimerState,
  HesitationAnalysis,
  HesitationConfig,
  ResponseSpeed,
} from '../../types/hesitation';
import { DEFAULT_HESITATION_CONFIG } from '../../types/hesitation';

/**
 * Classe para gerenciar timer de hesitação
 *
 * @example
 * const timer = new HesitationTimer();
 *
 * // Quando exercício é exibido
 * timer.start();
 *
 * // Quando criança desenha no canvas
 * timer.recordInteraction();
 *
 * // Quando criança aperta "Enviar"
 * const analysis = timer.stop();
 * if (analysis.speed === 'fast') {
 *   console.log('Maestria! Criança domina o conceito.');
 * }
 */
export class HesitationTimer {
  private state: HesitationTimerState;
  private config: HesitationConfig;
  private intervalId: number | null = null;

  constructor(config: Partial<HesitationConfig> = {}) {
    this.config = { ...DEFAULT_HESITATION_CONFIG, ...config };
    this.state = {
      isRunning: false,
      startTime: null,
      lastInteractionTime: null,
      elapsedMs: 0,
    };
  }

  /**
   * Inicia o timer quando exercício é exibido
   */
  start(): void {
    const now = Date.now();
    this.state = {
      isRunning: true,
      startTime: now,
      lastInteractionTime: now, // Inicialmente = startTime
      elapsedMs: 0,
    };
  }

  /**
   * Registra interação da criança com o canvas
   * (desenho, toque, etc.)
   */
  recordInteraction(): void {
    if (!this.state.isRunning) {
      return;
    }

    this.state.lastInteractionTime = Date.now();
  }

  /**
   * Para o timer e retorna análise de hesitação
   */
  stop(): HesitationAnalysis {
    if (!this.state.isRunning || this.state.startTime === null) {
      // Timer não estava rodando, retornar valores padrão
      return {
        speed: 'hesitant',
        timeMs: 0,
        shouldShowHint: false,
        inactivityMs: 0,
      };
    }

    const now = Date.now();
    const timeMs = now - this.state.startTime;
    const inactivityMs = this.state.lastInteractionTime
      ? now - this.state.lastInteractionTime
      : timeMs;

    // Parar timer
    this.state.isRunning = false;
    this.state.elapsedMs = timeMs;

    // Classificar velocidade
    const speed = this.classifySpeed(timeMs);

    // Decidir se deve mostrar dica
    const shouldShowHint =
      inactivityMs >= this.config.inactivityHintThresholdMs;

    return {
      speed,
      timeMs,
      shouldShowHint,
      inactivityMs,
    };
  }

  /**
   * Obtém estado atual do timer (sem parar)
   */
  getState(): HesitationTimerState {
    if (this.state.isRunning && this.state.startTime !== null) {
      const now = Date.now();
      return {
        ...this.state,
        elapsedMs: now - this.state.startTime,
      };
    }

    return this.state;
  }

  /**
   * Verifica se criança está hesitante (sem interação por muito tempo)
   * Útil para disparar dicas em tempo real
   */
  checkIfHesitant(): boolean {
    if (!this.state.isRunning || this.state.lastInteractionTime === null) {
      return false;
    }

    const now = Date.now();
    const inactivityMs = now - this.state.lastInteractionTime;

    return inactivityMs >= this.config.inactivityHintThresholdMs;
  }

  /**
   * Obtém tempo de inatividade atual (ms)
   */
  getInactivityMs(): number {
    if (!this.state.isRunning || this.state.lastInteractionTime === null) {
      return 0;
    }

    const now = Date.now();
    return now - this.state.lastInteractionTime;
  }

  /**
   * Reseta o timer para estado inicial
   */
  reset(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.state = {
      isRunning: false,
      startTime: null,
      lastInteractionTime: null,
      elapsedMs: 0,
    };
  }

  /**
   * Classifica velocidade de resposta
   */
  private classifySpeed(timeMs: number): ResponseSpeed {
    if (timeMs < this.config.fastThresholdMs) {
      return 'fast';
    }

    if (timeMs < this.config.slowThresholdMs) {
      return 'slow';
    }

    return 'hesitant';
  }

  /**
   * Atualiza configuração do timer
   */
  updateConfig(config: Partial<HesitationConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): HesitationConfig {
    return { ...this.config };
  }
}

/**
 * Função utilitária para criar timer com configuração padrão
 */
export function createHesitationTimer(
  config?: Partial<HesitationConfig>
): HesitationTimer {
  return new HesitationTimer(config);
}

/**
 * Função utilitária para classificar velocidade de resposta
 * (útil para análise de dados históricos)
 */
export function classifyResponseSpeed(
  timeMs: number,
  config: HesitationConfig = DEFAULT_HESITATION_CONFIG
): ResponseSpeed {
  if (timeMs < config.fastThresholdMs) {
    return 'fast';
  }

  if (timeMs < config.slowThresholdMs) {
    return 'slow';
  }

  return 'hesitant';
}

/**
 * Função utilitária para formatar tempo em formato legível
 */
export function formatResponseTime(timeMs: number): string {
  if (timeMs < 1000) {
    return `${timeMs}ms`;
  }

  const seconds = (timeMs / 1000).toFixed(1);
  return `${seconds}s`;
}
