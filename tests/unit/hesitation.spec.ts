/**
 * Testes Unitários: Detector de Hesitação
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  HesitationTimer,
  createHesitationTimer,
  classifyResponseSpeed,
  formatResponseTime,
} from '../../src/lib/progression';
import { DEFAULT_HESITATION_CONFIG } from '../../src/types';

// Helper para simular delay
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('HesitationTimer', () => {
  let timer: HesitationTimer;

  beforeEach(() => {
    timer = new HesitationTimer();
  });

  describe('start()', () => {
    it('deve iniciar o timer', () => {
      timer.start();
      const state = timer.getState();

      expect(state.isRunning).toBe(true);
      expect(state.startTime).toBeGreaterThan(0);
      expect(state.lastInteractionTime).toBeGreaterThan(0);
    });

    it('deve zerar elapsedMs ao iniciar', () => {
      timer.start();
      const state = timer.getState();

      expect(state.elapsedMs).toBe(0);
    });
  });

  describe('recordInteraction()', () => {
    it('deve atualizar lastInteractionTime', async () => {
      timer.start();
      const initialState = timer.getState();

      await wait(50);
      timer.recordInteraction();

      const newState = timer.getState();
      expect(newState.lastInteractionTime).toBeGreaterThan(
        initialState.lastInteractionTime!
      );
    });

    it('não deve fazer nada se timer não estiver rodando', () => {
      timer.recordInteraction();
      const state = timer.getState();

      expect(state.lastInteractionTime).toBeNull();
    });
  });

  describe('stop()', () => {
    it('deve parar o timer e retornar análise', async () => {
      timer.start();
      await wait(100);

      const analysis = timer.stop();

      expect(analysis.timeMs).toBeGreaterThanOrEqual(100);
      expect(analysis.speed).toBeDefined();
      expect(timer.getState().isRunning).toBe(false);
    });

    it('deve classificar como "fast" se < 5s', async () => {
      timer.start();
      await wait(2000);

      const analysis = timer.stop();

      expect(analysis.speed).toBe('fast');
      expect(analysis.timeMs).toBeLessThan(5000);
    });

    it('deve classificar como "slow" se 5-15s', async () => {
      // Simular 8 segundos
      vi.useFakeTimers();
      timer.start();
      vi.advanceTimersByTime(8000);

      const analysis = timer.stop();

      expect(analysis.speed).toBe('slow');
      expect(analysis.timeMs).toBeGreaterThanOrEqual(5000);
      expect(analysis.timeMs).toBeLessThan(15000);

      vi.useRealTimers();
    });

    it('deve classificar como "hesitant" se > 15s', async () => {
      vi.useFakeTimers();
      timer.start();
      vi.advanceTimersByTime(20000);

      const analysis = timer.stop();

      expect(analysis.speed).toBe('hesitant');
      expect(analysis.timeMs).toBeGreaterThanOrEqual(15000);

      vi.useRealTimers();
    });

    it('deve calcular inactivityMs corretamente', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(8000); // 8s de inatividade

      const analysis = timer.stop();

      expect(analysis.inactivityMs).toBeGreaterThanOrEqual(8000);
      expect(analysis.timeMs).toBeGreaterThanOrEqual(10000); // 2s + 8s

      vi.useRealTimers();
    });

    it('shouldShowHint = true se inatividade > 10s', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(12000); // 12s sem interação

      const analysis = timer.stop();

      expect(analysis.shouldShowHint).toBe(true);

      vi.useRealTimers();
    });

    it('shouldShowHint = false se inatividade < 10s', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(5000); // 5s sem interação

      const analysis = timer.stop();

      expect(analysis.shouldShowHint).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getState()', () => {
    it('deve retornar estado atual com elapsedMs atualizado', async () => {
      timer.start();
      await wait(100);

      const state = timer.getState();

      expect(state.isRunning).toBe(true);
      expect(state.elapsedMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('checkIfHesitant()', () => {
    it('deve retornar true se inatividade > 10s', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(11000);

      expect(timer.checkIfHesitant()).toBe(true);

      vi.useRealTimers();
    });

    it('deve retornar false se inatividade < 10s', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(5000);

      expect(timer.checkIfHesitant()).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getInactivityMs()', () => {
    it('deve retornar tempo desde última interação', async () => {
      vi.useFakeTimers();
      timer.start();

      vi.advanceTimersByTime(2000);
      timer.recordInteraction();

      vi.advanceTimersByTime(3000);

      const inactivity = timer.getInactivityMs();
      expect(inactivity).toBeGreaterThanOrEqual(3000);

      vi.useRealTimers();
    });
  });

  describe('reset()', () => {
    it('deve resetar timer para estado inicial', async () => {
      timer.start();
      await wait(100);
      timer.reset();

      const state = timer.getState();

      expect(state.isRunning).toBe(false);
      expect(state.startTime).toBeNull();
      expect(state.lastInteractionTime).toBeNull();
      expect(state.elapsedMs).toBe(0);
    });
  });

  describe('updateConfig()', () => {
    it('deve atualizar configuração', () => {
      timer.updateConfig({
        fastThresholdMs: 3000,
        slowThresholdMs: 10000,
      });

      const config = timer.getConfig();
      expect(config.fastThresholdMs).toBe(3000);
      expect(config.slowThresholdMs).toBe(10000);
    });

    it('deve manter valores não atualizados', () => {
      timer.updateConfig({
        fastThresholdMs: 3000,
      });

      const config = timer.getConfig();
      expect(config.fastThresholdMs).toBe(3000);
      expect(config.slowThresholdMs).toBe(DEFAULT_HESITATION_CONFIG.slowThresholdMs);
    });
  });
});

describe('createHesitationTimer()', () => {
  it('deve criar timer com configuração padrão', () => {
    const timer = createHesitationTimer();
    expect(timer).toBeInstanceOf(HesitationTimer);

    const config = timer.getConfig();
    expect(config.fastThresholdMs).toBe(5000);
    expect(config.slowThresholdMs).toBe(15000);
    expect(config.inactivityHintThresholdMs).toBe(10000);
  });

  it('deve criar timer com configuração customizada', () => {
    const timer = createHesitationTimer({
      fastThresholdMs: 3000,
      slowThresholdMs: 10000,
    });

    const config = timer.getConfig();
    expect(config.fastThresholdMs).toBe(3000);
    expect(config.slowThresholdMs).toBe(10000);
  });
});

describe('classifyResponseSpeed()', () => {
  it('deve classificar como "fast" se < 5s', () => {
    expect(classifyResponseSpeed(3000)).toBe('fast');
    expect(classifyResponseSpeed(4999)).toBe('fast');
  });

  it('deve classificar como "slow" se 5-15s', () => {
    expect(classifyResponseSpeed(5000)).toBe('slow');
    expect(classifyResponseSpeed(10000)).toBe('slow');
    expect(classifyResponseSpeed(14999)).toBe('slow');
  });

  it('deve classificar como "hesitant" se >= 15s', () => {
    expect(classifyResponseSpeed(15000)).toBe('hesitant');
    expect(classifyResponseSpeed(20000)).toBe('hesitant');
  });

  it('deve aceitar configuração customizada', () => {
    const customConfig = {
      fastThresholdMs: 3000,
      slowThresholdMs: 10000,
      inactivityHintThresholdMs: 8000,
    };

    expect(classifyResponseSpeed(2000, customConfig)).toBe('fast');
    expect(classifyResponseSpeed(5000, customConfig)).toBe('slow');
    expect(classifyResponseSpeed(12000, customConfig)).toBe('hesitant');
  });
});

describe('formatResponseTime()', () => {
  it('deve formatar milissegundos se < 1s', () => {
    expect(formatResponseTime(500)).toBe('500ms');
    expect(formatResponseTime(999)).toBe('999ms');
  });

  it('deve formatar segundos se >= 1s', () => {
    expect(formatResponseTime(1000)).toBe('1.0s');
    expect(formatResponseTime(3500)).toBe('3.5s');
    expect(formatResponseTime(10000)).toBe('10.0s');
  });
});
