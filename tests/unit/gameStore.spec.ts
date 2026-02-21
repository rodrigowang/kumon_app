/**
 * Testes da useGameStore
 *
 * startSession, endSession, submitExercise, dismissSubtractionBanner
 * Progressão: advance_microlevel → subtração desbloqueada
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../../src/stores/useGameStore'
import { MasteryTracker } from '../../src/lib/progression'
import type { ExerciseResult } from '../../src/types'

/** Reseta o store antes de cada teste */
beforeEach(() => {
  useGameStore.getState().resetProgress()
})

// ─── Helpers ─────────────────────────────────────────────────────────────

const fastResult = (): ExerciseResult => ({
  correct: true,
  speed: 'fast',
  timeMs: 2000,
  attempts: 1,
  timestamp: Date.now(),
})

const slowResult = (): ExerciseResult => ({
  correct: true,
  speed: 'slow',
  timeMs: 12000,
  attempts: 1,
  timestamp: Date.now(),
})

const wrongResult = (): ExerciseResult => ({
  correct: false,
  speed: 'hesitant',
  timeMs: 18000,
  attempts: 2,
  timestamp: Date.now(),
})

// ─── startSession ─────────────────────────────────────────────────────────

describe('startSession', () => {
  it('ativa sessionRound.isActive', () => {
    useGameStore.getState().startSession()
    expect(useGameStore.getState().sessionRound.isActive).toBe(true)
  })

  it('inicia exerciseIndex em 0', () => {
    useGameStore.getState().startSession()
    expect(useGameStore.getState().sessionRound.exerciseIndex).toBe(0)
  })

  it('reseta contadores (correct, incorrect, fastCount)', () => {
    useGameStore.getState().startSession()
    const round = useGameStore.getState().sessionRound
    expect(round.correct).toBe(0)
    expect(round.incorrect).toBe(0)
    expect(round.fastCount).toBe(0)
  })
})

// ─── submitExercise ────────────────────────────────────────────────────────

describe('submitExercise', () => {
  beforeEach(() => {
    useGameStore.getState().startSession()
  })

  it('incrementa exerciseIndex após submissão', () => {
    useGameStore.getState().submitExercise(fastResult())
    expect(useGameStore.getState().sessionRound.exerciseIndex).toBe(1)
  })

  it('incrementa correct em acerto', () => {
    useGameStore.getState().submitExercise(fastResult())
    expect(useGameStore.getState().sessionRound.correct).toBe(1)
    expect(useGameStore.getState().sessionRound.incorrect).toBe(0)
  })

  it('incrementa incorrect em erro', () => {
    useGameStore.getState().submitExercise(wrongResult())
    expect(useGameStore.getState().sessionRound.incorrect).toBe(1)
    expect(useGameStore.getState().sessionRound.correct).toBe(0)
  })

  it('incrementa fastCount em acerto rápido', () => {
    useGameStore.getState().submitExercise(fastResult())
    expect(useGameStore.getState().sessionRound.fastCount).toBe(1)
  })

  it('NÃO incrementa fastCount em acerto lento', () => {
    useGameStore.getState().submitExercise(slowResult())
    expect(useGameStore.getState().sessionRound.fastCount).toBe(0)
  })

  it('acumula estatísticas ao longo de 10 exercícios', () => {
    for (let i = 0; i < 7; i++) useGameStore.getState().submitExercise(fastResult())
    for (let i = 0; i < 3; i++) useGameStore.getState().submitExercise(wrongResult())

    const round = useGameStore.getState().sessionRound
    expect(round.exerciseIndex).toBe(10)
    expect(round.correct).toBe(7)
    expect(round.incorrect).toBe(3)
    expect(round.fastCount).toBe(7)
  })
})

// ─── isSessionComplete ─────────────────────────────────────────────────────

describe('isSessionComplete', () => {
  it('retorna false antes de 10 exercícios', () => {
    useGameStore.getState().startSession()
    for (let i = 0; i < 9; i++) {
      useGameStore.getState().submitExercise(fastResult())
    }
    expect(useGameStore.getState().isSessionComplete()).toBe(false)
  })

  it('retorna true após 10 exercícios', () => {
    useGameStore.getState().startSession()
    for (let i = 0; i < 10; i++) {
      useGameStore.getState().submitExercise(fastResult())
    }
    expect(useGameStore.getState().isSessionComplete()).toBe(true)
  })
})

// ─── endSession ────────────────────────────────────────────────────────────

describe('endSession', () => {
  const runSession = (correct: number, fast: number) => {
    useGameStore.getState().startSession()
    for (let i = 0; i < fast; i++) useGameStore.getState().submitExercise(fastResult())
    for (let i = fast; i < correct; i++) useGameStore.getState().submitExercise(slowResult())
    for (let i = correct; i < 10; i++) useGameStore.getState().submitExercise(wrongResult())
    return useGameStore.getState().endSession()
  }

  it('retorna coinsEarned > 0 após sessão com acertos', () => {
    const summary = runSession(8, 0)
    expect(summary.coinsEarned).toBeGreaterThan(0)
  })

  it('aplica bônus ×2 quando fastCount ≥ 7', () => {
    // 10 acertos, 7 rápidos
    const summaryWithBonus = runSession(10, 7)
    expect(summaryWithBonus.speedBonus).toBe(true)

    useGameStore.getState().resetProgress()

    // 10 acertos, 6 rápidos — sem bônus
    const summaryNoBonus = runSession(10, 6)
    expect(summaryNoBonus.speedBonus).toBe(false)
    expect(summaryWithBonus.coinsEarned).toBe(summaryNoBonus.coinsEarned * 2)
  })

  it('concede 1 estrela por completar (accuracy < 80%)', () => {
    const summary = runSession(7, 0) // 70% accuracy
    expect(summary.starsEarned).toBe(1)
  })

  it('concede 2 estrelas com accuracy ≥ 80%', () => {
    const summary = runSession(8, 0) // 80% accuracy
    expect(summary.starsEarned).toBe(2)
  })

  it('concede 3 estrelas com 100% accuracy', () => {
    const summary = runSession(10, 0) // 100%
    expect(summary.starsEarned).toBe(3)
  })

  it('retorna total, correct, incorrect corretos', () => {
    const summary = runSession(7, 0)
    expect(summary.total).toBe(10)
    expect(summary.correct).toBe(7)
    expect(summary.incorrect).toBe(3)
  })

  it('desativa sessionRound após encerrar', () => {
    runSession(10, 0)
    expect(useGameStore.getState().sessionRound.isActive).toBe(false)
  })

  it('incrementa totalStars', () => {
    const before = useGameStore.getState().totalStars
    const summary = runSession(10, 0)
    expect(useGameStore.getState().totalStars).toBe(before + summary.starsEarned)
  })
})

// ─── subtractionBannerSeen ─────────────────────────────────────────────────

describe('subtractionBannerSeen + dismissSubtractionBanner', () => {
  it('começa como false', () => {
    expect(useGameStore.getState().subtractionBannerSeen).toBe(false)
  })

  it('dismissSubtractionBanner define como true', () => {
    useGameStore.getState().dismissSubtractionBanner()
    expect(useGameStore.getState().subtractionBannerSeen).toBe(true)
  })

  it('resetProgress restaura para false', () => {
    useGameStore.getState().dismissSubtractionBanner()
    useGameStore.getState().resetProgress()
    expect(useGameStore.getState().subtractionBannerSeen).toBe(false)
  })
})

// ─── Progressão: adição → subtração ──────────────────────────────────────

describe('Progressão: adição completa → desbloqueia subtração', () => {
  it('avança para subtração após maestria no último nível de adição', () => {
    // Forçar nível máximo de adição: maxResult=20, abstract
    useGameStore.setState({
      currentLevel: { operation: 'addition', maxResult: 20, cpaPhase: 'abstract' },
      masteryTracker: new MasteryTracker({ operation: 'addition', maxResult: 20, cpaPhase: 'abstract' }),
    })

    useGameStore.getState().startSession()

    // 5 acertos rápidos → advance_microlevel → deve avançar para subtração
    for (let i = 0; i < 5; i++) {
      useGameStore.getState().submitExercise(fastResult())
    }

    const level = useGameStore.getState().currentLevel
    expect(level.operation).toBe('subtraction')
    expect(level.maxResult).toBe(5)
    expect(level.cpaPhase).toBe('concrete')
  })
})
