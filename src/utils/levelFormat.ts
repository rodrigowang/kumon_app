/**
 * Utilitários para formatação de níveis de maestria
 */

import type { MasteryLevel } from '../types';

/**
 * Converte MasteryLevel em string legível para crianças
 *
 * @example
 * formatLevelName({ operation: 'addition', maxResult: 10, cpaPhase: 'abstract' })
 * // => "Somas até 10"
 */
export function formatLevelName(level: MasteryLevel): string {
  const operationName = level.operation === 'addition' ? 'Somas' : 'Subtrações';
  return `${operationName} até ${level.maxResult}`;
}

/**
 * Determina se houve aumento ou diminuição de nível
 *
 * @returns 'increase' | 'decrease' | 'none'
 */
export function getLevelChangeDirection(
  oldLevel: MasteryLevel,
  newLevel: MasteryLevel
): 'increase' | 'decrease' | 'none' {
  if (oldLevel.operation !== newLevel.operation) {
    // Mudança de operação (ex: adição → subtração)
    return 'increase';
  }

  if (newLevel.maxResult > oldLevel.maxResult) {
    return 'increase';
  }

  if (newLevel.maxResult < oldLevel.maxResult) {
    return 'decrease';
  }

  return 'none';
}
