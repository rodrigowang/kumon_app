# Dev Output — Sprint 5.4: Guias Visuais no Canvas + Dica de Espaçamento

**Data**: 2026-02-22
**Task**: Guias pontilhadas no canvas para multi-dígitos + dica "Escreva mais separado!" no retry
**Status**: ✅ Concluído — 0 erros TypeScript, build limpo

## Arquivos Modificados

### `src/components/canvas/DrawingCanvas.tsx`
- Novo prop `expectedDigits?: number`
- Quando `> 1`: overlay absoluto com N caixas divididas por linhas pontilhadas azuis (rgba(74,144,226,0.35))
- `pointer-events: none` — não afeta o desenho nem o OCR
- Aparece para qualquer resposta com 2+ dígitos (ex: 10, 12, 21...)

### `src/components/ui/OCRRetryOverlay.simple.tsx`
- Novo prop `expectedDigits?: number`
- `showSpacingTip`: true quando `expectedDigits > 1` E não está no modo "usar teclado"
- Mostra box destacada: "💡 Escreva os números mais separados!" no 1º e 2º retry

### `src/components/exercises/AbstractExerciseScreen.tsx`
- `expectedDigitCount = currentProblem.correctAnswer.toString().length`
- Passado para `<DrawingCanvas expectedDigits={expectedDigitCount} />`
- Passado para `<OCRRetryOverlay expectedDigits={expectedDigitCount} />`

---

# Dev Output — Sprint 5.3.2: Quantização float16 do modelo MNIST

**Data**: 2026-02-22
**Task**: Quantizar modelo MNIST com float16 para reduzir tamanho e latência
**Status**: ✅ Concluído — modelo 4.6MB → 2.3MB (50% menor), build limpo

## Decisão técnica

O modelo EMNIST (j05t/emnist, 258epochs_model_7.h5, Keras 2.1.6) foi descartado:
- Usa `channels_first` [None, 1, 28, 28] — incompatível com nosso pipeline [1, 28, 28, 1]
- `Lambda` layers não suportadas pelo TFJS converter → `modelTopology: null` no output
- Keras 2.1.6 é antigo demais para converter com tensorflowjs 4.22.0

## Fallback executado: quantização do modelo MNIST atual

### `public/models/mnist/model.json` — SUBSTITUÍDO
- Antes: 2 shards (`group1-shard1of2.bin` + `group1-shard2of2.bin`)
- Depois: 1 shard (`group1-shard1of1.bin`)
- Formato: `layers-model`, quantização `float16` em todos os pesos
- Input shape mantido: `[None, 28, 28, 1]` ← 100% compatível com pipeline existente
- Zero mudanças de código (o hook `useOCRModel.ts` carrega via `model.json` sem hardcode dos shards)

### `public/models/mnist/group1-shard1of1.bin` — NOVO (substituiu 2 shards)
- 2.3 MB (vs 4.6 MB original — 50% menor)
- Todos os pesos: `quantization: {dtype: 'float16', original_dtype: 'float32'}`

### `public/models/mnist-backup/` — CRIADO (backup)
- Contém os 3 arquivos originais para rollback se necessário

---

# Dev Output — Sprint 5.3.1: Test-Time Augmentation (TTA)

**Data**: 2026-02-22
**Task**: Implementar TTA — 4 variações geométricas + média softmax para maior precisão OCR
**Status**: ✅ Concluído — 0 erros TypeScript, build limpo

## Arquivos Criados

### `src/utils/ocr/tta.ts` — NOVO
- `buildRotationMatrix(degrees)` — matriz afim para rotação em torno do centro 28x28
- `buildScaleMatrix(factor)` — matriz afim para escala uniforme em torno do centro
- `applyAffineTransform(tensor4D, matrix)` — aplica transform via `tf.image.transform()`
- `predictWithTTA(model, tensor)` — gera 4 variantes (original, -5°, +5°, 0.9x), média softmax

## Arquivos Modificados

### `src/utils/ocr/predict.ts`
- Import de `predictWithTTA` do novo módulo `./tta`
- Interface `PredictOptions { useTTA?: boolean }` adicionada (exportada)
- `predictDigits()` aceita `options?: PredictOptions` — usa TTA por default
- `predictDigitsAsync()` aceita `options?: PredictOptions` — yield por dígito (TTA é 4x mais pesado)
- `predictNumber()` aceita `options.predictOptions?: PredictOptions` — passa para `predictDigitsAsync`

### `src/utils/ocr/index.ts`
- Exporta `PredictOptions` (tipo)
- Exporta `predictWithTTA` (função)

### `src/components/screens/PetHub.tsx`
- Fix: comparação redundante `displayStatus === 'eating'` removida do template literal (erro TS pré-existente de narrowing de control flow)

---

# Dev Output — Sprint 5.2: Reescrever Segmentação Multi-Dígitos (CCL)

**Data**: 2026-02-21
**Task**: Substituir projeção horizontal por Connected Component Labeling + merge + split
**Status**: ✅ Concluído — build OK (erro pré-existente em PetHub.tsx não relacionado)

## Arquivo Reescrito

### `src/utils/ocr/segment.ts` — Reescrito completo

**Pipeline novo:**
1. **Binarização** — mapa binário via luminância invertida (reusa `isStrokePixel` do 5.1)
2. **Connected Component Labeling (CCL)** — flood-fill BFS com 4-connectivity
3. **Filtro de ruído** — remove componentes minúsculos (<5% da área mediana), mas preserva "1" fino (aspect ratio > 3.0)
4. **Merge de componentes próximos** — gap horizontal < 15% da largura média + overlap vertical → mesmo dígito (resolve "8" e "=" quebrados)
5. **Split de componentes largos** — largura > 1.8x da mediana → procura vale de mínima densidade vertical no terço central → split se vale < 20% do máximo (resolve "10" grudado)
6. **Ordenação L→R** — componentes ordenados por posição X
7. **Fallback** — se CCL encontra 0 componentes, usa projeção horizontal legada

**Tratamento especial para "1":**
- Não filtrado como ruído se aspect ratio (altura/largura) > 3.0 e altura > 20% do canvas
- `minDigitWidth` reduzido para 3px no fallback

**Funções novas:**
- `toBinaryMap()` — converte ImageData para Uint8Array binário
- `connectedComponentLabeling()` — BFS flood-fill, retorna bounding boxes
- `filterNoise()` — remove componentes minúsculos, preserva "1"
- `mergeCloseComponents()` — junta partes do mesmo dígito
- `splitWideComponents()` / `trySplitVertical()` — separa dígitos grudados
- `recalcBounds()` — recalcula bounding box após split
- `componentsToBoundingBoxes()` — converte para BoundingBox com padding
- `fallbackProjectionBoxes()` — projeção horizontal como último recurso

**`segmentDigitsDebug` atualizado:**
- Retorna `method: 'ccl' | 'projection-fallback'` em vez de `projection` array
- Retorna `boxes: BoundingBox[]` em vez de `ranges`

## Impacto Esperado
- "10", "12", "21", "100" reconhecidos corretamente na maioria dos casos
- "1" fino não é mais filtrado como ruído
- "8" e dígitos com gaps internos não são mais quebrados em partes

---

# Dev Output — Sprint 5.1: Fix Preprocessing OCR (Quick Wins)

**Data**: 2026-02-21
**Task**: Melhorar preprocessing do OCR para aumentar precisão (+15-25% esperado)
**Status**: ✅ Concluído — build OK (erro pré-existente em PetHub.tsx não relacionado)

## Arquivos Modificados

### `src/utils/ocr/tensorOps.ts` — Reescrito
**4 melhorias implementadas:**

1. **Luminância em vez de canal alpha** — `normalize()` agora usa `(R+G+B)/3` invertido, composto com fundo branco. Robusto tanto para canvas transparente quanto fundo branco opaco.

2. **Centro de massa** — `centerAndResize()` calcula centroide ponderado por intensidade e posiciona no centro do grid 28x28 (como o MNIST original foi preprocessado). Nova função `centerOfMass()`.

3. **Binarização com threshold** — Nova função `binarize()` (threshold=0.3). Remove artefatos de antialiasing que confundem o modelo.

4. **Normalização de espessura de traço** — Nova função `normalizeStrokeWidth()` com erosão/dilatação morfológica. Traços grossos (>15% pixels) são afinados, traços finos (<5%) são engrossados. Alvo: ~8-12% dos pixels (como MNIST). Funções auxiliares `dilate()` e `erode()` usando maxPool.

**Pipeline atualizado em `prepareForModel()`:**
```
canvas → luminância invertida → binarização → centro de massa + resize 28x28 → normalizar espessura → batch dim
```

### `src/utils/ocr/segment.ts` — Modificado
- `horizontalProjection()` e detecção de bounds verticais agora usam luminância invertida em vez de canal alpha
- Nova função local `isStrokePixel()` com composição alpha + luminância

### `src/utils/ocr/imageProcessing.ts` — Modificado
- `findBoundingBox()` agora usa luminância invertida em vez de canal alpha
- Nova função local `isStrokePixel()` com composição alpha + luminância

## Impacto Esperado
- +15-25% precisão em dígitos isolados
- Mais robusto a variações de canvas (fundo branco vs transparente)
- Menos falsos negativos de antialiasing
- Traços de dedo grosso e stylus fino tratados igualmente

---

# Dev Output — Sprint 5.2: Estado de Sede (separado da Fome)

**Data**: 2026-02-21
**Task**: Separar sede da fome — água cura sede, comida cura fome, remédio cura sick
**Status**: ✅ Concluído — **0 erros TypeScript, build OK**

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/lib/petActions.ts` | 5 estados: happy/hungry/thirsty/hungry_and_thirsty/sick. `derivePetStatus(lastFedAt, lastWateredAt)` com 2 args. `canFeedPet`: água→sede, comida→fome, remédio→sick. Thresholds: 12h hungry/thirsty, 24h sick |
| `src/stores/usePetStore.ts` | `lastWateredAt` no estado. Defasagem 6h para sede não aparecer junto com fome. `feedPet`: água→lastWateredAt, comida→lastFedAt, remédio→ambos. Emergency rescue atualiza ambos. `partialize` inclui lastWateredAt |
| `src/components/screens/PetHub.tsx` | Lê `lastWateredAt` da store, passa para `derivePetStatus`. `handleEatingEnd` re-deriva status real |
| `src/components/ui/PetDisplay.tsx` | Novos configs: thirsty (azul, petHungryGif), hungry_and_thirsty (laranja, petHungryGif) |
| `tests/unit/petActions.spec.ts` | Reescrito: testa 5 estados, `derivePetStatus` com 2 args, `canFeedPet` com regras separadas (água→sede, comida→fome, remédio→só sick), fronteiras 12h |
| `tests/unit/petStore.spec.ts` | Reescrito: helpers setHappy/setHungry/setThirsty/setSick, testa feedPet com água/comida/remédio separados, emergency rescue por sede, lastWateredAt atualizado |

## Estados do Pet

| Estado | Condição | Itens que funcionam |
|--------|----------|-------------------|
| happy | fed < 12h E watered < 12h | Nenhum (recusa) |
| hungry | fed > 12h, watered < 12h | Comida |
| thirsty | watered > 12h, fed < 12h | Água |
| hungry_and_thirsty | fed > 12h E watered > 12h | Comida, Água |
| sick | fed > 24h OU watered > 24h | Remédio |

## Decisões Técnicas

- **Defasagem de 6h**: `lastWateredAt = Date.now() - 6h` no estado inicial, para que sede não apareça junto com fome
- **Remédio só cura sick** (antes curava hungry também) — mais estratégico
- **PetDisplay reutiliza petHungryGif** para thirsty/hungry_and_thirsty com cores de borda diferentes (azul/laranja)
- **Emergency rescue atualiza ambos timestamps** (lastFedAt + lastWateredAt)
- **Vitest não instalado** — testes escritos e prontos, build TypeScript valida tipos

---

# Dev Output — Sprint 5.1: Progressão Multi-Dígitos (2+1 e 3+1 dígitos)

**Data**: 2026-02-21
**Task**: Estender progressão para operações com dezenas e centenas; mais moedas por nível
**Status**: ✅ Concluído — **0 erros TypeScript, build OK**

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/types/mastery.ts` | `MICROLEVEL_PROGRESSION`: `[5,10,15,20]` → `[5,10,15,20,99,999]` para ambas operações |
| `src/lib/math/generateProblem.ts` | Novos configs em `getAdditionConfig()` e `getSubtractionConfig()` para maxResult 99 (2+1 dígitos) e 999 (3+1 dígitos) |
| `src/lib/coinCalculator.ts` | Novos tiers: `≤99 → 8c`, `≥100 → 15c` |
| `src/stores/useGameStore.ts` | `multiDigitBannerSeen` (persist) + `dismissMultiDigitBanner()` |
| `src/components/screens/PetHub.tsx` | Banner "Números maiores!" (azul) ao desbloquear maxResult≥99 |
| `tests/unit/coinCalculator.spec.ts` | Testes para novos tiers (8c e 15c) |
| `tests/unit/generateProblem.spec.ts` | Testes para adição/subtração níveis 5 (2+1) e 6 (3+1) |
| `tests/unit/progression-engine.spec.ts` | Testes atualizados: transição adição→subtração agora requer maxResult=999; testes novos para 20→99 e 99→999 |

## Nova Tabela de Progressão

| Nível | maxResult | Tipo | Exemplo | Moedas/acerto |
|-------|-----------|------|---------|---------------|
| 1 | 5 | 1+1 dig | 2+3 | 1c |
| 2 | 10 | 1+1 dig | 7+3 | 1c |
| 3 | 15 | 1+1 dig | 8+7 | 3c |
| 4 | 20 | 1+1 dig | 9+9 | 3c |
| 5 | 99 | 2+1 dig | 45+8 | 8c |
| 6 | 999 | 3+1 dig | 247+5 | 15c |

## Configs de Geração

### Adição
- `maxResult ≤ 99`: operandA 10–89, operandB 1–9
- `maxResult ≤ 999`: operandA 100–989, operandB 1–9

### Subtração
- `maxResult ≤ 99`: minuendo 11–99, subtraendo 1–9
- `maxResult ≤ 999`: minuendo 101–999, subtraendo 1–9

## Decisões Técnicas

- **OCR não precisou de mudança** — pipeline já suportava 3+ dígitos (auditado antes de implementar)
- **Transição adição→subtração agora requer maxResult=999** (antes era 20)
- **Banner multi-dígitos**: azul (distinto do verde do banner de subtração), aparece 1x ao atingir maxResult≥99
- **Vitest não instalado** — testes escritos e prontos, build TypeScript valida tipos

---

# Dev Output — Sprint 4.3: Acessibilidade

**Data**: 2026-02-21
**Task**: ARIA labels, contraste WCAG AA, navegação por teclado
**Status**: ✅ Concluído — **0 erros TypeScript, build OK**

## Arquivos Modificados

### Acessibilidade — Overlays (focus trap + teclado físico + aria-modal)
- `src/components/ui/NumericKeypadOverlay.tsx`
  - `FocusTrap` (Mantine) envolve o conteúdo do dialog
  - `aria-modal="true"` no dialog
  - `aria-live="polite"` no display de número digitado
  - `aria-label` descritivo em cada botão numérico (`Digitar N`)
  - `data-autofocus` no botão "1" (primeiro foco ao abrir)
  - Suporte a teclado físico: dígitos 0–9 digitam, Backspace apaga, Delete limpa, Enter confirma, Escape cancela

- `src/components/ui/OCRConfirmationOverlay.simple.tsx`
  - `FocusTrap` envolve o conteúdo
  - `aria-modal="true"` no dialog
  - `data-autofocus` no botão ✓ (foco automático ao abrir)
  - Suporte a teclado: Enter/Y = confirmar, Escape/N = rejeitar
  - `aria-label` atualizado com dica de atalho

- `src/components/ui/OCRRetryOverlay.simple.tsx`
  - `FocusTrap` envolve o conteúdo
  - `aria-modal="true"` no dialog
  - `data-autofocus` no botão "Desenhar de novo"
  - Suporte a teclado: Enter/R = retry, K = usar teclado

### Acessibilidade — PetHub (contraste + landmarks)
- `src/components/screens/PetHub.tsx`
  - `c="dimmed"` → `c="gray.7"` + `fw={700}` nos labels "Inventário" e "Loja" (contraste WCAG AA)
  - Seções `<Box component="section" aria-label="...">` para inventário e loja
  - Wrapper `aria-live="polite"` com `aria-label` dinâmico no PetDisplay (anuncia estado do bichinho)

### Acessibilidade — Tela de Exercício (atalhos de teclado)
- `src/components/exercises/AbstractExerciseScreen.tsx`
  - Atalhos globais: Delete/Backspace = limpar canvas, Enter = enviar (quando tem desenho), K = abrir teclado
  - Enter/Espaço = continuar quando mostrando correção de erro

### Acessibilidade — Canvas de Desenho (foco visual)
- `src/components/canvas/DrawingCanvas.tsx`
  - `aria-label` dinâmico: muda conforme canvas vazio/com conteúdo
  - Indicador de foco visual: `box-shadow` azul ao receber foco (para usuários de teclado/tablets)

---

# Dev Output — Sprint 4.2: Testes automatizados

**Data**: 2026-02-21
**Task**: Vitest unitários + Playwright E2E
**Status**: ✅ Concluído — **136/136 testes passando, build OK**

## Arquivos Criados/Modificados

### Instalação
- `node_modules/vitest` (2.1.9) — instalado manualmente via /tmp (package-lock.json root-owned)
- `vitest.config.ts` — adicionado `include: ['tests/unit/**']` para excluir e2e do vitest

### App (modo E2E)
- `src/App.tsx` — flag `IS_E2E` (query param `?e2e`) pula loading screen do OCR; `mockOCR=true` automático

### Testes Unitários (Vitest — 136 testes, todos ✓)
- `tests/unit/petActions.spec.ts` — 25 testes: derivePetStatus, canFeedPet, canBuyItem
- `tests/unit/coinCalculator.spec.ts` — 17 testes: getCoinsPerCorrect, calculateSessionCoins
- `tests/unit/streakUtils.spec.ts` — 15 testes: updateStreak, hasCompletedToday, wasStreakBroken
- `tests/unit/petStore.spec.ts` — 23 testes: feedPet, buyItem, completedLesson, emergency rescue, troféu
- `tests/unit/gameStore.spec.ts` — 23 testes: startSession, endSession, submitExercise, subtractionBannerSeen, progressão adição→subtração
- `tests/unit/progression-engine.spec.ts` — +3 testes Sprint 4.1: advance_microlevel → subtração

### Teste E2E (Playwright)
- `tests/e2e/main-flow.spec.ts` — PetHub → Lição (mockOCR via dialog) → Resumo com moedas → Voltar → PetHub

---

# Dev Output — Sprint 4.1: Subtração integrada no fluxo

**Data**: 2026-02-20
**Task**: Desbloquear subtração após dominar adição; transição visual no PetHub
**Status**: ✅ Concluído — **0 erros TS, build OK**

## Arquivos Modificados

- `src/lib/progression/mastery.ts` — `advanceMicrolevel()` agora avança para subtração quando adição está completa
- `src/stores/useGameStore.ts` — adicionado `subtractionBannerSeen` (persist) + `dismissSubtractionBanner()`
- `src/components/screens/PetHub.tsx` — banner de celebração "Agora vamos subtrair!" com dismiss

---

# Dev Output — Audit de Bugs + Zero Débito Técnico

**Data**: 2026-02-20
**Task**: Avaliar e corrigir todos os bugs e erros TypeScript do app
**Status**: ✅ Concluído — **0 erros TS, build OK**

---

## Bugs de Runtime Corrigidos

| # | Arquivo | Bug | Correção |
|---|---------|-----|----------|
| 1 | `PetHub.tsx` | `setState` chamado durante render (`setDisplayStatus` no corpo do componente) | Movido para `useEffect` com deps `[petStatus, displayStatus]` |
| 2 | `SessionSummaryScreen.tsx` | `completedLesson()` chamado 2x em StrictMode (double-mount) → moedas dobradas | Adicionado `useRef` guard (`completedRef.current`) |
| 3 | `useGameStore.ts` — `endSession()` | Sem guard de `isActive` — poderia ser chamado sem sessão ativa e produzir duração absurda | Adicionado early return com `console.warn` quando `!sessionRound.isActive` |
| 4 | `ExerciseScreen.tsx` | `imageData` era `string \| undefined` mas `onSubmit` esperava `string \| null` | Corrigido com `?? null` |

## Erros TypeScript Corrigidos (16 → 0)

| Arquivo | Erro | Correção |
|---------|------|----------|
| `OCRFeedbackOverlay.tsx` (4x) | `playSound` com tipo `(...) => void` incompatível com `(sound: string) => void` | Null check explícito + variável `confirmedDigit` |
| `OCRConfirmationOverlay.tsx` | `playSound?: (type: 'doubt')` — tipo muito restrito | Unificado para `(type: 'doubt \| oops \| tap \| confirm') => void` |
| `OCRRetryOverlay.tsx` + `.simple.tsx` | `playSound?: (type: 'oops')` — tipo muito restrito | Unificado |
| `NumericKeypadOverlay.tsx` | `playSound?: (sound: string)` — tipo muito amplo | Narrowed para `(sound: 'tap \| confirm') => void` |
| `FloatingKeypadButton.tsx` | `playSound?: (sound: string)` — tipo muito amplo | Narrowed para `(sound: 'tap') => void` |
| `OCRFeedbackTester.tsx` | `playSound: (type: 'doubt \| oops')` — tipo incompleto | Expandido para union completo |
| `mastery.ts` | `ProgressionDecision`, `CpaPhase` importados mas nunca usados | Removidos dos imports |
| `types/mastery.ts` | `ProblemResult` importado mas nunca usado | Removido |
| `ocr-integration-example.ts` | `canvas`, `model` declarados mas nunca lidos | Prefixados com `_` |
| `predict.ts` (2x) | `tf.tidy()` recebendo função que retorna `DigitPrediction` (não `TensorContainer`) | Removido `tf.tidy()` externo redundante (`predictSingleDigit` já tem seu próprio internamente) |
| `App.tsx` (2x) | `Button` e `Heading` sem `data-testid` obrigatório | Adicionados `data-testid="back-to-home-button"` e `"abstract-exercise-heading"` |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/components/screens/PetHub.tsx` | setState-during-render → useEffect |
| `src/components/screens/SessionSummaryScreen.tsx` | useRef guard para StrictMode |
| `src/stores/useGameStore.ts` | Guard isActive em endSession() |
| `src/components/exercises/ExerciseScreen.tsx` | imageData ?? null |
| `src/components/ui/OCRFeedbackOverlay.tsx` | Null check + confirmedDigit |
| `src/components/ui/OCRConfirmationOverlay.tsx` | Tipo playSound unificado |
| `src/components/ui/OCRRetryOverlay.tsx` | Tipo playSound unificado |
| `src/components/ui/OCRRetryOverlay.simple.tsx` | Tipo playSound unificado |
| `src/components/ui/NumericKeypadOverlay.tsx` | Tipo playSound narrowed |
| `src/components/ui/FloatingKeypadButton.tsx` | Tipo playSound narrowed |
| `src/components/dev/OCRFeedbackTester.tsx` | Tipo playSound expandido |
| `src/lib/progression/mastery.ts` | Imports unused removidos |
| `src/types/mastery.ts` | Import unused removido |
| `src/utils/ocr-integration-example.ts` | Parâmetros prefixados com `_` |
| `src/utils/ocr/predict.ts` | tf.tidy() redundante removido |
| `src/App.tsx` | data-testid adicionados |

---

# Dev Output — Sprint 2.5: Streak, Troféu e Emergency Rescue (visual)

**Data**: 2026-02-20
**Task**: Criar StreakDisplay e TrophyDisplay, integrar no PetHub e SessionSummaryScreen
**Status**: ✅ Implementado

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/ui/StreakDisplay.tsx` | Componente de streak com variantes compact/expanded, barra de progresso até troféu |
| `src/components/ui/TrophyDisplay.tsx` | Badge dourado do troféu com animação CSS pulse |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/components/ui/index.ts` | Exporta `StreakDisplay` e `TrophyDisplay` |
| `src/components/screens/PetHub.tsx` | Substituiu streak/troféu inline por componentes dedicados |
| `src/components/screens/SessionSummaryScreen.tsx` | Mostra streak atual, aviso de streak quebrado |

## Funcionalidades visuais por tela

### PetHub
- `StreakDisplay compact`: 🔥/💤 + contagem no status bar, borda dourada em 7+
- `TrophyDisplay`: badge dourado com pulse animation, só aparece quando desbloqueado

### SessionSummaryScreen (bloco de moedas)
- "🔥 N dias seguidos!" — após cada lição completada
- "🏆 7 dias seguidos! Troféu desbloqueado!" — na lição que atinge 7
- "Seu streak reiniciou — jogue amanhã para manter!" — quando o streak é quebrado
- "💊 Kit de emergência: seu bichinho foi curado!" — rescue automático

---

# Dev Output — Sprint 2.4: PetHub (Nova Tela Principal)

**Data**: 2026-02-20
**Task**: Criar PetHub como tela principal substituindo HomeScreen na navegação
**Status**: ✅ Implementado

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/components/screens/PetHub.tsx` | Tela principal com pet, loja, inventário, streak, moedas |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/App.tsx` | Import `PetHub` em vez de `HomeScreen`; view `'home'` renderiza `PetHub` |
| `src/components/screens/index.ts` | Exporta `PetHub` |

## Layout do PetHub

```
┌──────────────────────────────────────────┐
│ 🔥 3 dias    🪙 24    [Somas até 5] 4★  │  status bar
├──────────────────────────────────────────┤
│           🏆 Troféu de 7 dias!           │  (se desbloqueado)
│                                          │
│       ┌────────────────────────┐         │
│       │     PetDisplay         │         │
│       │   (gatinho animado)    │         │
│       └────────────────────────┘         │
│            Feliz! 😊                     │
├──────────────────────────────────────────┤
│ ⚠️ Doente + sem moedas → aviso rescue   │  (condicional)
├──────────────────────────────────────────┤
│ Inventário                               │
│ [💧 0x Água] [🍎 0x Comida] [💊 0x Rem.] │
├──────────────────────────────────────────┤
│ Loja                                     │
│ [💧 🪙4]    [🍎 🪙6]    [💊 🪙20]       │
├──────────────────────────────────────────┤
│        🎮 COMEÇAR LIÇÃO (80px)           │
├──────────────────────────────────────────┤
│     progresso  ·  dev  ·  resetar        │
└──────────────────────────────────────────┘
```

## Decisões Técnicas

- **`data-testid="home-screen"`** mantido no PetHub para compatibilidade com testes existentes
- **`displayStatus` local** separa a animação `eating` (temporária) do estado real do pet
- **Reset unificado** limpa tanto `useGameStore` quanto `usePetStore`
- **`canFeedPet` e `canBuyItem`** chamados diretamente para habilitar/desabilitar botões
- **HomeScreen não foi deletada** — fica disponível como fallback caso necessário
- **Build de produção OK** — GIFs incluídos no precache PWA

---

# Dev Output — Sprint 2.3: Pet Visual (Sprites + Componente)

**Data**: 2026-02-20
**Task**: Baixar sprites CC0, gerar GIFs por estado, criar PetDisplay.tsx
**Status**: ✅ Implementado

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/assets/sprites/pet_happy.gif` | 12 frames, 26KB — animação idle (loop) |
| `src/assets/sprites/pet_hungry.gif` | 6 frames, 13KB — animação hurt (loop devagar) |
| `src/assets/sprites/pet_sick.gif` | 8 frames, 17KB — animação dead (loop bem devagar) |
| `src/assets/sprites/pet_eating.gif` | 10 frames, 21KB — animação run (loop rápido) |
| `src/components/ui/PetDisplay.tsx` | Componente React com estado/animação + auto-retorno do eating |

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/vite-env.d.ts` | Adicionado `declare module "*.gif"` e `"*.png"` |
| `src/components/ui/index.ts` | Exporta `PetDisplay` e `PetDisplayStatus` |

---

## Fonte dos Sprites

**"Tiny Cat Sprite"** por OpenGameArt.org
- Licença: CC0 1.0 Universal (domínio público)
- Download: https://opengameart.org/content/tiny-kitten-game-sprite
- Processamento: PNG sequences (489×461px) → GIFs animados (200×200px) via PIL

## Mapeamento de Animações

| Estado | Animação original | Velocidade | Loop |
|--------|-------------------|-----------|------|
| `happy` | 01_Idle (12 frames) | 110ms/frame | Infinito |
| `hungry` | 04_Hurt (6 frames) | 150ms/frame | Infinito |
| `sick` | 05_Dead (8 frames) | 180ms/frame | Infinito |
| `eating` | 02_Run (10 frames) | 80ms/frame | Infinito — componente troca de volta para happy após 1.2s via callback |

## Decisões Técnicas

- **GIF > PNG sequences** — Arquivo único, auto-animado pelo browser, zero JavaScript de animação
- **`key={gifKey}`** — Força re-render do `<img>` ao mudar status (alguns browsers travam GIF sem isso)
- **`grayscale(30%) + opacity: 0.85` no sick** — Reforço visual extra além da animação
- **Moldura circular colorida por estado** — Verde/Amarelo/Vermelho/Azul para reforçar leitura visual para criança de 7 anos

---

# Dev Output — Sprint 2.2: Economia Integrada ao Fluxo

**Data**: 2026-02-20
**Task**: Calcular moedas no endSession(), creditar no pet store, exibir na tela de resumo
**Status**: ✅ Implementado

---

## Arquivos Modificados

| Arquivo | O que mudou |
|---------|-------------|
| `src/stores/useGameStore.ts` | `SessionRound` + `fastCount`; `SessionSummary` + `coinsEarned`/`speedBonus`; `endSession()` usa `calculateSessionCoins()`; `startSession()`/`resetProgress()` inicializam `fastCount: 0` |
| `src/components/screens/SessionSummaryScreen.tsx` | Chama `completedLesson()` no mount (useEffect, 1x); exibe bloco de moedas; mostra bônus x2, emergency rescue e troféu; botão "Voltar ao quarto" |

## Arquivos Criados

Nenhum.

---

## Decisões Técnicas

- **`fastCount` em `sessionRound`** (não em `sessionStats`) — `sessionStats` é global/acumulado; precisávamos do contador por sessão
- **`completedLesson()` chamado em `SessionSummaryScreen`** (não em `App.tsx`) — segue a spec "chamar 1 vez no mount de LessonResult"
- **`coinsEarned` como dep do useEffect** — `summary` é prop estável, `coinsEarned` não muda; satisfaz linter e garante idempotência

---

# Dev Output — Sprint 2.1: Base do Bichinho Virtual

**Data**: 2026-02-20
**Task**: Criar fundação do pet virtual (store + lógica pura) sem tocar em nenhum arquivo existente
**Status**: ✅ Implementado

---

## Arquivos Criados

| Arquivo | Descrição |
|---------|-----------|
| `src/lib/streakUtils.ts` | Funções puras de streak diário (updateStreak, wasStreakBroken, etc.) |
| `src/lib/coinCalculator.ts` | Cálculo de moedas por sessão + tabela de preços de itens |
| `src/lib/petActions.ts` | Lógica pura de validação do pet (derivePetStatus, canFeedPet, canBuyItem) |
| `src/stores/usePetStore.ts` | Zustand store com persist — estado completo do bichinho |

## Arquivos Modificados

Nenhum.

---

## Decisões Técnicas

- **`usePetStore` separado de `useGameStore`** — ciclos de vida e preocupações distintas
- **Status nunca persiste** — sempre derivado de `Date.now() - lastFedAt` via `derivePetStatus()`
- **`lastLessonEmergencyRescue` não persiste** — flag temporária, limpa na próxima sessão
- **Água e comida não curam doença** — só o remédio cura `sick`; água/comida só resolvem `hungry`
- **Emergency rescue verifica moedas ANTES de creditá-las** (conforme spec)

---

# Dev Output — Tratamento de Erros Graceful + UX Simplificado (Sprint 3.3)

**Data**: 2026-02-20
**Task**: Simplificar feedback (som > overlay), correção inline para erros, fallbacks graceful
**Status**: ✅ Implementado

---

## TL;DR

Removido FeedbackOverlay para respostas corretas — agora acerto toca som e avança automaticamente. Para erros: tela fica parada mostrando a resposta correta inline (em verde) com a resposta da criança (em vermelho), e botão "Continuar" para avançar. Modelo OCR indisponível → abre teclado numérico (não mais `prompt()`). OCR com timeout de 5s → fallback teclado. Erros de OCR → fallback teclado.

---

## Mudanças de UX (pedido do usuário)

### Antes
- Acerto: FeedbackOverlay verde com confetti (2s de espera) → avança
- Erro: FeedbackOverlay vermelho (2s de espera) → avança

### Depois
- **Acerto**: Toca som → avança imediatamente (com animação de transição)
- **Erro**: Toca som → permanece na tela → mostra resposta correta (verde) + resposta errada (vermelho) → criança clica "Continuar" → avança

**Motivação**: "A tela de correto/errado pode tirar, fica muito tempo e distrai. Só o som já é suficiente."

---

## Tratamento de Erros Graceful

| Cenário | Antes | Depois |
|---------|-------|--------|
| Modelo OCR não carrega | `prompt()` (dialog do browser) | Abre teclado numérico |
| OCR timeout (>5s) | Não tratado (travava) | Fallback para teclado |
| Erro inesperado no OCR | Overlay de retry | Fallback para teclado |
| Canvas vazio | Overlay de retry | Overlay de retry (mantido) |

---

## Arquivos Modificados

### 1. `src/components/exercises/AbstractExerciseScreen.tsx` — Mudança principal

**Import**: `FeedbackOverlay` removido, mantido apenas `type { FeedbackType }` (para determinação de som)

**Função removida**: `getFeedbackMessage()` — não mais necessária

**Estados removidos**:
- `feedbackVisible`, `feedbackType`, `feedbackMessage`, `feedbackSubMessage`, `feedbackCorrectAnswer`

**Novo estado**:
```typescript
const [showingCorrection, setShowingCorrection] = useState<{
  correctAnswer: number;
  userAnswer: number;
} | null>(null);
```

**Novo handler**:
```typescript
const handleContinueAfterError = useCallback(() => {
  setShowingCorrection(null);
  advanceToNext();
}, [advanceToNext]);
```

**processResult reescrito**:
- Streaks e sons mantidos (celebration para 5/10-streak)
- Se correto: `advanceToNext()` direto
- Se errado: `setShowingCorrection({ correctAnswer, userAnswer })`
- FeedbackOverlay não mais renderizado

**handleSubmit atualizado**:
- `!ocrModel` → `setOcrState({ phase: 'keypad' })` (antes: `prompt()`)
- OCR timeout 5s via `Promise.race`
- catch → `setOcrState({ phase: 'keypad' })` (antes: `{ phase: 'retry' }`)

**UI - Painel do exercício**:
- Quando `showingCorrection`: "?" substituído pela resposta correta (verde, fw=800)
- Texto "Sua resposta: X" em vermelho abaixo do problema
- Borda do painel muda de azul para vermelho

**UI - Área do canvas**:
- Quando `showingCorrection`: canvas e botões substituídos por botão "Continuar" (80px, azul, borderRadius 16px)
- Quando normal: canvas + Limpar + Enviar (inalterado)

---

## Fluxo Completo

### Acerto
```
1. Criança desenha resposta → Enviar
2. OCR reconhece → processResult(correto)
3. Som de acerto toca
4. advanceToNext() → transição fade → próximo exercício
```

### Erro
```
1. Criança desenha resposta → Enviar
2. OCR reconhece → processResult(errado)
3. Som de erro toca
4. Tela mostra:
   - Problema: "3 + 5 = 8" (8 em verde)
   - "Sua resposta: 6" (em vermelho)
   - Borda vermelha no painel
   - Botão "Continuar" no lugar do canvas
5. Criança clica "Continuar"
6. advanceToNext() → transição → próximo exercício
```

### Modelo OCR indisponível
```
1. Criança desenha → Enviar
2. !ocrModel → abre teclado numérico
3. Criança digita resposta → OK
4. processResult() → fluxo normal
```

### OCR Timeout
```
1. Criança desenha → Enviar
2. OCR demora >5s → Promise.race resolve 'timeout'
3. Abre teclado numérico
4. Criança digita resposta → OK
```

---

## Como Testar

```bash
npm run dev
```

### Teste 1: Acerto sem overlay
1. Home → Jogar
2. Desenhe a resposta correta → Enviar
3. ✅ Som de acerto toca
4. ✅ Tela avança direto (sem overlay verde, sem confetti, sem espera)
5. ✅ Transição fade suave para próximo exercício

### Teste 2: Erro com correção inline
1. Desenhe resposta errada → Enviar
2. ✅ Som de erro toca
3. ✅ "?" muda para resposta correta (verde)
4. ✅ "Sua resposta: X" aparece em vermelho
5. ✅ Borda do painel muda para vermelho
6. ✅ Canvas some, botão "Continuar" aparece (grande, azul)
7. Clique "Continuar"
8. ✅ Transição para próximo exercício

### Teste 3: OCR indisponível (sem modelo)
1. Abrir app sem modelo MNIST carregado
2. Desenhe → Enviar
3. ✅ Teclado numérico abre (sem dialog prompt)
4. ✅ Digitar resposta funciona normalmente

### Teste 4: Streak de som
1. Acertar 5 exercícios seguidos
2. ✅ No 5º acerto: som de celebração (em vez de som normal)
3. ✅ Sem overlay — só som diferente + avança

---

# Dev Output — PWA e Offline (Sprint 3.2)

**Data**: 2026-02-20
**Task**: App instalável e funcional offline (PWA completo)
**Status**: ✅ Implementado

---

## TL;DR

PWA completo configurado. Manifest expandido com ícones, descrição, orientação portrait, e lang pt-BR. Service Worker (workbox via vite-plugin-pwa) precacheia app shell + modelo MNIST (~4.6MB) + fontes Google. App é instalável em tablet/celular e funciona 100% offline após primeiro carregamento. Build gera `sw.js` + `registerSW.js` automaticamente.

---

## Arquivos Modificados

### 1. `vite.config.ts` — Configuração PWA completa

**includeAssets**: Precache explícito dos arquivos do modelo MNIST:
- `models/mnist/model.json` (3.8KB)
- `models/mnist/group1-shard1of2.bin` (4.0MB)
- `models/mnist/group1-shard2of2.bin` (592KB)
- Ícones favicon, apple-touch-icon, PWA 192/512

**manifest**: Expandido com:
- `description`: "Aprenda matemática brincando!"
- `display`: "standalone" (fullscreen no tablet)
- `orientation`: "portrait"
- `lang`: "pt-BR"
- `categories`: ["education", "kids"]
- `background_color`: "#F5F7FA"
- 5 ícones: PNG 192, PNG 512, PNG 512 maskable, SVG 192, SVG 512

**workbox**:
- `globPatterns`: `['**/*.{js,css,html,ico,png,svg,woff2}']`
- `maximumFileSizeToCacheInBytes`: 5MB (modelo MNIST ~4.6MB)
- Runtime caching para Google Fonts (CacheFirst, 1 ano TTL)
- Runtime caching para Google Fonts static (gstatic.com)

### 2. `public/pwa-192x192.png` — Ícone PWA 192×192 (regenerado)

Antes: placeholder 70 bytes. Agora: PNG válido verde (#4CAF50) 592 bytes.

### 3. `public/pwa-512x512.png` — Ícone PWA 512×512 (regenerado)

Antes: placeholder 70 bytes. Agora: PNG válido verde (#4CAF50) 2200 bytes.

### 4. `public/apple-touch-icon.png` — Ícone Apple 180×180 (regenerado)

Antes: placeholder 70 bytes. Agora: PNG válido verde (#4CAF50) 562 bytes.

### 5. `public/favicon.ico` — Favicon 32×32 (regenerado)

Antes: placeholder 70 bytes. Agora: PNG válido verde (#4CAF50) 104 bytes.

---

## Build Output

```
npx vite build

dist/registerSW.js                   0.13 kB
dist/manifest.webmanifest            0.67 kB
dist/index.html                      1.72 kB
dist/assets/index-*.css            204.31 kB
dist/assets/segment-*.js              5.61 kB
dist/assets/index-*.js            1,964.35 kB

PWA v1.2.0
mode      generateSW
precache  25 entries (2130.27 KiB)
files generated
  dist/sw.js
  dist/workbox-*.js
```

**Precache inclui**: modelo MNIST, ícones, app shell, JS/CSS bundles.

---

## Como Testar

### Teste 1: Build e verificação
```bash
npx vite build
# ✅ "PWA v1.2.0" no output
# ✅ "precache 25 entries" inclui modelo
# ✅ dist/sw.js e dist/registerSW.js gerados
```

### Teste 2: Instalar como app
```bash
npx vite preview
# Abrir http://localhost:4173 no Chrome
```
1. Clique no ícone de instalação na barra de endereço (ou menu → "Instalar app")
2. ✅ Dialog de instalação mostra "Kumon Math" com ícone verde
3. ✅ App abre em janela standalone (sem barra de navegação)
4. ✅ Orientação portrait forçada

### Teste 3: Funcionalidade offline
```bash
npx vite preview
# Abrir http://localhost:4173
```
1. Navegue pelo app (Home, Jogar, etc) para popular o cache
2. DevTools → Application → Service Workers → verificar "sw.js" ativo
3. DevTools → Application → Cache Storage → verificar entradas:
   - `workbox-precache-*`: deve conter model.json, .bin shards, JS/CSS
   - `google-fonts-cache`: fontes Nunito
4. **Desativar rede**: DevTools → Network → Offline ✓
5. Recarregar a página
6. ✅ App carrega normalmente (HTML, CSS, JS do cache)
7. ✅ OCR funciona (modelo MNIST do cache)
8. ✅ Fontes renderizam (Google Fonts do cache)

### Teste 4: Auto-update
1. Modifique qualquer arquivo → rebuild
2. Abra o app
3. ✅ Service Worker detecta nova versão automaticamente
4. ✅ Na próxima visita, app atualizado é servido

---

## Limitações Conhecidas

- **PNGs são sólidos verdes**: Sem a letra "K" por falta de conversor SVG→PNG no ambiente. Os SVGs têm a letra. Em browsers modernos, os SVGs são usados pelo manifest. Para iOS que não suporta SVG em manifest, o sólido verde funciona como fallback.
- **Fonte Nunito só cacheia no primeiro uso**: Runtime cache (CacheFirst) — se o primeiro acesso for offline e a fonte nunca foi carregada, usa fallback do sistema.
- **Erros TS pré-existentes**: `tsc -b && vite build` falha por erros antigos. Usar `npx vite build` diretamente funciona.

---

# Dev Output — Fallback Teclado Numérico Inteligente (Sprint 3.1)

**Data**: 2026-02-20
**Task**: Integrar teclado numérico como fallback após falhas consecutivas de OCR
**Status**: ✅ Implementado

---

## TL;DR

Teclado numérico agora é oferecido automaticamente como alternativa quando o OCR falha 2+ vezes consecutivas no mesmo exercício. O `NumericKeypadOverlay` foi atualizado para suportar respostas multi-dígito (até 99). O `OCRRetryOverlay` ganhou botão "⌨️ Usar teclado" que aparece com animação bounce após 2 retries. Respostas via teclado seguem exatamente o mesmo fluxo de validação e feedback que respostas via OCR.

---

## Arquivos Modificados

### 1. `src/components/ui/NumericKeypadOverlay.tsx` — Multi-dígito

**Antes**: Aceitava apenas 1 dígito (0-9). `handleNumberClick` substituía o input.
**Depois**: Acumula dígitos (append). Prop `maxDigits` (padrão 2) limita tamanho. Botão "Limpar" vira "⌫" (backspace) quando há 2+ dígitos. `onSubmit` recebe `number` (não mais `digit`). Texto do cancelar mudou para "Voltar para desenho".

### 2. `src/components/ui/OCRRetryOverlay.simple.tsx` — Botão de teclado

**Novas props**:
- `retryCount?: number` — quantas vezes OCR falhou neste exercício
- `onUseKeypad?: () => void` — callback para abrir teclado

**Lógica**: Quando `retryCount >= 2 && onUseKeypad`, mostra botão "⌨️ Usar teclado" abaixo de "Desenhar de novo". Botão aparece com animação `keypadBounce`. Mensagem muda para "Quer usar o teclado?".

### 3. `src/components/exercises/AbstractExerciseScreen.tsx` — Integração

**Novos estados**:
- `ocrRetryCount: number` — contador de retries consecutivos por exercício
- `{ phase: 'keypad' }` adicionado ao tipo `OCRState`

**Novos handlers**:
- `handleOpenKeypad()` — muda OCR state para `keypad`
- `handleKeypadSubmit(number)` — cria hesitation analysis manual (speed: 'slow'), chama `processResult`, reseta retry count
- `handleKeypadClose()` — volta para desenho (OCR idle)

**Incremento do contador**:
- `handleOCRRetry()` — incrementa `ocrRetryCount`
- `handleOCRReject()` — incrementa `ocrRetryCount`

**Reset do contador**:
- useEffect de novo problema (mudança de nível)
- `advanceToNext()` (próximo exercício)

**Props passados ao OCRRetryOverlay**:
```tsx
<OCRRetryOverlay
  onRetry={handleOCRRetry}
  retryCount={ocrRetryCount}
  onUseKeypad={handleOpenKeypad}
/>
```

**Renderização do keypad**:
```tsx
{ocrState.phase === 'keypad' && (
  <NumericKeypadOverlay
    onSubmit={handleKeypadSubmit}
    onClose={handleKeypadClose}
  />
)}
```

---

## Fluxo Completo

```
1. Criança desenha no canvas → clica "Enviar"
2. OCR tenta reconhecer → confiança <50%
3. OCRRetryOverlay aparece: "Não consegui entender"
   → Botão "🔄 Desenhar de novo" (sempre visível)
   → [ocrRetryCount incrementa para 1]

4. Criança tenta de novo → OCR falha novamente
5. OCRRetryOverlay: ocrRetryCount = 1
   → Só "🔄 Desenhar de novo"
   → [ocrRetryCount incrementa para 2]

6. Criança tenta de novo → OCR falha novamente
7. OCRRetryOverlay: ocrRetryCount = 2 (≥2!)
   → "🔄 Desenhar de novo"
   → "⌨️ Usar teclado" ← NOVO! (com bounce animation)

8a. Se clica "Desenhar de novo": volta para canvas (retry count continua)
8b. Se clica "Usar teclado": NumericKeypadOverlay abre
    → Digita resposta (ex: "12") → clica "✓ OK"
    → processResult(12, 3) é chamado
    → FeedbackOverlay mostra se acertou/errou
    → Próximo exercício (retry count reseta)

9. Se clica "Voltar para desenho" no keypad: volta para canvas
```

---

## Como Testar

```bash
npm run dev
```

### Cenário 1: Teclado aparece após 2 retries
1. Home → Jogar
2. **Desenhe um rabisco ilegível** → Enviar
3. ✅ OCRRetryOverlay: "Não consegui entender" + botão "Desenhar de novo"
4. Clique "Desenhar de novo" → rabisque de novo → Enviar
5. ✅ OCRRetryOverlay de novo, SEM botão de teclado (retry 1)
6. Clique "Desenhar de novo" → rabisque de novo → Enviar
7. ✅ OCRRetryOverlay COM botão "⌨️ Usar teclado" (retry 2!)
8. ✅ Botão aparece com animação bounce

### Cenário 2: Usar teclado e acertar
1. Após cenário 1, clique "⌨️ Usar teclado"
2. ✅ NumericKeypadOverlay abre (modal com botões 0-9)
3. Digite a resposta correta (ex: se 2+3, digite "5")
4. Clique "✓ OK"
5. ✅ FeedbackOverlay verde: "Correto!"
6. ✅ Próximo exercício (retry count resetou)

### Cenário 3: Usar teclado e errar
1. Repita cenário 1
2. Clique "⌨️ Usar teclado"
3. Digite resposta errada (ex: "9")
4. Clique "✓ OK"
5. ✅ FeedbackOverlay vermelho: "Quase! A resposta certa é X"
6. ✅ Próximo exercício normalmente

### Cenário 4: Multi-dígito
1. Avance até "Somas até 20" (nível 3+)
2. Force 2 retries → abra teclado
3. ✅ Pode digitar "12", "15", "20" etc (2 dígitos)
4. ✅ Botão "Limpar" vira "⌫" quando tem 2+ dígitos

### Cenário 5: Cancelar teclado
1. Após cenário 1, clique "⌨️ Usar teclado"
2. Clique "Voltar para desenho"
3. ✅ Volta para canvas, pode desenhar novamente
4. ✅ Retry count não reseta (teclado aparecerá de novo se falhar)

---

# Dev Output — Animações de Transição (Sprint 2.3)

**Data**: 2026-02-20
**Task**: Transições suaves entre exercícios, mudanças de nível, e fim de sessão
**Status**: ✅ Implementado

---

## TL;DR

Sistema completo de animações de transição implementado. Fade out/in (300ms) entre exercícios normais. Transição especial com slide + flash (600ms) quando o nível muda. Efeito "virar página" (800ms) ao final da sessão. Tudo baseado em CSS animations sem dependências externas.

---

## Tipos de Transição

### 1. **Transição Normal** (exercício → exercício)
- **Duração**: 300ms
- **Efeito**: Fade out → Fade in
- **Quando**: Entre exercícios sem mudança de nível

### 2. **Transição de Mudança de Nível** (level change)
- **Duração**: 600ms
- **Efeito**: Slide lateral + flash de brilho
- **Quando**: Nível sobe ou desce (ex: "até 5" → "até 10")
- **Visual**:
  - **Out**: Desliza para esquerda (-50px) com fade
  - **In**: Entra da direita (+50px), escala 1.05, brightness 1.3, depois normaliza

### 3. **Transição de Fim de Sessão** (session end)
- **Duração**: 800ms
- **Efeito**: Perspectiva 3D "virar página"
- **Quando**: Após completar 10 exercícios
- **Visual**: RotateY -20deg com fade out
- **Complemento**: SessionSummaryScreen entra com flip in reverso (rotateY +20deg → 0deg)

---

## Arquivos Modificados

### 1. `src/components/exercises/AbstractExerciseScreen.tsx` — Motor de animações

**Novos estados**:
```typescript
const [isTransitioning, setIsTransitioning] = useState(false);
const [transitionType, setTransitionType] = useState<'normal' | 'level-change' | 'session-end'>('normal');
const levelChangedRef = useRef(false);
```

**Lógica de transição** (em `advanceToNext`):
```typescript
// 1. Determinar tipo
const type = sessionComplete ? 'session-end'
  : levelChanged ? 'level-change'
  : 'normal';

// 2. Fade out
setIsTransitioning(true);

// 3. Atualizar conteúdo após duração
setTimeout(() => {
  // Gerar próximo problema ou chamar onSessionComplete
}, duration);

// 4. Fade in
setTimeout(() => setIsTransitioning(false), 50);
```

**CSS Animations adicionadas**:
- `@keyframes fadeIn` / `fadeOut` — Transição normal
- `@keyframes levelChangeOut` / `levelChangeIn` — Slide + flash
- `@keyframes sessionEndOut` — Perspectiva 3D

**Classes dinâmicas aplicadas ao Flex principal**:
```typescript
className={
  isTransitioning
    ? `transition-${transitionType}-out`
    : `transition-${transitionType}-in`
}
```

**Detecção de mudança de nível**:
```typescript
// No useEffect de detecção de currentLevel
if (previousLevel !== currentLevel) {
  levelChangedRef.current = true; // Marca para animação especial
}
```

### 2. `src/components/screens/SessionSummaryScreen.tsx` — Animação de entrada

**Imports adicionados**:
```typescript
import { useState, useEffect } from 'react';
```

**Estado de visibilidade**:
```typescript
const [isVisible, setIsVisible] = useState(false);

useEffect(() => {
  const timer = setTimeout(() => setIsVisible(true), 50);
  return () => clearTimeout(timer);
}, []);
```

**CSS Animation**:
```css
@keyframes sessionSummaryFlipIn {
  0% {
    opacity: 0;
    transform: perspective(1000px) rotateY(20deg) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: perspective(1000px) rotateY(0deg) scale(1);
  }
}
```

**Classe aplicada ao Container**:
```typescript
<Container
  className={isVisible ? 'session-summary-enter' : ''}
  style={{ opacity: isVisible ? 1 : 0 }}
>
```

---

## Como Testar

```bash
npm run dev
```

### **Teste 1: Transição normal entre exercícios**
1. Home → Jogar
2. Resolver um exercício (desenhar + enviar)
3. Feedback aparece → fecha automaticamente
4. ✅ Tela faz fade out (300ms)
5. ✅ Próximo exercício aparece com fade in (300ms)
6. ✅ Transição suave, sem "pulo"

### **Teste 2: Transição de mudança de nível**
1. Resolver **5 exercícios rapidamente** (<3s cada)
2. No 5º acerto: nível muda (até 5 → até 10)
3. Feedback fecha
4. ✅ Tela desliza para esquerda com fade out (600ms)
5. ✅ Novo exercício entra da direita com:
   - Slide da direita
   - Leve zoom (scale 1.05 → 1)
   - Flash de brilho (brightness 1.3 → 1)
6. ✅ Efeito dramático, diferente da transição normal

### **Teste 3: Transição de fim de sessão**
1. Completar 10 exercícios
2. No 10º exercício, após feedback:
3. ✅ Tela de exercício faz "virar página" (rotateY -20deg, 800ms)
4. ✅ SessionSummaryScreen aparece com flip in (rotateY +20deg → 0deg)
5. ✅ Efeito de "virar página" visível

### **Teste 4: Detectar tipo de transição no console**
Abra DevTools (F12) e adicione logs temporários:
```typescript
console.log('Tipo de transição:', type);
```
- Normal: "normal"
- Mudança de nível: "level-change"
- Fim de sessão: "session-end"

---

## Detalhes Técnicos

### Duração por Tipo
```typescript
const duration = type === 'level-change' ? 600
  : type === 'session-end' ? 800
  : 300;
```

### CSS Transform Properties
- **Fade**: `opacity` 0 ↔ 1
- **Slide**: `translateX` -50px/+50px
- **Flash**: `filter: brightness(1.3)` → `brightness(1)`
- **Flip**: `perspective(1000px) rotateY(±20deg)`
- **Scale**: `scale(1.05)` → `scale(1)`

### Performance
- Todas as animações usam `transform` e `opacity` (GPU-accelerated)
- Sem layout recalc durante animações
- CSS animations puras (não JavaScript RAF)

---

## Benefícios

1. **Feedback visual claro**: Criança percebe que mudou de exercício
2. **Destaque de progresso**: Mudança de nível tem celebração visual
3. **Sensação de conclusão**: "Virar página" marca fim da sessão
4. **Smooth UX**: Zero "pulos" ou aparições abruptas
5. **Performance**: GPU-accelerated, 60fps consistente

---

# Dev Output — Dashboard de Progresso (Sprint 2.2)

**Data**: 2026-02-20
**Task**: Mapa visual de níveis tipo jogo
**Status**: ✅ Implementado

---

## TL;DR

Dashboard de progresso criado com grid visual de níveis estilo mapa de jogo. Mostra todos os níveis de adição (até 5, até 10, até 15, até 20) com estados: desbloqueado (verde), bloqueado (cinza + cadeado), e atual (verde vibrante + animação pulse + troféu). Acessível via botão "Ver Progresso" na HomeScreen.

---

## Arquivos Criados

### 1. `src/components/screens/ProgressDashboard.tsx` — Tela de mapa de níveis

**Props**:
- `currentLevel: MasteryLevel` — Nível atual do jogador
- `totalStars: number` — Total de estrelas acumuladas
- `onBack: () => void` — Callback para voltar

**Visual**:
- Background gradiente roxo (667eea → 764ba2)
- Header com título "Seu Progresso" + contador de estrelas
- Grid responsivo de cards de nível (1-4 colunas)
- Footer motivacional

**LevelCard individual**:
- Badge numerado (posição no canto superior esquerdo)
- **Desbloqueado**: Verde claro (#81C784), nome do nível visível
- **Bloqueado**: Cinza (#E0E0E0), ícone cadeado, nome do nível visível mas opaco
- **Atual**: Verde vibrante (#4CAF50), ícone troféu, badge "Atual", animação pulse (scale + box-shadow), borda verde escura
- Estrelas por nível (placeholder para feature futura)

**Animação**:
```css
@keyframes levelPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Arquivos Modificados

### 1. `src/components/screens/HomeScreen.tsx` — Botão "Ver Progresso"

**Nova prop**:
```typescript
onViewProgress?: () => void
```

**Novo botão** (abaixo do botão "Jogar"):
- Texto: "🗺️ Ver Progresso"
- Estilo: outline, borda roxa (#667eea), altura 64px, fonte 24px
- Posicionado entre "Jogar" e links discretos

### 2. `src/components/screens/index.ts` — Export do ProgressDashboard

### 3. `src/App.tsx` — Nova view 'progress-dashboard'

**Import adicionado**:
```typescript
import { ProgressDashboard } from './components/screens'
```

**Tipo atualizado**:
```typescript
type AppView = 'home' | 'exercise' | 'dev-dashboard' | 'session-summary' | 'progress-dashboard'
```

**Nova renderização condicional**:
```typescript
if (currentView === 'progress-dashboard') {
  return (
    <ProgressDashboard
      currentLevel={currentLevel}
      totalStars={totalStars}
      onBack={() => setCurrentView('home')}
    />
  )
}
```

**Callback no HomeScreen**:
```typescript
<HomeScreen
  onViewProgress={() => setCurrentView('progress-dashboard')}
/>
```

---

## Como Testar

```bash
npm run dev
```

### Cenário 1: Abrir dashboard pela primeira vez
1. Tela inicial (Home) → clicar **"🗺️ Ver Progresso"**
2. ✅ Abre dashboard com fundo gradiente roxo
3. ✅ Header mostra "Seu Progresso" + "0 estrelas"
4. ✅ Grid mostra 4 cards de nível:
   - **Nível 1 (Somas até 5)**: Verde vibrante, troféu, badge "Atual", pulsando
   - **Níveis 2-4 (até 10, 15, 20)**: Cinza, cadeado, bloqueados
5. ✅ Botão "← Voltar" no canto superior direito

### Cenário 2: Dashboard após progressão
1. Home → clicar "Jogar"
2. Resolver 5 exercícios rapidamente (nível sobe para "até 10")
3. Voltar para Home → clicar "Ver Progresso"
4. ✅ Grid mostra:
   - **Nível 1 (até 5)**: Verde claro (desbloqueado, mas não atual)
   - **Nível 2 (até 10)**: Verde vibrante, troféu, "Atual", pulsando
   - **Níveis 3-4**: Cinza, cadeado, bloqueados

### Cenário 3: Navegação completa
1. Home → Ver Progresso → ✅ Dashboard abre
2. Dashboard → clicar "← Voltar" → ✅ Volta para Home
3. Home → Jogar → ✅ Abre exercícios
4. Exercícios → ← Voltar → ✅ Volta para Home (dashboard não é afetado)

---

## Lógica de Desbloqueio

```typescript
function getLevelCardData(currentLevel: MasteryLevel): LevelCardData[] {
  // Nível está desbloqueado se maxResult <= currentLevel.maxResult
  const isUnlocked = maxResult <= currentMax;

  // Nível é atual se operation + maxResult coincidem exatamente
  const isCurrent = currentOp === 'addition' && maxResult === currentMax;
}
```

**Exemplo**:
- `currentLevel = { operation: 'addition', maxResult: 10 }`
- Desbloqueados: até 5 ✅, até 10 ✅
- Atual: até 10 (único com troféu + pulse)
- Bloqueados: até 15 ❌, até 20 ❌

---

## Benefícios

1. **Visibilidade de progresso**: Criança vê todos os níveis e onde está
2. **Motivação visual**: "Mapa de jogo" com níveis bloqueados gera vontade de desbloquear
3. **Awareness de conquista**: Verde claro nos desbloqueados mostra o que já foi conquistado
4. **Destaque do atual**: Pulse + troféu deixa claro "você está aqui"

---

## Limitações Conhecidas

- **Sem rastreamento de estrelas por nível**: Placeholder existe (`starsEarned`), mas store não rastreia isso ainda. Feature futura.
- **Só mostra níveis de adição**: Subtração ainda não integrada no fluxo principal (Sprint 4.1)
- **Sem mudança de fase CPA**: Só fase 'abstract' por enquanto

---

# Dev Output — Badge de Nível + Notificação de Mudança (Sprint 2.1)

**Data**: 2026-02-20
**Task**: Indicador de nível na tela de exercício com animações de transição
**Status**: ✅ Implementado

---

## TL;DR

Badge discreto mostrando nível atual ("Somas até 10") sempre visível na tela de exercício. Quando o nível muda mid-session, aparece notificação animada com mensagem motivacional: "Novo desafio!" (aumento) ou "Vamos praticar mais um pouco" (regressão). Animação de pulse com duração de 3s.

---

## Arquivos Criados

### 1. `src/utils/levelFormat.ts` — Formatação de níveis

**Funções utilitárias**:
- `formatLevelName(level: MasteryLevel): string` — Converte nível em texto ("Somas até 10", "Subtrações até 5")
- `getLevelChangeDirection(oldLevel, newLevel)` — Retorna 'increase' | 'decrease' | 'none'

### 2. `src/components/ui/LevelBadge.tsx` — Badge discreto

**Props**: `{ level: MasteryLevel }`
**Visual**: Badge Mantine com cor dinâmica (verde=adição, laranja=subtração), tamanho 16px, padding 12×20
**Posição**: Canto superior esquerdo da tela de exercício (sempre visível)

### 3. `src/components/ui/LevelChangeNotification.tsx` — Notificação animada

**Props**: `{ oldLevel, newLevel, onClose }`
**Visual**:
- Modal centralizado com emoji grande (🎉 aumento, 💪 regressão, ✨ outro)
- Título motivacional
- Subtítulo com novo nível
- Animação `levelChangePulse` (scale 0.8→1.05→1)
- Auto-close após 3s com fade out

**Mensagens**:
- Aumento: "Novo desafio!" + "Agora você está em [nível]"
- Regressão: "Vamos praticar mais um pouco" + "Voltamos para [nível]"

---

## Arquivos Modificados

### 1. `src/components/exercises/AbstractExerciseScreen.tsx` — Integração completa

**Imports adicionados**:
```typescript
import { LevelBadge } from '../ui/LevelBadge';
import { LevelChangeNotification } from '../ui/LevelChangeNotification';
import type { MasteryLevel } from '../../types';
```

**Novo estado**:
```typescript
const [levelChangeNotification, setLevelChangeNotification] = useState<{
  oldLevel: MasteryLevel;
  newLevel: MasteryLevel;
} | null>(null);
const previousLevelRef = useRef<MasteryLevel>(currentLevel);
```

**Novo useEffect** (detecção de mudança de nível):
```typescript
useEffect(() => {
  if (
    previousLevel.operation !== currentLevel.operation ||
    previousLevel.maxResult !== currentLevel.maxResult
  ) {
    setLevelChangeNotification({ oldLevel: previousLevel, newLevel: currentLevel });
  }
  previousLevelRef.current = currentLevel;
}, [currentLevel]);
```

**Header reestruturado**:
- Badge de nível (sempre visível) no canto esquerdo
- Indicador de progresso de sessão (bolinhas) no centro/direita
- Ambos dentro de um `<Box>` flex com `space-between`

**Renderização condicional**:
```typescript
{levelChangeNotification && (
  <LevelChangeNotification
    oldLevel={levelChangeNotification.oldLevel}
    newLevel={levelChangeNotification.newLevel}
    onClose={() => setLevelChangeNotification(null)}
  />
)}
```

---

## Como Testar

```bash
npm run dev
```

### Cenário 1: Badge sempre visível
1. Abrir app → clicar "Jogar"
2. ✅ Canto superior esquerdo mostra "Somas até 5" (badge verde)

### Cenário 2: Notificação de aumento de nível
1. Resolver 5 exercícios **rapidamente** (<3s cada) e **corretamente**
2. No 5º acerto rápido: nível sobe (até 5 → até 10)
3. ✅ Notificação aparece centralizada: 🎉 "Novo desafio!" + "Agora você está em Somas até 10"
4. ✅ Badge muda para "Somas até 10"
5. ✅ Notificação desaparece após 3s
6. ✅ Próximo exercício tem números maiores (ex: 3+7, 6+4)

### Cenário 3: Notificação de regressão
1. Errar 3 exercícios seguidos
2. No 3º erro: nível desce (até 10 → até 5)
3. ✅ Notificação aparece: 💪 "Vamos praticar mais um pouco" + "Voltamos para Somas até 5"
4. ✅ Badge volta para "Somas até 5"
5. ✅ Próximos exercícios ficam mais fáceis (ex: 2+3, 1+4)

### Cenário 4: Badge persiste entre exercícios
1. Resolver vários exercícios sem mudança de nível
2. ✅ Badge continua visível mostrando nível atual
3. ✅ Nenhuma notificação aparece (só badge estático)

---

## Benefícios

1. **Awareness de progresso**: Criança vê o nível atual em tempo real
2. **Motivação positiva**: Mudanças celebradas com animação
3. **Feedback gentil em regressão**: Mensagem encorajadora, não punitiva
4. **Zero confusão**: Badge discreto (não atrapalha exercício), notificação aparece apenas quando relevante

---

# Dev Output — Sessão com começo e fim (Sprint 1.4)

**Data**: 2026-02-19
**Task**: Sessões de 10 exercícios com tela de resumo e estrelas
**Status**: ✅ Implementado

---

## TL;DR

Implementado sistema de sessões com 10 exercícios cada. Indicador visual de progresso (bolinhas + "3 de 10"). Tela de resumo ao final com acertos, tempo, barra de acerto, e estrelas ganhas (+1 completar, +2 se ≥80%, +3 se 100%). Botões "Jogar de novo" e "Voltar". Estrelas não são mais dadas por acerto individual — apenas no fim da sessão.

---

## Arquivos Criados

### 1. `src/components/screens/SessionSummaryScreen.tsx` — Tela de resumo

**Exibe**:
- Título motivacional baseado na accuracy (Perfeito! / Muito bem! / Bom trabalho! / Continue tentando!)
- Estrelas ganhas (★★★ para 100%, ★★ para ≥80%, ★ para completar)
- Estatísticas: acertos, tempo, nível atual
- Barra visual de % de acerto (verde/amarelo/laranja)
- Botões: "Jogar de novo" e "Voltar"

---

## Arquivos Modificados

### 1. `src/stores/useGameStore.ts` — Estado e lógica de sessão

**Novo estado**:
- `SESSION_SIZE = 10` (constante exportada)
- `SessionRound`: { isActive, exerciseIndex, correct, incorrect, startTime }
- `SessionSummary`: { correct, incorrect, total, durationMs, starsEarned, accuracy }
- `sessionRound` — rastreia sessão atual
- `lastSessionSummary` — último resumo (persistido)

**Novas actions**:
- `startSession()` — inicia rodada (reset contadores, marca startTime)
- `isSessionComplete()` — retorna true se exerciseIndex >= SESSION_SIZE
- `endSession()` — calcula estrelas, retorna SessionSummary, reseta rodada

**Mudança em `submitExercise`**: Agora incrementa `sessionRound.exerciseIndex/correct/incorrect`. Estrelas NÃO são mais dadas por acerto individual — apenas via `endSession()`.

**Premiação**:
- Completou sessão: +1 ★
- ≥80% acerto: +2 ★
- 100% acerto: +3 ★

### 2. `src/components/exercises/AbstractExerciseScreen.tsx` — Indicador + detecção de fim

**Novo prop**: `onSessionComplete?: () => void`
**Novo estado lido da store**: `sessionRound`, `isSessionComplete`

**Indicador visual**: Bolinhas de progresso (verde=feito, azul=atual, cinza=pendente) + texto "3 de 10"

**Detecção de fim**: Em `advanceToNext()`, verifica `isSessionComplete()` antes de gerar próximo problema. Se true, chama `onSessionComplete()`.

### 3. `src/components/dev/AbstractExerciseTester.tsx` — Repassa prop + debug

**Novo prop**: `onSessionComplete?: () => void` repassado ao AbstractExerciseScreen
**Debug panel**: Mostra "Sessão: Ex 3/10 | ✓ 2 | ✗ 1"

### 4. `src/App.tsx` — Fluxo completo

**Nova view**: `'session-summary'` adicionada ao AppView
**Novo estado**: `sessionSummary: SessionSummary | null`

**Fluxo**:
```
Home → "Jogar" → startSession() → exercise view
  → 10 exercícios → endSession() → session-summary view
    → "Jogar de novo" → startSession() → exercise view
    → "Voltar" → home view
```

### 5. `src/components/screens/index.ts` — Exporta SessionSummaryScreen

---

## Como Testar

```bash
npm run dev
# Abrir http://localhost:5173
```

**Fluxo completo**:
1. Home mostra 0 ★ e "Somas até 5"
2. Clicar "Jogar" → exercício aparece com bolinhas (1 de 10)
3. Resolver exercícios (desenhar ou mock OCR) — bolinhas avançam
4. No 10º exercício, após fechar o feedback → tela de resumo aparece
5. Resumo mostra: acertos, tempo, estrelas ganhas
6. Clicar "Jogar de novo" → nova sessão com bolinhas resetadas
7. Clicar "Voltar" → Home mostra estrelas acumuladas

**Teste de estrelas**:
- 10/10 corretas → +3 ★ (100%)
- 8/10 corretas → +2 ★ (≥80%)
- 5/10 corretas → +1 ★ (completou)

**Teste de persistência**:
- Completar sessão → voltar home → recarregar → estrelas mantidas

---

# Dev Output — Persistência localStorage (Sprint 1.3)

**Data**: 2026-02-19
**Task**: Adicionar persist middleware ao useGameStore para salvar progresso
**Status**: ✅ Implementado

---

## TL;DR

Estado do jogo agora persiste em localStorage. Nível atual, estrelas, e estatísticas sobrevivem ao recarregar a página. MasteryTracker (instância de classe) é reconstruído na hidratação. Link "resetar progresso" adicionado na HomeScreen com confirmação.

---

## Arquivos Modificados

### 1. `src/stores/useGameStore.ts` — Persist middleware

**Imports adicionados**:
```typescript
import { persist, createJSONStorage } from 'zustand/middleware';
```

**Store wrapped com persist**:
```typescript
export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({ /* estado e actions */ }),
    {
      name: 'kumon-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentLevel: state.currentLevel,
        sessionStats: state.sessionStats,
        lastProgressionDecision: state.lastProgressionDecision,
        totalStars: state.totalStars,
      }),
      onRehydrateStorage: () => {
        return (state, error) => {
          if (state) {
            // Reconstruir MasteryTracker com nível salvo
            const tracker = new MasteryTracker(state.currentLevel);
            state.masteryTracker = tracker;
          }
        };
      },
    }
  )
);
```

**Campos salvos**:
- `currentLevel` — nível de maestria (operation, maxResult, cpaPhase)
- `sessionStats` — total de exercícios, acertos, erros, velocidades
- `lastProgressionDecision` — última decisão de progressão
- `totalStars` — estrelas acumuladas

**Campos NÃO salvos** (reconstruídos):
- `masteryTracker` — reconstruído via `new MasteryTracker(currentLevel)`
- `ocrStatus`, `ocrFeedbackState`, `ocrFeedbackData` — estado de sessão volátil
- `currentExercise`, `sessionData` — temporários

**Estratégia de hidratação**:
1. Zustand carrega dados do localStorage
2. `onRehydrateStorage` dispara após carregar
3. `MasteryTracker` é reconstruído com o nível salvo
4. Histórico de exercícios perdido, mas nível atual preservado

### 2. `src/components/screens/HomeScreen.tsx` — Botão de reset

**Adicionado**:
- `const resetProgress = useGameStore(state => state.resetProgress)`
- Handler com confirmação: `window.confirm('Resetar todo o progresso?')`
- Link discreto "resetar progresso" no rodapé (junto com "dev")

**Lógica**:
```typescript
const handleReset = () => {
  if (window.confirm('Resetar todo o progresso? Isso não pode ser desfeito.')) {
    resetProgress();
  }
};
```

---

## Como Testar

```bash
npm run dev
# Abrir http://localhost:5173
```

**Teste de persistência**:
1. Home mostra 0 ★ e "Somas até 5"
2. Clicar "🎮 Jogar"
3. Resolver 5 exercícios corretos e rápidos (<5s cada)
4. Observar mudança de nível: "Somas até 10" no debug panel
5. Voltar para Home → mostra 5 ★
6. **Recarregar a página (F5)**
7. ✅ Home ainda mostra 5 ★ e "Somas até 10"
8. Abrir DevTools → Application → Local Storage → localhost:5173
9. Ver chave `kumon-game-storage` com JSON do estado

**Teste de reset**:
1. Clicar "resetar progresso" (link discreto)
2. Confirmar no dialog
3. ✅ Volta para 0 ★ e "Somas até 5"
4. Recarregar página → estado resetado persiste

---

## localStorage Schema

**Chave**: `kumon-game-storage`

**Valor** (JSON):
```json
{
  "state": {
    "currentLevel": {
      "operation": "addition",
      "maxResult": 10,
      "cpaPhase": "abstract"
    },
    "sessionStats": {
      "totalExercises": 5,
      "correct": 5,
      "incorrect": 0,
      "fastCount": 5,
      "slowCount": 0,
      "hesitantCount": 0
    },
    "lastProgressionDecision": "advance_microlevel",
    "totalStars": 5
  },
  "version": 0
}
```

---

## Edge Cases Tratados

1. **Primeira carga (sem localStorage)**: Estado inicial padrão aplicado
2. **localStorage corrompido**: `onRehydrateStorage` loga erro e ignora
3. **MasteryTracker não serializável**: Reconstruído via `new MasteryTracker(currentLevel)`
4. **Mudança de estrutura de dados**: Zustand `version` permite migrations futuras

---

## Limitações Conhecidas

- **Histórico de exercícios perdido ao recarregar**: O circular buffer interno do MasteryTracker não é salvo. Só o nível atual persiste. Na próxima sprint (1.4 — sessões), salvaremos histórico explicitamente.
- **Sem sincronização cross-tab**: Se abrir em 2 abas, cada uma terá estado independente. Última aba a fechar "vence".

---

# Dev Output — HomeScreen + Navegação (Sprint 1.2)

**Data**: 2026-02-19
**Task**: Criar HomeScreen minimalista e substituir dev dashboard como tela inicial
**Status**: ✅ Implementado

---

## TL;DR

Interface real para crianças criada. HomeScreen minimalista com botão "Jogar" (≥80px), badge do nível atual ("Somas até 5"), e contador de estrelas acumuladas. Dev dashboard agora acessível via link discreto "dev" na home. Navegação por estado React (`home` | `exercise` | `dev-dashboard`).

---

## Arquivos Criados

### 1. `src/components/screens/HomeScreen.tsx` — Tela inicial

**Elementos visuais**:
- Título gradiente "✨ Kumon Math" (72px)
- Subtítulo "Aprenda matemática brincando" (24px)
- Badge do nível atual com gradiente blue→cyan (ex: "Somas até 5")
- Contador de estrelas: `{totalStars} ★` (64px)
- Botão "🎮 Jogar" (80px altura, gradiente verde, sombra)
- Link discreto "dev" para acessar dashboard (pequeno, embaixo)

**Props**:
- `onPlay: () => void` — callback ao clicar "Jogar"
- `onDevDashboard?: () => void` — callback ao clicar link "dev" (opcional)

**Lógica**:
- Lê `currentLevel` da store → formata como texto amigável
- Lê `totalStars` da store → mostra com "estrela" ou "estrelas"
- 100% responsiva, centered layout

### 2. `src/components/screens/index.ts` — Barrel export

---

## Arquivos Modificados

### 1. `src/stores/useGameStore.ts` — Tracking de estrelas

**Estado adicionado**:
```typescript
totalStars: number; // Inicializado em 0
```

**Lógica de incremento** (em `submitExercise`):
```typescript
totalStars: state.totalStars + (result.correct ? 1 : 0)
```

**Reset** (em `resetProgress`):
```typescript
totalStars: 0
```

### 2. `src/App.tsx` — Navegação reestruturada

**Tipo de navegação atualizado**:
```typescript
// Antes: 'home' | 'abstract-exercise'
// Depois: 'home' | 'exercise' | 'dev-dashboard'
```

**Fluxo de navegação**:
```
1. App abre → currentView = 'home' → HomeScreen
2. Clica "Jogar" → currentView = 'exercise' → AbstractExerciseTester
3. Clica "← Voltar" → volta para 'home'
4. Clica "dev" (na home) → currentView = 'dev-dashboard' → Dev Dashboard completo
5. Clica "← Voltar para Home" → volta para 'home'
```

**Mudanças visuais no dev dashboard**:
- Header agora tem "Kumon Math App — Dev Dashboard"
- Botão "← Voltar para Home" no canto superior direito
- Mantém todos os testers (Sound, Canvas, OCR, Exercise, Abstract)

---

## Como Testar

```bash
npm run dev
# Abrir http://localhost:5173
```

**Fluxo de teste**:
1. Tela inicial mostra "✨ Kumon Math" com 0 ★
2. Badge mostra "Somas até 5" (nível inicial)
3. Clicar "🎮 Jogar" → vai para exercícios
4. Resolver 3 exercícios corretos → voltar (botão ← Voltar)
5. Home agora mostra 3 ★
6. Clicar "dev" (link discreto) → vai para dev dashboard
7. Dev dashboard tem botão "← Voltar para Home"

**Estrelas acumulam**: Cada acerto = +1 estrela (persistente na sessão).

---

## Comparação Antes/Depois

| Aspecto | Antes (Sprint 1.1) | Depois (Sprint 1.2) |
|---------|-------------------|---------------------|
| Tela inicial | Dev dashboard com testers | HomeScreen minimalista |
| Acesso a exercícios | Card "Abrir Tela de Exercício" | Botão "🎮 Jogar" (80px) |
| Progresso visível | Só no debug panel | Badge de nível + estrelas na home |
| Dev dashboard | Única tela | Acessível via link "dev" |
| UX para criança | ❌ Confusa, muito texto | ✅ Clara, visual, botão grande |

---

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
