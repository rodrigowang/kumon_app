# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: App funcional onde a criança faz exercícios e, conforme acerta, a dificuldade aumenta automaticamente.

**Estado atual**: Temos motor de progressão completo (gerador, hesitação, maestria), OCR real integrado, e FeedbackOverlay rico. Mas tudo vive no `AbstractExerciseTester` (modo dev). Falta conectar as peças numa experiência real de uso.

---

## Sprint 1 — Loop Principal Funcional

> Criança abre o app → começa a fazer contas → acerta → dificuldade sobe → erra → dificuldade desce. Sessão persistida.

### 1.1 — Integrar MasteryTracker no fluxo real do app

**O que falta**: Hoje o `MasteryTracker` vive dentro do `AbstractExerciseTester` (componente dev). Precisa migrar para o `useGameStore` (Zustand) para ser o estado real do app.

**Tarefas**:
- Adicionar `currentLevel: MasteryLevel` e `masteryTracker` ao `useGameStore`
- Criar action `submitExercise(result)` que chama `tracker.addResult()` + `tracker.analyze()` e atualiza `currentLevel`
- O AbstractExerciseScreen lê `currentLevel` da store e chama `submitExercise` como callback
- Remover lógica duplicada do AbstractExerciseTester (que hoje faz tracking local)

**Critério de aceite**: Nível muda automaticamente ao acertar 5 seguidas. Visível no debug panel.

---

### 1.2 — Tela inicial simples (Home → Jogar)

**O que falta**: Hoje a home é um dashboard dev com testers. Criança precisa de um botão grande "Jogar" e só.

**Tarefas**:
- Criar `HomeScreen.tsx` minimalista: logo/título + botão "Jogar" (≥80px, cor vibrante)
- Mostrar nível atual visualmente (ex: "Somas até 5" com badge)
- Mostrar estrelas/progresso acumulado (simples, tipo "12 ★")
- Botão "Jogar" navega para tela de exercício
- Manter rota para dashboard dev (botão discreto ou query param `?dev=true`)

**Critério de aceite**: Criança toca "Jogar", faz exercícios, volta para home e vê progresso atualizado.

---

### 1.3 — Persistência local (localStorage)

**O que falta**: Ao recarregar a página, tudo reseta. Nível, progresso e histórico precisam sobreviver entre sessões.

**Tarefas**:
- Usar `zustand/middleware` persist no `useGameStore` (ou store dedicada)
- Persistir: `currentLevel`, `history[]` (últimos resultados), `totalStars`, `sessionCount`
- Ao abrir o app, carregar estado salvo e reconstruir MasteryTracker com nível salvo
- Botão "Resetar Progresso" (acessível só para pais — escondido, ex: long press no título)

**Critério de aceite**: Fechar e reabrir o app mantém o nível e progresso.

---

### 1.4 — Sessão com começo e fim

**O que falta**: Hoje os exercícios são infinitos. Kumon real tem sessões de ~20 exercícios.

**Tarefas**:
- Definir sessão: 10 exercícios por sessão (configurável)
- Mostrar progresso da sessão: "Exercício 3 de 10" (barra ou bolinhas)
- Ao completar sessão: tela de resumo (acertos, tempo, decisão de progressão)
- Na tela de resumo: "Muito bem! ★" + botão "Jogar de novo" ou "Voltar"
- Premiação: +1 estrela por sessão completada, +2 se ≥80% acerto, +3 se 100%

**Critério de aceite**: Criança faz 10 exercícios, vê resumo com estrelas, volta para home.

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
Sprint 1 (funcionalidade core):
  1.1 MasteryTracker na store     ← PRÓXIMO
  1.2 HomeScreen simples
  1.3 Persistência localStorage
  1.4 Sessão com começo e fim

Sprint 2 (motivação visual):
  2.1 Badge de nível
  2.2 Dashboard de progresso
  2.3 Animações de transição

Sprint 3 (robustez):
  3.1 Fallback teclado
  3.2 PWA/Offline
  3.3 Tratamento de erros

Sprint 4 (polimento):
  4.1 Subtração no fluxo
  4.2 Testes automatizados
  4.3 Acessibilidade
```

---

## Princípio Guia

> A cada etapa o app deve estar **usável**. Depois da Sprint 1, uma criança já pode usar o app de verdade e ter a experiência de "quanto mais acerto, mais difícil fica". As sprints seguintes adicionam camadas de polimento sem quebrar o que funciona.

---

**Última atualização**: 2026-02-19
