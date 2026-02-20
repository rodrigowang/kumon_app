# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: Loop completo de estudo diário: criança faz contas → ganha moedas → cuida do bichinho virtual → quer voltar amanhã.

**Estado atual (2026-02-20)**: ✅ **Sprints 1–3 COMPLETAS**. App funcional com HomeScreen, sessões de 10 exercícios, resumo, estrelas, progressão automática de nível, OCR, PWA offline e fallback teclado. Sprint 2 original (progressão visível) foi iniciada mas NÃO concluída — `ProgressDashboard.tsx`, `LevelBadge.tsx`, `LevelChangeNotification.tsx` e `levelFormat.ts` existem como arquivos não commitados e ficam em standby.

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

### 4.1 — Subtração integrada no fluxo
- Hoje o gerador suporta subtração mas o fluxo padrão começa com adição
- Após dominar adição até 20: desbloquear subtração
- Transição visual no PetHub: "Agora vamos subtrair! Seu bichinho vai adorar! 🐾"
- **Dificuldade de moedas** para subtração: mesma tabela (baseada em maxResult)

### 4.2 — Testes automatizados
- Vitest nos pet stores (derivação de status, feedPet, buyItem, streak)
- Vitest nos game stores (submissão, progressão, persistência)
- Playwright E2E: HomeHub → Lição → Resumo com moedas → Voltar → Pet feliz

### 4.3 — Acessibilidade
- ARIA labels nos botões de loja e inventário
- Contraste WCAG AA validado (especialmente status do pet)
- Navegação por teclado (para tablets com teclado)

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
Sprint 2 (bichinho virtual):            ← PRÓXIMO
  2.1 usePetStore + petActions + utils  🔲 ← COMEÇAR AQUI
  2.2 Economia integrada no fluxo       🔲
  2.3 PetDisplay (visual do bichinho)   🔲
  2.4 PetHub (nova tela principal)      🔲
  2.5 Streak + troféu + rescue          🔲

Sprint 4 (polimento):
  4.1 Subtração no fluxo                🔲
  4.2 Testes automatizados              🔲
  4.3 Acessibilidade                    🔲
```

---

## Princípio Guia

> A cada etapa o app deve estar **usável**. Depois da Sprint 2.2, uma criança já ganha moedas de verdade. Depois da 2.4, o loop completo de pet funciona. Assets provisórios são aceitáveis — substituir depois.

---

**Última atualização**: 2026-02-20
