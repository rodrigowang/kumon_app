/**
 * coinCalculator — Cálculo de moedas por sessão de exercícios
 *
 * Funções puras sem side effects.
 * Integrado ao endSession() do useGameStore e completedLesson() do usePetStore.
 */

import type { MasteryLevel } from '../types'

export type ItemType = 'water' | 'food' | 'medicine'

/** Preços dos itens da loja */
export const ITEM_PRICES: Record<ItemType, number> = {
  water: 4,
  food: 6,
  medicine: 20,
}

/**
 * Moedas base ganhas por acerto, baseado no nível de dificuldade.
 *
 * | maxResult | Dificuldade     | Moedas/acerto |
 * |-----------|-----------------|---------------|
 * | ≤ 10      | 1+1 fácil       | 1c            |
 * | 11 – 20   | 1+1 difícil     | 3c            |
 * | 21 – 99   | 2+1 dígitos     | 8c            |
 * | ≥ 100     | 3+1 dígitos     | 15c           |
 */
export function getCoinsPerCorrect(level: MasteryLevel): number {
  if (level.maxResult <= 10) return 1
  if (level.maxResult <= 20) return 3
  if (level.maxResult <= 99) return 8
  return 15
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
