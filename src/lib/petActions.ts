/**
 * petActions — Lógica de negócio pura do bichinho virtual
 *
 * Funções puras sem side effects. A pet store usa estas funções
 * internamente para manter a lógica testável separada do Zustand.
 */

import { ITEM_PRICES } from './coinCalculator'
import type { ItemType } from './coinCalculator'

export type { ItemType }

/** Estado derivado em runtime a partir de lastFedAt — nunca persiste diretamente */
export type PetStatus = 'happy' | 'hungry' | 'sick'

export interface PetInventory {
  water: number
  food: number
  medicine: number
}

/** Limites de tempo para cada estado */
const STATUS_THRESHOLDS = {
  HAPPY_MAX_MS: 24 * 60 * 60 * 1000, // 24h
  HUNGRY_MAX_MS: 48 * 60 * 60 * 1000, // 48h
}

/**
 * Deriva o status atual do pet a partir do timestamp da última alimentação.
 * Esta é a única fonte de verdade — nunca salvar o status diretamente.
 */
export function derivePetStatus(lastFedAt: number): PetStatus {
  const elapsed = Date.now() - lastFedAt
  if (elapsed <= STATUS_THRESHOLDS.HAPPY_MAX_MS) return 'happy'
  if (elapsed <= STATUS_THRESHOLDS.HUNGRY_MAX_MS) return 'hungry'
  return 'sick'
}

/**
 * Valida se o pet pode ser alimentado com o item dado.
 *
 * Regras:
 * - Pet feliz recusa qualquer item (já está saciado)
 * - Remédio funciona em `hungry` e `sick`
 * - Água e comida funcionam em `hungry` (não curam doença)
 * - Inventário deve ter pelo menos 1 unidade do item
 */
export function canFeedPet(
  status: PetStatus,
  inventory: PetInventory,
  type: ItemType,
): boolean {
  if (status === 'happy') return false
  if (inventory[type] <= 0) return false
  // Água e comida não curam doença (estado `sick`)
  if (type !== 'medicine' && status === 'sick') return false
  return true
}

/**
 * Valida se a criança tem moedas suficientes para comprar o item.
 */
export function canBuyItem(coins: number, type: ItemType): boolean {
  return coins >= ITEM_PRICES[type]
}

/**
 * Mensagem de label amigável para o status do pet (UI).
 */
export function getPetStatusLabel(status: PetStatus): string {
  switch (status) {
    case 'happy':
      return 'Feliz! 😊'
    case 'hungry':
      return 'Com fome... 😢'
    case 'sick':
      return 'Doentinho 🤒'
  }
}
