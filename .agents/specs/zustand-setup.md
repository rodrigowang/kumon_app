# Spec: Zustand Setup (0.3)

## Objetivo Pedagógico

Estabelecer a arquitetura de estado que suportará a progressão CPA, sistema de maestria, e persistência de progresso — fundamentos do método Kumon adaptado.

## Requisitos Pedagógicos

### 1. Game Store (`useGameStore`)
**Por quê**: Controla o contexto imediato da criança — onde ela está e qual fase do aprendizado está explorando.

- `currentExercise`: identificador único do exercício (ex: `"add-1-2"`)
- `cpaPhase`: `"concrete" | "pictorial" | "abstract"` — progressão linear
- `level`: número inteiro ≥ 1 — dificuldade crescente
- `sessionData`: objeto com `startTime`, `attempts`, `correctAnswers`, `mistakes`

**Critérios**:
- ✅ Estado inicial: `currentExercise: null`, `cpaPhase: "concrete"`, `level: 1`, `sessionData: null`
- ✅ Tipos TypeScript strict, sem `any`

### 2. Progress Store (`useProgressStore`)
**Por quê**: Kumon depende de histórico cumulativo — maestria é conquistada pela repetição e análise de padrões de erro.

- `history`: array de objetos `{ exerciseId, timestamp, wasCorrect, attempts, cpaPhase }`
- `stars`: mapa `{ [exerciseId]: number }` — estrelas acumuladas (0-3)
- `unlockedLevels`: array de números — níveis liberados

**Critérios**:
- ✅ Estado inicial vazio: `history: []`, `stars: {}`, `unlockedLevels: [1]`
- ✅ Estrutura preparada para futura persistência (localStorage ou IndexedDB)

### 3. Settings Store (`useSettingsStore`)
**Por quê**: Criança deve controlar ambiente sonoro — autonomia reduz frustração.

- `volume`: número 0-1
- `soundEnabled`: booleano

**Critérios**:
- ✅ Estado inicial: `volume: 0.7`, `soundEnabled: true`
- ✅ Valores numéricos validados (0 ≤ volume ≤ 1)

## Princípios Kumon Aplicados

1. **Progressão linear (CPA)**: A store reflete o modelo concreto → pictorial → abstrato explicitamente.
2. **Maestria via repetição**: O histórico permite identificar padrões de erro e calibrar próximos exercícios.
3. **Autonomia**: Criança controla configurações (som) sem assistência adulta.

## O Que NÃO Fazer

❌ **NÃO** criar actions complexas agora — apenas estado e tipagem. Actions virão nas tasks específicas de cada feature.
❌ **NÃO** implementar persistência ainda — isso é task separada (0.4).
❌ **NÃO** criar lógica de negócio dentro das stores — stores são apenas estado + mutações simples.
❌ **NÃO** usar `any`, `unknown` sem tratamento, ou tipos implícitos.

## Critérios de Aceitação

1. ✅ Arquivo `src/stores/useGameStore.ts` existe, exporta hook tipado
2. ✅ Arquivo `src/stores/useProgressStore.ts` existe, exporta hook tipado
3. ✅ Arquivo `src/stores/useSettingsStore.ts` existe, exporta hook tipado
4. ✅ Tipos explícitos para todos os estados (interfaces/types exportados)
5. ✅ Estado inicial correto em cada store
6. ✅ Zero erros TypeScript (`tsc --noEmit` passa)
7. ✅ Zustand instalado em `package.json`

## Referências Pedagógicas

- Método Kumon: progressão incremental, maestria antes de avançar
- CPA (Bruner): concretizar conceitos antes de abstrair
- Autonomia infantil: criança deve controlar ambiente sem adulto

---

**Nota ao Dev**: Esta spec é apenas estrutura. Ações de mutação (ex: `completeExercise()`, `addStar()`) virão em tasks futuras quando implementarmos cada feature.
