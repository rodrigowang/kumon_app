import { create } from 'zustand';

// Tipos
export interface SettingsState {
  volume: number;
  soundEnabled: boolean;
}

// Store
export const useSettingsStore = create<SettingsState>(() => ({
  volume: 0.7,
  soundEnabled: true,
}));
