# Kumon Math App — Memória Persistente

## Projeto
App web educacional (React 18 + TS + Vite + Mantine + Zustand + TensorFlow.js) para crianças de 7 anos aprenderem matemática escrevendo à mão. OCR reconhece dígitos, progressão automática estilo Kumon.

## Arquivos Chave
- `MEMORY.md` (raiz): resumo completo do que foi implementado
- `.agents/NEXT-STEPS.md`: sprint de próximos passos
- `.agents/dev-output.md`: log de alterações
- `CLAUDE.md`: regras globais do projeto

## Padrões Aprendidos
- **npm install pode falhar** com EACCES — usar `npx` ou implementar nativo
- **Imports em src/lib/**: usar caminhos relativos (aliases `@/` não funcionam com `tsc` bare)
- **TypeScript readonly tuples**: usar `as never` cast em `indexOf`
- **Navegação**: state-based no App.tsx, sem React Router
- **Vitest**: listado em scripts mas NÃO está em devDependencies
- **Mantine Overlay bug**: `<Overlay>` bloqueia cliques — usar CSS plain `backgroundColor + backdropFilter`
- **Build**: usar `npx vite build` (não `npm run build`)
- **FeedbackOverlay**: removido para acertos (Sprint 3.3) — só som. Erros: correção inline
- **useCallback order**: advanceToNext deve ser definido ANTES de processResult (TDZ)
- **React StrictMode double-call**: usar `useRef` guard em useEffect com side effects (ex: creditar moedas)
- **setState-during-render**: nunca chamar setState no corpo do componente, usar useEffect
- **playSound type**: unificado como `(type: 'doubt' | 'oops' | 'tap' | 'confirm') => void` em toda a cadeia OCR
- **tf.tidy() com objetos não-tensor**: não usar tf.tidy() se a função retorna objeto custom (DigitPrediction) — causa type error; a função já tem seu próprio tidy() interno

## Estado Atual (2026-02-20)
**Sprint 1 COMPLETA** — Loop principal funcional
**Sprint 2 COMPLETA** — Bichinho Virtual (pet tamagotchi)
  - 2.1: usePetStore + petActions + coinCalculator + streakUtils
  - 2.2: Economia integrada ao fluxo (moedas em endSession, SessionSummary)
  - 2.3: PetDisplay com sprites GIF CC0
  - 2.4: PetHub (nova tela principal, substituiu HomeScreen)
  - 2.5: StreakDisplay + TrophyDisplay + Emergency Rescue visual
**Sprint 3 COMPLETA** — Robustez
  - 3.1: Fallback teclado numérico inteligente
  - 3.2: PWA e Offline
  - 3.3: Erros graceful + UX simplificado (sem overlay, correção inline)
**Audit de Bugs COMPLETO** — 0 erros TypeScript, build OK

### ✅ O que funciona

1. **PetHub** (nova tela principal, `src/components/screens/PetHub.tsx`)
   - Status bar: streak 🔥, moedas 🪙, nível/estrelas
   - PetDisplay centralizado (GIF animado por estado)
   - Inventário (usar itens no pet)
   - Loja (comprar água/comida/remédio)
   - Aviso de emergência quando pet doente e sem moedas
   - Botão "🎮 Começar Lição" (80px)
   - Links: progresso, dev, resetar

2. **Bichinho Virtual** (`src/stores/usePetStore.ts`)
   - Status derivado em runtime: happy (0-24h), hungry (24-48h), sick (>48h)
   - `coins`, `inventory`, `streak`, `hasTrophy7Days`
   - `feedPet(type)`: água/comida só cura `hungry`; remédio cura `sick` e `hungry`
   - `buyItem(type)`: valida saldo, debita moedas
   - `completedLesson(coinsEarned)`: credita moedas + streak + emergency rescue + troféu
   - Persiste em `kumon-pet-storage` (exceto `lastLessonEmergencyRescue`)

3. **Economia** (`src/lib/coinCalculator.ts`)
   - 1c/acerto (maxResult ≤10), 3c (11-20), 5c (>20)
   - Multiplicador x2 se fastCount ≥ 7 na sessão
   - Preços: água 4c, comida 6c, remédio 20c

4. **Streak e Troféu** (`src/lib/streakUtils.ts`)
   - Streak diário mantido se completar ≥1 lição/dia
   - Quebra se pular 1 dia
   - Troféu permanente ao atingir 7 dias seguidos

5. **Emergency Rescue**
   - Condição: pet sick + coins < 20 (verificado ANTES de creditar)
   - Injeta remédio automático + cura o pet
   - Mensagem na SessionSummaryScreen

6. **Sessões de 10 exercícios**
   - Indicador visual (bolinhas + "3 de 10")
   - SessionSummaryScreen: titulo, estrelas, stats, moedas, bônus x2, rescue, troféu

7. **Motor de progressão**
   - MasteryTracker no useGameStore
   - Nível muda automaticamente (5 fast→sobe, 3 erros→desce)

8. **OCR real**
   - Pipeline: canvas → segmentDigits → predictNumber (CNN, ~99%)
   - 3 status: accepted (≥80%), confirmation (50-79%), retry (<50%)
   - Timeout 5s → fallback teclado
   - Overlays clicáveis

9. **Feedback UX** (Sprint 3.3)
   - Acerto: som + avança automaticamente (sem overlay)
   - Erro: correção inline — resposta correta (verde) + resposta do aluno (vermelho)
   - Botão "Continuar" para avançar após erro

10. **Persistência**
    - `kumon-game-storage`: currentLevel, sessionStats, totalStars, lastSessionSummary
    - `kumon-pet-storage`: coins, lastFedAt, inventory, streak, hasTrophy7Days
    - MasteryTracker reconstruído na hidratação

11. **Fallback teclado numérico** (Sprint 3.1)
    - Após 2 retries OCR: botão "⌨️ Usar teclado"
    - Multi-dígito (respostas até 99)

12. **PWA e Offline** (Sprint 3.2)
    - Service Worker precacheia modelo MNIST (~4.6MB) + app shell
    - App instalável e funcional 100% offline

### Stack
- UI: React 18 + TypeScript 5 + Vite
- Componentes: Mantine v7
- Estado: Zustand (useGameStore + usePetStore)
- Canvas: perfect-freehand
- OCR: TensorFlow.js + CNN MNIST (~99%)
- Som: Web Audio API (sintético)

### Estrutura
```
src/
├── assets/sprites/     pet_happy.gif, pet_hungry.gif, pet_sick.gif, pet_eating.gif (CC0)
├── components/
│   ├── canvas/         DrawingCanvas
│   ├── exercises/      AbstractExerciseScreen
│   ├── screens/        PetHub, SessionSummaryScreen, HomeScreen (legado)
│   ├── ui/             PetDisplay, StreakDisplay, TrophyDisplay, OCR overlays, Keypad
│   └── dev/            Testers
├── hooks/              useSound, useOCRModel
├── lib/
│   ├── math/           generateProblem
│   ├── progression/    HesitationTimer, MasteryTracker
│   ├── coinCalculator.ts
│   ├── petActions.ts
│   └── streakUtils.ts
├── stores/             useGameStore, usePetStore
├── types/              progression, problem, mastery
└── utils/ocr/          pipeline completo
```

### Próximo Passo
**Sprint 4.3** — Acessibilidade (ARIA labels, contraste WCAG AA, teclado)

### Sprint 4.2 ✅
- Vitest 2.1.9 instalado (Node 18 compat) — package-lock.json root-owned, instalar em /tmp e copiar
- **136/136 testes passando**: petActions, coinCalculator, streakUtils, petStore, gameStore, progression-engine
- Zustand stores testáveis em Node sem jsdom (persist silently swallows localStorage errors)
- `IS_E2E` flag em App.tsx: `?e2e` pula loading OCR, `mockOCR=true` via `!ocrModel`
- E2E `tests/e2e/main-flow.spec.ts`: PetHub → Lição mockOCR → Resumo → Voltar
- `vitest.config.ts` com `include: ['tests/unit/**']` para excluir e2e

### Sprint 4.1 ✅
- `mastery.ts` → `advanceMicrolevel()` avança para subtração (op: 'subtraction', maxResult: 5, cpaPhase: 'concrete')
- `useGameStore` → `subtractionBannerSeen` (persisted) + `dismissSubtractionBanner()`
- `PetHub` → banner "Agora vamos subtrair!" aparece 1x ao desbloquear subtração

---

**Última atualização**: 2026-02-21 (Sprints 4.1 + 4.2 completos)
