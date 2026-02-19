/**
 * Testes Unitários: Gerador de Problemas Matemáticos
 */

import { describe, it, expect } from 'vitest';
import { generateProblem } from '../../src/lib/math';
import type { MasteryLevel } from '../../src/types';

describe('generateProblem', () => {
  describe('Adição - Nível 1 (até 5)', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 5,
      cpaPhase: 'concrete',
    };

    it('deve gerar problema de adição', () => {
      const problem = generateProblem(level);

      expect(problem.operation).toBe('addition');
      expect(problem.correctAnswer).toBe(problem.operandA + problem.operandB);
    });

    it('deve respeitar maxResult = 5', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
        expect(problem.correctAnswer).toBeLessThanOrEqual(5);
      }
    });

    it('deve gerar ID único no formato "a+b"', () => {
      const problem = generateProblem(level);
      expect(problem.id).toMatch(/^\d+\+\d+$/);
      expect(problem.id).toBe(`${problem.operandA}+${problem.operandB}`);
    });

    it('não deve repetir problema anterior', () => {
      const problem1 = generateProblem(level);
      const problem2 = generateProblem(level, problem1.id);

      expect(problem2.id).not.toBe(problem1.id);
    });
  });

  describe('Adição - Nível 2 (até 10)', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 10,
      cpaPhase: 'pictorial',
    };

    it('deve respeitar maxResult = 10', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
        expect(problem.correctAnswer).toBeLessThanOrEqual(10);
      }
    });

    it('deve usar operandos adequados ao nível', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        // Nível 2: operandos entre 2-9
        expect(problem.operandA).toBeGreaterThanOrEqual(2);
        expect(problem.operandB).toBeGreaterThanOrEqual(1);
      }
    });
  });

  describe('Adição - Nível 3 (até 15, "passa 10")', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 15,
      cpaPhase: 'abstract',
    };

    it('deve respeitar maxResult = 15', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
        expect(problem.correctAnswer).toBeLessThanOrEqual(15);
      }
    });

    it('deve incluir problemas que "passam do 10"', () => {
      const problems = Array.from({ length: 30 }, () => generateProblem(level));
      const hasPassaDez = problems.some((p) => p.correctAnswer > 10);
      expect(hasPassaDez).toBe(true);
    });
  });

  describe('Adição - Nível 4 (até 20)', () => {
    const level: MasteryLevel = {
      operation: 'addition',
      maxResult: 20,
      cpaPhase: 'abstract',
    };

    it('deve respeitar maxResult = 20', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(1);
        expect(problem.correctAnswer).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Subtração - Nível 1 (até 5)', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 5,
      cpaPhase: 'concrete',
    };

    it('deve gerar problema de subtração', () => {
      const problem = generateProblem(level);

      expect(problem.operation).toBe('subtraction');
      expect(problem.correctAnswer).toBe(problem.operandA - problem.operandB);
    });

    it('deve respeitar maxResult = 5', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(problem.correctAnswer).toBeLessThanOrEqual(5);
      }
    });

    it('nunca deve gerar resultado negativo', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(problem.operandA).toBeGreaterThan(problem.operandB);
      }
    });

    it('deve gerar ID único no formato "a-b"', () => {
      const problem = generateProblem(level);
      expect(problem.id).toMatch(/^\d+-\d+$/);
      expect(problem.id).toBe(`${problem.operandA}-${problem.operandB}`);
    });
  });

  describe('Subtração - Nível 2 (até 10)', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 10,
      cpaPhase: 'pictorial',
    };

    it('deve respeitar maxResult = 10', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(problem.correctAnswer).toBeLessThanOrEqual(10);
      }
    });
  });

  describe('Subtração - Nível 3 (até 15, "descer do 10")', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 15,
      cpaPhase: 'abstract',
    };

    it('deve respeitar maxResult = 15', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(problem.correctAnswer).toBeLessThanOrEqual(15);
      }
    });

    it('deve incluir problemas que "descem do 10"', () => {
      const problems = Array.from({ length: 30 }, () => generateProblem(level));
      // "Descer do 10": minuendo > 10, resultado < 10
      const hasDesceDez = problems.some(
        (p) => p.operandA > 10 && p.correctAnswer < 10
      );
      expect(hasDesceDez).toBe(true);
    });
  });

  describe('Subtração - Nível 4 (até 20)', () => {
    const level: MasteryLevel = {
      operation: 'subtraction',
      maxResult: 20,
      cpaPhase: 'abstract',
    };

    it('deve respeitar maxResult = 20', () => {
      for (let i = 0; i < 20; i++) {
        const problem = generateProblem(level);
        expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
        expect(problem.correctAnswer).toBeLessThanOrEqual(20);
      }
    });
  });

  describe('Repetição disfarçada', () => {
    it('nunca deve gerar o mesmo problema 2x seguidas (adição)', () => {
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

    it('nunca deve gerar o mesmo problema 2x seguidas (subtração)', () => {
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
  });

  describe('Validação de respostas corretas', () => {
    it('correctAnswer deve sempre estar correto (adição)', () => {
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

    it('correctAnswer deve sempre estar correto (subtração)', () => {
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
