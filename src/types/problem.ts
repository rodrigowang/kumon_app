/**
 * Tipos para Problemas Matemáticos
 */

import type { Operation } from './progression';

/**
 * Problema matemático para a criança resolver
 *
 * @property operandA - Primeiro número (ex: em "3 + 2", operandA = 3)
 * @property operandB - Segundo número (ex: em "3 + 2", operandB = 2)
 * @property operation - Tipo de operação (addition ou subtraction)
 * @property correctAnswer - Resposta correta do problema
 * @property id - ID único do problema (para evitar repetição imediata)
 *
 * @example
 * // Problema: 3 + 2 = ?
 * {
 *   operandA: 3,
 *   operandB: 2,
 *   operation: 'addition',
 *   correctAnswer: 5,
 *   id: '3+2'
 * }
 */
export interface Problem {
  operandA: number;
  operandB: number;
  operation: Operation;
  correctAnswer: number;
  id: string; // ex: "3+2", "10-4"
}
