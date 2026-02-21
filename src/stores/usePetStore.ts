/**
 * usePetStore — Estado global do bichinho virtual
 *
 * Regras críticas:
 * - NUNCA persiste `status` — sempre derivado de `lastFedAt` em runtime
 * - `completedLesson()` é a única porta de entrada de moedas
 * - Emergency rescue: pet doente + moedas insuficientes → cura automática ao completar lição
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { derivePetStatus, canFeedPet, canBuyItem } from '../lib/petActions'
import { ITEM_PRICES } from '../lib/coinCalculator'
import { updateStreak, wasStreakBroken } from '../lib/streakUtils'

import type { PetStatus, PetInventory, ItemType } from '../lib/petActions'
import type { Streak } from '../lib/streakUtils'

export type { PetStatus, PetInventory, ItemType }

// ─── Estado ───────────────────────────────────────────────────────────────────

interface PetState {
  /** Saldo de moedas da criança */
  coins: number
  /** Timestamp (ms) da última alimentação — base para derivar status */
  lastFedAt: number
  /** Itens disponíveis no inventário */
  inventory: PetInventory
  /** Progresso de dias consecutivos */
  streak: Streak
  /** Troféu de 7 dias desbloqueado (permanente) */
  hasTrophy7Days: boolean
  /**
   * Flag temporária: indica se a última lição ativou o resgate de emergência.
   * Usado pela SessionSummaryScreen para exibir mensagem especial.
   * NÃO é persistida no localStorage.
   */
  lastLessonEmergencyRescue: boolean
}

// ─── Actions ──────────────────────────────────────────────────────────────────

interface PetActions {
  /**
   * Retorna o status atual derivado em runtime.
   * Use dentro de components: `const status = usePetStore(s => s.getPetStatus())`
   */
  getPetStatus: () => PetStatus

  /**
   * Alimenta o pet com o item especificado.
   * @returns `true` se alimentou com sucesso, `false` se recusado (pet feliz, sem estoque, item errado para o estado)
   */
  feedPet: (type: ItemType) => boolean

  /**
   * Compra um item na loja debitando moedas.
   * @returns `true` se comprou com sucesso, `false` se moedas insuficientes
   */
  buyItem: (type: ItemType) => boolean

  /**
   * Registra uma lição concluída: credita moedas, atualiza streak,
   * aplica emergency rescue se necessário, desbloqueia troféu se merecido.
   *
   * IMPORTANTE: chamar apenas 1 vez por sessão, no mount de SessionSummaryScreen.
   */
  completedLesson: (coinsEarned: number) => CompletedLessonResult

  /** Reseta tudo para o estado inicial (dev/debug) */
  resetPetProgress: () => void
}

export interface CompletedLessonResult {
  /** Se o resgate de emergência foi ativado (pet doente + sem moedas) */
  emergencyRescue: boolean
  /** Se o streak foi quebrado (era >1 dia e foi reiniciado) */
  streakBroken: boolean
  /** Novo valor do streak após a lição */
  newStreak: number
  /** Se o troféu de 7 dias foi desbloqueado nesta lição */
  trophyUnlocked: boolean
}

// ─── Estado inicial ────────────────────────────────────────────────────────────

function makeInitialState(): PetState {
  return {
    coins: 0,
    lastFedAt: 0, // Pet começa com fome
    inventory: { water: 0, food: 0, medicine: 0 },
    streak: { current: 0, lastLessonDate: '' },
    hasTrophy7Days: false,
    lastLessonEmergencyRescue: false,
  }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const usePetStore = create<PetState & PetActions>()(
  persist(
    (set, get) => ({
      ...makeInitialState(),

      getPetStatus: () => derivePetStatus(get().lastFedAt),

      feedPet: (type: ItemType): boolean => {
        const { inventory, lastFedAt } = get()
        const status = derivePetStatus(lastFedAt)

        if (!canFeedPet(status, inventory, type)) return false

        set({
          inventory: { ...inventory, [type]: inventory[type] - 1 },
          lastFedAt: Date.now(),
        })
        return true
      },

      buyItem: (type: ItemType): boolean => {
        const { coins, inventory } = get()

        if (!canBuyItem(coins, type)) return false

        set({
          coins: coins - ITEM_PRICES[type],
          inventory: { ...inventory, [type]: inventory[type] + 1 },
        })
        return true
      },

      completedLesson: (coinsEarned: number): CompletedLessonResult => {
        const { coins, lastFedAt, streak, hasTrophy7Days } = get()
        const status = derivePetStatus(lastFedAt)

        // 1. Calcular novo streak
        const newStreak = updateStreak(streak)
        const streakBroken = wasStreakBroken(streak, newStreak)

        // 2. Verificar troféu
        const trophyUnlocked = !hasTrophy7Days && newStreak.current >= 7
        const newHasTrophy = hasTrophy7Days || trophyUnlocked

        // 3. Emergency rescue — verificar ANTES de creditar moedas
        // Condição: pet doente E moedas atuais insuficientes para remédio
        const needsRescue = status === 'sick' && coins < ITEM_PRICES.medicine
        const newLastFedAt = needsRescue ? Date.now() : lastFedAt

        // 4. Creditar moedas + aplicar todas as mudanças atomicamente
        set({
          coins: coins + coinsEarned,
          lastFedAt: newLastFedAt,
          streak: newStreak,
          hasTrophy7Days: newHasTrophy,
          lastLessonEmergencyRescue: needsRescue,
        })

        return {
          emergencyRescue: needsRescue,
          streakBroken,
          newStreak: newStreak.current,
          trophyUnlocked,
        }
      },

      resetPetProgress: () => {
        set(makeInitialState())
      },
    }),
    {
      name: 'kumon-pet-storage',
      storage: createJSONStorage(() => localStorage),
      // Status nunca é persistido — sempre derivado de lastFedAt
      partialize: (state) => ({
        coins: state.coins,
        lastFedAt: state.lastFedAt,
        inventory: state.inventory,
        streak: state.streak,
        hasTrophy7Days: state.hasTrophy7Days,
        // lastLessonEmergencyRescue: NÃO persiste (temporário)
      }),
    },
  ),
)
