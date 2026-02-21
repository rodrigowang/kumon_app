/**
 * Testes da usePetStore
 *
 * feedPet, buyItem, completedLesson, getPetStatus
 * Estado é resetado via resetPetProgress() antes de cada teste.
 *
 * 5 estados: happy, hungry, thirsty, hungry_and_thirsty, sick
 * - lastFedAt controla fome, lastWateredAt controla sede
 * - Água cura sede, comida cura fome, remédio cura sick (ambos)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { usePetStore } from '../../src/stores/usePetStore'

const HOUR = 60 * 60 * 1000

/** Reseta a store para estado inicial antes de cada teste */
beforeEach(() => {
  usePetStore.getState().resetPetProgress()
})

/** Helper: coloca o pet em estado happy (ambos timestamps recentes) */
function setHappy() {
  usePetStore.setState({ lastFedAt: Date.now(), lastWateredAt: Date.now() })
}

/** Helper: coloca o pet em estado hungry (lastFedAt > 12h, lastWateredAt ok) */
function setHungry() {
  usePetStore.setState({ lastFedAt: Date.now() - 13 * HOUR, lastWateredAt: Date.now() })
}

/** Helper: coloca o pet em estado thirsty (lastWateredAt > 12h, lastFedAt ok) */
function setThirsty() {
  usePetStore.setState({ lastFedAt: Date.now(), lastWateredAt: Date.now() - 13 * HOUR })
}

/** Helper: coloca o pet em estado sick (lastFedAt > 24h) */
function setSick() {
  usePetStore.setState({ lastFedAt: Date.now() - 25 * HOUR, lastWateredAt: Date.now() })
}

// ─── getPetStatus ──────────────────────────────────────────────────────────

describe('getPetStatus', () => {
  it('retorna hungry no estado inicial (lastFedAt = 0, pet começa com fome)', () => {
    // Estado inicial: lastFedAt = 0 (> 24h atrás), então é sick
    // Na verdade, lastFedAt = 0 é epoch → > 24h → sick
    const status = usePetStore.getState().getPetStatus()
    expect(status).toBe('sick')
  })

  it('retorna happy quando ambos timestamps são recentes', () => {
    setHappy()
    expect(usePetStore.getState().getPetStatus()).toBe('happy')
  })

  it('retorna hungry quando lastFedAt > 12h e lastWateredAt ok', () => {
    setHungry()
    expect(usePetStore.getState().getPetStatus()).toBe('hungry')
  })

  it('retorna thirsty quando lastWateredAt > 12h e lastFedAt ok', () => {
    setThirsty()
    expect(usePetStore.getState().getPetStatus()).toBe('thirsty')
  })

  it('retorna sick quando lastFedAt > 24h', () => {
    setSick()
    expect(usePetStore.getState().getPetStatus()).toBe('sick')
  })

  it('retorna sick quando lastWateredAt > 24h', () => {
    usePetStore.setState({ lastFedAt: Date.now(), lastWateredAt: Date.now() - 25 * HOUR })
    expect(usePetStore.getState().getPetStatus()).toBe('sick')
  })
})

// ─── feedPet ───────────────────────────────────────────────────────────────

describe('feedPet', () => {
  it('retorna false quando pet está happy (recusa)', () => {
    setHappy()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('water')).toBe(false)
  })

  it('retorna false quando inventário está vazio', () => {
    setHungry()
    usePetStore.setState({ inventory: { water: 0, food: 0, medicine: 0 } })
    expect(usePetStore.getState().feedPet('food')).toBe(false)
  })

  // Água → cura sede
  it('retorna true para água quando thirsty e decrementa inventário', () => {
    setThirsty()
    usePetStore.setState({ inventory: { water: 2, food: 0, medicine: 0 } })

    const ok = usePetStore.getState().feedPet('water')

    expect(ok).toBe(true)
    expect(usePetStore.getState().inventory.water).toBe(1)
  })

  it('atualiza lastWateredAt após dar água', () => {
    const before = Date.now()
    setThirsty()
    usePetStore.setState({ inventory: { water: 1, food: 0, medicine: 0 } })

    usePetStore.getState().feedPet('water')

    expect(usePetStore.getState().lastWateredAt).toBeGreaterThanOrEqual(before)
  })

  it('retorna false para água quando hungry (sem sede)', () => {
    setHungry()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('water')).toBe(false)
  })

  // Comida → cura fome
  it('retorna true para comida quando hungry e decrementa inventário', () => {
    setHungry()
    usePetStore.setState({ inventory: { water: 0, food: 2, medicine: 0 } })

    const ok = usePetStore.getState().feedPet('food')

    expect(ok).toBe(true)
    expect(usePetStore.getState().inventory.food).toBe(1)
  })

  it('atualiza lastFedAt após dar comida', () => {
    const before = Date.now()
    setHungry()
    usePetStore.setState({ inventory: { water: 0, food: 1, medicine: 0 } })

    usePetStore.getState().feedPet('food')

    expect(usePetStore.getState().lastFedAt).toBeGreaterThanOrEqual(before)
  })

  it('retorna false para comida quando thirsty (sem fome)', () => {
    setThirsty()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('food')).toBe(false)
  })

  // Remédio → só cura sick
  it('retorna false para água quando sick', () => {
    setSick()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('water')).toBe(false)
  })

  it('retorna false para comida quando sick', () => {
    setSick()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('food')).toBe(false)
  })

  it('retorna true para remédio quando sick e atualiza ambos timestamps', () => {
    const before = Date.now()
    setSick()
    usePetStore.setState({ inventory: { water: 0, food: 0, medicine: 1 } })

    const ok = usePetStore.getState().feedPet('medicine')

    expect(ok).toBe(true)
    expect(usePetStore.getState().inventory.medicine).toBe(0)
    expect(usePetStore.getState().lastFedAt).toBeGreaterThanOrEqual(before)
    expect(usePetStore.getState().lastWateredAt).toBeGreaterThanOrEqual(before)
  })

  it('retorna false para remédio quando hungry (não é sick)', () => {
    setHungry()
    usePetStore.setState({ inventory: { water: 3, food: 3, medicine: 3 } })
    expect(usePetStore.getState().feedPet('medicine')).toBe(false)
  })
})

// ─── buyItem ───────────────────────────────────────────────────────────────

describe('buyItem', () => {
  it('retorna false quando moedas insuficientes para água (< 4c)', () => {
    usePetStore.setState({ coins: 3 })
    const ok = usePetStore.getState().buyItem('water')
    expect(ok).toBe(false)
    expect(usePetStore.getState().coins).toBe(3) // não debitou
  })

  it('retorna true e debita 4 moedas ao comprar água', () => {
    usePetStore.setState({ coins: 10 })
    const ok = usePetStore.getState().buyItem('water')

    expect(ok).toBe(true)
    expect(usePetStore.getState().coins).toBe(6)
    expect(usePetStore.getState().inventory.water).toBe(1)
  })

  it('retorna true e debita 6 moedas ao comprar comida', () => {
    usePetStore.setState({ coins: 10 })
    usePetStore.getState().buyItem('food')

    expect(usePetStore.getState().coins).toBe(4)
    expect(usePetStore.getState().inventory.food).toBe(1)
  })

  it('retorna true e debita 20 moedas ao comprar remédio', () => {
    usePetStore.setState({ coins: 25 })
    usePetStore.getState().buyItem('medicine')

    expect(usePetStore.getState().coins).toBe(5)
    expect(usePetStore.getState().inventory.medicine).toBe(1)
  })

  it('retorna false quando moedas insuficientes para remédio (< 20c)', () => {
    usePetStore.setState({ coins: 19 })
    const ok = usePetStore.getState().buyItem('medicine')
    expect(ok).toBe(false)
    expect(usePetStore.getState().inventory.medicine).toBe(0)
  })

  it('acumula quantidade no inventário com múltiplas compras', () => {
    usePetStore.setState({ coins: 20 })
    usePetStore.getState().buyItem('water') // -4 → 16 coins
    usePetStore.getState().buyItem('water') // -4 → 12 coins
    usePetStore.getState().buyItem('water') // -4 → 8 coins

    expect(usePetStore.getState().inventory.water).toBe(3)
    expect(usePetStore.getState().coins).toBe(8)
  })
})

// ─── completedLesson ────────────────────────────────────────────────────────

describe('completedLesson', () => {
  it('credita moedas corretamente', () => {
    usePetStore.setState({ coins: 5 })
    usePetStore.getState().completedLesson(10)

    expect(usePetStore.getState().coins).toBe(15)
  })

  it('atualiza o streak (incrementa)', () => {
    // Simular "ontem" como lastLessonDate
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    usePetStore.setState({
      streak: { current: 3, lastLessonDate: yesterdayStr },
    })

    const result = usePetStore.getState().completedLesson(0)

    expect(result.newStreak).toBe(4)
    expect(usePetStore.getState().streak.current).toBe(4)
  })

  it('retorna streakBroken=true quando streak foi quebrado', () => {
    usePetStore.setState({
      streak: { current: 5, lastLessonDate: '2020-01-01' }, // data antiga
    })

    const result = usePetStore.getState().completedLesson(0)

    expect(result.streakBroken).toBe(true)
    expect(result.newStreak).toBe(1)
  })

  it('ativa emergency rescue quando pet está sick e coins < 20', () => {
    usePetStore.setState({
      lastFedAt: Date.now() - 25 * HOUR, // sick (fome > 24h)
      lastWateredAt: Date.now(),
      coins: 10, // < 20 (sem dinheiro para remédio)
    })

    const before = Date.now()
    const result = usePetStore.getState().completedLesson(5)

    expect(result.emergencyRescue).toBe(true)
    // Pet foi curado: ambos timestamps atualizados
    expect(usePetStore.getState().lastFedAt).toBeGreaterThanOrEqual(before)
    expect(usePetStore.getState().lastWateredAt).toBeGreaterThanOrEqual(before)
    expect(usePetStore.getState().getPetStatus()).toBe('happy')
  })

  it('ativa emergency rescue quando sick por sede (lastWateredAt > 24h)', () => {
    usePetStore.setState({
      lastFedAt: Date.now(),
      lastWateredAt: Date.now() - 25 * HOUR, // sick por sede
      coins: 5,
    })

    const result = usePetStore.getState().completedLesson(5)

    expect(result.emergencyRescue).toBe(true)
    expect(usePetStore.getState().getPetStatus()).toBe('happy')
  })

  it('NÃO ativa emergency rescue quando sick mas coins >= 20', () => {
    usePetStore.setState({
      lastFedAt: Date.now() - 25 * HOUR, // sick
      lastWateredAt: Date.now(),
      coins: 20, // tem dinheiro para remédio
    })

    const result = usePetStore.getState().completedLesson(5)

    expect(result.emergencyRescue).toBe(false)
    // Pet continua sick
    expect(usePetStore.getState().getPetStatus()).toBe('sick')
  })

  it('NÃO ativa emergency rescue quando pet está apenas hungry', () => {
    usePetStore.setState({
      lastFedAt: Date.now() - 13 * HOUR, // hungry
      lastWateredAt: Date.now(),
      coins: 0,
    })

    const result = usePetStore.getState().completedLesson(5)

    expect(result.emergencyRescue).toBe(false)
  })

  it('desbloqueia troféu ao atingir 7 dias seguidos', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    usePetStore.setState({
      streak: { current: 6, lastLessonDate: yesterdayStr },
      hasTrophy7Days: false,
    })

    const result = usePetStore.getState().completedLesson(0)

    expect(result.trophyUnlocked).toBe(true)
    expect(usePetStore.getState().hasTrophy7Days).toBe(true)
  })

  it('NÃO desbloqueia troféu duas vezes', () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    usePetStore.setState({
      streak: { current: 7, lastLessonDate: yesterdayStr },
      hasTrophy7Days: true, // já tem troféu
    })

    const result = usePetStore.getState().completedLesson(0)

    expect(result.trophyUnlocked).toBe(false)
  })
})
