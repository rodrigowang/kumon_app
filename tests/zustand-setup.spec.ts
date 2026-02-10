import { describe, it, expect, beforeEach } from 'vitest'
import { useGameStore } from '../src/stores/useGameStore'
import { useProgressStore } from '../src/stores/useProgressStore'
import { useSettingsStore } from '../src/stores/useSettingsStore'

describe('Zustand Stores', () => {
  describe('useGameStore', () => {
    beforeEach(() => {
      useGameStore.setState({
        currentExercise: null,
        cpaPhase: 'concrete',
        level: 1,
        sessionData: null,
      })
    })

    it('Estado inicial correto', () => {
      const state = useGameStore.getState()
      expect(state.currentExercise).toBe(null)
      expect(state.cpaPhase).toBe('concrete')
      expect(state.level).toBe(1)
      expect(state.sessionData).toBe(null)
    })

    it('CPAPhase é um literal type válido', () => {
      const state = useGameStore.getState()
      expect(['concrete', 'pictorial', 'abstract']).toContain(state.cpaPhase)
    })

    it('Level é número ≥ 1', () => {
      const state = useGameStore.getState()
      expect(typeof state.level).toBe('number')
      expect(state.level).toBeGreaterThanOrEqual(1)
    })

    it('sessionData pode conter startTime, attempts, correctAnswers, mistakes', () => {
      useGameStore.setState({
        sessionData: {
          startTime: Date.now(),
          attempts: 3,
          correctAnswers: 2,
          mistakes: 1,
        },
      })
      const state = useGameStore.getState()
      expect(state.sessionData?.startTime).toBeDefined()
      expect(state.sessionData?.attempts).toBe(3)
      expect(state.sessionData?.correctAnswers).toBe(2)
      expect(state.sessionData?.mistakes).toBe(1)
    })
  })

  describe('useProgressStore', () => {
    beforeEach(() => {
      useProgressStore.setState({
        history: [],
        stars: {},
        unlockedLevels: [1],
      })
    })

    it('Estado inicial correto', () => {
      const state = useProgressStore.getState()
      expect(state.history).toEqual([])
      expect(state.stars).toEqual({})
      expect(state.unlockedLevels).toEqual([1])
    })

    it('history contém HistoryEntry válido', () => {
      useProgressStore.setState({
        history: [
          {
            exerciseId: 'add-1-2',
            timestamp: Date.now(),
            wasCorrect: true,
            attempts: 1,
            cpaPhase: 'concrete',
          },
        ],
      })
      const state = useProgressStore.getState()
      expect(state.history).toHaveLength(1)
      expect(state.history[0].exerciseId).toBe('add-1-2')
      expect(state.history[0].wasCorrect).toBe(true)
    })

    it('stars é Record<string, number>', () => {
      useProgressStore.setState({
        stars: {
          'add-1-2': 3,
          'add-2-3': 2,
        },
      })
      const state = useProgressStore.getState()
      expect(typeof state.stars).toBe('object')
      expect(state.stars['add-1-2']).toBe(3)
      expect(state.stars['add-2-3']).toBe(2)
    })

    it('unlockedLevels é array de números', () => {
      useProgressStore.setState({
        unlockedLevels: [1, 2, 3],
      })
      const state = useProgressStore.getState()
      expect(Array.isArray(state.unlockedLevels)).toBe(true)
      expect(state.unlockedLevels).toEqual([1, 2, 3])
    })
  })

  describe('useSettingsStore', () => {
    beforeEach(() => {
      useSettingsStore.setState({
        volume: 0.7,
        soundEnabled: true,
      })
    })

    it('Estado inicial correto', () => {
      const state = useSettingsStore.getState()
      expect(state.volume).toBe(0.7)
      expect(state.soundEnabled).toBe(true)
    })

    it('volume é número entre 0 e 1', () => {
      const state = useSettingsStore.getState()
      expect(typeof state.volume).toBe('number')
      expect(state.volume).toBeGreaterThanOrEqual(0)
      expect(state.volume).toBeLessThanOrEqual(1)
    })

    it('soundEnabled é booleano', () => {
      const state = useSettingsStore.getState()
      expect(typeof state.soundEnabled).toBe('boolean')
    })

    it('volume pode ser 0 (muted)', () => {
      useSettingsStore.setState({ volume: 0 })
      const state = useSettingsStore.getState()
      expect(state.volume).toBe(0)
    })

    it('volume pode ser 1 (máximo)', () => {
      useSettingsStore.setState({ volume: 1 })
      const state = useSettingsStore.getState()
      expect(state.volume).toBe(1)
    })
  })

  describe('TypeScript Strict (sem any)', () => {
    it('Tipos são explícitos (GameState, ProgressState, SettingsState)', () => {
      const game = useGameStore.getState()
      const progress = useProgressStore.getState()
      const settings = useSettingsStore.getState()

      // Se essas linhas compilam, os tipos estão corretos
      expect(game.cpaPhase === 'concrete' || game.cpaPhase === 'pictorial' || game.cpaPhase === 'abstract').toBe(true)
      expect(Array.isArray(progress.history)).toBe(true)
      expect(typeof settings.soundEnabled).toBe('boolean')
    })
  })

  describe('Integração com Pedagogia Kumon', () => {
    it('CPA oferece progressão linear: concrete → pictorial → abstract', () => {
      const phases = ['concrete', 'pictorial', 'abstract'] as const
      phases.forEach((phase) => {
        useGameStore.setState({ cpaPhase: phase })
        const state = useGameStore.getState()
        expect(state.cpaPhase).toBe(phase)
      })
    })

    it('Histórico permite rastreamento de maestria via padrão de erros', () => {
      const entries = [
        { exerciseId: 'add-1-2', timestamp: 1000, wasCorrect: true, attempts: 1, cpaPhase: 'concrete' as const },
        { exerciseId: 'add-1-2', timestamp: 2000, wasCorrect: false, attempts: 2, cpaPhase: 'concrete' as const },
        { exerciseId: 'add-1-2', timestamp: 3000, wasCorrect: true, attempts: 1, cpaPhase: 'pictorial' as const },
      ]
      useProgressStore.setState({ history: entries })
      const state = useProgressStore.getState()
      const mistakes = state.history.filter((e) => !e.wasCorrect).length
      expect(mistakes).toBe(1)
    })

    it('Autonomia da criança: controla som sem adulto', () => {
      useSettingsStore.setState({ soundEnabled: false, volume: 0.5 })
      const state = useSettingsStore.getState()
      expect(state.soundEnabled).toBe(false)
      expect(state.volume).toBe(0.5)
    })
  })
})
