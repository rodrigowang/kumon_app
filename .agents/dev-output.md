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
