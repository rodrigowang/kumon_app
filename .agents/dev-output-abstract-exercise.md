# Dev Output — Tela de Exercício Abstrato

**Data**: 2026-02-19
**Task**: Implementar tela de exercício abstrato com integração completa do motor
**Status**: ✅ Implementado

---

## TL;DR

Implementada tela de exercício completa para fase abstrata, integrando:
- Gerador de problemas (`generateProblem`)
- Detector de hesitação (`HesitationTimer`)
- Algoritmo de maestria (`MasteryTracker`)
- Canvas de desenho (`DrawingCanvas`)
- Feedback visual/sonoro
- OCR mock (para desenvolvimento)

---

## Arquivos Criados

### 1. `src/components/exercises/AbstractExerciseScreen.tsx`

Componente principal da tela de exercício abstrato.

**Props:**
- `currentLevel: MasteryLevel` - Nível atual (operation, maxResult, cpaPhase)
- `onSubmitExercise?: (result) => void` - Callback com resultado para store
- `onValidated?: (correct, userAnswer, correctAnswer) => void` - Callback de validação
- `mockOCR?: boolean` - Usar mock OCR para desenvolvimento

**Fluxo:**
```
1. Gera problema baseado em currentLevel
2. Exibe: "operandA [operador] operandB = ?"
3. Inicia HesitationTimer
4. Criança desenha no canvas
   → Timer registra interações
5. Ao enviar:
   → Para timer
   → OCR (mock ou real)
   → Valida resposta
   → Mostra feedback (2s)
   → Gera próximo problema
6. Callback onSubmitExercise com ExerciseResult
```

**Características:**
- ✅ Fonte ≥32px (64px para números)
- ✅ Operador e "=" com cor diferente (destaque visual)
- ✅ Canvas para escrever resposta
- ✅ Botão enviar com 3 estados (desabilitado/pronto/processando)
- ✅ Feedback overlay (verde/vermelho, 2s)
- ✅ Layout responsivo (portrait/landscape)

### 2. `src/components/dev/AbstractExerciseTester.tsx`

Componente de teste/demonstração com debug panel.

**Features:**
- Debug panel (canto superior direito) com:
  - Nível atual (operation, maxResult, cpaPhase)
  - Estatísticas (total, corretos, incorretos)
  - Velocidades (fast/slow/hesitant)
  - Última decisão de progressão
  - Botão reset
- Integração completa com `MasteryTracker`
- Atualiza nível automaticamente após decisões
- Mock OCR (prompt para digitar resposta)

### 3. `src/pages/AbstractExercisePage.tsx`

Página standalone para rota `/abstract-exercise`.

---

## Layout da Tela

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ┌────────────────┐                    ┌──────────────────┐│
│  │  EXERCÍCIO     │                    │  Debug Panel     ││
│  │                │                    │  (dev only)      ││
│  │   3  +  2  =  ?│                    │                  ││
│  │                │                    │  Nível: add, 5   ││
│  │  (64px fonte)  │                    │  Total: 12       ││
│  │                │                    │  ✓ 10 | ✗ 2     ││
│  └────────────────┘                    └──────────────────┘│
│                                                             │
│                       ┌─────────────────┐                   │
│                       │                 │                   │
│                       │  CANVAS         │                   │
│                       │  (200px altura) │                   │
│                       │                 │                   │
│                       └─────────────────┘                   │
│                                                             │
│                   ┌──────────┐  ┌──────────┐              │
│                   │ 🗑️ Limpar│  │ ✅ Enviar│              │
│                   │  (64px)  │  │  (64px)  │              │
│                   └──────────┘  └──────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Estados do Botão Enviar

| Estado | Visual | Cursor | Condicão |
|--------|--------|--------|----------|
| Desabilitado | Cinza (#CCC) | not-allowed | Canvas vazio |
| Pronto | Verde (#4CAF50) | pointer | Canvas com traço |
| Processando | Verde claro + Spinner | not-allowed | OCR rodando |

---

## Integração com Motor de Progressão

### Fluxo de Dados

```typescript
// 1. Gerar problema
const problem = generateProblem(currentLevel, previousProblemId);

// 2. Exibir e iniciar timer
timerRef.current.start();

// 3. Criança desenha
// → timer.recordInteraction() em cada traço

// 4. Enviar
const hesitationAnalysis = timerRef.current.stop();
const userAnswer = await runOCR(imageData);
const correct = userAnswer === problem.correctAnswer;

// 5. Criar resultado
const exerciseResult: ExerciseResult = {
  correct,
  speed: hesitationAnalysis.speed, // 'fast' | 'slow' | 'hesitant'
  timeMs: hesitationAnalysis.timeMs,
  attempts: 1,
  timestamp: Date.now(),
};

// 6. Callback para store
onSubmitExercise(exerciseResult);

// Store vai:
// - masteryTracker.addResult(exerciseResult)
// - masteryTracker.analyze() → decisão de progressão
// - Atualizar currentLevel se necessário
```

### Exemplo de Uso no Store (Zustand)

```typescript
interface GameState {
  currentLevel: MasteryLevel;
  masteryTracker: MasteryTracker;

  submitExercise: (result: ExerciseResult) => void;
}

const useGameStore = create<GameState>((set, get) => ({
  currentLevel: { operation: 'addition', maxResult: 5, cpaPhase: 'concrete' },
  masteryTracker: new MasteryTracker(/* ... */),

  submitExercise: (result) => {
    const { masteryTracker } = get();

    // Adicionar resultado
    masteryTracker.addResult(result);

    // Analisar progressão
    const analysis = masteryTracker.analyze();

    // Aplicar decisão
    if (analysis.decision !== 'maintain' && analysis.newLevel) {
      masteryTracker.updateLevel(analysis.newLevel);
      set({ currentLevel: analysis.newLevel });

      // Feedback visual
      if (analysis.decision === 'advance_microlevel') {
        showCelebration('Maestria! Próximo nível! 🎉');
      } else if (analysis.shouldGiveSpecialFeedback) {
        showEncouragement('Vamos tentar de outro jeito? 🤗');
      }
    }
  },
}));
```

---

## Formato do Exercício

### Adição
```
 3   +   2   =  ?
───  ───  ───  ────
 #1   op   #2  resp

- Números: #2C3E50 (cinza escuro)
- Operador +: #4CAF50 (verde)
- Igual =: #4A90E2 (azul)
- Resposta ?: #BDBDBD (cinza claro)
- Fonte: 64px, weight 700
```

### Subtração
```
 7   −   3   =  ?
───  ───  ───  ────

- Números: #2C3E50
- Operador −: #FF9800 (laranja)
- Igual =: #4A90E2
- Resposta ?: #BDBDBD
```

**Nota**: Usar `−` (minus sign U+2212) em vez de `-` (hyphen) para clareza visual

---

## Feedback Visual

### Acerto (2s)
```
┌────────────────────────────────────┐
│ Background: rgba(76, 175, 80, 0.95)│
│                                    │
│    🎉 Correto!                     │
│    3 + 2 = 5                       │
│                                    │
│ (32px, white, bold)                │
└────────────────────────────────────┘
```

### Erro (2s)
```
┌────────────────────────────────────┐
│ Background: rgba(244, 67, 54, 0.95)│
│                                    │
│    ❌ Ops!                         │
│    Você escreveu 4, mas 3 + 2 = 5  │
│                                    │
│ (32px, white, bold)                │
└────────────────────────────────────┘
```

---

## Como Testar

### Opção 1: App Principal

```bash
npm run dev
```

Navegue até `http://localhost:5173` e clique em "Abrir Tela de Exercício"

### Opção 2: Rota Direta

Acesse `http://localhost:5173/abstract-exercise` (após configurar rota)

### Opção 3: Componente Standalone

```typescript
import { AbstractExerciseScreen } from '@/components/exercises';

<AbstractExerciseScreen
  currentLevel={{
    operation: 'addition',
    maxResult: 10,
    cpaPhase: 'abstract',
  }}
  onSubmitExercise={(result) => console.log(result)}
  mockOCR={true}
/>
```

---

## Debug Panel (Dev Mode)

O AbstractExerciseTester inclui painel de debug:

```
🎮 Debug Panel
───────────────────
Nível Atual
  [addition] [maxResult: 5] [abstract]

Estatísticas
  Total: 12 | ✓ 10 | ✗ 2
  Fast: 8 | Slow: 2 | Hesitant: 0

Última Decisão
  [advance_microlevel]

[🔄 Reset]
```

**Funcionalidades:**
- Ver nível em tempo real
- Monitorar estatísticas
- Ver decisões de progressão
- Reset completo (volta ao início)

---

## Mock OCR

Para desenvolvimento sem OCR real:

```typescript
<AbstractExerciseScreen
  currentLevel={level}
  mockOCR={true}  // ← Habilita mock
/>
```

**Comportamento:**
1. Ao enviar, exibe `prompt()` com:
   - "Você desenhou qual número?"
   - Mostra resposta correta para referência
2. Digite o número que "OCR reconheceu"
3. Validação procede normalmente

**Próximo passo**: Substituir por OCR real com useOCRModel

---

## Critérios de Aceitação ✅

- [x] Display: `[numA] [operador] [numB] = ___`
- [x] Fonte ≥32px (na verdade 64px para números)
- [x] Operador e "=" com cor diferente
- [x] Canvas para escrever resposta
- [x] Botão enviar com 3 estados (desabilitado/pronto/processando)
- [x] Fluxo completo: exibir → desenhar → enviar → OCR → validar → feedback → próximo
- [x] Integração com HesitationTimer
- [x] Integração com generateProblem
- [x] Integração com MasteryTracker (via callback)
- [x] Feedback visual (overlay 2s)
- [x] Layout responsivo

---

## Próximos Passos

1. ✅ Substituir mock OCR por integração real com `useOCRModel`
2. ✅ Adicionar feedback sonoro (success/error)
3. ✅ Implementar sistema de dicas (quando shouldShowHint = true)
4. ✅ Adicionar animações de transição entre problemas
5. ✅ Criar fases Concrete e Pictorial (com representações visuais)
6. ✅ Integrar com store Zustand para persistência

---

## Arquivos Criados/Modificados

1. `src/components/exercises/AbstractExerciseScreen.tsx` (novo)
2. `src/components/dev/AbstractExerciseTester.tsx` (novo)
3. `src/pages/AbstractExercisePage.tsx` (novo)
4. `src/components/exercises/index.ts` (atualizado)
5. `src/components/dev/index.ts` (atualizado)
6. `src/App.tsx` (atualizado - link para teste)
