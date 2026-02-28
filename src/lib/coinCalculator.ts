/**
 * coinCalculator — Cálculo de moedas por sessão de exercícios
 *
 * Funções puras sem side effects.
 * Integrado ao endSession() do useGameStore e completedLesson() do usePetStore.
 */

import type { MasteryLevel } from '../types'
import { DIFFICULTY_COINS } from '../types'
import type { DifficultyLevel } from '../types'

export type ItemType = 'water' | 'food' | 'medicine'

/** Preços dos itens da loja */
export const ITEM_PRICES: Record<ItemType, number> = {
  water: 4,
  food: 6,
  medicine: 20,
}

/** Mapeia maxResult → DifficultyLevel para lookup de moedas */
function maxResultToDifficulty(maxResult: number): DifficultyLevel {
  if (maxResult <= 9) return '1digit'
  if (maxResult <= 99) return '2digit'
  return '3digit'
}

/**
 * Moedas base ganhas por acerto, baseado no nível de dificuldade.
 *
 * | Dificuldade | maxResult | Moedas/acerto |
 * |-------------|-----------|---------------|
 * | 1 dígito    | ≤ 9       | 2c            |
 * | 2 dígitos   | 10 – 99   | 5c            |
 * | 3 dígitos   | ≥ 100     | 10c           |
 */
export function getCoinsPerCorrect(level: MasteryLevel): number {
  const diff = maxResultToDifficulty(level.maxResult)
  return DIFFICULTY_COINS[diff]
}

export interface CoinResult {
  /** Moedas base (antes do multiplicador) */
  baseCoins: number
  /** Moedas finais (com multiplicador aplicado se merecido) */
  totalCoins: number
  /** true se 7+ exercícios foram resolvidos na velocidade "fast" → x2 */
  speedBonus: boolean
}

/**
 * Calcula moedas ganhas na sessão.
 *
 * Multiplicador x2: se `fastCount >= 7` das 10 contas foram resolvidas
 * rapidamente (já rastreado em useGameStore.sessionStats.fastCount).
 *
 * @param correctCount - Número de acertos na sessão
 * @param fastCount - Número de exercícios resolvidos com velocidade "fast"
 * @param level - Nível atual (define moedas base por acerto)
 */
export function calculateSessionCoins(
  correctCount: number,
  fastCount: number,
  level: MasteryLevel,
): CoinResult {
  const coinsPerCorrect = getCoinsPerCorrect(level)
  const baseCoins = correctCount * coinsPerCorrect
  const speedBonus = fastCount >= 7
  const totalCoins = speedBonus ? baseCoins * 2 : baseCoins

  return { baseCoins, totalCoins, speedBonus }
}
