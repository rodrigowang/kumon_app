import { create } from 'zustand';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SettingsState {
  // Configurações serão definidas conforme specs
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface SettingsActions {
  // Ações serão definidas conforme specs
}

export type SettingsStore = SettingsState & SettingsActions;

export const useSettingsStore = create<SettingsStore>(() => ({
  // Estado inicial será definido conforme specs
}));
