# Dev Output — Sistema de Progressão: Tipos Base

**Data**: 2026-02-19
**Task**: Criar tipos TypeScript para sistema de progressão (Kumon + CPA)
**Status**: ✅ Implementado

---

## TL;DR

Criados tipos base para o sistema de progressão pedagógica: `CpaPhase`, `Operation`, `ProblemResult`, e `MasteryLevel`. Sistema segue modelo CPA (Concreto → Pictórico → Abstrato) do método Kumon.

---

## Arquivos Criados

### 1. `src/types/progression.ts`

Tipos principais:

- **`CpaPhase`**: `'concrete' | 'pictorial' | 'abstract'`
  - Fases do modelo pedagógico CPA
  - Concrete: objetos visuais para representar quantidades
  - Pictorial: representação visual simplificada
  - Abstract: apenas números e símbolos

- **`Operation`**: `'addition' | 'subtraction'`
  - Operações matemáticas suportadas
  - Extensível para multiplicação/divisão no futuro

- **`ProblemResult`**: `{ correct: boolean; timeMs: number; attempts: number }`
  - Resultado de uma tentativa de resolver problema
  - `correct`: se a resposta estava correta
  - `timeMs`: tempo levado (em ms)
  - `attempts`: número de tentativas até acertar

- **`MasteryLevel`**: `{ operation: Operation; maxResult: number; cpaPhase: CpaPhase }`
  - Nível de maestria atual da criança
  - `operation`: tipo de operação (adição/subtração)
  - `maxResult`: maior número que pode aparecer (ex: 10 para somas até 10)
  - `cpaPhase`: fase pedagógica atual

### 2. `src/types/index.ts` (atualizado)

Adicionados exports dos tipos de progressão:

```typescript
export type {
  CpaPhase,
  Operation,
  ProblemResult,
  MasteryLevel,
} from './progression';
```

### 3. `tsconfig.json` (fix)

Adicionado `"baseUrl": "."` para corrigir erro de paths (`@/*`).

---

## Exemplos de Uso

```typescript
import type { MasteryLevel, ProblemResult } from '@/types';

// Criança iniciante: somas simples até 5, fase concreta
const initialLevel: MasteryLevel = {
  operation: 'addition',
  maxResult: 5,
  cpaPhase: 'concrete',
};

// Resultado de um exercício
const result: ProblemResult = {
  correct: true,
  timeMs: 3500,
  attempts: 1,
};
```

---

## Validação

- ✅ TypeScript compila sem erros (`npx tsc --noEmit src/types/progression.ts`)
- ✅ Exports estão acessíveis via `@/types`
- ✅ Documentação inline completa (JSDoc)
- ✅ Strict mode habilitado (sem `any`, null-safe)

---

## Próximos Passos

1. Criar lógica de progressão (`lib/maestria/`)
2. Integrar com `useProgressStore` (Zustand)
3. Implementar gerador de exercícios baseado em `MasteryLevel`
