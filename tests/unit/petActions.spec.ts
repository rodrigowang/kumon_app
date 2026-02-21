/**
 * Testes unitários: petActions
 *
 * Funções puras — derivePetStatus, canFeedPet, canBuyItem, getPetStatusLabel
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
const fullInventory: PetInventory = { water: 3, food: 3, medicine: 3 }
const emptyInventory: PetInventory = { water: 0, food: 0, medicine: 0 }

// ─── derivePetStatus ────────────────────────────────────────────────────────

describe('derivePetStatus', () => {
  it('retorna happy quando alimentado há menos de 24h', () => {
    const lastFedAt = Date.now() - 10 * HOUR
    expect(derivePetStatus(lastFedAt)).toBe('happy')
  })

  it('retorna happy exatamente no limite de 24h (fronteira)', () => {
    const lastFedAt = Date.now() - 23 * HOUR
    expect(derivePetStatus(lastFedAt)).toBe('happy')
  })

  it('retorna hungry quando alimentado entre 24h e 48h atrás', () => {
    const lastFedAt = Date.now() - 25 * HOUR
    expect(derivePetStatus(lastFedAt)).toBe('hungry')
  })

  it('retorna hungry exatamente no limite de 47h', () => {
    const lastFedAt = Date.now() - 47 * HOUR
    expect(derivePetStatus(lastFedAt)).toBe('hungry')
  })

  it('retorna sick quando alimentado há mais de 48h', () => {
    const lastFedAt = Date.now() - 50 * HOUR
    expect(derivePetStatus(lastFedAt)).toBe('sick')
  })

  it('retorna sick quando nunca alimentado (lastFedAt muito antigo)', () => {
    const lastFedAt = Date.now() - 7 * 24 * HOUR // 7 dias
    expect(derivePetStatus(lastFedAt)).toBe('sick')
  })
})

// ─── canFeedPet ────────────────────────────────────────────────────────────

describe('canFeedPet', () => {
  it('retorna false quando pet está happy (qualquer item)', () => {
    expect(canFeedPet('happy', fullInventory, 'water')).toBe(false)
    expect(canFeedPet('happy', fullInventory, 'food')).toBe(false)
    expect(canFeedPet('happy', fullInventory, 'medicine')).toBe(false)
  })

  it('retorna false quando inventário está vazio', () => {
    expect(canFeedPet('hungry', emptyInventory, 'water')).toBe(false)
    expect(canFeedPet('hungry', emptyInventory, 'food')).toBe(false)
    expect(canFeedPet('sick', emptyInventory, 'medicine')).toBe(false)
  })

  it('retorna true para água quando hungry e estoque > 0', () => {
    expect(canFeedPet('hungry', fullInventory, 'water')).toBe(true)
  })

  it('retorna true para comida quando hungry e estoque > 0', () => {
    expect(canFeedPet('hungry', fullInventory, 'food')).toBe(true)
  })

  it('retorna false para água quando sick (água não cura doença)', () => {
    expect(canFeedPet('sick', fullInventory, 'water')).toBe(false)
  })

  it('retorna false para comida quando sick (comida não cura doença)', () => {
    expect(canFeedPet('sick', fullInventory, 'food')).toBe(false)
  })

  it('retorna true para remédio quando sick', () => {
    expect(canFeedPet('sick', fullInventory, 'medicine')).toBe(true)
  })

  it('retorna true para remédio quando hungry (remédio funciona em hungry também)', () => {
    expect(canFeedPet('hungry', fullInventory, 'medicine')).toBe(true)
  })

  it('respeita estoque unitário (exatamente 1 item)', () => {
    const oneItem: PetInventory = { water: 1, food: 0, medicine: 0 }
    expect(canFeedPet('hungry', oneItem, 'water')).toBe(true)
    expect(canFeedPet('hungry', oneItem, 'food')).toBe(false)
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
  const statuses: PetStatus[] = ['happy', 'hungry', 'sick']

  it('retorna string não-vazia para cada status', () => {
    for (const s of statuses) {
      expect(getPetStatusLabel(s)).toBeTruthy()
    }
  })

  it('cada status tem label diferente', () => {
    const labels = statuses.map(getPetStatusLabel)
    const unique = new Set(labels)
    expect(unique.size).toBe(3)
  })
})
