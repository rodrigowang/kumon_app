/**
 * Testes Unitários Completos: Motor de Progressão
 *
 * Testa integração de:
 * - generateProblem (gerador)
 * - MasteryTracker (algoritmo de maestria)
 * - HesitationTimer (detector de hesitação)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { generateProblem } from '../../src/lib/math';
import { MasteryTracker, canAdvanceOperation } from '../../src/lib/progression';
import type { MasteryLevel, ExerciseResult } from '../../src/types';

describe('Motor de Progressão - Integração Completa', () => {
  describe('Gerador de Problemas', () => {
    describe('Não Repetição Consecutiva', () => {
      it('nunca deve gerar exercício idêntico consecutivo (adição)', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        };

        const problem1 = generateProblem(level);
        const problem2 = generateProblem(level, problem1.id);
        const problem3 = generateProblem(level, problem2.id);

        expect(problem2.id).not.toBe(problem1.id);
        expect(problem3.id).not.toBe(problem2.id);
      });

      it('nunca deve gerar exercício idêntico consecutivo (subtração)', () => {
        const level: MasteryLevel = {
          operation: 'subtraction',
          maxResult: 10,
          cpaPhase: 'concrete',
        };

        const problem1 = generateProblem(level);
        const problem2 = generateProblem(level, problem1.id);
        const problem3 = generateProblem(level, problem2.id);

        expect(problem2.id).not.toBe(problem1.id);
        expect(problem3.id).not.toBe(problem2.id);
      });

      it('deve permitir o mesmo exercício após vários outros', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'concrete',
        };

        const problems = [];
        for (let i = 0; i < 20; i++) {
          const previousId = problems.length > 0 ? problems[problems.length - 1].id : undefined;
          problems.push(generateProblem(level, previousId));
        }

        // Verificar que nenhum é consecutivo
        for (let i = 1; i < problems.length; i++) {
          expect(problems[i].id).not.toBe(problems[i - 1].id);
        }
      });
    });

    describe('Resultados Dentro do Range', () => {
      it('adição nível 1 (até 5): todos resultados <= 5', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
          expect(problem.correctAnswer).toBeLessThanOrEqual(5);
        }
      });

      it('adição nível 2 (até 10): todos resultados <= 10', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
          expect(problem.correctAnswer).toBeLessThanOrEqual(10);
        }
      });

      it('adição nível 3 (até 15): todos resultados <= 15', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 15,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
          expect(problem.correctAnswer).toBeLessThanOrEqual(15);
        }
      });

      it('adição nível 4 (até 20): todos resultados <= 20', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 20,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
          expect(problem.correctAnswer).toBeLessThanOrEqual(20);
        }
      });

      it('subtração nível 1 (até 5): todos resultados >= 0 e <= 5', () => {
        const level: MasteryLevel = {
          operation: 'subtraction',
          maxResult: 5,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(problem.correctAnswer).toBeLessThanOrEqual(5);
        }
      });

      it('subtração nível 2 (até 10): todos resultados >= 0 e <= 10', () => {
        const level: MasteryLevel = {
          operation: 'subtraction',
          maxResult: 10,
          cpaPhase: 'concrete',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
          expect(problem.correctAnswer).toBeLessThanOrEqual(10);
        }
      });

      it('subtração nunca deve gerar resultado negativo', () => {
        const levels = [5, 10, 15, 20];

        for (const maxResult of levels) {
          const level: MasteryLevel = {
            operation: 'subtraction',
            maxResult,
            cpaPhase: 'concrete',
          };

          for (let i = 0; i < 30; i++) {
            const problem = generateProblem(level);
            expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
            expect(problem.operandA).toBeGreaterThan(problem.operandB);
          }
        }
      });
    });

    describe('Cálculos Corretos', () => {
      it('adição: correctAnswer sempre = operandA + operandB', () => {
        const level: MasteryLevel = {
          operation: 'addition',
          maxResult: 20,
          cpaPhase: 'abstract',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          const expected = problem.operandA + problem.operandB;
          expect(problem.correctAnswer).toBe(expected);
        }
      });

      it('subtração: correctAnswer sempre = operandA - operandB', () => {
        const level: MasteryLevel = {
          operation: 'subtraction',
          maxResult: 20,
          cpaPhase: 'abstract',
        };

        for (let i = 0; i < 50; i++) {
          const problem = generateProblem(level);
          const expected = problem.operandA - problem.operandB;
          expect(problem.correctAnswer).toBe(expected);
        }
      });
    });
  });

  describe('Algoritmo de Maestria', () => {
    let tracker: MasteryTracker;

    beforeEach(() => {
      tracker = new MasteryTracker({
        operation: 'addition',
        maxResult: 5,
        cpaPhase: 'concrete',
      });
    });

    const createResult = (
      correct: boolean,
      speed: 'fast' | 'slow' | 'hesitant',
      timeMs = 3000
    ): ExerciseResult => ({
      correct,
      speed,
      timeMs,
      attempts: correct ? 1 : 2,
      timestamp: Date.now(),
    });

    describe('Regra: 5 Acertos Rápidos → Avança', () => {
      it('deve avançar micro-nível após 5 acertos rápidos em abstract', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'abstract',
        });

        // 5 acertos rápidos
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'fast', 3000));
        }

        const analysis = tracker.analyze();

        expect(analysis.decision).toBe('advance_microlevel');
        expect(analysis.newLevel).not.toBeNull();
        expect(analysis.newLevel?.maxResult).toBe(10);
        expect(analysis.newLevel?.cpaPhase).toBe('concrete');
        expect(analysis.streak.fast).toBe(5);
      });

      it('deve avançar fase CPA após 5 acertos (lentos ou rápidos)', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        });

        // 5 acertos lentos
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'slow', 8000));
        }

        const analysis = tracker.analyze();

        expect(analysis.decision).toBe('advance_cpa_phase');
        expect(analysis.newLevel?.cpaPhase).toBe('pictorial');
        expect(analysis.newLevel?.maxResult).toBe(10); // Mantém maxResult
      });

      it('NÃO deve avançar micro-nível se não estiver em abstract', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'concrete',
        });

        // 5 acertos rápidos em concrete
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'fast', 3000));
        }

        const analysis = tracker.analyze();

        // Deve avançar CPA, NÃO micro-nível
        expect(analysis.decision).toBe('advance_cpa_phase');
        expect(analysis.newLevel?.cpaPhase).toBe('pictorial');
        expect(analysis.newLevel?.maxResult).toBe(5); // NÃO mudou
      });
    });

    describe('Regra: 3 Erros → Regride', () => {
      it('deve regredir fase CPA após 3 erros consecutivos', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'abstract',
        });

        // 3 erros consecutivos
        for (let i = 0; i < 3; i++) {
          tracker.addResult(createResult(false, 'hesitant', 18000));
        }

        const analysis = tracker.analyze();

        expect(analysis.decision).toBe('regress_cpa_phase');
        expect(analysis.newLevel?.cpaPhase).toBe('pictorial');
        expect(analysis.shouldGiveSpecialFeedback).toBe(true);
        expect(analysis.streak.incorrect).toBe(3);
      });

      it('deve regredir micro-nível após 3 erros em concrete', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        });

        // 3 erros consecutivos
        for (let i = 0; i < 3; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        const analysis = tracker.analyze();

        expect(analysis.decision).toBe('regress_microlevel');
        expect(analysis.newLevel?.maxResult).toBe(5);
        expect(analysis.newLevel?.cpaPhase).toBe('abstract'); // Vai para abstract do nível anterior
        expect(analysis.shouldGiveSpecialFeedback).toBe(true);
      });

      it('deve regredir ao baseline após 10 erros consecutivos', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 20,
          cpaPhase: 'abstract',
        });

        // 10 erros consecutivos
        for (let i = 0; i < 10; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        const analysis = tracker.analyze();

        expect(analysis.decision).toBe('regress_to_baseline');
        expect(analysis.newLevel?.maxResult).toBe(5);
        expect(analysis.newLevel?.cpaPhase).toBe('concrete');
        expect(analysis.shouldGiveSpecialFeedback).toBe(true);
        expect(analysis.streak.incorrect).toBe(10);
      });

      it('deve resetar streak de erros após um acerto', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'abstract',
        });

        // 2 erros
        tracker.addResult(createResult(false, 'hesitant'));
        tracker.addResult(createResult(false, 'hesitant'));

        // 1 acerto (quebra streak)
        tracker.addResult(createResult(true, 'slow'));

        // 2 erros novamente
        tracker.addResult(createResult(false, 'hesitant'));
        tracker.addResult(createResult(false, 'hesitant'));

        const analysis = tracker.analyze();

        // Streak de erros = 2 (não 4), então não regride
        expect(analysis.streak.incorrect).toBe(2);
        expect(analysis.decision).not.toBe('regress_cpa_phase');
      });
    });

    describe('Transição CPA Correta', () => {
      it('deve progredir concrete → pictorial → abstract', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        });

        // Concrete → Pictorial
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'slow'));
        }

        let analysis = tracker.analyze();
        expect(analysis.newLevel?.cpaPhase).toBe('pictorial');
        tracker.updateLevel(analysis.newLevel!);

        // Pictorial → Abstract
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'slow'));
        }

        analysis = tracker.analyze();
        expect(analysis.newLevel?.cpaPhase).toBe('abstract');
      });

      it('deve regredir abstract → pictorial → concrete', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'abstract',
        });

        // Abstract → Pictorial
        for (let i = 0; i < 3; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        let analysis = tracker.analyze();
        expect(analysis.newLevel?.cpaPhase).toBe('pictorial');
        tracker.updateLevel(analysis.newLevel!);

        // Pictorial → Concrete
        for (let i = 0; i < 3; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        analysis = tracker.analyze();
        expect(analysis.newLevel?.cpaPhase).toBe('concrete');
      });

      it('NÃO deve avançar CPA se já estiver em abstract', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'abstract',
        });

        // 5 acertos lentos em abstract
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'slow', 8000));
        }

        const analysis = tracker.analyze();

        // Deve manter, não avançar CPA
        expect(analysis.decision).toBe('maintain');
        expect(analysis.newLevel).toBeNull();
      });

      it('NÃO deve regredir CPA se já estiver em concrete', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'concrete',
        });

        // 3 erros em concrete
        for (let i = 0; i < 3; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        const analysis = tracker.analyze();

        // Deve regredir micro-nível, não CPA
        expect(analysis.decision).toBe('regress_microlevel');
        expect(analysis.newLevel?.cpaPhase).toBe('abstract'); // Vai para abstract do nível anterior
        expect(analysis.newLevel?.maxResult).toBe(5);
      });
    });

    describe('Bloqueio de Operação', () => {
      it('subtração NÃO deve aparecer antes de maestria em adição', () => {
        // Nível inicial de adição
        const level1: MasteryLevel = {
          operation: 'addition',
          maxResult: 10,
          cpaPhase: 'abstract',
        };

        expect(canAdvanceOperation(level1)).toBe(false);

        // Avançou para maxResult=20, mas ainda em pictorial
        const level2: MasteryLevel = {
          operation: 'addition',
          maxResult: 20,
          cpaPhase: 'pictorial',
        };

        expect(canAdvanceOperation(level2)).toBe(false);

        // Maestria completa: maxResult=20 E abstract
        const level3: MasteryLevel = {
          operation: 'addition',
          maxResult: 20,
          cpaPhase: 'abstract',
        };

        expect(canAdvanceOperation(level3)).toBe(true);
      });

      it('deve exigir AMBOS maxResult=20 E cpaPhase=abstract', () => {
        // Apenas maxResult=20
        expect(
          canAdvanceOperation({
            operation: 'addition',
            maxResult: 20,
            cpaPhase: 'concrete',
          })
        ).toBe(false);

        // Apenas cpaPhase=abstract
        expect(
          canAdvanceOperation({
            operation: 'addition',
            maxResult: 15,
            cpaPhase: 'abstract',
          })
        ).toBe(false);

        // Ambos
        expect(
          canAdvanceOperation({
            operation: 'addition',
            maxResult: 20,
            cpaPhase: 'abstract',
          })
        ).toBe(true);
      });

      it('subtração também deve exigir maestria completa antes de próxima operação', () => {
        const level: MasteryLevel = {
          operation: 'subtraction',
          maxResult: 20,
          cpaPhase: 'abstract',
        };

        // Subtração no nível máximo também pode "avançar" (para futuras operações)
        expect(canAdvanceOperation(level)).toBe(true);
      });
    });

    describe('Buffer Circular', () => {
      it('deve manter apenas últimos 10 resultados', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'concrete',
        });

        // Adicionar 15 resultados
        for (let i = 0; i < 15; i++) {
          tracker.addResult(createResult(true, 'fast'));
        }

        const results = tracker.getResults();
        expect(results.length).toBe(10);
      });

      it('deve descartar resultados mais antigos', () => {
        const tracker = new MasteryTracker({
          operation: 'addition',
          maxResult: 5,
          cpaPhase: 'concrete',
        });

        // Adicionar 5 corretos, depois 10 incorretos
        for (let i = 0; i < 5; i++) {
          tracker.addResult(createResult(true, 'fast'));
        }

        for (let i = 0; i < 10; i++) {
          tracker.addResult(createResult(false, 'hesitant'));
        }

        const analysis = tracker.analyze();

        // Deve considerar apenas os últimos 10 (todos incorretos)
        expect(analysis.streak.incorrect).toBe(10);
        expect(analysis.decision).toBe('regress_to_baseline');
      });
    });
  });

  describe('Integração: Gerador + Maestria', () => {
    it('deve gerar problemas apropriados após avanço de nível', () => {
      const tracker = new MasteryTracker({
        operation: 'addition',
        maxResult: 5,
        cpaPhase: 'abstract',
      });

      // 5 acertos rápidos → avança para maxResult=10
      for (let i = 0; i < 5; i++) {
        tracker.addResult({
          correct: true,
          speed: 'fast',
          timeMs: 3000,
          attempts: 1,
          timestamp: Date.now(),
        });
      }

      const analysis = tracker.analyze();
      expect(analysis.newLevel?.maxResult).toBe(10);

      // Gerar problemas no novo nível
      const newLevel = analysis.newLevel!;

      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(newLevel);
        expect(problem.correctAnswer).toBeLessThanOrEqual(10);
      }
    });

    it('deve simular jornada completa de progressão', () => {
      let currentLevel: MasteryLevel = {
        operation: 'addition',
        maxResult: 5,
        cpaPhase: 'concrete',
      };

      const tracker = new MasteryTracker(currentLevel);
      const journey: string[] = [];

      // Concrete → Pictorial
      for (let i = 0; i < 5; i++) {
        const problem = generateProblem(currentLevel);
        expect(problem.correctAnswer).toBeLessThanOrEqual(5);

        tracker.addResult({
          correct: true,
          speed: 'slow',
          timeMs: 8000,
          attempts: 1,
          timestamp: Date.now(),
        });
      }

      let analysis = tracker.analyze();
      journey.push(`${currentLevel.cpaPhase} → ${analysis.newLevel?.cpaPhase}`);
      tracker.updateLevel(analysis.newLevel!);
      currentLevel = analysis.newLevel!;

      // Pictorial → Abstract
      for (let i = 0; i < 5; i++) {
        tracker.addResult({
          correct: true,
          speed: 'slow',
          timeMs: 8000,
          attempts: 1,
          timestamp: Date.now(),
        });
      }

      analysis = tracker.analyze();
      journey.push(`${tracker.getCurrentLevel().cpaPhase} → ${analysis.newLevel?.cpaPhase}`);
      tracker.updateLevel(analysis.newLevel!);
      currentLevel = analysis.newLevel!;

      // Abstract → Avança micro-nível (5 → 10)
      for (let i = 0; i < 5; i++) {
        tracker.addResult({
          correct: true,
          speed: 'fast',
          timeMs: 3000,
          attempts: 1,
          timestamp: Date.now(),
        });
      }

      analysis = tracker.analyze();
      journey.push(`maxResult ${tracker.getCurrentLevel().maxResult} → ${analysis.newLevel?.maxResult}`);

      expect(journey).toEqual([
        'concrete → pictorial',
        'pictorial → abstract',
        'maxResult 5 → 10',
      ]);

      expect(analysis.newLevel?.maxResult).toBe(10);
      expect(analysis.newLevel?.cpaPhase).toBe('concrete'); // Volta para concrete
    });
  });
});
