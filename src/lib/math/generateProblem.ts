/**
 * Gerador de Problemas Matemáticos
 *
 * Implementa progressão Small Steps do método Kumon:
 * - Incremento gradual de dificuldade
 * - Repetição disfarçada (mesmo conceito, números diferentes)
 * - Nunca gerar o mesmo problema 2x seguidas
 */

import type { MasteryLevel } from '../../types/progression';
import type { Problem } from '../../types/problem';

/**
 * Calcula a resposta correta de uma operação
 */
function calculateAnswer(a: number, b: number, operation: 'addition' | 'subtraction'): number {
  return operation === 'addition' ? a + b : a - b;
}

/**
 * Gera ID único para um problema (para evitar repetição)
 */
function generateProblemId(a: number, b: number, operation: 'addition' | 'subtraction'): string {
  const symbol = operation === 'addition' ? '+' : '-';
  return `${a}${symbol}${b}`;
}

/**
 * Gera um número aleatório entre min e max (inclusive)
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Configuração de geração por nível (Adição)
 */
interface AdditionLevelConfig {
  maxResult: number;
  minOperandA: number;
  maxOperandA: number;
  minOperandB: number;
  maxOperandB: number;
}

function getAdditionConfig(maxResult: number): AdditionLevelConfig {
  // Nível 1: resultados até 5 (1+1, 1+2, 2+2, 2+3...)
  if (maxResult <= 5) {
    return {
      maxResult: 5,
      minOperandA: 1,
      maxOperandA: 4,
      minOperandB: 1,
      maxOperandB: 4,
    };
  }

  // Nível 2: resultados até 10 (4+3, 5+5, 6+4...)
  if (maxResult <= 10) {
    return {
      maxResult: 10,
      minOperandA: 2,
      maxOperandA: 9,
      minOperandB: 1,
      maxOperandB: 9,
    };
  }

  // Nível 3: resultados até 15, incluindo "passa 10" (8+5, 7+6...)
  if (maxResult <= 15) {
    return {
      maxResult: 15,
      minOperandA: 3,
      maxOperandA: 12,
      minOperandB: 2,
      maxOperandB: 12,
    };
  }

  // Nível 4: resultados até 20 (9+8, 7+9, 12+5...)
  if (maxResult <= 20) {
    return {
      maxResult: 20,
      minOperandA: 5,
      maxOperandA: 15,
      minOperandB: 3,
      maxOperandB: 15,
    };
  }

  // Nível 5: 2 dígitos + 1 dígito (23+5, 45+8, 71+9...)
  if (maxResult <= 99) {
    return {
      maxResult: 99,
      minOperandA: 10,
      maxOperandA: 89,
      minOperandB: 1,
      maxOperandB: 9,
    };
  }

  // Nível 6: 3 dígitos + 1 dígito (123+5, 247+8, 540+9...)
  return {
    maxResult: 999,
    minOperandA: 100,
    maxOperandA: 989,
    minOperandB: 1,
    maxOperandB: 9,
  };
}

/**
 * Gera problema de adição seguindo Small Steps
 */
function generateAddition(maxResult: number, previousProblemId?: string): Problem {
  const config = getAdditionConfig(maxResult);
  let operandA: number;
  let operandB: number;
  let result: number;
  let attempts = 0;
  const maxAttempts = 50; // Evitar loop infinito

  do {
    operandA = randomInt(config.minOperandA, config.maxOperandA);
    operandB = randomInt(config.minOperandB, config.maxOperandB);
    result = operandA + operandB;
    attempts++;

    // Validações:
    // 1. Resultado dentro do limite (usa maxResult do input, não do config)
    // 2. Não repetir problema anterior
    const isValidResult = result <= maxResult && result >= 1;
    const id = generateProblemId(operandA, operandB, 'addition');
    const isDifferentFromPrevious = id !== previousProblemId;

    if (isValidResult && isDifferentFromPrevious) {
      break;
    }
  } while (attempts < maxAttempts);

  const correctAnswer = calculateAnswer(operandA, operandB, 'addition');
  const id = generateProblemId(operandA, operandB, 'addition');

  return {
    operandA,
    operandB,
    operation: 'addition',
    correctAnswer,
    id,
  };
}

/**
 * Configuração de geração por nível (Subtração)
 */
interface SubtractionLevelConfig {
  maxMinuend: number; // Maior valor para o primeiro número (minuendo)
  minMinuend: number;
  maxSubtrahend: number; // Maior valor para o segundo número (subtraendo)
  minSubtrahend: number;
  allowNegative: boolean; // Se permite resultado negativo (não para crianças de 7 anos)
}

function getSubtractionConfig(maxResult: number): SubtractionLevelConfig {
  // Nível 1: resultados até 5, sem "descer do 10" (5-2, 4-1...)
  if (maxResult <= 5) {
    return {
      minMinuend: 1,
      maxMinuend: 5,
      minSubtrahend: 1,
      maxSubtrahend: 4,
      allowNegative: false,
    };
  }

  // Nível 2: resultados até 10 (10-3, 8-5...)
  if (maxResult <= 10) {
    return {
      minMinuend: 2,
      maxMinuend: 10,
      minSubtrahend: 1,
      maxSubtrahend: 9,
      allowNegative: false,
    };
  }

  // Nível 3: "descer do 10" (13-5, 15-8...)
  if (maxResult <= 15) {
    return {
      minMinuend: 5,
      maxMinuend: 15,
      minSubtrahend: 2,
      maxSubtrahend: 12,
      allowNegative: false,
    };
  }

  // Nível 4: resultados até 20 (20-7, 18-9...)
  if (maxResult <= 20) {
    return {
      minMinuend: 8,
      maxMinuend: 20,
      minSubtrahend: 3,
      maxSubtrahend: 15,
      allowNegative: false,
    };
  }

  // Nível 5: 2 dígitos - 1 dígito (73-6, 45-8, 91-3...)
  if (maxResult <= 99) {
    return {
      minMinuend: 11,
      maxMinuend: 99,
      minSubtrahend: 1,
      maxSubtrahend: 9,
      allowNegative: false,
    };
  }

  // Nível 6: 3 dígitos - 1 dígito (452-8, 130-5, 999-7...)
  return {
    minMinuend: 101,
    maxMinuend: 999,
    minSubtrahend: 1,
    maxSubtrahend: 9,
    allowNegative: false,
  };
}

/**
 * Gera problema de subtração seguindo Small Steps
 */
function generateSubtraction(maxResult: number, previousProblemId?: string): Problem {
  const config = getSubtractionConfig(maxResult);
  let operandA: number; // minuendo
  let operandB: number; // subtraendo
  let result: number;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    operandA = randomInt(config.minMinuend, config.maxMinuend);
    operandB = randomInt(config.minSubtrahend, config.maxSubtrahend);
    result = operandA - operandB;
    attempts++;

    // Validações:
    // 1. Resultado >= 0 (sem negativos para crianças)
    // 2. operandB < operandA (garantir resultado positivo)
    // 3. Resultado dentro do limite do nível
    // 4. Não repetir problema anterior
    const isValidResult = result >= 0;
    const isValidOperands = operandB < operandA;
    const id = generateProblemId(operandA, operandB, 'subtraction');
    const isDifferentFromPrevious = id !== previousProblemId;

    if (isValidResult && isValidOperands && isDifferentFromPrevious) {
      break;
    }
  } while (attempts < maxAttempts);

  const correctAnswer = calculateAnswer(operandA, operandB, 'subtraction');
  const id = generateProblemId(operandA, operandB, 'subtraction');

  return {
    operandA,
    operandB,
    operation: 'subtraction',
    correctAnswer,
    id,
  };
}

/**
 * Gera um problema matemático baseado no nível de maestria
 *
 * @param masteryLevel - Nível atual da criança (operação, dificuldade, fase CPA)
 * @param previousProblemId - ID do problema anterior (para evitar repetição)
 * @returns Problema matemático adequado ao nível
 *
 * @example
 * const level: MasteryLevel = {
 *   operation: 'addition',
 *   maxResult: 5,
 *   cpaPhase: 'concrete'
 * };
 * const problem = generateProblem(level);
 * // Retorna: { operandA: 2, operandB: 3, operation: 'addition', correctAnswer: 5, id: '2+3' }
 */
export function generateProblem(
  masteryLevel: MasteryLevel,
  previousProblemId?: string
): Problem {
  const { operation, maxResult } = masteryLevel;

  // Mixed mode: 50% adição, 50% subtração
  if (operation === 'mixed') {
    const randomOp = Math.random() < 0.5 ? 'addition' : 'subtraction';
    return randomOp === 'addition'
      ? generateAddition(maxResult, previousProblemId)
      : generateSubtraction(maxResult, previousProblemId);
  }

  if (operation === 'addition') {
    return generateAddition(maxResult, previousProblemId);
  }

  if (operation === 'subtraction') {
    return generateSubtraction(maxResult, previousProblemId);
  }

  // TypeScript garante que não chegamos aqui (exhaustive check)
  throw new Error(`Operação não suportada: ${operation satisfies never}`);
}
