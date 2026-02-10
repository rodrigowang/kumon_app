# Kumon Math App — Plano de Sprints & Fluxo Multi-Agent

## Visão Geral

O roadmap do MVP tem 8 épicos. Organizados em **5 sprints** de complexidade crescente.
Cada sprint entrega algo testável — nunca código "meia-boca" esperando a próxima sprint.

```
Sprint 1 ─── Fundação + "Eu consigo ver o número" (Épicos 0 + 1)
Sprint 2 ─── "O app pensa sozinho" (Épico 2)
Sprint 3 ─── "Meu filho consegue jogar" (Épicos 3 + 4 + 5)
Sprint 4 ─── "Meu filho quer voltar amanhã" (Épicos 6 + 7)
Sprint 5 ─── "Posso entregar para ele sem medo" (Épico 8)
```

---

## Sprint 1: Fundação + Canvas/OCR

**Entrega**: App abre, criança desenha um número, app reconhece (1 e 2 dígitos).

### Micro-tasks para o orquestrador

```bash
# ---- Semana 1: Setup ----

# Task 0.1
cat > .agents/current-task.md << 'EOF'
# Task: Inicializar Projeto (0.1)
Criar projeto React + TypeScript + Vite.
Configurar ESLint, Prettier, tsconfig com strict: true.
Criar estrutura de pastas conforme skill do Dev.
EOF
./scripts/orchestrate.sh setup-projeto

# Task 0.2
cat > .agents/current-task.md << 'EOF'
# Task: Instalar UI Framework (0.2)
Instalar Shadcn/UI (ou Mantine).
Configurar tema: cores vibrantes, fonte Nunito (Google Fonts).
Definir tokens: --font-size-number: 32px, --button-min-size: 48px.
EOF
./scripts/orchestrate.sh ui-framework

# Task 0.3
cat > .agents/current-task.md << 'EOF'
# Task: Setup Zustand (0.3)
Instalar Zustand. Criar stores tipadas vazias:
- useGameStore (exercício atual, fase CPA, nível, sessão)
- useProgressStore (histórico, estrelas, mapa)
- useSettingsStore (volume)
EOF
./scripts/orchestrate.sh zustand-setup

# Task 0.4
cat > .agents/current-task.md << 'EOF'
# Task: Setup Áudio (0.4)
Instalar howler (ou use-sound). Criar hook useSound() com:
playCorrect(), playWrong(), playCelebration(), playClick().
Incluir 4-5 mp3 curtos em src/assets/sounds/.
Deve funcionar com volume 0 (feedback visual basta).
EOF
./scripts/orchestrate.sh audio-setup

# Task 0.5
cat > .agents/current-task.md << 'EOF'
# Task: Configurar PWA (0.5)
Instalar vite-plugin-pwa. Gerar manifest.json.
Configurar service worker para cache offline
(especialmente dos arquivos do modelo MNIST).
EOF
./scripts/orchestrate.sh pwa-setup

# ---- Semana 2: Canvas + OCR ----

# Task 1.1
cat > .agents/current-task.md << 'EOF'
# Task: Componente Canvas de Desenho (1.1)
Instalar react-signature-canvas + perfect-freehand.
Criar <DrawingCanvas /> com: traço ≥8px, cor preta, fundo branco,
botão Limpar (≥48px), prop onDrawingChange, responsivo (≥60% viewport).
Borda visual indicando "escreva aqui".
EOF
./scripts/orchestrate.sh canvas-componente

# Task 1.2
cat > .agents/current-task.md << 'EOF'
# Task: Carregar Modelo MNIST (1.2)
Instalar @tensorflow/tfjs. Criar hook useOCRModel():
carrega modelo MNIST via CDN, cacheia no service worker,
retorna { model, isLoading, error }.
Tela de loading amigável enquanto carrega.
Exercícios bloqueados até modelo pronto.
EOF
./scripts/orchestrate.sh modelo-mnist

# Task 1.3 + 1.4 (juntas — são complementares)
cat > .agents/current-task.md << 'EOF'
# Task: Pipeline OCR completo (1.3 + 1.4)
Criar lib/ocr/preprocess.ts com: extractImageData, findBoundingBox,
centerAndResize (28x28 via tf.image.resizeBilinear), normalize, toModelInput.
Criar lib/ocr/segment.ts com: segmentDigits (clusters horizontais),
tolerante a espaçamento variável.
Usar utilidades nativas do TensorFlow.js.
IMPORTANTE: Ler references/ocr-pipeline.md da skill do Dev.
EOF
./scripts/orchestrate.sh ocr-pipeline

# Task 1.5
cat > .agents/current-task.md << 'EOF'
# Task: Função de Predição (1.5)
Criar lib/ocr/predict.ts: predictNumber(canvas, model) →
{ value: number, confidence: number }.
Pipeline: canvas → segmentar → pré-processar cada dígito → inferir → concatenar.
Limiares: ≥80% aceita, 50-79% confirmação, <50% reescrita.
EOF
./scripts/orchestrate.sh ocr-predicao

# Task 1.6
cat > .agents/current-task.md << 'EOF'
# Task: Layout Tela de Exercício (1.6)
Criar <ExerciseScreen />:
Tablet landscape: exercício esquerda, canvas direita.
Portrait: exercício cima, canvas baixo.
Componentes: display da conta (≥32px), DrawingCanvas, botão Enviar (≥64px, ícone ✓),
botão Limpar (≥48px). Estados do botão: desabilitado/pronto/processando.
EOF
./scripts/orchestrate.sh layout-exercicio

# Task 1.7
cat > .agents/current-task.md << 'EOF'
# Task: Fluxo Confirmação OCR (1.7)
Confiança ≥80%: aceitar direto. 50-79%: overlay "Você escreveu X?" com ✓ e ✗.
<50%: "Não consegui entender, tente de novo!". Fallback: ícone discreto de
teclado numérico após 3+ tentativas falhas de OCR.
EOF
./scripts/orchestrate.sh ocr-confirmacao
```

**Teste manual ao final da Sprint 1**: Abrir app → desenhar "7" → ver reconhecimento. Desenhar "13" → ver 2 dígitos. Confirmação aparecendo quando confiança é média.

---

## Sprint 2: Motor de Progressão

**Entrega**: Lógica de maestria funcionando com testes. Sem UI nova — apenas o cérebro.

```bash
# Task 2.1
cat > .agents/current-task.md << 'EOF'
# Task: Tipos de Progressão (2.1)
Criar types/progression.ts com: CpaPhase, Operation, ProblemResult,
MasteryLevel, MasteryState. Tipar tudo, sem any.
EOF
./scripts/orchestrate.sh tipos-progressao

# Task 2.2
cat > .agents/current-task.md << 'EOF'
# Task: Gerador de Problemas (2.2)
Criar lib/math/generateProblem.ts. Input: MasteryLevel → Output: Problem.
Adição: 4 sub-níveis (até 5, até 10, até 15, até 20).
Subtração: 4 sub-níveis (até 5, até 10, descer do 10, até 20).
Repetição disfarçada: nunca mesmo exercício 2x seguidas.
Usar math.js para validação.
IMPORTANTE: Ler references/curriculo.md da skill EdTech.
EOF
./scripts/orchestrate.sh gerador-problemas

# Task 2.3
cat > .agents/current-task.md << 'EOF'
# Task: Detector de Hesitação (2.3)
Criar lib/progression/hesitation.ts. Timer inicia ao exibir exercício,
para ao enviar. Classificar: fast (<5s), slow (5-15s), hesitant (>10s sem interação).
Parâmetros configuráveis.
IMPORTANTE: Ler references/maestria.md da skill EdTech.
EOF
./scripts/orchestrate.sh detector-hesitacao

# Task 2.4
cat > .agents/current-task.md << 'EOF'
# Task: Algoritmo de Maestria (2.4)
Criar lib/progression/mastery.ts. Buffer circular últimos 10 resultados.
Avanço: 5 acertos rápidos consecutivos. Regressão: 3 erros = micro-nível,
5 erros = fase CPA anterior, 10 erros = nível básico.
Critério CPA: 5 acertos consecutivos para sair da fase.
Subtração bloqueada até maestria em adição.
IMPORTANTE: Ler references/maestria.md e references/cpa.md da skill EdTech.
EOF
./scripts/orchestrate.sh algoritmo-maestria

# Task 2.5
cat > .agents/current-task.md << 'EOF'
# Task: Testes do Motor (2.5)
Vitest. Testar: gerador não repete, 5 acertos → avança, 3 erros → regride,
transição CPA, subtração bloqueada antes de adição, resultados dentro do range.
Mínimo 15 testes cobrindo todos os cenários de references/cenarios-progressao.md.
EOF
./scripts/orchestrate.sh testes-motor
```

**Teste ao final da Sprint 2**: Todos os testes unitários passando. `generateProblem()` gerando exercícios corretos para cada nível. Algoritmo avançando/regredindo conforme esperado.

---

## Sprint 3: As 3 Fases CPA (Jogável)

**Entrega**: Criança consegue jogar todas as fases. Primeira versão para botar na mão do seu filho.

```bash
# ---- Fase Abstrata ----

# Task 3.1
cat > .agents/current-task.md << 'EOF'
# Task: Tela Exercício Abstrato (3.1)
Integrar ExerciseScreen: display "numA operador numB = ___" (≥32px, Nunito Bold),
DrawingCanvas, botão enviar. Fluxo: exibir → desenhar → enviar → OCR → validar → feedback.
EOF
./scripts/orchestrate.sh tela-abstrato

# Task 3.2
cat > .agents/current-task.md << 'EOF'
# Task: Feedback Visual e Sonoro (3.2)
Instalar react-confetti + framer-motion. Criar <FeedbackOverlay />:
Acerto: confete (2s) + som. Acerto após erros: confete intenso + som especial.
5 acertos: celebração grande. 10 acertos: mega celebração.
Erro 1-2: shake suave + "Tente de novo!". Erro 3: "Você está aprendendo!" + dica pictórica.
Erro 5+: "Vamos ver de um jeito diferente!" + regredir CPA.
Pausa 300-500ms entre exercícios. Animações <500ms.
IMPORTANTE: Ler references/cenarios-emocional.md da skill QA.
EOF
./scripts/orchestrate.sh feedback-overlay

# Task 3.3 + 3.4 (integração)
cat > .agents/current-task.md << 'EOF'
# Task: Integrar Motor + Dicas (3.3 + 3.4)
Conectar useGameStore com mastery.ts. Cada resultado alimenta o algoritmo.
Avanço/regressão automáticos. Hesitação >10s mostra bolinhas ao lado da conta (fade in).
Transição de nível com animação.
EOF
./scripts/orchestrate.sh integracao-motor

# ---- Fase Pictórica ----

# Task 4.1 + 4.2
cat > .agents/current-task.md << 'EOF'
# Task: Representação Pictórica (4.1 + 4.2)
Criar <PictorialDisplay />: bolinhas coloridas agrupadas (●) com operador visível.
Animação de entrada (uma a uma, ~100ms). Grupos com cores diferentes.
Para >9: barra (▬) = 10, bolinha = 1. Ex: 13 = ▬ ●●●.
Input continua sendo canvas de escrita (criança escreve o número).
IMPORTANTE: Ler references/cpa.md da skill EdTech.
EOF
./scripts/orchestrate.sh fase-pictorica

# Task 4.4
cat > .agents/current-task.md << 'EOF'
# Task: Transições CPA Pictórico↔Abstrato (4.4)
Avançar: bolinhas se transformam em números (animação).
Regredir: números "explodem" em bolinhas (animação).
Primeiros exercícios da nova fase são fáceis (nível 1).
EOF
./scripts/orchestrate.sh transicao-pictorico

# ---- Fase Concreta ----

# Task 5.1 + 5.2
cat > .agents/current-task.md << 'EOF'
# Task: Objetos Arrastáveis + Área de Agrupamento (5.1 + 5.2)
Instalar @dnd-kit/core. Criar <DraggableObject /> (≥56px, sombra ao arrastar).
Adição: 2 grupos + cesta. Subtração: grupo cheio + área de remover.
Contador visual em tempo real. Nenhum número — apenas objetos.
Objetos temáticos variáveis (maçãs, estrelas, bolinhas).
EOF
./scripts/orchestrate.sh fase-concreta

# Task 5.3 + 5.4
cat > .agents/current-task.md << 'EOF'
# Task: Validação Concreta + Dezenas (5.3 + 5.4)
Validação por contagem de objetos (sem OCR). Botão "Pronto!" (✓).
Para >9: agrupar 10 objetos em "caixa" visual. Criança manipula caixas + unidades.
Feedback: correto = objetos dançam. Incorreto = voltam às posições.
EOF
./scripts/orchestrate.sh validacao-concreta

# Task 5.5
cat > .agents/current-task.md << 'EOF'
# Task: Transições Concreto↔Pictórico (5.5)
Avançar: objetos se simplificam em bolinhas (animação 500-800ms).
Regredir: bolinhas se transformam em objetos coloridos.
EOF
./scripts/orchestrate.sh transicao-concreto

# ---- Testes E2E ----

# Task 3.5
cat > .agents/current-task.md << 'EOF'
# Task: Testes E2E das 3 Fases (3.5)
Playwright: fluxo completo por fase. Canvas vazio → feedback.
Toque rápido repetido → 1 processamento. Feedback sem palavras negativas.
Transições CPA funcionando. Drag-and-drop funcional.
EOF
./scripts/orchestrate.sh testes-e2e-fases
```

**Teste ao final da Sprint 3**: Seu filho consegue jogar. Começa arrastando maçãs, progride para bolinhas, depois escreve números. Motor funciona. Feedback funciona. **Esta é a sprint mais importante.**

---

## Sprint 4: Engajamento + Persistência

**Entrega**: A criança quer voltar no dia seguinte. Progresso não se perde.

```bash
# Task 6.1 + 6.2
cat > .agents/current-task.md << 'EOF'
# Task: Tela Inicial + Mapa de Jornada (6.1 + 6.2)
Criar <HomeScreen /> com mapa de trilha: pontos = micro-níveis dominados.
Conquistados: coloridos com ícone. Futuros: cinza. Caminho animado.
Botão "Jogar" gigante (≥80px, pulsa). Estrelas acumuladas visíveis.
Zero texto para navegar. Sem barra de porcentagem, sem ranking.
EOF
./scripts/orchestrate.sh tela-inicial

# Task 6.3
cat > .agents/current-task.md << 'EOF'
# Task: Recompensas por Maestria (6.3)
Micro-nível: desbloqueia ponto no mapa + som + item colecionável variado.
Nível completo: celebração tela inteira + nova região no mapa.
Progresso nunca regride visualmente.
EOF
./scripts/orchestrate.sh recompensas

# Task 6.4
cat > .agents/current-task.md << 'EOF'
# Task: Sessão e Revisão (6.4)
Ao abrir após dias: mostrar mapa. Primeira sessão: 2-3 exercícios de revisão
do último nível dominado, depois retoma.
EOF
./scripts/orchestrate.sh sessao-revisao

# Task 7.1 + 7.2 + 7.3
cat > .agents/current-task.md << 'EOF'
# Task: Persistência Local Completa (7.1-7.3)
Instalar dexie (IndexedDB). Criar lib/storage/persistence.ts.
saveProgress após cada exercício. Salvar ao sair (beforeunload/visibilitychange).
Ao reabrir: carregar e retomar. Schema versionado.
Dados corrompidos: iniciar do zero com mensagem amigável (sem erro técnico).
resetProgress() oculto para pais.
EOF
./scripts/orchestrate.sh persistencia
```

**Teste ao final da Sprint 4**: Criança joga, fecha o tablet, abre 3 dias depois — mapa está lá, progresso intacto. Ela vê suas conquistas e quer jogar mais.

---

## Sprint 5: QA Final

**Entrega**: App à prova de criança de 7 anos.

```bash
# Tasks 8.1-8.5 (rodar apenas agente QA, sem Dev nem EdTech)
# Aqui o fluxo muda: QA gera relatório → você decide o que corrigir → Dev corrige

# QA completo
cat > .agents/current-task.md << 'EOF'
# Task: QA Completo (8.1-8.5)
Rodar TODOS os cenários de teste das 5 referências:
- references/cenarios-canvas.md
- references/cenarios-interacao.md
- references/cenarios-progressao.md
- references/cenarios-emocional.md
- references/cenarios-dispositivo.md
Produzir relatório consolidado com todos os bugs encontrados.
Priorizar por severidade: Crítica > Alta > Média.
EOF

# Rodar apenas QA (sem pipeline completo)
cat scripts/prompt-qa.md | claude --print \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "QA completo. Leia todos os cenários de referência."

# Depois: corrigir bugs com o Dev
cat > .agents/current-task.md << 'EOF'
# Task: Corrigir bugs do QA
Leia .agents/qa/qa-completo.md e corrija todos os bugs de severidade Crítica e Alta.
EOF

cat scripts/prompt-dev.md | claude --print \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "Corrigir bugs listados no relatório QA."
```

**Task 8.6 — Teste com criança real**: Isso é você + seu filho. 20 minutos. Observe, anote, ajuste.

---

## Onde Colocar Este Documento

```
kumon-app/
├── CLAUDE.md
├── docs/
│   ├── epicos-microtasks-mvp.md     ← Roadmap completo (o doc anterior)
│   └── plano-sprints.md             ← ESTE documento
├── .agents/
│   └── current-task.md              ← Atualizado a cada micro-task
├── .claude/skills/
│   └── (as 3 skills)
├── scripts/
│   └── orchestrate.sh
└── src/
```

## Fluxo Diário de Trabalho

```
1. Abra o plano de sprints (este doc)
2. Identifique a próxima micro-task
3. Copie o bloco correspondente para o terminal
4. Observe o orquestrador rodar (EdTech → Dev → QA)
5. Revise os outputs em .agents/
6. Se satisfeito → próxima task
7. Se não → ajuste a task e re-rode
```

## Estimativa de Tempo

| Sprint | Épicos | Estimativa | O que entrega |
|--------|--------|-----------|---------------|
| Sprint 1 | 0 + 1 | 2-3 dias | Canvas + OCR funcionando |
| Sprint 2 | 2 | 1-2 dias | Motor de progressão testado |
| Sprint 3 | 3 + 4 + 5 | 3-5 dias | App jogável (3 fases CPA) |
| Sprint 4 | 6 + 7 | 2-3 dias | Mapa + persistência |
| Sprint 5 | 8 | 1-2 dias | QA + teste real |
| **Total** | | **~10-15 dias** | **MVP completo** |

As estimativas assumem uso do Claude Code com multi-agent. Ajuste conforme
sua disponibilidade — o importante é respeitar a ordem das sprints e não
pular para a seguinte sem a anterior estar testável.
