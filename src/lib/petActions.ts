/**
 * petActions — Lógica de negócio pura do bichinho virtual
 *
 * Funções puras sem side effects. A pet store usa estas funções
 * internamente para manter a lógica testável separada do Zustand.
 */

import { ITEM_PRICES } from './coinCalculator'
import type { ItemType } from './coinCalculator'

export type { ItemType }

/**
 * Estado derivado em runtime a partir de lastFedAt + lastWateredAt.
 * Nunca persiste diretamente.
 *
 * - happy: alimentado E hidratado
 * - hungry: precisa de comida (mas hidratado)
 * - thirsty: precisa de água (mas alimentado)
 * - hungry_and_thirsty: precisa de ambos
 * - sick: qualquer um dos dois ultrapassou 24h
 */
export type PetStatus = 'happy' | 'hungry' | 'thirsty' | 'hungry_and_thirsty' | 'sick'

export interface PetInventory {
  water: number
  food: number
  medicine: number
}

/** Limites de tempo para cada estado */
const STATUS_THRESHOLDS = {
  HAPPY_MAX_MS: 12 * 60 * 60 * 1000, // 12h
  NEED_MAX_MS: 24 * 60 * 60 * 1000, // 24h — após isso, fica doente
}

/**
 * Deriva o status atual do pet a partir dos timestamps de alimentação e hidratação.
 * Esta é a única fonte de verdade — nunca salvar o status diretamente.
 */
export function derivePetStatus(lastFedAt: number, lastWateredAt: number): PetStatus {
  const now = Date.now()
  const fedElapsed = now - lastFedAt
  const wateredElapsed = now - lastWateredAt

  // Doente: qualquer necessidade ultrapassou 24h
  if (fedElapsed > STATUS_THRESHOLDS.NEED_MAX_MS || wateredElapsed > STATUS_THRESHOLDS.NEED_MAX_MS) {
    return 'sick'
  }

  const isHungry = fedElapsed > STATUS_THRESHOLDS.HAPPY_MAX_MS
  const isThirsty = wateredElapsed > STATUS_THRESHOLDS.HAPPY_MAX_MS

  if (isHungry && isThirsty) return 'hungry_and_thirsty'
  if (isHungry) return 'hungry'
  if (isThirsty) return 'thirsty'
  return 'happy'
}

/**
 * Valida se o pet pode ser alimentado com o item dado.
 *
 * Regras:
 * - Pet feliz recusa qualquer item (já está saciado)
 * - Remédio funciona em qualquer estado não-feliz (cura sick)
 * - Água funciona quando o pet está com sede (thirsty ou hungry_and_thirsty)
 * - Comida funciona quando o pet está com fome (hungry ou hungry_and_thirsty)
 * - Inventário deve ter pelo menos 1 unidade do item
 */
export function canFeedPet(
  status: PetStatus,
  inventory: PetInventory,
  type: ItemType,
): boolean {
  if (status === 'happy') return false
  if (inventory[type] <= 0) return false

  if (type === 'medicine') return status === 'sick'

  if (type === 'water') {
    return status === 'thirsty' || status === 'hungry_and_thirsty'
  }

  if (type === 'food') {
    return status === 'hungry' || status === 'hungry_and_thirsty'
  }

  return false
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
    case 'thirsty':
      return 'Com sede... 💧'
    case 'hungry_and_thirsty':
      return 'Com fome e sede! 😢💧'
    case 'sick':
      return 'Doentinho 🤒'
  }
}
