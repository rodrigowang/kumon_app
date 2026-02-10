import { Howl } from 'howler';
import { useRef, useEffect, useCallback } from 'react';
import {
  generateCorrectSound,
  generateWrongSound,
  generateCelebrationSound,
  generateClickSound,
} from '../lib/syntheticSounds';

export interface SoundConfig {
  volume?: number; // 0-1, default 0.5
  enabled?: boolean; // default true
}

export interface SoundHook {
  playCorrect: () => void;
  playWrong: () => void;
  playCelebration: () => void;
  playClick: () => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
}

/**
 * Hook customizado para gerenciar sons da aplicação usando Howler.js
 *
 * Características:
 * - Funciona com volume 0 (graceful degradation)
 * - Usa sons sintéticos via Web Audio API como fallback
 * - Pré-carrega todos os sons na montagem
 * - Cleanup automático na desmontagem
 * - Controle de volume e habilitação dinâmicos
 *
 * @param config - Configuração inicial de volume e habilitação
 * @returns Funções para tocar cada som + controles de volume/habilitação
 *
 * @example
 * ```tsx
 * const { playCorrect, playWrong, setVolume } = useSound({ volume: 0.7 });
 *
 * // Tocar som de acerto
 * playCorrect();
 *
 * // Ajustar volume dinamicamente
 * setVolume(0.3);
 *
 * // Desabilitar sons temporariamente
 * setEnabled(false);
 * ```
 */
export function useSound(config: SoundConfig = {}): SoundHook {
  const { volume: initialVolume = 0.5, enabled: initialEnabled = true } = config;

  // Refs para os objetos Howl (persistem entre re-renders)
  const soundsRef = useRef<Record<string, Howl | null>>({
    correct: null,
    wrong: null,
    celebration: null,
    click: null,
  });

  const volumeRef = useRef(initialVolume);
  const enabledRef = useRef(initialEnabled);

  // Inicializa os sons na montagem
  useEffect(() => {
    // Usa sons sintéticos como fallback (podem ser substituídos por MP3 reais)
    soundsRef.current = {
      correct: new Howl({
        src: [generateCorrectSound()],
        volume: volumeRef.current,
        preload: true,
        html5: false, // Força Web Audio API para melhor performance
      }),
      wrong: new Howl({
        src: [generateWrongSound()],
        volume: volumeRef.current,
        preload: true,
        html5: false,
      }),
      celebration: new Howl({
        src: [generateCelebrationSound()],
        volume: volumeRef.current,
        preload: true,
        html5: false,
      }),
      click: new Howl({
        src: [generateClickSound()],
        volume: volumeRef.current,
        preload: true,
        html5: false,
      }),
    };

    // Cleanup: descarrega todos os sons ao desmontar
    return () => {
      Object.values(soundsRef.current).forEach((sound) => {
        sound?.unload();
      });
    };
  }, []);

  // Função auxiliar genérica para tocar som
  const playSound = useCallback((soundKey: keyof typeof soundsRef.current) => {
    if (!enabledRef.current || volumeRef.current === 0) {
      // Graceful degradation: não toca se desabilitado ou volume 0
      return;
    }
    const sound = soundsRef.current[soundKey];
    if (sound) {
      sound.volume(volumeRef.current);
      sound.play();
    }
  }, []);

  // Funções específicas para cada tipo de som
  const playCorrect = useCallback(() => playSound('correct'), [playSound]);
  const playWrong = useCallback(() => playSound('wrong'), [playSound]);
  const playCelebration = useCallback(() => playSound('celebration'), [playSound]);
  const playClick = useCallback(() => playSound('click'), [playSound]);

  // Controles dinâmicos
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clampedVolume;
    Object.values(soundsRef.current).forEach((sound) => {
      sound?.volume(clampedVolume);
    });
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    enabledRef.current = enabled;
  }, []);

  return {
    playCorrect,
    playWrong,
    playCelebration,
    playClick,
    setVolume,
    setEnabled,
  };
}
