import { Howl } from 'howler';
import { useRef, useCallback } from 'react';

interface SoundHook {
  playCorrect: () => void;
  playWrong: () => void;
  playCelebration: () => void;
  playClick: () => void;
}

export function useSound(): SoundHook {
  // Refs para instâncias dos sons (serão carregadas quando os arquivos existirem)
  const correctSound = useRef<Howl | null>(null);
  const wrongSound = useRef<Howl | null>(null);
  const celebrationSound = useRef<Howl | null>(null);
  const clickSound = useRef<Howl | null>(null);

  const playCorrect = useCallback(() => {
    if (!correctSound.current) {
      // Placeholder: arquivo será adicionado em src/assets/sounds/correct.mp3
      console.log('[useSound] playCorrect: arquivo de som não carregado');
      return;
    }
    correctSound.current.play();
  }, []);

  const playWrong = useCallback(() => {
    if (!wrongSound.current) {
      // Placeholder: arquivo será adicionado em src/assets/sounds/wrong.mp3
      console.log('[useSound] playWrong: arquivo de som não carregado');
      return;
    }
    wrongSound.current.play();
  }, []);

  const playCelebration = useCallback(() => {
    if (!celebrationSound.current) {
      // Placeholder: arquivo será adicionado em src/assets/sounds/celebration.mp3
      console.log('[useSound] playCelebration: arquivo de som não carregado');
      return;
    }
    celebrationSound.current.play();
  }, []);

  const playClick = useCallback(() => {
    if (!clickSound.current) {
      // Placeholder: arquivo será adicionado em src/assets/sounds/click.mp3
      console.log('[useSound] playClick: arquivo de som não carregado');
      return;
    }
    clickSound.current.play();
  }, []);

  return {
    playCorrect,
    playWrong,
    playCelebration,
    playClick,
  };
}
