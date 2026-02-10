# useSound Hook

Hook customizado para gerenciamento de áudio usando Howler.js.

## Características

- ✅ Sons sintéticos via Web Audio API (fallback enquanto MP3 reais não existem)
- ✅ Controle de volume dinâmico (0-1)
- ✅ Toggle de habilitação (silenciar temporariamente)
- ✅ Graceful degradation: volume 0 = sem erros
- ✅ Cleanup automático (unload ao desmontar)
- ✅ Pré-carregamento de sons

## Uso Básico

```tsx
import { useSound } from '@/hooks';

function MyComponent() {
  const { playCorrect, playWrong, playCelebration, playClick } = useSound();

  return (
    <button onClick={playCorrect}>
      Tocar Som de Acerto
    </button>
  );
}
```

## Com Configuração

```tsx
const sound = useSound({
  volume: 0.7,    // Volume inicial (0-1)
  enabled: true,  // Habilitado por padrão
});

// Ajustar volume dinamicamente
sound.setVolume(0.3);

// Desabilitar sons temporariamente
sound.setEnabled(false);
```

## API

### Parâmetros

- `config?: SoundConfig`
  - `volume?: number` — Volume inicial (0-1, default: 0.5)
  - `enabled?: boolean` — Habilitado por padrão (default: true)

### Retorno

- `playCorrect()` — Toca som de acerto (nota ascendente alegre)
- `playWrong()` — Toca som de erro (buzz suave, não assustador)
- `playCelebration()` — Toca som de celebração (arpejo: C5→E5→G5→C6)
- `playClick()` — Toca som de clique/tap (feedback tátil)
- `setVolume(volume: number)` — Ajusta volume (0-1)
- `setEnabled(enabled: boolean)` — Habilita/desabilita sons

## Substituir Sons Sintéticos por MP3 Reais

1. Adicione arquivos em `src/assets/sounds/`:
   - `correct.mp3`
   - `wrong.mp3`
   - `celebration.mp3`
   - `click.mp3`

2. Modifique o hook para importar os MP3:

```ts
import correctMP3 from '../assets/sounds/correct.mp3';
// ...

soundsRef.current = {
  correct: new Howl({
    src: [correctMP3],  // Substitui generateCorrectSound()
    // ...
  }),
};
```

## Componente de Teste

Use `<SoundTester />` para testar todos os sons:

```tsx
import { SoundTester } from '@/components/dev';

function DevTools() {
  return <SoundTester />;
}
```

## Notas Técnicas

- **Howler.js** escolhido por ser a biblioteca consolidada (14k+ stars, manutenção ativa)
- **Web Audio API** usada para gerar sons sintéticos (fallback temporário)
- **html5: false** força Web Audio API para melhor performance
- **preload: true** garante sons prontos antes do primeiro play
- Volume 0 ou `enabled: false` → não toca, sem erros (graceful degradation)
