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
- **Erros TS pre-existentes**: OCRFeedbackTester, ExerciseScreen, predict.ts — não tocar
- **Mantine Overlay bug**: `<Overlay>` bloqueia cliques — usar CSS plain `backgroundColor + backdropFilter`

## Estado Atual (2026-02-19)
**Sprint 1 COMPLETA** — Loop principal funcional

### ✅ O que funciona
1. **Home Screen** (HomeScreen.tsx)
   - Botão "Jogar" grande (80px)
   - Badge de nível atual ("Somas até 5")
   - Contador de estrelas acumuladas
   - Link discreto "dev" para dashboard
   - Link "resetar progresso" com confirmação

2. **Sessões de 10 exercícios**
   - Indicador visual de progresso (bolinhas + "3 de 10")
   - Detecção automática de fim de sessão
   - Tela de resumo (SessionSummaryScreen) com:
     - Título motivacional (Perfeito/Muito bem/Bom trabalho)
     - Estrelas ganhas (+1/+2/+3 baseado em accuracy)
     - Acertos, tempo, barra de % visual
     - Botões "Jogar de novo" e "Voltar"

3. **Motor de progressão integrado**
   - MasteryTracker vive no useGameStore (Zustand)
   - Nível muda automaticamente (5 fast→sobe, 3 erros→desce)
   - AbstractExerciseScreen lê `currentLevel` da store
   - `submitExercise(result)` atualiza progressão

4. **OCR real funcionando**
   - Pipeline: canvas → segmentDigits → predictNumber
   - 3 status: accepted (≥80%), confirmation (50-79%), retry (<50%)
   - Overlays clicáveis (fix Mantine Overlay)
   - Fallback mockOCR quando modelo indisponível

5. **FeedbackOverlay rico**
   - 7 tipos: correct, correct-after-errors, streak-5, streak-10, error-gentle, error-learning, error-regress
   - Confetti CSS, animações, sons

6. **Persistência localStorage**
   - Estado salvo: currentLevel, sessionStats, totalStars, lastSessionSummary
   - MasteryTracker reconstruído na hidratação
   - Progresso sobrevive ao recarregar página

7. **Estrelas**
   - Premiação por sessão completa (não mais por acerto individual)
   - +1 ★ = completou 10 exercícios
   - +2 ★ = ≥80% acerto
   - +3 ★ = 100% acerto

### Stack
- UI: React 18 + TypeScript 5 + Vite
- Componentes: Mantine v7 (customizado para crianças)
- Estado: Zustand (useGameStore principal)
- Canvas: perfect-freehand
- OCR: TensorFlow.js + CNN MNIST (~99%)
- Som: Web Audio API (sintético)

### Estrutura
```
src/
├── components/
│   ├── canvas/        DrawingCanvas
│   ├── exercises/     AbstractExerciseScreen
│   ├── screens/       HomeScreen, SessionSummaryScreen
│   ├── ui/            FeedbackOverlay, OCR overlays, Keypad
│   └── dev/           Testers (dev dashboard)
├── hooks/             useSound, useOCRModel
├── lib/
│   ├── math/          generateProblem
│   └── progression/   HesitationTimer, MasteryTracker
├── stores/            useGameStore (principal)
├── types/             progression, problem, mastery
└── utils/ocr/         pipeline completo
```

### Próximo Passo
**Sprint 2.1** — Badge de nível na tela de exercício
- Mostrar "Somas até 10" discreto durante exercício
- Animação quando nível muda ("Novo desafio!")
- Mensagem gentil se regredir

---

**Última atualização**: 2026-02-19 (Sprint 1.4 concluída)
