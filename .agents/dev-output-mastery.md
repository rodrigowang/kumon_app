## Dev Output — Algoritmo de Maestria

**Data**: 2026-02-19
**Task**: Implementar algoritmo de maestria (progressão Kumon + CPA)
**Status**: ✅ Implementado e Testado

---

## TL;DR

Implementado algoritmo completo de maestria baseado no método Kumon com progressão CPA (Concreto → Pictórico → Abstrato). Buffer circular mantém últimos 10 resultados. Regras de avanço (5 acertos rápidos), manutenção (5 acertos lentos) e regressão (3/10 erros). Nunca avança de operação sem maestria completa.

---

## Arquivos Criados

### 1. `src/types/mastery.ts`

Tipos principais:

- **`ExerciseResult`**: Resultado individual
  ```typescript
  {
    correct: boolean;
    speed: ResponseSpeed;
    timeMs: number;
    attempts: number;
    timestamp: number;
  }
  ```

- **`ProgressionDecision`**: Decisão de progressão
  - `advance_microlevel`: Aumentar maxResult (5→10)
  - `advance_cpa_phase`: Avançar CPA (concrete→pictorial)
  - `maintain`: Manter nível, variar exercícios
  - `regress_microlevel`: Diminuir maxResult (10→5)
  - `regress_cpa_phase`: Regredir CPA (abstract→pictorial)
  - `regress_to_baseline`: Voltar ao início

- **`MasteryAnalysis`**: Resultado da análise
  ```typescript
  {
    decision: ProgressionDecision;
    reason: string;
    newLevel: MasteryLevel | null;
    streak: { correct, incorrect, fast, slow };
    shouldGiveSpecialFeedback: boolean;
  }
  ```

- **`MasteryConfig`**: Configuração dos thresholds
  - `bufferSize`: 10
  - `fastStreakToAdvanceMicro`: 5
  - `slowStreakToMaintain`: 5
  - `correctStreakToAdvanceCpa`: 5
  - `errorStreakToRegressMicro`: 3
  - `errorStreakToRegressCpa`: 3
  - `errorStreakToRegressBaseline`: 10

### 2. `src/lib/progression/mastery.ts`

#### Classe `MasteryTracker`

**API Principal:**
- `addResult(result)` - Adiciona resultado ao buffer
- `analyze()` - Analisa e retorna decisão de progressão
- `getCurrentLevel()` - Obtém nível atual
- `updateLevel(newLevel)` - Atualiza nível após decisão
- `getResults()` - Obtém todos resultados do buffer
- `clearResults()` - Limpa buffer (nova sessão)

**Buffer Circular:**
- Mantém últimos 10 resultados
- Ordem cronológica preservada
- Descarta resultados mais antigos automaticamente

**Funções Utilitárias:**
- `createMasteryTracker(level, config?)` - Factory
- `canAdvanceOperation(level)` - Verifica se pode mudar operação
- `getNextOperation(op)` - Retorna próxima operação

---

## Regras de Progressão

### ✅ Avanços

| Condição | Decisão | Efeito |
|----------|---------|--------|
| 5 acertos consecutivos | `advance_cpa_phase` | concrete → pictorial → abstract |
| 5 acertos rápidos em abstract | `advance_microlevel` | maxResult +1 nível, volta para concrete |
| 5 acertos lentos | `maintain` | Mantém nível, varia exercícios |

### ❌ Regressões

| Condição | Decisão | Efeito |
|----------|---------|--------|
| 3 erros consecutivos | `regress_cpa_phase` | abstract → pictorial → concrete |
| 3 erros em concrete | `regress_microlevel` | maxResult -1 nível, vai para abstract |
| 10 erros consecutivos | `regress_to_baseline` | Volta ao início (maxResult=5, concrete) |

### 🔒 Bloqueio de Operação

**Nunca avançar de adição → subtração** sem maestria completa:
- Critério: `maxResult = 20` (último nível) **E** `cpaPhase = abstract`
- Função: `canAdvanceOperation(level)`

---

## Teste Manual Executado

```bash
npx tsx src/lib/progression/__manual-test-mastery.ts
```

**Resultado**: ✅ 100% dos testes passaram (8 cenários)

### Cenários Testados:

#### ✅ Teste 1: Avanço CPA (concrete → pictorial)
```
Nível inicial: {operation: 'addition', maxResult: 5, cpaPhase: 'concrete'}
5 acertos lentos consecutivos

Decisão: advance_cpa_phase
Novo nível: {cpaPhase: 'pictorial'}
```

#### ✅ Teste 2: Avanço Micro-Nível (5 → 10)
```
Nível inicial: {maxResult: 5, cpaPhase: 'abstract'}
5 acertos rápidos consecutivos

Decisão: advance_microlevel
Novo nível: {maxResult: 10, cpaPhase: 'concrete'}
(Volta para concrete no novo nível)
```

#### ✅ Teste 3: Manter Nível
```
5 acertos lentos consecutivos (em abstract)

Decisão: maintain
Motivo: "Precisa mais prática para maestria"
```

#### ✅ Teste 4: Regressão CPA (abstract → pictorial)
```
3 erros consecutivos

Decisão: regress_cpa_phase
Novo nível: {cpaPhase: 'pictorial'}
shouldGiveSpecialFeedback: true
```

#### ✅ Teste 5: Regressão Micro-Nível (10 → 5)
```
Nível inicial: {maxResult: 10, cpaPhase: 'concrete'}
3 erros consecutivos

Decisão: regress_microlevel
Novo nível: {maxResult: 5, cpaPhase: 'abstract'}
(Vai para abstract do nível anterior)
```

#### ✅ Teste 6: Regressão ao Baseline
```
10 erros consecutivos

Decisão: regress_to_baseline
Novo nível: {maxResult: 5, cpaPhase: 'concrete'}
shouldGiveSpecialFeedback: true
```

#### ✅ Teste 7: Progressão CPA Completa
```
concrete → (5 acertos) → pictorial → (5 acertos) → abstract
```

#### ✅ Teste 8: Bloqueio de Operação
```
{maxResult: 20, cpaPhase: 'pictorial'} → canAdvanceOperation = false
{maxResult: 15, cpaPhase: 'abstract'} → canAdvanceOperation = false
{maxResult: 20, cpaPhase: 'abstract'} → canAdvanceOperation = true ✓
```

---

## Uso no Código

### Exemplo Básico

```typescript
import { MasteryTracker } from '@/lib/progression';

const tracker = new MasteryTracker({
  operation: 'addition',
  maxResult: 5,
  cpaPhase: 'concrete',
});

// Adicionar resultados conforme criança resolve exercícios
tracker.addResult({
  correct: true,
  speed: 'fast',
  timeMs: 3000,
  attempts: 1,
  timestamp: Date.now(),
});

// Analisar progressão após cada exercício
const analysis = tracker.analyze();

if (analysis.decision !== 'maintain' && analysis.newLevel) {
  // Atualizar nível
  tracker.updateLevel(analysis.newLevel);

  // Dar feedback
  console.log(analysis.reason);

  if (analysis.shouldGiveSpecialFeedback) {
    showEncouragementMessage(); // 3+ erros
  }
}
```

### Integração com React + Zustand

```typescript
// store
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

      // Mostrar feedback
      if (analysis.decision === 'advance_microlevel') {
        showCelebration('Maestria! Próximo nível! 🎉');
      } else if (analysis.shouldGiveSpecialFeedback) {
        showEncouragement('Vamos tentar de outro jeito? 🤗');
      }
    }
  },
}));
```

### Verificar Avanço de Operação

```typescript
import { canAdvanceOperation, getNextOperation } from '@/lib/progression';

const currentLevel = tracker.getCurrentLevel();

if (canAdvanceOperation(currentLevel)) {
  const nextOp = getNextOperation(currentLevel.operation);

  if (nextOp) {
    console.log(`Maestria completa! Avançar para ${nextOp}? 🎊`);

    // Criar novo tracker para nova operação
    const newTracker = new MasteryTracker({
      operation: nextOp,
      maxResult: 5,
      cpaPhase: 'concrete',
    });
  }
}
```

---

## Fundamentos Pedagógicos

### Modelo CPA (Concrete-Pictorial-Abstract)

Jerome Bruner, 1960s - Aprendizado em 3 estágios:

1. **Concrete (Concreto)**: Manipulação de objetos físicos/visuais
   - Criança usa representações visuais (bolinhas, blocos)
   - UI: Exibir animações de objetos sendo adicionados/removidos

2. **Pictorial (Pictórico)**: Representação visual simplificada
   - Desenhos, diagramas, ícones
   - UI: Mostrar números com ícones pequenos ao lado

3. **Abstract (Abstrato)**: Apenas símbolos matemáticos
   - Números e operadores puros (3 + 2 = ?)
   - UI: Texto puro, sem ajudas visuais

### Progressão Small Steps (Kumon)

- **Micro-níveis**: Incrementos pequenos (5→10→15→20)
- **Maestria**: 5 acertos rápidos (<5s) = resposta automática
- **Prevenção de Frustração**: Regressão após 3 erros (não deixar acumular)

### Buffer Circular

Por que 10 resultados?
- **Memória de Trabalho Infantil**: ~7±2 items (Miller, 1956)
- **Estatística**: 10 samples = suficiente para detectar padrões
- **UX**: Decisões rápidas sem esperar 20+ exercícios

---

## Decisões Técnicas

### Por que Buffer Circular?

```typescript
// ✅ Buffer Circular - Eficiente
buffer.add(result); // O(1)
buffer.getAll(); // O(n), n=10 fixo

// ❌ Array Simples - Ineficiente
array.push(result);
if (array.length > 10) array.shift(); // O(n) shift!
```

**Vantagens**:
- Inserção O(1) constante
- Memória fixa (10 items)
- Ordem cronológica preservada

### Por que Classe em vez de Funções Puras?

```typescript
// ✅ Classe - Estado encapsulado
const tracker = new MasteryTracker(level);
tracker.addResult(r1);
tracker.addResult(r2);
const analysis = tracker.analyze();

// ❌ Funções - Estado manual
let state = createState(level);
state = addResult(state, r1);
state = addResult(state, r2);
const analysis = analyzeState(state);
```

**Vantagens**:
- Buffer interno gerenciado automaticamente
- API intuitiva (add, analyze)
- Fácil de integrar com React (useRef, Zustand)

### Prioridade de Regressões

Por que verificar baseline antes de CPA?

```typescript
// Ordem correta (urgência decrescente):
if (10 erros) → baseline   // Mais urgente
if (3 erros) → regress CPA
if (3 erros em concrete) → regress micro
```

**Motivo**: 10 erros = criança completamente perdida, precisa voltar ao início IMEDIATAMENTE.

---

## Validação TypeScript

```bash
npx tsc --noEmit src/lib/progression/mastery.ts
# ✅ Sem erros
```

---

## Próximos Passos

1. ✅ Integrar `MasteryTracker` no `useGameStore` (Zustand)
2. ✅ Conectar com `HesitationTimer` para gerar `ExerciseResult`
3. ✅ Implementar feedback visual por decisão (celebração, encorajamento)
4. ✅ Adicionar analytics de progressão (gráficos de evolução)
5. ✅ Implementar sistema de badges/conquistas por marcos (ex: "Primeira vez em abstract!")

---

## Arquivos Modificados

1. `src/types/mastery.ts` (novo)
2. `src/types/index.ts` (atualizado - exports)
3. `src/lib/progression/mastery.ts` (novo)
4. `src/lib/progression/index.ts` (atualizado - exports)
