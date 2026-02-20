/**
 * Algoritmo de Maestria
 *
 * Implementa progressão baseada no método Kumon:
 * - Small Steps: micro-progressões frequentes
 * - Maestria = 5 acertos consecutivos
 * - Regressão rápida após 3 erros (prevenção de frustração)
 * - Progressão CPA: Concreto → Pictórico → Abstrato
 */

import type {
  ExerciseResult,
  MasteryAnalysis,
  MasteryConfig,
} from '../../types/mastery';
import type { MasteryLevel, Operation } from '../../types/progression';
import {
  DEFAULT_MASTERY_CONFIG,
  MICROLEVEL_PROGRESSION,
  CPA_PROGRESSION,
} from '../../types/mastery';

/**
 * Buffer circular para armazenar últimos N resultados
 */
class CircularBuffer<T> {
  private buffer: T[];
  private maxSize: number;
  private currentIndex: number = 0;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
    this.buffer = [];
  }

  add(item: T): void {
    if (this.buffer.length < this.maxSize) {
      this.buffer.push(item);
    } else {
      this.buffer[this.currentIndex] = item;
      this.currentIndex = (this.currentIndex + 1) % this.maxSize;
    }
  }

  getAll(): T[] {
    // Retorna items na ordem cronológica (mais antigo → mais recente)
    if (this.buffer.length < this.maxSize) {
      return [...this.buffer];
    }

    const firstPart = this.buffer.slice(this.currentIndex);
    const secondPart = this.buffer.slice(0, this.currentIndex);
    return [...firstPart, ...secondPart];
  }

  getLast(n: number): T[] {
    const all = this.getAll();
    return all.slice(-n);
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
    this.currentIndex = 0;
  }
}

/**
 * Classe para gerenciar algoritmo de maestria
 *
 * @example
 * const tracker = new MasteryTracker({ operation: 'addition', maxResult: 5, cpaPhase: 'concrete' });
 *
 * // Adicionar resultados
 * tracker.addResult({ correct: true, speed: 'fast', timeMs: 3000, attempts: 1, timestamp: Date.now() });
 *
 * // Analisar progressão
 * const analysis = tracker.analyze();
 * if (analysis.decision === 'advance_microlevel') {
 *   console.log('Avançar para próximo nível!');
 *   const newLevel = analysis.newLevel;
 * }
 */
export class MasteryTracker {
  private buffer: CircularBuffer<ExerciseResult>;
  private config: MasteryConfig;
  private currentLevel: MasteryLevel;

  constructor(
    initialLevel: MasteryLevel,
    config: Partial<MasteryConfig> = {}
  ) {
    this.config = { ...DEFAULT_MASTERY_CONFIG, ...config };
    this.buffer = new CircularBuffer<ExerciseResult>(this.config.bufferSize);
    this.currentLevel = { ...initialLevel };
  }

  /**
   * Adiciona resultado de exercício ao buffer
   */
  addResult(result: ExerciseResult): void {
    this.buffer.add(result);
  }

  /**
   * Analisa resultados e retorna decisão de progressão
   */
  analyze(): MasteryAnalysis {
    const results = this.buffer.getAll();

    if (results.length === 0) {
      return {
        decision: 'maintain',
        reason: 'Nenhum resultado ainda',
        newLevel: null,
        streak: { correct: 0, incorrect: 0, fast: 0, slow: 0 },
        shouldGiveSpecialFeedback: false,
      };
    }

    // Calcular streaks (sequências)
    const streak = this.calculateStreaks(results);

    // Verificar regressões (prioridade: mais urgente primeiro)
    const regressionCheck = this.checkRegressions(streak);
    if (regressionCheck) {
      return regressionCheck;
    }

    // Verificar avanços
    const advanceCheck = this.checkAdvancements(streak);
    if (advanceCheck) {
      return advanceCheck;
    }

    // Manter nível atual
    return {
      decision: 'maintain',
      reason: 'Continuar praticando no nível atual',
      newLevel: null,
      streak,
      shouldGiveSpecialFeedback: false,
    };
  }

  /**
   * Calcula sequências consecutivas (streaks)
   */
  private calculateStreaks(results: ExerciseResult[]): {
    correct: number;
    incorrect: number;
    fast: number;
    slow: number;
  } {
    const recent = results.slice(-10); // Últimos 10

    let correct = 0;
    let incorrect = 0;
    let fast = 0;
    let slow = 0;

    // Contar streaks do final para o início
    for (let i = recent.length - 1; i >= 0; i--) {
      const result = recent[i];

      // Streak de corretos
      if (result.correct) {
        correct++;
      } else {
        break;
      }
    }

    // Streak de incorretos
    for (let i = recent.length - 1; i >= 0; i--) {
      const result = recent[i];

      if (!result.correct) {
        incorrect++;
      } else {
        break;
      }
    }

    // Streak de fast (corretos rápidos)
    for (let i = recent.length - 1; i >= 0; i--) {
      const result = recent[i];

      if (result.correct && result.speed === 'fast') {
        fast++;
      } else {
        break;
      }
    }

    // Streak de slow (corretos lentos)
    for (let i = recent.length - 1; i >= 0; i--) {
      const result = recent[i];

      if (result.correct && result.speed === 'slow') {
        slow++;
      } else {
        break;
      }
    }

    return { correct, incorrect, fast, slow };
  }

  /**
   * Verifica se deve regredir
   */
  private checkRegressions(streak: {
    correct: number;
    incorrect: number;
    fast: number;
    slow: number;
  }): MasteryAnalysis | null {
    const { incorrect } = streak;

    // Regressão ao baseline (10 erros consecutivos)
    if (incorrect >= this.config.errorStreakToRegressBaseline) {
      const newLevel = this.getBaselineLevel();
      return {
        decision: 'regress_to_baseline',
        reason: `${incorrect} erros consecutivos. Voltando ao início.`,
        newLevel,
        streak,
        shouldGiveSpecialFeedback: true,
      };
    }

    // Regressão de fase CPA (3 erros consecutivos)
    if (incorrect >= this.config.errorStreakToRegressCpa) {
      const newLevel = this.regressCpaPhase();

      if (newLevel) {
        return {
          decision: 'regress_cpa_phase',
          reason: `${incorrect} erros consecutivos. Voltando 1 fase CPA.`,
          newLevel,
          streak,
          shouldGiveSpecialFeedback: true,
        };
      }
    }

    // Regressão de micro-nível (3 erros consecutivos, se já estiver em concrete)
    if (
      incorrect >= this.config.errorStreakToRegressMicro &&
      this.currentLevel.cpaPhase === 'concrete'
    ) {
      const newLevel = this.regressMicrolevel();

      if (newLevel) {
        return {
          decision: 'regress_microlevel',
          reason: `${incorrect} erros consecutivos. Diminuindo dificuldade.`,
          newLevel,
          streak,
          shouldGiveSpecialFeedback: true,
        };
      }
    }

    return null;
  }

  /**
   * Verifica se deve avançar
   */
  private checkAdvancements(streak: {
    correct: number;
    incorrect: number;
    fast: number;
    slow: number;
  }): MasteryAnalysis | null {
    const { fast, slow, correct } = streak;

    // Avanço de micro-nível (5 acertos rápidos consecutivos)
    if (
      fast >= this.config.fastStreakToAdvanceMicro &&
      this.currentLevel.cpaPhase === 'abstract'
    ) {
      const newLevel = this.advanceMicrolevel();

      if (newLevel) {
        return {
          decision: 'advance_microlevel',
          reason: `${fast} acertos rápidos! Maestria alcançada. Próximo nível.`,
          newLevel,
          streak,
          shouldGiveSpecialFeedback: false,
        };
      }
    }

    // Avanço de fase CPA (5 acertos consecutivos)
    if (correct >= this.config.correctStreakToAdvanceCpa) {
      const newLevel = this.advanceCpaPhase();

      if (newLevel) {
        return {
          decision: 'advance_cpa_phase',
          reason: `${correct} acertos! Avançando para próxima fase CPA.`,
          newLevel,
          streak,
          shouldGiveSpecialFeedback: false,
        };
      }
    }

    // Manter nível (5 acertos lentos consecutivos)
    if (slow >= this.config.slowStreakToMaintain) {
      return {
        decision: 'maintain',
        reason: `${slow} acertos lentos. Precisa mais prática para maestria.`,
        newLevel: null,
        streak,
        shouldGiveSpecialFeedback: false,
      };
    }

    return null;
  }

  /**
   * Avança micro-nível (aumenta maxResult)
   */
  private advanceMicrolevel(): MasteryLevel | null {
    const progression = MICROLEVEL_PROGRESSION[this.currentLevel.operation];
    const currentIndex = progression.indexOf(this.currentLevel.maxResult as never);

    if (currentIndex === -1 || currentIndex >= progression.length - 1) {
      return null; // Já está no último nível
    }

    return {
      ...this.currentLevel,
      maxResult: progression[currentIndex + 1] as number,
      cpaPhase: 'concrete', // Volta para concrete no novo nível
    };
  }

  /**
   * Regride micro-nível (diminui maxResult)
   */
  private regressMicrolevel(): MasteryLevel | null {
    const progression = MICROLEVEL_PROGRESSION[this.currentLevel.operation];
    const currentIndex = progression.indexOf(this.currentLevel.maxResult as never);

    if (currentIndex === -1 || currentIndex === 0) {
      return null; // Já está no primeiro nível
    }

    return {
      ...this.currentLevel,
      maxResult: progression[currentIndex - 1] as number,
      cpaPhase: 'abstract', // Vai para abstract do nível anterior (mais fácil)
    };
  }

  /**
   * Avança fase CPA (concrete → pictorial → abstract)
   */
  private advanceCpaPhase(): MasteryLevel | null {
    const currentIndex = CPA_PROGRESSION.indexOf(this.currentLevel.cpaPhase);

    if (currentIndex === -1 || currentIndex >= CPA_PROGRESSION.length - 1) {
      return null; // Já está em abstract
    }

    return {
      ...this.currentLevel,
      cpaPhase: CPA_PROGRESSION[currentIndex + 1],
    };
  }

  /**
   * Regride fase CPA (abstract → pictorial → concrete)
   */
  private regressCpaPhase(): MasteryLevel | null {
    const currentIndex = CPA_PROGRESSION.indexOf(this.currentLevel.cpaPhase);

    if (currentIndex === -1 || currentIndex === 0) {
      return null; // Já está em concrete
    }

    return {
      ...this.currentLevel,
      cpaPhase: CPA_PROGRESSION[currentIndex - 1],
    };
  }

  /**
   * Retorna ao nível baseline (mais básico da operação atual)
   */
  private getBaselineLevel(): MasteryLevel {
    const progression = MICROLEVEL_PROGRESSION[this.currentLevel.operation];

    return {
      operation: this.currentLevel.operation,
      maxResult: progression[0], // Primeiro nível
      cpaPhase: 'concrete', // Fase mais concreta
    };
  }

  /**
   * Obtém nível atual
   */
  getCurrentLevel(): MasteryLevel {
    return { ...this.currentLevel };
  }

  /**
   * Atualiza nível atual (após aplicar decisão de progressão)
   */
  updateLevel(newLevel: MasteryLevel): void {
    this.currentLevel = { ...newLevel };
  }

  /**
   * Obtém todos os resultados do buffer
   */
  getResults(): ExerciseResult[] {
    return this.buffer.getAll();
  }

  /**
   * Limpa buffer (útil para nova sessão)
   */
  clearResults(): void {
    this.buffer.clear();
  }

  /**
   * Obtém configuração atual
   */
  getConfig(): MasteryConfig {
    return { ...this.config };
  }

  /**
   * Atualiza configuração
   */
  updateConfig(config: Partial<MasteryConfig>): void {
    this.config = { ...this.config, ...config };
  }
}

/**
 * Função utilitária para criar tracker com configuração padrão
 */
export function createMasteryTracker(
  initialLevel: MasteryLevel,
  config?: Partial<MasteryConfig>
): MasteryTracker {
  return new MasteryTracker(initialLevel, config);
}

/**
 * Função utilitária para verificar se pode avançar de operação
 * (adição → subtração)
 *
 * Critério: Maestria completa = abstract no último micro-nível
 */
export function canAdvanceOperation(currentLevel: MasteryLevel): boolean {
  const progression = MICROLEVEL_PROGRESSION[currentLevel.operation];
  const isLastMicrolevel = currentLevel.maxResult === progression[progression.length - 1];
  const isAbstract = currentLevel.cpaPhase === 'abstract';

  return isLastMicrolevel && isAbstract;
}

/**
 * Função utilitária para obter próxima operação
 */
export function getNextOperation(currentOperation: Operation): Operation | null {
  if (currentOperation === 'addition') {
    return 'subtraction';
  }

  return null; // Subtração é a última por enquanto
}
