# Memória do Projeto — Kumon Math App

## O Que É

App web educacional para crianças de 7 anos aprenderem matemática (método Kumon). A criança escreve a resposta à mão num canvas touch e o sistema reconhece via OCR (TensorFlow.js). Conforme acerta, a dificuldade aumenta automaticamente.

---

## Stack

| Camada | Tecnologia |
|--------|-----------|
| UI | React 18 + TypeScript 5 + Vite |
| Componentes | Mantine v7 (tema custom, fontes grandes, touch ≥48px) |
| Estado | Zustand (3 stores: Game, Progress, Settings) |
| Canvas | perfect-freehand (traço suave) |
| OCR | TensorFlow.js + CNN MNIST (~99% acurácia) |
| Som | Howler.js + Web Audio API (sons sintéticos) |
| Testes | Vitest (unit) + Playwright (e2e) |
| Deploy | PWA (vite-plugin-pwa configurado, não ativado) |

---

## O Que Já Está Implementado

### Infraestrutura
- Vite + React 18 + TS strict, ESLint, Prettier
- Tema Mantine para crianças (cores vibrantes, Nunito, tokens CSS)
- 3 stores Zustand: `useGameStore` (OCR status, feedback), `useProgressStore` (histórico, estrelas — sem actions), `useSettingsStore` (volume, som — sem actions)
- Navegação por estado React (`currentView` no App.tsx), sem React Router
- Pasta `src/pages/` existe mas está vazia

### Canvas de Desenho
- `DrawingCanvas.tsx` — touch/mouse, perfect-freehand, DPR scaling
- Expõe via ref: `clear()`, `isEmpty()`, `getImageData()`, `getCanvasElement()`

### Pipeline OCR Completo
- **Modelo**: CNN pré-treinado do [SciSharp/Keras.NET](https://github.com/SciSharp/Keras.NET/tree/master/Examples/Keras.Playground/wwwroot/MNIST) — Conv2D×2 + MaxPool + Dense, ~600K params, 4.6MB, input `[1,28,28,1]`
- **Módulos**: `imageProcessing.ts` → `tensorOps.ts` → `segment.ts` → `predict.ts`
- **Fluxo**: canvas → segmentDigits → predictNumber → `{number, status, confidence, digits}`
- **3 status**: accepted (≥80%), confirmation (50-79%), retry (<50%)
- **Hook**: `useOCRModel()` — carrega modelo, warmup, gerencia loading/error

### Overlays OCR
- `OCRConfirmationOverlay` — "Você escreveu X?" (✓/✗)
- `OCRRetryOverlay` — "Tente desenhar novamente"
- `OCRFeedbackOverlay` — wrapper com lógica de decisão
- `NumericKeypadOverlay` + `FloatingKeypadButton` — fallback teclado

### Motor de Progressão (Kumon + CPA)
- **Tipos**: `CpaPhase` (concrete/pictorial/abstract), `Operation` (addition/subtraction), `MasteryLevel`, `ExerciseResult`, `Problem`
- **Gerador**: `generateProblem(level, previousId)` — Small Steps (maxResult: 5→10→15→20), evita repetição
- **Hesitação**: `HesitationTimer` — classifica: fast (<5s), slow (5-15s), hesitant (>15s), hint inatividade >10s
- **Maestria**: `MasteryTracker` — circular buffer (últimos 10), regras: 5 fast→advance micro, 5 correct→advance CPA, 3 errors→regress CPA, 10 errors→baseline
- **Constantes**: `MICROLEVEL_PROGRESSION = {addition: [5,10,15,20], subtraction: [5,10,15,20]}`, `CPA_PROGRESSION = ['concrete','pictorial','abstract']`

### Tela de Exercício Abstrato
- `AbstractExerciseScreen.tsx` — integra gerador + hesitação + OCR real + feedback
- Aceita `ocrModel` via prop, fallback mockOCR (prompt) se modelo indisponível
- State machine OCR: idle → processing → accepted/confirmation/retry
- Streak tracking (consecutiveCorrect, consecutiveErrors)

### FeedbackOverlay Rico
- `FeedbackOverlay.tsx` — 7 tipos de feedback:
  - Acerto: correct, correct-after-errors, streak-5, streak-10
  - Erro: error-gentle (1-2), error-learning (3-4), error-regress (5+)
- Confetti CSS nativo, animações (bounceIn, shake, emojiPulse, streakGlow)
- Sons integrados (playCorrect, playWrong, playCelebration)

### Som
- `useSound()` — 4 sons: correct, wrong, celebration, click
- Sons sintéticos via Web Audio API (`syntheticSounds.ts`)

### Dev/Test
- 7 testers em `src/components/dev/`: Sound, Canvas, OCR, Exercise, AbstractExercise, OCRFeedback, KeypadFallback
- `AbstractExerciseTester` — debug panel com nível, stats, última decisão, reset

### Testes
- Playwright configurado com Chromium
- Vitest config existe mas vitest não está em devDependencies
- Tests unitários manuais do motor de progressão (17/17 passing via tsx)

---

## Padrões e Convenções

- **Imports**: relativos (`../../types/progression`) nos arquivos lib (aliases `@/` não funcionam com `tsc` bare)
- **Imports**: aliases `@/` funcionam no Vite bundler (apps e componentes)
- **data-testid**: obrigatório em todo componente interativo
- **Commits**: Dev NÃO commita — lista em `.agents/dev-output.md`, humano commita
- **npm install**: pode dar EACCES — workaround: implementar nativo ou usar `npx`
- **TypeScript readonly tuples**: usar `as never` cast em `indexOf`
- **Erros TS pre-existentes**: OCRFeedbackTester (playSound types), ExerciseScreen (undefined params), predict.ts (tf.tidy typing) — não introduzidos por nós

---

## Estrutura de Diretórios (resumo)

```
src/
├── components/
│   ├── canvas/        DrawingCanvas
│   ├── exercises/     ExerciseScreen, AbstractExerciseScreen
│   ├── ui/            Button, Card, Heading, Overlays, FeedbackOverlay, Keypad
│   └── dev/           7 testers (não produção)
├── hooks/             useSound, useDrawingCanvas, useOCRModel
├── lib/
│   ├── math/          generateProblem
│   └── progression/   HesitationTimer, MasteryTracker
├── stores/            useGameStore, useProgressStore, useSettingsStore
├── types/             progression, problem, hesitation, mastery
├── utils/ocr/         imageProcessing, tensorOps, segment, predict
└── theme/             mantine.ts
```

---

**Última atualização**: 2026-02-19
