# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: App funcional onde a criança faz exercícios e, conforme acerta, a dificuldade aumenta automaticamente.

**Estado atual (2026-02-19)**: ✅ **Sprint 1 COMPLETA**. App funcional com HomeScreen, sessões de 10 exercícios, tela de resumo, estrelas por sessão, progressão automática de nível, OCR real, e persistência localStorage. Criança pode usar o app de verdade.

---

## Sprint 1 — Loop Principal Funcional

> Criança abre o app → começa a fazer contas → acerta → dificuldade sobe → erra → dificuldade desce. Sessão persistida.

### ✅ 1.1 — Integrar MasteryTracker no fluxo real do app

MasteryTracker migrado para `useGameStore`. Action `submitExercise(result)` atualiza nível automaticamente. AbstractExerciseScreen lê `currentLevel` da store.

---

### ✅ 1.2 — Tela inicial simples (Home → Jogar)

HomeScreen criada com botão "Jogar" (80px), badge de nível, contador de estrelas. Link discreto "dev" para dashboard.

---

### ✅ 1.3 — Persistência local (localStorage)

Zustand persist middleware adicionado. Estado salvo: currentLevel, sessionStats, totalStars, lastSessionSummary. MasteryTracker reconstruído na hidratação. Botão "resetar progresso" na HomeScreen.

---

### ✅ 1.4 — Sessão com começo e fim

Sessões de 10 exercícios implementadas. Indicador visual (bolinhas + "3 de 10"). Tela de resumo (SessionSummaryScreen) com acertos, tempo, barra visual, estrelas ganhas (+1/+2/+3). Botões "Jogar de novo" e "Voltar". Estrelas agora são dadas por sessão completa, não por acerto individual.

---

## Sprint 2 — Progressão Visível e Motivação

> A criança enxerga que está evoluindo. Motivação via feedback visual.

### 2.1 — Indicador de nível na tela de exercício

**Tarefas**:
- Mostrar badge discreto: "Somas até 10" (ou "Subtrações até 5")
- Quando nível muda mid-session: animação + mensagem "Novo desafio!"
- Se regredir: mensagem gentil "Vamos praticar mais um pouco"

---

### 2.2 — Tela de progresso (Dashboard criança)

**Tarefas**:
- Grid visual de níveis (tipo mapa de fases de jogo)
- Níveis desbloqueados: coloridos. Bloqueados: cinza com cadeado
- Nível atual: brilhando/pulsando
- Estrelas acumuladas por nível
- Acessível via botão na HomeScreen

---

### 2.3 — Animações de transição entre exercícios

**Tarefas**:
- Fade out do exercício atual → fade in do próximo (300ms)
- Quando muda nível: transição mais elaborada (slide + flash)
- Entre sessões: efeito de "virar página"

---

## Sprint 3 — Robustez e Edge Cases

> App funciona bem em cenários reais (tablet, offline, criança impaciente).

### 3.1 — Fallback teclado numérico inteligente

**O que falta**: O `NumericKeypadOverlay` existe mas não está integrado no fluxo.

**Tarefas**:
- Após 2 retries OCR consecutivos na mesma conta: mostrar botão de teclado
- Teclado numérico como alternativa (não substitui canvas permanentemente)
- Resposta via teclado segue mesmo fluxo de validação e feedback

---

### 3.2 — PWA e Offline

**Tarefas**:
- Ativar vite-plugin-pwa (já configurado)
- Cachear modelo MNIST no Service Worker
- Manifest com ícones para instalação em tablet
- Testar funcionalidade offline completa

---

### 3.3 — Tratamento de erros graceful

**Tarefas**:
- OCR falha silenciosamente (sem crash)
- Modelo não carrega: app funciona com teclado numérico
- Canvas vazio ao submeter: mensagem amigável
- Timeout de OCR (>5s): fallback para teclado

---

## Sprint 4 — Polimento

### 4.1 — Subtração integrada no fluxo
- Hoje o gerador suporta subtração mas o fluxo padrão começa com adição
- Após dominar adição até 20: desbloquear subtração
- Transição visual: "Agora vamos subtrair!"

### 4.2 — Testes automatizados
- Vitest nos stores (submissão, progressão, persistência)
- Playwright E2E: fluxo completo HomeScreen → Jogar → 10 exercícios → Resumo → Home
- Testes do motor de progressão (já existem 17 manuais, migrar para Vitest)

### 4.3 — Acessibilidade
- ARIA labels nos botões e canvas
- Contraste WCAG AA validado
- Navegação por teclado (para tablets com teclado)

---

## Ordem de Implementação Recomendada

```
Sprint 1 (funcionalidade core):              ✅ COMPLETA
  1.1 MasteryTracker na store                ✅
  1.2 HomeScreen simples                     ✅
  1.3 Persistência localStorage              ✅
  1.4 Sessão com começo e fim                ✅

Sprint 2 (motivação visual):                 ← PRÓXIMO
  2.1 Badge de nível na tela exercício       🔲
  2.2 Dashboard de progresso (mapa fases)    🔲
  2.3 Animações de transição                 🔲

Sprint 3 (robustez):
  3.1 Fallback teclado inteligente           🔲
  3.2 PWA/Offline                            🔲
  3.3 Tratamento de erros graceful           🔲

Sprint 4 (polimento):
  4.1 Subtração no fluxo                     🔲
  4.2 Testes automatizados                   🔲
  4.3 Acessibilidade                         🔲
```

---

## Princípio Guia

> A cada etapa o app deve estar **usável**. Depois da Sprint 1, uma criança já pode usar o app de verdade e ter a experiência de "quanto mais acerto, mais difícil fica". As sprints seguintes adicionam camadas de polimento sem quebrar o que funciona.

---

**Última atualização**: 2026-02-19
