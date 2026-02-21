/**
 * Testes unitários: petActions
 *
 * Funções puras — derivePetStatus, canFeedPet, canBuyItem, getPetStatusLabel
 *
 * 5 estados: happy, hungry, thirsty, hungry_and_thirsty, sick
 * - Fome: lastFedAt > 12h → hungry, > 24h → sick
 * - Sede: lastWateredAt > 12h → thirsty, > 24h → sick
 */

import { describe, it, expect } from 'vitest'
import {
  derivePetStatus,
  canFeedPet,
  canBuyItem,
  getPetStatusLabel,
} from '../../src/lib/petActions'
import type { PetInventory, PetStatus } from '../../src/lib/petActions'

const HOUR = 60 * 60 * 1000
const now = () => Date.now()
const fullInventory: PetInventory = { water: 3, food: 3, medicine: 3 }
const emptyInventory: PetInventory = { water: 0, food: 0, medicine: 0 }

// ─── derivePetStatus ────────────────────────────────────────────────────────

describe('derivePetStatus', () => {
  it('retorna happy quando alimentado e hidratado recentemente', () => {
    expect(derivePetStatus(now(), now())).toBe('happy')
  })

  it('retorna happy quando ambos estão dentro de 12h', () => {
    expect(derivePetStatus(now() - 11 * HOUR, now() - 11 * HOUR)).toBe('happy')
  })

  it('retorna hungry quando lastFedAt > 12h mas lastWateredAt < 12h', () => {
    expect(derivePetStatus(now() - 13 * HOUR, now())).toBe('hungry')
  })

  it('retorna thirsty quando lastWateredAt > 12h mas lastFedAt < 12h', () => {
    expect(derivePetStatus(now(), now() - 13 * HOUR)).toBe('thirsty')
  })

  it('retorna hungry_and_thirsty quando ambos > 12h mas ambos < 24h', () => {
    expect(derivePetStatus(now() - 13 * HOUR, now() - 13 * HOUR)).toBe('hungry_and_thirsty')
  })

  it('retorna sick quando lastFedAt > 24h (mesmo com lastWateredAt ok)', () => {
    expect(derivePetStatus(now() - 25 * HOUR, now())).toBe('sick')
  })

  it('retorna sick quando lastWateredAt > 24h (mesmo com lastFedAt ok)', () => {
    expect(derivePetStatus(now(), now() - 25 * HOUR)).toBe('sick')
  })

  it('retorna sick quando ambos > 24h', () => {
    expect(derivePetStatus(now() - 50 * HOUR, now() - 50 * HOUR)).toBe('sick')
  })

  it('retorna sick quando nunca alimentado (lastFedAt = 0)', () => {
    expect(derivePetStatus(0, now())).toBe('sick')
  })

  // Fronteiras
  it('fronteira: exatamente 12h é happy (não ultrapassou)', () => {
    const t = now() - 12 * HOUR
    // 12h exato: elapsed === HAPPY_MAX_MS, condição é > (estrito)
    expect(derivePetStatus(t, now())).toBe('happy')
  })

  it('fronteira: 12h + 1ms é hungry', () => {
    const t = now() - 12 * HOUR - 1
    expect(derivePetStatus(t, now())).toBe('hungry')
  })
})

// ─── canFeedPet ────────────────────────────────────────────────────────────

describe('canFeedPet', () => {
  // Happy: recusa tudo
  it('retorna false quando pet está happy (qualquer item)', () => {
    expect(canFeedPet('happy', fullInventory, 'water')).toBe(false)
    expect(canFeedPet('happy', fullInventory, 'food')).toBe(false)
    expect(canFeedPet('happy', fullInventory, 'medicine')).toBe(false)
  })

  // Inventário vazio
  it('retorna false quando inventário está vazio', () => {
    expect(canFeedPet('hungry', emptyInventory, 'food')).toBe(false)
    expect(canFeedPet('thirsty', emptyInventory, 'water')).toBe(false)
    expect(canFeedPet('sick', emptyInventory, 'medicine')).toBe(false)
  })

  // Água: só funciona em thirsty e hungry_and_thirsty
  it('retorna true para água quando thirsty', () => {
    expect(canFeedPet('thirsty', fullInventory, 'water')).toBe(true)
  })

  it('retorna true para água quando hungry_and_thirsty', () => {
    expect(canFeedPet('hungry_and_thirsty', fullInventory, 'water')).toBe(true)
  })

  it('retorna false para água quando hungry (sem sede)', () => {
    expect(canFeedPet('hungry', fullInventory, 'water')).toBe(false)
  })

  it('retorna false para água quando sick', () => {
    expect(canFeedPet('sick', fullInventory, 'water')).toBe(false)
  })

  // Comida: só funciona em hungry e hungry_and_thirsty
  it('retorna true para comida quando hungry', () => {
    expect(canFeedPet('hungry', fullInventory, 'food')).toBe(true)
  })

  it('retorna true para comida quando hungry_and_thirsty', () => {
    expect(canFeedPet('hungry_and_thirsty', fullInventory, 'food')).toBe(true)
  })

  it('retorna false para comida quando thirsty (sem fome)', () => {
    expect(canFeedPet('thirsty', fullInventory, 'food')).toBe(false)
  })

  it('retorna false para comida quando sick', () => {
    expect(canFeedPet('sick', fullInventory, 'food')).toBe(false)
  })

  // Remédio: só funciona em sick
  it('retorna true para remédio quando sick', () => {
    expect(canFeedPet('sick', fullInventory, 'medicine')).toBe(true)
  })

  it('retorna false para remédio quando hungry (remédio só cura sick)', () => {
    expect(canFeedPet('hungry', fullInventory, 'medicine')).toBe(false)
  })

  it('retorna false para remédio quando thirsty', () => {
    expect(canFeedPet('thirsty', fullInventory, 'medicine')).toBe(false)
  })

  it('retorna false para remédio quando hungry_and_thirsty', () => {
    expect(canFeedPet('hungry_and_thirsty', fullInventory, 'medicine')).toBe(false)
  })

  // Estoque
  it('respeita estoque unitário (exatamente 1 item)', () => {
    const oneWater: PetInventory = { water: 1, food: 0, medicine: 0 }
    expect(canFeedPet('thirsty', oneWater, 'water')).toBe(true)
    expect(canFeedPet('hungry', oneWater, 'food')).toBe(false)
  })
})

// ─── canBuyItem ────────────────────────────────────────────────────────────

describe('canBuyItem', () => {
  it('retorna false com 0 moedas', () => {
    expect(canBuyItem(0, 'water')).toBe(false)
    expect(canBuyItem(0, 'food')).toBe(false)
    expect(canBuyItem(0, 'medicine')).toBe(false)
  })

  it('retorna false com moedas insuficientes para água (< 4c)', () => {
    expect(canBuyItem(3, 'water')).toBe(false)
  })

  it('retorna true com moedas exatas para água (4c)', () => {
    expect(canBuyItem(4, 'water')).toBe(true)
  })

  it('retorna false com moedas insuficientes para comida (< 6c)', () => {
    expect(canBuyItem(5, 'food')).toBe(false)
  })

  it('retorna true com moedas exatas para comida (6c)', () => {
    expect(canBuyItem(6, 'food')).toBe(true)
  })

  it('retorna false com moedas insuficientes para remédio (< 20c)', () => {
    expect(canBuyItem(19, 'medicine')).toBe(false)
  })

  it('retorna true com moedas exatas para remédio (20c)', () => {
    expect(canBuyItem(20, 'medicine')).toBe(true)
  })

  it('retorna true com moedas sobrando', () => {
    expect(canBuyItem(100, 'medicine')).toBe(true)
  })
})

// ─── getPetStatusLabel ─────────────────────────────────────────────────────

describe('getPetStatusLabel', () => {
  const statuses: PetStatus[] = ['happy', 'hungry', 'thirsty', 'hungry_and_thirsty', 'sick']

  it('retorna string não-vazia para cada status', () => {
    for (const s of statuses) {
      expect(getPetStatusLabel(s)).toBeTruthy()
    }
  })

  it('cada status tem label diferente', () => {
    const labels = statuses.map(getPetStatusLabel)
    const unique = new Set(labels)
    expect(unique.size).toBe(5)
  })
})
