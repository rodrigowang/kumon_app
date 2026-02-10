import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProgressState {
  // Estado de progresso será definido conforme specs
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface ProgressActions {
  // Ações serão definidas conforme specs
}

export type ProgressStore = ProgressState & ProgressActions;

export const useProgressStore = create<ProgressStore>(() => ({
  // Estado inicial será definido conforme specs
}));
