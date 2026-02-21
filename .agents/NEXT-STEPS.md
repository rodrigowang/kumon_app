# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: Loop completo de estudo diário: criança faz contas → ganha moedas → cuida do bichinho virtual → quer voltar amanhã.

**Estado atual (2026-02-20)**: ✅ **Sprints 1–3 + Sprint 2 (Bichinho Virtual) COMPLETAS**. App funcional com PetHub (tela principal), sessões de 10 exercícios, resumo com moedas, estrelas, progressão automática, OCR, PWA offline, fallback teclado e loop completo do pet virtual. Audit de bugs concluído: **0 erros TypeScript, build limpo**. `ProgressDashboard.tsx`, `LevelBadge.tsx`, `LevelChangeNotification.tsx` e `levelFormat.ts` existem como arquivos não commitados e ficam em standby (substituídos pelo PetHub como tela de progresso visual).

---

## Sprint 1 — Loop Principal Funcional ✅ COMPLETA

> Criança abre o app → faz contas → acerta → dificuldade sobe → erra → desce. Sessão de 10 exercícios com resumo.

---

## Sprint 2 — Bichinho Virtual (MVP) ← PRÓXIMA

> Criança faz contas → ganha moedas → compra comida/água → cuida do bichinho → volta amanhã para não deixá-lo doente.

**Filosofia de implementação:**
- Tudo **aditivo** — zero refatoração do core existente
- `ExerciseResult.timeMs` e `sessionStats.fastCount` já existem: multiplicador x2 de velocidade é trivial
- Pet state fica em `usePetStore` separado (Zustand), **não** mistura com `useGameStore`
- **Sem PixiJS** no MVP — CSS keyframes + GIFs/PNGs do itch.io são suficientes
- Status do pet nunca é salvo diretamente; sempre derivado de `Date.now() - lastFedAt`

---

### 2.1 — Base de Dados do Pet (fundação pura, zero UI)

**Criar:**
- `src/stores/usePetStore.ts` — Zustand com persist
- `src/lib/petActions.ts` — funções de mutação
- `src/lib/coinCalculator.ts` — cálculo de moedas
- `src/lib/streakUtils.ts` — lógica de streak diário

**Estado salvo no localStorage** (chave `kumon-pet-storage`):
```json
{
  "coins": 0,
  "lastFedAt": 1700000000000,
  "inventory": { "water": 0, "food": 0, "medicine": 0 },
  "streak": { "current": 0, "lastLessonDate": "" },
  "hasTrophy7Days": false
}
```

**Status derivado em runtime** (nunca persiste):
| `Date.now() - lastFedAt` | Status   | Visual       |
|--------------------------|----------|--------------|
| 0 a 24h                  | `happy`  | Animação idle |
| 24h a 48h                | `hungry` | Estático/triste |
| Mais de 48h              | `sick`   | Deitado/triste |

**`petActions.ts`:**
- `feedPet(type)` — recusa se status `happy`; consume 1 unidade do inventário; atualiza `lastFedAt`
- `buyItem(type)` — valida moedas; debita; incrementa inventário

Tabela de preços:
| Item     | Preço | Efeito                         |
|----------|-------|--------------------------------|
| Água     | 4c    | Restaura para `happy` (somente se `hungry`) |
| Comida   | 6c    | Restaura para `happy` (somente se `hungry`) |
| Remédio  | 20c   | Restaura para `happy` (qualquer estado)     |

**`coinCalculator.ts`:** baseado em `MasteryLevel.maxResult`:
| Dificuldade  | `maxResult`  | Moedas/acerto |
|--------------|--------------|---------------|
| Fácil        | ≤ 10         | 1c            |
| Média        | 11 a 20      | 3c            |
| Difícil      | > 20         | 5c            |

Multiplicador x2: se `sessionStats.fastCount >= 7` na sessão → total × 2 (já temos esse dado no `useGameStore`).

**`completedLesson(coinsEarned, sessionStats)`** dentro de `petActions.ts`:
1. Credita moedas
2. Atualiza streak (via `streakUtils.ts`)
3. Emergency rescue: se `status === 'sick'` E `coins < 20` → injeta 1 remédio + aplica `feedPet('medicine')`
4. Desbloqueia troféu se `streak.current >= 7`

**`streakUtils.ts`:**
```ts
// Não altera se já completou uma lição hoje
if (lastLessonDate === today) return
streak.current = (lastLessonDate === yesterday) ? streak.current + 1 : 1
streak.lastLessonDate = today
```

> **Critério de done:** funções testáveis no console do browser antes de qualquer UI.

---

### 2.2 — Economia Integrada no Fluxo de Exercícios

**Modificar:**
- `src/stores/useGameStore.ts` — `endSession()` retorna também `coinsEarned` e `speedBonus: boolean`
- `src/components/screens/SessionSummaryScreen.tsx` — exibir moedas ganhas + "x2 Rápido!" se bônus
- `src/App.tsx` — após `endSession()`, chamar `completedLesson()` do pet store

**Detalhes:**
- `endSession()` calcula moedas: soma moedas base por acerto (via `currentLevel`) + aplica x2 se `fastCount >= 7`
- `SessionSummary` ganha campos opcionais: `coinsEarned: number`, `speedBonus: boolean`
- `SessionSummaryScreen` mostra seção nova: "🪙 +12 moedas" (ou "🪙 +24 moedas ⚡ Rápido!")
- Botão "Voltar para o Quarto" (em vez de "Voltar")

**Nenhuma mudança em `AbstractExerciseScreen`** — dados de `timeMs` e `speed` já chegam via `ExerciseResult`.

> **Critério de done:** completar uma sessão e ver moedas acreditadas no localStorage.

---

### 2.3 — Pet Visual (Sprites Simples, Sem PixiJS)

**Criar:**
- `src/components/ui/PetDisplay.tsx` — componente React puro com `<img>` + CSS

**Assets:** buscar sprites gratuitos em:
- [itch.io](https://itch.io/game-assets/free/tag-tamagotchi) — buscar "tamagotchi sprite free" ou "virtual pet sprite CC0"
- [OpenGameArt.org](https://opengameart.org) — tag "pet", licença CC0
- Formato ideal: PNG spritesheet OU GIFs separados por estado

**Props do componente:**
```tsx
<PetDisplay status="happy" | "hungry" | "sick" | "eating" />
```

**Implementação sem PixiJS:**
- Se GIFs: `<img src={sprites[status]} />` — simples e funciona
- Se PNG spritesheet: CSS `background-position` + `@keyframes steps()`
- Animação `eating` curta (1–2s) → volta para `happy` automaticamente via `setTimeout`

**Sprites necessários (mínimo viável):**
| Estado    | Tipo         | Alternativa de fallback |
|-----------|--------------|------------------------|
| `happy`   | GIF animado  | PNG estático + CSS bounce |
| `hungry`  | PNG estático | Emoji grande 😢          |
| `sick`    | PNG estático | Emoji grande 🤒          |
| `eating`  | GIF curto    | PNG estático             |

> **Critério de done:** bichinho visível na tela mudando de visual conforme status derivado.

---

### 2.4 — PetHub — Nova Tela Principal

**Criar:**
- `src/components/screens/PetHub.tsx` — substitui HomeScreen na navegação

**Modificar:**
- `src/App.tsx` — view `'home'` → renderiza `PetHub` (não `HomeScreen`)
- `src/components/screens/index.ts` — exportar `PetHub`

**Layout do PetHub:**
```
┌─────────────────────────────┐
│  🔥 Streak: 3 dias   🪙 24  │  ← status bar (topo, compacto)
├─────────────────────────────┤
│                             │
│        [PetDisplay]         │  ← bichinho centralizado
│       😊 Feliz!             │  ← status em texto
│                             │
├─────────────────────────────┤
│ [💧 Usar] [🍎 Usar] [💊 Usar] │  ← inventário (desabilitado se happy)
│  0 água    0 comida  0 rem. │
├─────────────────────────────┤
│ LOJA: [💧 4c] [🍎 6c] [💊 20c] │  ← loja compacta
├─────────────────────────────┤
│   🎮 COMEÇAR LIÇÃO (80px)   │  ← botão principal
├─────────────────────────────┤
│ [🗺️ Progresso]  [dev] [reset]│  ← links discretos
└─────────────────────────────┘
```

**Regras de UI (criança de 7 anos):**
- Botões "Usar" → desabilitados (cinza) se `status === 'happy'`
- Botões "Comprar" → desabilitados se `coins < preço`
- Se `status === 'sick'` e `coins < 20` → aviso: "Seu bichinho está doente! Complete uma lição e ele será curado! 🏥"
- Touch targets ≥ 48px em todos os botões de loja/inventário
- Saldo de moedas sempre visível no topo

> **Critério de done:** loop completo funcional — pet hub → começar lição → sessão → resumo com moedas → voltar para hub → comprar item → usar item → pet fica feliz.

---

### 2.5 — Streak, Troféu e Emergency Rescue

**Criar:**
- `src/components/ui/StreakDisplay.tsx` — "🔥 N dias seguidos" (compacto, no PetHub)
- `src/components/ui/TrophyDisplay.tsx` — troféu de 7 dias (aparece no PetHub após conquista)

**Regras de streak:**
- Completar ≥ 1 lição por dia mantém streak
- Streak quebra se pular 1 dia
- Ao atingir 7 dias: `hasTrophy7Days = true` → exibir troféu visual permanente no PetHub
- Celebração simples: mensagem "🏆 7 dias seguidos! Incrível!"

**Emergency rescue** (já especificado em 2.1 mas com confirmação visual):
- Condição: `status === 'sick'` E `coins < 20`
- Após completar lição: remédio automático + mensagem no `SessionSummaryScreen`:
  > "Seu bichinho foi curado com um kit de emergência! 💊"

> **Critério de done:** streak visível; troféu aparece após 7 dias; kit emergência curou o pet na tela de resumo.

---

## Sprint 3 — Robustez e Edge Cases ✅ COMPLETA

> Fallback teclado, PWA/Offline, erros graceful.

---

## Sprint 4 — Polimento

### 4.1 — Subtração integrada no fluxo ✅ COMPLETA
- `mastery.ts` → `advanceMicrolevel()` avança para subtração quando adição está no topo (maxResult=20, abstract)
- `useGameStore.ts` → `subtractionBannerSeen` + `dismissSubtractionBanner()`
- `PetHub.tsx` → banner "Agora vamos subtrair!" com botão "Entendi!" (aparece 1x ao desbloquear)
- Moedas: sem alteração — já funcionam por `maxResult`

### 4.2 — Testes automatizados
- Vitest nos pet stores (derivação de status, feedPet, buyItem, streak)
- Vitest nos game stores (submissão, progressão, persistência)
- Playwright E2E: HomeHub → Lição → Resumo com moedas → Voltar → Pet feliz

### 4.3 — Acessibilidade ✅ COMPLETA
- ARIA labels nos botões de loja e inventário ✅
- Contraste WCAG AA: `c="dimmed"` → `c="gray.7"` nos labels de seção ✅
- Navegação por teclado completa: overlays com FocusTrap + atalhos físicos ✅
- `aria-modal="true"` + `data-autofocus` em todos os dialogs ✅
- `aria-live="polite"` no status do pet e display do teclado ✅
- Foco visual no canvas de desenho ✅

---

## Sprint 5 — Progressão Multi-Dígitos + Mecânicas do Pet ← PRÓXIMA

> Dois objetivos paralelos: ampliar o alcance matemático para operações com 2 e 3 dígitos, e tornar o cuidado do pet mais rico com o estado de sede independente da fome.

---

### 5.1 — Progressão Multi-Dígitos (2+1 e 3+1 dígitos)

**Motivação:** hoje soma e subtração evoluem apenas dentro de resultados até 20 (1 dígito + 1 dígito). Queremos continuar a progressão natural para operações com dezenas e centenas.

**Auditoria OCR concluída:** o pipeline já suporta 3 dígitos sem nenhuma mudança. `segmentDigits`, `predictDigits` e `predictionsToNumber` são agnósticos à quantidade de dígitos.

**Nova tabela de níveis:**

| Nível | maxResult | Tipo de operação | Exemplo | Moedas/acerto |
|-------|-----------|-----------------|---------|---------------|
| 1 | 5 | 1+1 dígitos | 2+3 | 1c |
| 2 | 10 | 1+1 dígitos | 7+3 | 1c |
| 3 | 15 | 1+1 dígitos | 8+7 | 3c |
| 4 | 20 | 1+1 dígitos | 9+9 | 3c |
| 5 | 99 | 2+1 dígitos | 45+8 | 8c |
| 6 | 999 | 3+1 dígitos | 247+5 | 15c |

Mesma lógica para subtração (ex: 73-6, 452-8).

**Passo a passo de implementação:**

**Passo 1 — `src/types/mastery.ts`**
- Estender `MICROLEVEL_PROGRESSION`:
  ```ts
  addition:    [5, 10, 15, 20, 99, 999]
  subtraction: [5, 10, 15, 20, 99, 999]
  ```
- Nenhuma outra mudança neste arquivo.

**Passo 2 — `src/lib/math/generateProblem.ts`**
- Adicionar 2 novos blocos em `getAdditionConfig()`:
  ```
  maxResult <= 99:  operandA 10–89, operandB 1–9  (2+1 dígitos)
  maxResult <= 999: operandA 100–989, operandB 1–9 (3+1 dígitos)
  ```
- Adicionar 2 novos blocos em `getSubtractionConfig()`:
  ```
  maxResult <= 99:  minuend 11–99, subtrahend 1–9  (resultado ≥ 1)
  maxResult <= 999: minuend 101–999, subtrahend 1–9 (resultado ≥ 1)
  ```
- Garantir que `isValidResult` e `isValidOperands` continuam funcionando (sem negativos).

**Passo 3 — `src/lib/coinCalculator.ts`**
- Atualizar `getCoinsPerCorrect()`:
  ```ts
  maxResult <= 10  → 1c
  maxResult <= 20  → 3c
  maxResult <= 99  → 8c   ← novo
  maxResult <= 999 → 15c  ← novo
  ```

**Passo 4 — Verificar banner de desbloqueio (`PetHub.tsx`)**
- Hoje existe banner "Agora vamos subtrair!" para transição adição→subtração.
- Avaliar se vale adicionar banner "Números maiores!" ao desbloquear nível 5 (maxResult=99).
- Decisão: sim, mesma mecânica do `subtractionBannerSeen`.

**Passo 5 — Testes unitários**
- Atualizar testes de `generateProblem` para cobrir os novos níveis.
- Atualizar testes de `coinCalculator` para cobrir `maxResult=99` e `maxResult=999`.
- Testar que `advanceMicrolevel()` progride corretamente de 20→99→999.

**Arquivos modificados:**
- `src/types/mastery.ts`
- `src/lib/math/generateProblem.ts`
- `src/lib/coinCalculator.ts`
- `src/components/screens/PetHub.tsx` (banner opcional)
- `tests/unit/coinCalculator.spec.ts`
- `tests/unit/generateProblem.spec.ts` (se existir)

> **Critério de done:** criança que completa soma/subtração nível 4 (maxResult=20, abstract) avança para exercícios tipo "45+8". Moedas sobem de 3c para 8c. Build sem erros TypeScript.

---

### 5.2 — Estado de Sede (separado da Fome)

**Motivação:** água e comida hoje são intercambiáveis para `hungry`. Com sede como estado independente, cada item tem propósito único — mais engajamento e razão para comprar ambos.

**Nota sobre timing:** pet começa com fome (`lastFedAt: 0`) mas com sede defasada (`lastWateredAt: Date.now() - 6 * 3600 * 1000`) para que os estados não apareçam sempre simultaneamente.

**Novos estados derivados em runtime:**
| Estado | Condição |
|--------|----------|
| `happy` | alimentado E hidratado (ambos < 12h) |
| `hungry` | fome (12–24h sem comer), mas hidratado |
| `thirsty` | sede (12–24h sem beber), mas alimentado |
| `hungry_and_thirsty` | fome E sede simultaneamente |
| `sick` | qualquer um dos dois > 24h sem atenção |

**Regras de item:**
| Item | Cura |
|------|------|
| 💧 Água | `thirsty` e `hungry_and_thirsty` (atualiza `lastWateredAt`) |
| 🍎 Comida | `hungry` e `hungry_and_thirsty` (atualiza `lastFedAt`) |
| 💊 Remédio | `sick` (restaura ambos `lastFedAt` e `lastWateredAt`) |

**Passo a passo de implementação:**

**Passo 1 — `src/lib/petActions.ts`**
- Adicionar `PetStatus`: `'thirsty' | 'hungry_and_thirsty'` aos tipos existentes.
- Alterar assinatura de `derivePetStatus(lastFedAt, lastWateredAt)`.
- Lógica:
  ```ts
  const hungry = elapsed(lastFedAt) > 12h
  const thirsty = elapsed(lastWateredAt) > 12h
  const fedSick = elapsed(lastFedAt) > 24h
  const waterSick = elapsed(lastWateredAt) > 24h
  if (fedSick || waterSick) return 'sick'
  if (hungry && thirsty) return 'hungry_and_thirsty'
  if (hungry) return 'hungry'
  if (thirsty) return 'thirsty'
  return 'happy'
  ```
- Atualizar `canFeedPet()`: água só funciona se status inclui sede; comida só se inclui fome.
- Atualizar `getPetStatusLabel()` com os novos estados.

**Passo 2 — `src/stores/usePetStore.ts`**
- Adicionar campo `lastWateredAt: number` ao estado.
- Estado inicial: `lastWateredAt: Date.now() - 6 * 3600 * 1000` (defasado 6h).
- Atualizar `feedPet('water')` → atualiza `lastWateredAt`.
- Atualizar `feedPet('food')` → atualiza `lastFedAt` (sem mudança, já faz isso).
- Atualizar `feedPet('medicine')` → atualiza ambos.
- Atualizar `completedLesson()` → emergency rescue verifica `lastWateredAt` também.
- Atualizar `getPetStatus()` → passa ambos os timestamps.
- Adicionar `lastWateredAt` ao `partialize` (persistir).

**Passo 3 — `src/components/screens/PetHub.tsx`**
- Botão "Usar Água" habilitado se status é `thirsty` ou `hungry_and_thirsty`.
- Botão "Usar Comida" habilitado se status é `hungry` ou `hungry_and_thirsty`.
- Label de status exibe os novos estados.

**Passo 4 — `src/components/ui/PetDisplay.tsx`**
- Sprite `hungry_and_thirsty` → reusar sprite `hungry` (ou criar variação CSS).

**Passo 5 — Testes unitários**
- Atualizar testes de `petActions` para cobrir os 5 estados.
- Testar `canFeedPet` para todas as combinações (água em `thirsty`, `hungry`, `sick`, `happy`).

**Arquivos modificados:**
- `src/lib/petActions.ts`
- `src/stores/usePetStore.ts`
- `src/components/screens/PetHub.tsx`
- `src/components/ui/PetDisplay.tsx`
- `tests/unit/petActions.spec.ts`

> **Critério de done:** água só resolve sede, comida só resolve fome. Remédio cura os dois. Pet começa com fome (imediato) e fica com sede ~6h depois. Build sem erros TypeScript.

---

## Fora do Escopo deste MVP (não implementar agora)

- **PixiJS** — CSS + GIF resolve sem adicionar 4MB ao bundle
- **Quarto isométrico** — pixel art fancy fica para v2
- **Sincronização entre devices** — localStorage only por enquanto
- **Múltiplos pets / evolução** — v2
- **Anti-trapaça (Page Visibility API)** — MVP confia na criança
- **ProgressDashboard** — os arquivos já existem mas ficam em standby; PetHub é a nova tela de progresso visual

---

## Ordem de Implementação Recomendada

```
Sprint 2 (bichinho virtual):            ✅ COMPLETA
  2.1 usePetStore + petActions + utils  ✅
  2.2 Economia integrada no fluxo       ✅
  2.3 PetDisplay (visual do bichinho)   ✅
  2.4 PetHub (nova tela principal)      ✅
  2.5 Streak + troféu + rescue          ✅

Audit de Bugs:                          ✅ COMPLETO
  Bugs runtime (4 críticos)             ✅
  Erros TypeScript (16 → 0)            ✅
  Build limpo (npx vite build)          ✅

Sprint 4 (polimento):
  4.1 Subtração no fluxo                ✅
  4.2 Testes automatizados              ✅
  4.3 Acessibilidade                    ✅
```

---

## Princípio Guia

> A cada etapa o app deve estar **usável**. Depois da Sprint 2.2, uma criança já ganha moedas de verdade. Depois da 2.4, o loop completo de pet funciona. Assets provisórios são aceitáveis — substituir depois.

---

**Última atualização**: 2026-02-21 (Sprint 5 especificada: multi-dígitos 5.1 + sede 5.2)
