import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GameState {
  // Estado do jogo será definido conforme specs
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface GameActions {
  // Ações serão definidas conforme specs
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>(() => ({
  // Estado inicial será definido conforme specs
}));
