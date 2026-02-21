/**
 * Testes unitários: coinCalculator
 *
 * getCoinsPerCorrect, calculateSessionCoins
 */

import { describe, it, expect } from 'vitest'
import { getCoinsPerCorrect, calculateSessionCoins } from '../../src/lib/coinCalculator'
import type { MasteryLevel } from '../../src/types'

const makeLevel = (maxResult: number, operation: 'addition' | 'subtraction' = 'addition'): MasteryLevel => ({
  operation,
  maxResult,
  cpaPhase: 'abstract',
})

// ─── getCoinsPerCorrect ────────────────────────────────────────────────────

describe('getCoinsPerCorrect', () => {
  it('retorna 1 moeda para maxResult = 5 (nível fácil)', () => {
    expect(getCoinsPerCorrect(makeLevel(5))).toBe(1)
  })

  it('retorna 1 moeda para maxResult = 10 (fronteira fácil)', () => {
    expect(getCoinsPerCorrect(makeLevel(10))).toBe(1)
  })

  it('retorna 3 moedas para maxResult = 11 (início do médio)', () => {
    expect(getCoinsPerCorrect(makeLevel(11))).toBe(3)
  })

  it('retorna 3 moedas para maxResult = 15 (médio)', () => {
    expect(getCoinsPerCorrect(makeLevel(15))).toBe(3)
  })

  it('retorna 3 moedas para maxResult = 20 (fronteira difícil)', () => {
    expect(getCoinsPerCorrect(makeLevel(20))).toBe(3)
  })

  it('retorna 5 moedas para maxResult = 21 (difícil)', () => {
    expect(getCoinsPerCorrect(makeLevel(21))).toBe(5)
  })

  it('retorna 5 moedas para maxResult = 30 (difícil extremo)', () => {
    expect(getCoinsPerCorrect(makeLevel(30))).toBe(5)
  })

  it('funciona igualmente para subtração', () => {
    expect(getCoinsPerCorrect(makeLevel(10, 'subtraction'))).toBe(1)
    expect(getCoinsPerCorrect(makeLevel(15, 'subtraction'))).toBe(3)
  })
})

// ─── calculateSessionCoins ─────────────────────────────────────────────────

describe('calculateSessionCoins', () => {
  const easyLevel = makeLevel(5)   // 1 moeda/acerto
  const medLevel  = makeLevel(15)  // 3 moedas/acerto

  describe('moedas base', () => {
    it('10 acertos no nível fácil = 10 moedas (sem bônus)', () => {
      const result = calculateSessionCoins(10, 0, easyLevel)
      expect(result.baseCoins).toBe(10)
      expect(result.totalCoins).toBe(10)
      expect(result.speedBonus).toBe(false)
    })

    it('10 acertos no nível médio = 30 moedas (sem bônus)', () => {
      const result = calculateSessionCoins(10, 0, medLevel)
      expect(result.baseCoins).toBe(30)
      expect(result.totalCoins).toBe(30)
      expect(result.speedBonus).toBe(false)
    })

    it('0 acertos = 0 moedas', () => {
      const result = calculateSessionCoins(0, 0, easyLevel)
      expect(result.baseCoins).toBe(0)
      expect(result.totalCoins).toBe(0)
    })

    it('5 acertos no nível fácil = 5 moedas', () => {
      const result = calculateSessionCoins(5, 0, easyLevel)
      expect(result.baseCoins).toBe(5)
    })
  })

  describe('bônus de velocidade (×2 se fastCount ≥ 7)', () => {
    it('fastCount = 6 NÃO aplica bônus', () => {
      const result = calculateSessionCoins(10, 6, easyLevel)
      expect(result.speedBonus).toBe(false)
      expect(result.totalCoins).toBe(result.baseCoins)
    })

    it('fastCount = 7 aplica bônus ×2', () => {
      const result = calculateSessionCoins(10, 7, easyLevel)
      expect(result.speedBonus).toBe(true)
      expect(result.totalCoins).toBe(result.baseCoins * 2)
    })

    it('fastCount = 10 aplica bônus ×2', () => {
      const result = calculateSessionCoins(10, 10, easyLevel)
      expect(result.speedBonus).toBe(true)
      expect(result.totalCoins).toBe(result.baseCoins * 2)
    })

    it('10 acertos + 7 fast no nível fácil = 20 moedas (10 base × 2)', () => {
      const result = calculateSessionCoins(10, 7, easyLevel)
      expect(result.baseCoins).toBe(10)
      expect(result.totalCoins).toBe(20)
    })

    it('10 acertos + 7 fast no nível médio = 60 moedas (30 base × 2)', () => {
      const result = calculateSessionCoins(10, 7, medLevel)
      expect(result.baseCoins).toBe(30)
      expect(result.totalCoins).toBe(60)
    })
  })
})
