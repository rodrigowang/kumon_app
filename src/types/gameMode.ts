/**
 * Tipos para Seleção de Nível pela Criança
 *
 * A criança escolhe diretamente operação e dificuldade,
 * sem depender da progressão automática.
 */

/**
 * Modo de operação matemática
 *
 * - addition: Apenas adição
 * - mixed: Mix aleatório de adição e subtração (50/50)
 */
export type OperationMode = 'addition' | 'mixed';

/**
 * Nível de dificuldade por dígitos no resultado
 *
 * - 1digit: Resultados de 1 a 9 (ex: 3+5=8)
 * - 2digit: Resultados de 10 a 99 (ex: 45+8=53)
 * - 3digit: Resultados de 100 a 999 (ex: 247+5=252)
 */
export type DifficultyLevel = '1digit' | '2digit' | '3digit';

/**
 * Configuração de jogo escolhida pela criança
 */
export interface GameMode {
  operation: OperationMode;
  difficulty: DifficultyLevel;
}

/** Mapeia dificuldade → maxResult para generateProblem */
export const DIFFICULTY_MAX_RESULT: Record<DifficultyLevel, number> = {
  '1digit': 9,
  '2digit': 99,
  '3digit': 999,
};

/** Mapeia dificuldade → moedas por acerto */
export const DIFFICULTY_COINS: Record<DifficultyLevel, number> = {
  '1digit': 2,
  '2digit': 5,
  '3digit': 10,
};

/** GameMode padrão (primeira vez que abre o app) */
export const DEFAULT_GAME_MODE: GameMode = {
  operation: 'addition',
  difficulty: '1digit',
};
