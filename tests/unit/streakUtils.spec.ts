/**
 * Testes unitários: streakUtils
 *
 * updateStreak, hasCompletedToday, wasStreakBroken
 * Usa vi.useFakeTimers() para controlar datas.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  updateStreak,
  hasCompletedToday,
  wasStreakBroken,
  getTodayString,
  getYesterdayString,
} from '../../src/lib/streakUtils'
import type { Streak } from '../../src/lib/streakUtils'

// Data fixa para todos os testes
const FIXED_DATE = new Date('2024-06-15T12:00:00.000Z')
const TODAY = '2024-06-15'
const YESTERDAY = '2024-06-14'
const TWO_DAYS_AGO = '2024-06-13'

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(FIXED_DATE)
})

afterEach(() => {
  vi.useRealTimers()
})

// ─── getTodayString / getYesterdayString ───────────────────────────────────

describe('getTodayString', () => {
  it('retorna a data de hoje no formato YYYY-MM-DD', () => {
    expect(getTodayString()).toBe(TODAY)
  })
})

describe('getYesterdayString', () => {
  it('retorna a data de ontem no formato YYYY-MM-DD', () => {
    expect(getYesterdayString()).toBe(YESTERDAY)
  })
})

// ─── updateStreak ──────────────────────────────────────────────────────────

describe('updateStreak', () => {
  it('inicia streak em 1 na primeira lição', () => {
    const streak: Streak = { current: 0, lastLessonDate: '' }
    const result = updateStreak(streak)

    expect(result.current).toBe(1)
    expect(result.lastLessonDate).toBe(TODAY)
  })

  it('incrementa streak quando última lição foi ontem', () => {
    const streak: Streak = { current: 5, lastLessonDate: YESTERDAY }
    const result = updateStreak(streak)

    expect(result.current).toBe(6)
    expect(result.lastLessonDate).toBe(TODAY)
  })

  it('reinicia streak para 1 quando última lição foi há 2+ dias', () => {
    const streak: Streak = { current: 5, lastLessonDate: TWO_DAYS_AGO }
    const result = updateStreak(streak)

    expect(result.current).toBe(1)
    expect(result.lastLessonDate).toBe(TODAY)
  })

  it('NÃO altera streak se já completou uma lição hoje', () => {
    const streak: Streak = { current: 4, lastLessonDate: TODAY }
    const result = updateStreak(streak)

    expect(result.current).toBe(4) // inalterado
    expect(result.lastLessonDate).toBe(TODAY)
  })

  it('reinicia para 1 se última lição foi há uma semana', () => {
    const streak: Streak = { current: 20, lastLessonDate: '2024-06-08' }
    const result = updateStreak(streak)

    expect(result.current).toBe(1)
  })

  it('streak de 1 incrementa para 2 no dia seguinte', () => {
    const streak: Streak = { current: 1, lastLessonDate: YESTERDAY }
    const result = updateStreak(streak)

    expect(result.current).toBe(2)
  })
})

// ─── hasCompletedToday ─────────────────────────────────────────────────────

describe('hasCompletedToday', () => {
  it('retorna true se lastLessonDate é hoje', () => {
    const streak: Streak = { current: 3, lastLessonDate: TODAY }
    expect(hasCompletedToday(streak)).toBe(true)
  })

  it('retorna false se lastLessonDate é ontem', () => {
    const streak: Streak = { current: 3, lastLessonDate: YESTERDAY }
    expect(hasCompletedToday(streak)).toBe(false)
  })

  it('retorna false se nunca jogou', () => {
    const streak: Streak = { current: 0, lastLessonDate: '' }
    expect(hasCompletedToday(streak)).toBe(false)
  })
})

// ─── wasStreakBroken ────────────────────────────────────────────────────────

describe('wasStreakBroken', () => {
  it('retorna true quando streak era >1 e reiniciou para 1', () => {
    const oldStreak: Streak = { current: 5, lastLessonDate: TWO_DAYS_AGO }
    const newStreak: Streak = { current: 1, lastLessonDate: TODAY }

    expect(wasStreakBroken(oldStreak, newStreak)).toBe(true)
  })

  it('retorna false quando streak continuou normalmente', () => {
    const oldStreak: Streak = { current: 5, lastLessonDate: YESTERDAY }
    const newStreak: Streak = { current: 6, lastLessonDate: TODAY }

    expect(wasStreakBroken(oldStreak, newStreak)).toBe(false)
  })

  it('retorna false quando era 1 e foi para 1 (primeiro dia reiniciado)', () => {
    const oldStreak: Streak = { current: 1, lastLessonDate: TWO_DAYS_AGO }
    const newStreak: Streak = { current: 1, lastLessonDate: TODAY }

    expect(wasStreakBroken(oldStreak, newStreak)).toBe(false) // não considera "quebrado" se era 1
  })

  it('retorna false quando era 0 (primeiro uso)', () => {
    const oldStreak: Streak = { current: 0, lastLessonDate: '' }
    const newStreak: Streak = { current: 1, lastLessonDate: TODAY }

    expect(wasStreakBroken(oldStreak, newStreak)).toBe(false)
  })
})
