# Dev Output — MasteryTracker na Store (Sprint 1.1)

**Data**: 2026-02-19
**Task**: Migrar MasteryTracker do AbstractExerciseTester para useGameStore
**Status**: ✅ Implementado

---

## TL;DR

O MasteryTracker agora vive no `useGameStore` (Zustand), tornando-se o estado real do app. O `AbstractExerciseScreen` lê `currentLevel` da store e chama `submitExercise(result)` que automaticamente atualiza o nível. Removida duplicação de lógica no `AbstractExerciseTester`.

---

## Arquivos Modificados

### 1. `src/stores/useGameStore.ts` — Estado de progressão adicionado

**Novo estado:**
- `currentLevel: MasteryLevel` — nível atual (operation, maxResult, cpaPhase)
- `masteryTracker: MasteryTracker` — instância do tracker
- `sessionStats: { totalExercises, correct, incorrect, fastCount, slowCount, hesitantCount }`
- `lastProgressionDecision: string` — última decisão (maintain/advance/regress)

**Novas actions:**
- `submitExercise(result: ExerciseResult)` — adiciona resultado, analisa progressão, atualiza nível automaticamente
- `resetProgress()` — volta ao nível inicial (debug)

**Nível inicial:**
```typescript
const INITIAL_LEVEL: MasteryLevel = {
  operation: 'addition',
  maxResult: 5,
  cpaPhase: 'abstract',
};
```

**Lógica de submitExercise:**
1. `tracker.addResult(result)`
2. `analysis = tracker.analyze()`
3. Atualiza stats da sessão
4. Se `analysis.decision !== 'maintain'` → atualiza `currentLevel` e loga mudança

### 2. `src/components/exercises/AbstractExerciseScreen.tsx` — Conectado à store

**Props removidas:**
- `currentLevel` (agora lê da store)
- `onSubmitExercise` (agora chama `submitExercise` da store)

**Props mantidas:**
- `ocrModel` (necessário para OCR)
- `onValidated` (callback opcional para compatibilidade)
- `mockOCR` (fallback sem modelo)

**Mudança principal:**
```typescript
// Antes
interface Props {
  currentLevel: MasteryLevel;
  onSubmitExercise?: (result) => void;
}

// Depois
const currentLevel = useGameStore(state => state.currentLevel);
const submitExercise = useGameStore(state => state.submitExercise);

// Em processResult():
submitExercise(exerciseResult); // Store cuida da progressão
```

### 3. `src/components/dev/AbstractExerciseTester.tsx` — Simplificado (reescrito)

**Antes**: Mantinha `MasteryTracker` local + stats locais + callbacks duplicados

**Depois**: Lê tudo da store:
```typescript
const currentLevel = useGameStore(state => state.currentLevel);
const stats = useGameStore(state => state.sessionStats);
const lastDecision = useGameStore(state => state.lastProgressionDecision);
const resetProgress = useGameStore(state => state.resetProgress);
```

**Linhas de código**: 200 → 128 (36% redução)

---

## Fluxo Completo de Progressão

```
1. Criança resolve exercício no AbstractExerciseScreen
2. OCR reconhece resposta (ou mock/keypad)
3. processResult() cria ExerciseResult { correct, speed, timeMs, attempts }
4. submitExercise(result) chamado → vai para store
5. Store:
   a. tracker.addResult(result)
   b. analysis = tracker.analyze()
   c. Atualiza sessionStats
   d. Se mudança de nível → tracker.updateLevel() + set currentLevel
6. React re-renderiza AbstractExerciseScreen com novo nível
7. Próximo problema gerado automaticamente com nova dificuldade
```

---

## Benefícios

1. **Single source of truth**: Nível e stats vivem na store, não duplicados
2. **Progressão automática**: Não precisa passar callbacks, a store cuida
3. **Debug panel simplificado**: Lê diretamente da store
4. **Preparado para persistência**: Fácil adicionar `persist` middleware na Sprint 1.3

---

## Teste Manual

1. `npm run dev` → abrir http://localhost:5173
2. Clicar "Abrir Tela de Exercício"
3. Resolver 5 exercícios corretamente (rápido <5s cada)
4. Observar no debug panel: `lastDecision` muda para `advance_microlevel`
5. `maxResult` no badge muda de 5 para 10
6. Próximos problemas são mais difíceis (ex: 7+3, 6+4)

---

# Dev Output — OCR Real + FeedbackOverlay (3.2)

**Data**: 2026-02-19
**Task**: Integrar OCR real na tela de exercício + FeedbackOverlay rico
**Status**: ✅ Implementado

---

## TL;DR

Substituído mock OCR (prompt dialog) por pipeline OCR real (predictNumber → segmentDigits → predictDigitsAsync). Criado FeedbackOverlay com confetti CSS, animações, awareness de streaks (5/10), e tiers de erro (gentle/learning/regress). Integrados overlays de confirmação/retry OCR existentes.

---

## Arquivos Criados

1. `src/components/ui/FeedbackOverlay.tsx` — Componente de feedback rico com:
   - 7 tipos: correct, correct-after-errors, streak-5, streak-10, error-gentle, error-learning, error-regress
   - Confetti CSS nativo (sem deps externas)
   - Animações: bounceIn (acerto), shake (erro), emojiPulse, streakGlow
   - Auto-close configurável (2s normal, 3s streaks)

## Arquivos Modificados

1. `src/components/exercises/AbstractExerciseScreen.tsx` — Reescrito com:
   - OCR real via `predictNumber(canvas, model)` com 3 status (accepted/confirmation/retry)
   - FeedbackOverlay integrado (substitui overlay básico)
   - Streak tracking (consecutiveCorrect, consecutiveErrors)
   - State machine para OCR (idle → processing → confirmation/retry)
   - Sons via useSound (correct, wrong, celebration)
   - Prop `ocrModel` para receber modelo carregado
   - Fallback para mockOCR quando modelo não disponível

2. `src/components/dev/AbstractExerciseTester.tsx` — Adicionada prop `ocrModel`, passada ao AbstractExerciseScreen. mockOCR ativado automaticamente quando modelo não está disponível.

3. `src/components/canvas/DrawingCanvas.tsx` — Adicionado `getCanvasElement()` ao DrawingCanvasHandle para expor o HTMLCanvasElement ao OCR.

4. `src/components/ui/index.ts` — Exporta FeedbackOverlay + tipos

5. `src/App.tsx` — Passa `ocrModel={model}` ao AbstractExerciseTester

---

## Fluxo OCR Integrado

```
1. Criança desenha no canvas
2. Clica "Enviar"
3. predictNumber(canvasElement, model)
4. Se confiança ≥80% → aceita direto → FeedbackOverlay
5. Se confiança 50-79% → OCRConfirmationOverlay ("Você escreveu X?")
   → Sim → FeedbackOverlay
   → Não → limpa canvas, tenta de novo
6. Se confiança <50% → OCRRetryOverlay ("Tente desenhar novamente")
   → limpa canvas, tenta de novo
```

## Feedback por Tipo

| Situação | Tipo | Visual |
|----------|------|--------|
| Acerto normal | correct | Confetti leve + bounce |
| Acerto após erros | correct-after-errors | Confetti + "Muito bem!" |
| 5 seguidos | streak-5 | Confetti intenso + glow |
| 10 seguidos | streak-10 | Mega confetti + gradient |
| Erro 1-2 | error-gentle | Shake + "Quase!" |
| Erro 3-4 | error-learning | "Você está aprendendo!" |
| Erro 5+ | error-regress | "Vamos ver de outro jeito!" |

---

# Dev Output — Upgrade OCR: Modelo CNN Pré-treinado

**Data**: 2026-02-11
**Task**: Trocar modelo OCR Dense por CNN pré-treinado
**Status**: ✅ Implementado

---

## TL;DR

O modelo MNIST era uma única camada Dense (regressão logística, ~92% acurácia). Substituído por CNN pré-treinado do SciSharp/Keras.NET (Conv2D×2 + Dense, ~99% acurácia). Ajustado todo o pipeline de tensors para shape 4D `[1, 28, 28, 1]`.

---

## Problema

- Modelo antigo: 1 camada Dense (784→10), 7.840 parâmetros, ~92% no MNIST limpo
- Escrita de criança de 7 anos: acurácia muito inferior
- Input era achatado [1, 784] — perdia informação espacial

## Solução

### Modelo novo (SciSharp/Keras.NET)
- **Fonte**: https://github.com/SciSharp/Keras.NET/tree/master/Examples/Keras.Playground/wwwroot/MNIST
- **Treinamento**: 12 epochs, batch 128, Adadelta optimizer
- **Arquitetura**: Conv2D(32, 3×3, ReLU) → Conv2D(64, 3×3, ReLU) → MaxPool(2×2) → Dropout(0.25) → Flatten → Dense(128, ReLU) → Dropout(0.5) → Dense(10, Softmax)
- **Input**: [1, 28, 28, 1] (preserva informação espacial)
- **Parâmetros**: ~600K
- **Acurácia**: ~99% no MNIST test set
- **Tamanho**: 4.6MB (model.json + 2 weight shards)
- **Gerado com**: Keras 2.2.4 + CNTK backend
- **Convertido com**: TensorFlow.js Converter v1.2.2.1

---

## Arquivos modificados

1. `public/models/mnist/model.json` — Substituído por modelo CNN
2. `public/models/mnist/group1-shard1of2.bin` — Weight shard 1 (novo)
3. `public/models/mnist/group1-shard2of2.bin` — Weight shard 2 (novo)
4. `src/utils/ocr/tensorOps.ts` — Output de `Tensor2D [1,784]` → `Tensor4D [1,28,28,1]`
5. `src/utils/ocr/predict.ts` — Tipos atualizados para `Tensor4D`
6. `src/utils/ocr/segment.ts` — Tipo de retorno atualizado para `Tensor4D[]`
7. `src/hooks/useOCRModel.ts` — Warmup shape atualizado para `[1,28,28,1]`

## Fix: devicePixelRatio no DrawingCanvas

### Problema
O canvas não escalava por `devicePixelRatio`. Em tablet com DPR=2:
- Criança desenhava numa área visual de 800×600 device pixels
- Canvas interno tinha apenas 400×300 pixels
- CSS esticava 2x → resolução do desenho era metade do visível
- OCR recebia imagem de baixa resolução

### Correção (`DrawingCanvas.tsx`)
- `canvas.width/height` agora multiplicado por `devicePixelRatio`
- `ctx.scale(dpr, dpr)` aplicado para manter coordenadas CSS 1:1
- `setTransform` + `scale` em cada repaint para evitar scale acumulativo
- `clear()` também reseta transform corretamente

## Arquivos removidos

1. `public/models/mnist/group1-shard1of1` — Weight do modelo Dense antigo

## Todos os arquivos modificados (resumo final)

1. `public/models/mnist/*` — Modelo CNN substituído
2. `src/utils/ocr/tensorOps.ts` — Shape `[1,784]` → `[1,28,28,1]`
3. `src/utils/ocr/predict.ts` — Tipos `Tensor2D` → `Tensor4D`
4. `src/utils/ocr/segment.ts` — Retorno `Tensor2D[]` → `Tensor4D[]`
5. `src/hooks/useOCRModel.ts` — Warmup shape corrigido
6. `src/components/canvas/DrawingCanvas.tsx` — DPR scaling
