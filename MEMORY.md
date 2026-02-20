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

## Estado Atual (2026-02-20)
**Sprint 1 COMPLETA** — Loop principal funcional
**Sprint 2 COMPLETA** — Motivação visual
  - 2.1: Badge de nível + notificação de mudança
  - 2.2: Dashboard de progresso (mapa de fases)
  - 2.3: Animações de transição
**Sprint 3 COMPLETA** — Robustez
  - 3.1: Fallback teclado numérico inteligente
  - 3.2: PWA e Offline
  - 3.3: Erros graceful + UX simplificado (sem overlay, correção inline)

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

8. **Badge de nível e notificações** (Sprint 2.1)
   - Badge discreto sempre visível ("Somas até 10")
   - Notificação animada quando nível muda mid-session
   - Mensagem motivacional: "Novo desafio!" (aumento) ou "Vamos praticar mais um pouco" (regressão)
   - Animação pulse com auto-close 3s

9. **Dashboard de progresso** (Sprint 2.2)
   - Mapa visual de níveis estilo jogo
   - Grid com 4 níveis de adição (até 5/10/15/20)
   - Desbloqueado (verde claro), Bloqueado (cinza + cadeado), Atual (verde vibrante + pulse + troféu)
   - Acessível via botão "🗺️ Ver Progresso" na HomeScreen
   - Mostra total de estrelas no header

10. **Animações de transição** (Sprint 2.3)
    - Fade out/in (300ms) entre exercícios normais
    - Slide + flash (600ms) quando nível muda
    - Efeito "virar página" (800ms) ao final da sessão
    - SessionSummaryScreen com flip in 3D
    - Todas animações CSS puras, GPU-accelerated

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

11. **Fallback teclado numérico** (Sprint 3.1)
    - Após 2 retries OCR consecutivos: botão "⌨️ Usar teclado" aparece
    - Teclado multi-dígito (respostas até 99)
    - Resposta via teclado segue mesmo fluxo de validação e feedback
    - Retry count reseta por exercício

12. **PWA e Offline** (Sprint 3.2)
    - Manifest completo (standalone, portrait, pt-BR, ícones PNG+SVG)
    - Service Worker precacheia modelo MNIST (~4.6MB) + app shell
    - Google Fonts cacheadas em runtime (CacheFirst, 1 ano)
    - `maximumFileSizeToCacheInBytes: 5MB` para aceitar o modelo
    - Build: `npx vite build` (não `npm run build` — erros TS pré-existentes)
    - App instalável e funcional 100% offline

13. **UX simplificado e erros graceful** (Sprint 3.3)
    - Acerto: só toca som + avança automaticamente (sem overlay)
    - Erro: correção inline — resposta correta (verde) + resposta do aluno (vermelho)
    - Botão "Continuar" para avançar após ver o erro
    - Modelo OCR indisponível → abre teclado numérico (sem prompt)
    - OCR timeout >5s → fallback para teclado
    - Erros OCR → fallback para teclado
    - Borda do painel muda de azul para vermelho durante correção

### Próximo Passo
**Sprint 4.1** — Subtração integrada no fluxo
- Após dominar adição até 20: desbloquear subtração
- Transição visual: "Agora vamos subtrair!"

---

**Última atualização**: 2026-02-20 (Sprint 3.3 concluída — Sprint 3 completa)
