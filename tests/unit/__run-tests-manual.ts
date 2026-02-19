/**
 * Test Runner Manual (sem Vitest)
 * Execute com: npx tsx tests/unit/__run-tests-manual.ts
 *
 * Simula Vitest com assertions nativas do Node.js
 */

import assert from 'assert';
import { generateProblem } from '../../src/lib/math';
import { MasteryTracker, canAdvanceOperation } from '../../src/lib/progression';
import type { MasteryLevel, ExerciseResult } from '../../src/types';

// Helper para criar resultado
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

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function test(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    passedTests++;
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failedTests++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function describe(name: string, fn: () => void) {
  console.log(`\n${name}`);
  fn();
}

console.log('=== TESTES DO MOTOR DE PROGRESSÃO ===\n');

// TESTE 1: Gerador não repete consecutivo
describe('📝 Gerador de Problemas - Não Repetição', () => {
  test('nunca gera exercício idêntico consecutivo (adição)', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 10,
      cpaPhase: 'concrete',
    };

    const problem1 = generateProblem(level);
    const problem2 = generateProblem(level, problem1.id);
    const problem3 = generateProblem(level, problem2.id);

    assert.notStrictEqual(problem2.id, problem1.id);
    assert.notStrictEqual(problem3.id, problem2.id);
  });

  test('nunca gera exercício idêntico consecutivo (subtração)', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 10,
      cpaPhase: 'concrete',
    };

    const problem1 = generateProblem(level);
    const problem2 = generateProblem(level, problem1.id);
    const problem3 = generateProblem(level, problem2.id);

    assert.notStrictEqual(problem2.id, problem1.id);
    assert.notStrictEqual(problem3.id, problem2.id);
  });
});

// TESTE 2: Resultados dentro do range
describe('📝 Gerador - Resultados Dentro do Range', () => {
  test('adição nível 1 (até 5): todos <= 5', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 5,
      cpaPhase: 'concrete',
    };

    for (let i = 0; i < 50; i++) {
      const problem = generateProblem(level);
      assert.ok(problem.correctAnswer >= 1, `Resultado ${problem.correctAnswer} < 1`);
      assert.ok(problem.correctAnswer <= 5, `Resultado ${problem.correctAnswer} > 5`);
    }
  });

  test('subtração nunca gera negativo', () => {
    const levels = [5, 10, 15, 20];

    for (const maxResult of levels) {
      const level: MasteryLevel = {
        operation: 'subtraction',
        maxResult,
        cpaPhase: 'concrete',
      };

      for (let i = 0; i < 30; i++) {
        const problem = generateProblem(level);
        assert.ok(problem.correctAnswer >= 0, `Resultado negativo: ${problem.correctAnswer}`);
        assert.ok(
          problem.operandA > problem.operandB,
          `${problem.operandA} não é maior que ${problem.operandB}`
        );
      }
    }
  });

  test('cálculos sempre corretos (adição)', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 20,
      cpaPhase: 'abstract',
    };

    for (let i = 0; i < 50; i++) {
      const problem = generateProblem(level);
      const expected = problem.operandA + problem.operandB;
      assert.strictEqual(problem.correctAnswer, expected);
    }
  });

  test('cálculos sempre corretos (subtração)', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 20,
      cpaPhase: 'abstract',
    };

    for (let i = 0; i < 50; i++) {
      const problem = generateProblem(level);
      const expected = problem.operandA - problem.operandB;
      assert.strictEqual(problem.correctAnswer, expected);
    }
  });
});

// TESTE 3: 5 acertos rápidos → avança
describe('📝 Maestria - 5 Acertos Rápidos → Avança', () => {
  test('5 fast em abstract → avança micro-nível', () => {
    const tracker = new MasteryTracker({
      operation: 'addition',
      maxResult: 5,
      cpaPhase: 'abstract',
    });

    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'fast', 3000));
    }

    const analysis = tracker.analyze();

    assert.strictEqual(analysis.decision, 'advance_microlevel');
    assert.strictEqual(analysis.newLevel?.maxResult, 10);
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'concrete');
  });

  test('5 acertos consecutivos → avança fase CPA', () => {
    const tracker = new MasteryTracker({
      operation: 'addition',
      maxResult: 10,
      cpaPhase: 'concrete',
    });

    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'slow', 8000));
    }

    const analysis = tracker.analyze();

    assert.strictEqual(analysis.decision, 'advance_cpa_phase');
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'pictorial');
  });
});

// TESTE 4: 3 erros → regride
describe('📝 Maestria - 3 Erros → Regride', () => {
  test('3 erros consecutivos → regride CPA', () => {
    const tracker = new MasteryTracker({
      operation: 'addition',
      maxResult: 10,
      cpaPhase: 'abstract',
    });

    for (let i = 0; i < 3; i++) {
      tracker.addResult(createResult(false, 'hesitant', 18000));
    }

    const analysis = tracker.analyze();

    assert.strictEqual(analysis.decision, 'regress_cpa_phase');
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'pictorial');
    assert.strictEqual(analysis.shouldGiveSpecialFeedback, true);
  });

  test('3 erros em concrete → regride micro-nível', () => {
    const tracker = new MasteryTracker({
      operation: 'addition',
      maxResult: 10,
      cpaPhase: 'concrete',
    });

    for (let i = 0; i < 3; i++) {
      tracker.addResult(createResult(false, 'hesitant'));
    }

    const analysis = tracker.analyze();

    assert.strictEqual(analysis.decision, 'regress_microlevel');
    assert.strictEqual(analysis.newLevel?.maxResult, 5);
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'abstract');
  });

  test('10 erros → regride ao baseline', () => {
    const tracker = new MasteryTracker({
      operation: 'addition',
      maxResult: 20,
      cpaPhase: 'abstract',
    });

    for (let i = 0; i < 10; i++) {
      tracker.addResult(createResult(false, 'hesitant'));
    }

    const analysis = tracker.analyze();

    assert.strictEqual(analysis.decision, 'regress_to_baseline');
    assert.strictEqual(analysis.newLevel?.maxResult, 5);
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'concrete');
  });
});

// TESTE 5: Transição CPA correta
describe('📝 Maestria - Transição CPA', () => {
  test('concrete → pictorial → abstract', () => {
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
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'pictorial');
    tracker.updateLevel(analysis.newLevel!);

    // Pictorial → Abstract
    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'slow'));
    }

    analysis = tracker.analyze();
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'abstract');
  });

  test('abstract → pictorial → concrete', () => {
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
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'pictorial');
    tracker.updateLevel(analysis.newLevel!);

    // Pictorial → Concrete
    for (let i = 0; i < 3; i++) {
      tracker.addResult(createResult(false, 'hesitant'));
    }

    analysis = tracker.analyze();
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'concrete');
  });
});

// TESTE 6: Subtração só após maestria em adição
describe('📝 Maestria - Bloqueio de Operação', () => {
  test('NÃO avança sem maxResult=20', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 15,
      cpaPhase: 'abstract',
    };

    assert.strictEqual(canAdvanceOperation(level), false);
  });

  test('NÃO avança sem cpaPhase=abstract', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 20,
      cpaPhase: 'pictorial',
    };

    assert.strictEqual(canAdvanceOperation(level), false);
  });

  test('AVANÇA com maxResult=20 E abstract', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 20,
      cpaPhase: 'abstract',
    };

    assert.strictEqual(canAdvanceOperation(level), true);
  });
});

// TESTE 7: Integração completa
describe('📝 Integração - Jornada Completa', () => {
  test('simula progressão completa: concrete → abstract → avança nível', () => {
    let currentLevel: MasteryLevel = {
      operation: 'addition',
      maxResult: 5,
      cpaPhase: 'concrete',
    };

    const tracker = new MasteryTracker(currentLevel);

    // Concrete → Pictorial
    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'slow'));
    }

    let analysis = tracker.analyze();
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'pictorial');
    tracker.updateLevel(analysis.newLevel!);

    // Pictorial → Abstract
    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'slow'));
    }

    analysis = tracker.analyze();
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'abstract');
    tracker.updateLevel(analysis.newLevel!);

    // Abstract → Avança micro-nível
    for (let i = 0; i < 5; i++) {
      tracker.addResult(createResult(true, 'fast', 3000));
    }

    analysis = tracker.analyze();
    assert.strictEqual(analysis.newLevel?.maxResult, 10);
    assert.strictEqual(analysis.newLevel?.cpaPhase, 'concrete');
  });
});

// Resumo
console.log('\n' + '='.repeat(50));
console.log(`RESUMO: ${passedTests}/${totalTests} testes passaram`);

if (failedTests > 0) {
  console.log(`❌ ${failedTests} teste(s) falharam`);
  process.exit(1);
} else {
  console.log('✅ TODOS OS TESTES PASSARAM!');
  process.exit(0);
}
