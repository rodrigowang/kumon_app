/**
 * streakUtils — Lógica pura de streak diário
 *
 * Funções puras sem side effects.
 * O streak é atualizado em completedLesson() na pet store.
 */

export interface Streak {
  /** Número de dias consecutivos com pelo menos 1 lição concluída */
  current: number
  /** Data da última lição no formato "YYYY-MM-DD" (string vazia = nunca jogou) */
  lastLessonDate: string
}

/** Data de hoje no formato "YYYY-MM-DD" */
export function getTodayString(): string {
  return new Date().toISOString().split('T')[0]
}

/** Data de ontem no formato "YYYY-MM-DD" */
export function getYesterdayString(): string {
  return new Date(Date.now() - 86_400_000).toISOString().split('T')[0]
}

/**
 * Calcula o novo estado do streak após completar uma lição.
 *
 * Regras:
 * - Se já completou hoje: retorna inalterado (lição extra não conta)
 * - Se completou ontem: incrementa current
 * - Caso contrário: reinicia para 1 (streak quebrado ou primeiro dia)
 */
export function updateStreak(streak: Streak): Streak {
  const today = getTodayString()

  if (streak.lastLessonDate === today) {
    return streak // Já contou hoje
  }

  const yesterday = getYesterdayString()
  const newCurrent =
    streak.lastLessonDate === yesterday ? streak.current + 1 : 1

  return {
    current: newCurrent,
    lastLessonDate: today,
  }
}

/**
 * Retorna true se a criança já completou pelo menos 1 lição hoje.
 */
export function hasCompletedToday(streak: Streak): boolean {
  return streak.lastLessonDate === getTodayString()
}

/**
 * Detecta se o streak foi quebrado (tinha >1 dia e foi reiniciado para 1).
 * Usado para feedback visual na tela de resumo.
 */
export function wasStreakBroken(oldStreak: Streak, newStreak: Streak): boolean {
  return oldStreak.current > 1 && newStreak.current === 1
}
