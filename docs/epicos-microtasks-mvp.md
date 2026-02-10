# Kumon Math App — Épicos & Micro-Tasks (MVP)

## Meta do MVP

Uma criança de 7 anos pega o tablet do pai, abre o app, e consegue:
- Resolver exercícios de adição e subtração (resultados até 20)
- Escrever respostas à mão (incluindo números de 2 dígitos)
- Progredir pelas 3 fases CPA (objetos → bolinhas → números)
- Avançar/regredir automaticamente pelo algoritmo de maestria
- Ver seu progresso como uma jornada visual
- Ter tudo salvo localmente (sobrevive a fechar o app)

Sem autenticação. Sem backend. Sem internet após primeiro carregamento.

---

## Épico 0: Setup & Infraestrutura

Ambiente pronto, ferramentas instaladas, zero código de negócio.

### 0.1 — Inicializar Projeto
- `npm create vite@latest kumon-app -- --template react-ts`
- Configurar `tsconfig.json` com `strict: true`
- Configurar ESLint + Prettier
- Criar estrutura de pastas conforme skill do Dev:
  ```
  src/
  ├── components/ui/
  ├── components/canvas/
  ├── components/feedback/
  ├── components/exercises/
  ├── hooks/
  ├── lib/ocr/
  ├── lib/math/
  ├── lib/progression/
  ├── stores/
  ├── types/
  └── assets/sounds/
  ```

### 0.2 — Instalar UI Framework
- `npm install` Shadcn/UI (ou Mantine)
- Configurar tema base: cores vibrantes, fonte Nunito ou Quicksand (Google Fonts)
- Definir tokens de design: `--font-size-number: 32px`, `--button-min-size: 48px`

### 0.3 — Setup do Estado Global (Zustand)
- `npm install zustand`
- Criar stores vazias com tipagem:
  - `useGameStore` — exercício atual, fase CPA, nível, sessão
  - `useProgressStore` — histórico, estrelas, mapa de jornada
  - `useSettingsStore` — volume, preferências

### 0.4 — Setup de Áudio
- `npm install howler` (ou `use-sound`)
- Criar hook `useSound()` com métodos: `playCorrect()`, `playWrong()`, `playCelebration()`, `playClick()`
- Incluir 4-5 arquivos `.mp3` curtos em `src/assets/sounds/`
- Respeitar volume do dispositivo. Funcionar em silêncio (feedback visual basta)

### 0.5 — Configurar PWA
- `npm install vite-plugin-pwa`
- Gerar `manifest.json` (ícone, nome "Kumon Math", cor de fundo)
- Configurar service worker para cache do modelo MNIST (funcionar offline após primeiro load)

**Critério de conclusão**: `npm run dev` abre app vazio com fonte correta, tema aplicado, som tocando no clique de um botão de teste, e instalável como PWA.

---

## Épico 1: Canvas + OCR + Layout Básico

O coração do app. Canvas, reconhecimento de escrita, e a tela onde tudo acontece — juntos desde o início para testar integrado.

### 1.1 — Componente Canvas de Desenho
- `npm install react-signature-canvas perfect-freehand`
- Criar `<DrawingCanvas />` com:
  - Espessura de traço generosa (≥8px) renderizada com `perfect-freehand`
  - Cor preta, fundo branco (alto contraste para OCR)
  - Botão "Limpar" (ícone de borracha, ≥48px)
  - Prop `onDrawingChange` que detecta se há traço no canvas
  - Responsivo: ocupa ≥60% da viewport em celular, metade da tela em tablet landscape
- Canvas deve ter borda visual clara indicando "escreva aqui"

### 1.2 — Carregar Modelo MNIST
- `npm install @tensorflow/tfjs`
- Criar hook `useOCRModel()`:
  - Carrega modelo MNIST pré-treinado (layers model) via CDN no mount do app
  - Cacheia no service worker (PWA) para funcionar offline
  - Retorna `{ model, isLoading, error }`
  - Enquanto carrega: tela de loading amigável (animação, não spinner)
  - Exercícios bloqueados até modelo estar pronto

### 1.3 — Pipeline de Pré-processamento
- Criar `lib/ocr/preprocess.ts`:
  - `extractImageData(canvas)` — captura conteúdo como ImageData
  - `findBoundingBox(imageData)` — encontra limites do traço
  - `centerAndResize(imageData)` — centraliza e escala para 28×28px via `tf.image.resizeBilinear`
  - `normalize(tensor)` — grayscale, inverter (fundo preto, traço branco), normalizar [0,1]
  - `toModelInput(tensor)` — reshape para `[1, 28, 28, 1]`
- Usar utilidades nativas do TensorFlow.js, não manipulação manual de pixels

### 1.4 — Segmentação de Múltiplos Dígitos
- Criar `lib/ocr/segment.ts`:
  - `segmentDigits(imageData)` — detecta clusters de pixels separados horizontalmente
  - Retorna array de ImageData, um por dígito, na ordem esquerda → direita
  - Tolerante a espaçamento variável (criança pode deixar espaço grande entre dígitos)
  - Se detectar apenas 1 cluster, trata como dígito único

### 1.5 — Função de Predição Completa
- Criar `lib/ocr/predict.ts`:
  - `predictNumber(canvas, model)` → `{ value: number, confidence: number }`
  - Pipeline: canvas → segmentar → pré-processar cada dígito → inferir → concatenar
  - Retornar confiança (menor confiança entre os dígitos)
  - Limiares: ≥80% aceita, 50-79% pede confirmação, <50% pede reescrita

### 1.6 — Layout da Tela de Exercício
- Criar `<ExerciseScreen />`:
  - **Tablet landscape**: exercício à esquerda, canvas à direita
  - **Portrait/celular**: exercício em cima, canvas embaixo
  - Componentes:
    - Display da conta (fonte ≥32px, Nunito Bold)
    - `<DrawingCanvas />`
    - Botão "Enviar" (≥64px, ícone ✓)
    - Botão "Limpar" (≥48px, ícone borracha)
  - Estados do botão Enviar:
    - Desabilitado (cinza) se canvas vazio
    - Pronto (verde, pulsa suavemente) se há traço
    - Processando (loading animado) durante OCR
  - Botão Enviar dispara: segmentar → prever → validar

### 1.7 — Fluxo de Confirmação do OCR
- Se confiança 50-79%: mostrar overlay "Você escreveu [X]?" com botões ✓ (sim) e ✗ (não)
- Se confiança <50%: mostrar overlay gentil "Não consegui entender, tente de novo!" com botão para limpar canvas
- Se confiança ≥80%: aceitar direto, ir para validação da resposta
- Fallback: ícone discreto de teclado numérico (não proeminente) para digitar se OCR falhar repetidamente (3+ tentativas)

**Critério de conclusão**: Desenhar "7" na tela e ver o app reconhecer. Desenhar "13" e ver reconhecer os 2 dígitos. Overlay de confirmação funcionando.

---

## Épico 2: Motor de Progressão (Algoritmo de Maestria)

O cérebro do app. Decide quando avançar, quando regredir, quando dar dica. Sem UI ainda — apenas lógica pura com testes.

### 2.1 — Tipos e Estruturas de Dados
- Criar `types/progression.ts`:
  ```typescript
  type CpaPhase = 'concrete' | 'pictorial' | 'abstract'
  type Operation = 'addition' | 'subtraction'
  type ProblemResult = { correct: boolean; timeMs: number; attempts: number }
  type MasteryLevel = { operation: Operation; maxResult: number; cpaPhase: CpaPhase }
  ```

### 2.2 — Gerador de Problemas
- Criar `lib/math/generateProblem.ts`:
  - Input: `MasteryLevel` → Output: `Problem`
  - Progressão Small Steps para adição:
    - Nível 1: resultados até 5 (1+1, 1+2, 2+2, 2+3...)
    - Nível 2: resultados até 10 (4+3, 5+5, 6+4...)
    - Nível 3: resultados até 15, incluindo "passa 10" (8+5, 7+6...)
    - Nível 4: resultados até 20 (9+8, 7+9, 12+5...)
  - Progressão Small Steps para subtração:
    - Nível 1: resultados até 5, sem "descer do 10" (5-2, 4-1...)
    - Nível 2: resultados até 10 (10-3, 8-5...)
    - Nível 3: "descer do 10" (13-5, 15-8...)
    - Nível 4: resultados até 20 (20-7, 18-9...)
  - **Repetição disfarçada**: nunca gerar o mesmo exercício 2x seguidas. Mesmo conceito, números diferentes
  - Usar `math.js` para validação dos cálculos

### 2.3 — Detector de Hesitação
- Criar `lib/progression/hesitation.ts`:
  - Iniciar timer quando exercício é exibido
  - Parar timer quando criança aperta "Enviar"
  - Classificar:
    - `fast` — acerto em <5 segundos
    - `slow` — acerto em 5-15 segundos
    - `hesitant` — sem interação com canvas por >10 segundos (disparar dica)
  - Parâmetros configuráveis (futura adaptação por criança)

### 2.4 — Algoritmo de Maestria
- Criar `lib/progression/mastery.ts`:
  - Manter buffer circular dos últimos 10 resultados
  - Regras de avanço:
    - 5 acertos rápidos (`fast`) consecutivos → avançar micro-nível
    - 5 acertos lentos (`slow`) consecutivos → manter nível, variar exercícios
  - Regras de regressão:
    - 3 erros consecutivos → regredir micro-nível + feedback especial
    - 5 erros consecutivos → regredir para fase CPA anterior (abstrato → pictórico → concreto)
    - 10 erros consecutivos → regredir ao nível mais básico da operação atual
  - Regra CPA:
    - Dentro de cada micro-nível, a criança passa por Concreto → Pictórico → Abstrato
    - Critério de saída de cada fase: 5 acertos consecutivos
    - Regressão de fase: 3 erros consecutivos em qualquer fase = volta 1 fase
  - **Nunca avançar de operação** (adição → subtração) sem maestria completa no nível anterior

### 2.5 — Testes Unitários do Motor
- Usar Vitest
- Testar:
  - Gerador nunca repete exercício idêntico consecutivo
  - 5 acertos rápidos → avança
  - 3 erros → regride
  - Transição CPA correta
  - Subtração nunca aparece antes de maestria em adição
  - Resultados sempre dentro do range do nível

**Critério de conclusão**: Todos os testes passando. `generateProblem()` e `mastery.advance()` funcionando em isolamento.

---

## Épico 3: Fase Abstrata Completa

Primeira fase jogável. Números + canvas + feedback + motor de progressão integrados.

### 3.1 — Tela de Exercício Abstrato
- Integrar no `<ExerciseScreen />`:
  - Display: `[numA] [operador] [numB] = ___`
  - Fonte ≥32px, operador e "=" com cor diferente para destaque
  - Canvas para escrever a resposta
  - Botão enviar com estados (1.6)
  - Fluxo: exibir → criança desenha → enviar → OCR → validar → feedback → próximo

### 3.2 — Validação e Feedback
- Criar `<FeedbackOverlay />`:
  - `npm install react-confetti framer-motion`
  - **Acerto normal**: confete leve (2s) + som de celebração + estrela aparece
  - **Acerto após erros**: confete intenso + som especial + "Muito bem, você conseguiu!"
  - **Sequência de 5 acertos**: celebração grande + desbloqueio visual
  - **Sequência de 10 acertos**: mega celebração
  - **Erro 1-2**: shake suave no display + som gentil + "Tente de novo!" (ícone encorajador)
  - **Erro 3**: "Você está aprendendo!" + dica visual (mostrar representação pictórica como apoio)
  - **Erro 5+**: "Vamos ver de um jeito diferente!" + regredir fase CPA automaticamente
- Pausa de 300-500ms entre exercícios (criança respira)
- Animações <500ms para manter ritmo

### 3.3 — Dica Visual por Hesitação
- Se nenhuma interação com canvas por >10 segundos:
  - Mostrar representação pictórica sutil ao lado da conta (bolinhas representando numA e numB)
  - Animação suave de entrada (fade in), não intrusiva
  - Desaparece quando criança começa a desenhar

### 3.4 — Integração com Motor de Progressão
- Conectar `useGameStore` com `mastery.ts`:
  - Cada resultado alimenta o algoritmo
  - Avanço/regressão automáticos
  - Transição de nível com animação de "novo desafio"
  - Display do micro-nível atual (visual, não texto: ex. estrelas que mudam de cor)

### 3.5 — Testes E2E da Fase Abstrata
- Playwright:
  - Fluxo completo: abrir → exercício aparece → desenhar → enviar → feedback → próximo
  - Canvas vazio + enviar → feedback gentil (não envia ao OCR)
  - Toque rápido repetido no enviar → apenas 1 processamento
  - Verificar que feedback nunca contém palavras negativas

**Critério de conclusão**: Criança consegue jogar sessão completa de adição na fase abstrata. Motor de progressão avançando/regredindo corretamente.

---

## Épico 4: Fase Pictórica

Representação com bolinhas, barras e símbolos. Ponte entre concreto e abstrato.

### 4.1 — Componente de Representação Pictórica
- Criar `<PictorialDisplay />`:
  - Renderizar quantidades como bolinhas coloridas (●) agrupadas
  - Operador `+` ou `-` visível entre os grupos
  - Resultado como `= ___` (espaço vazio onde a criança responde)
  - Exemplo: `●●● + ●● = ___`
  - Bolinhas com animação de entrada (aparecem uma a uma, ~100ms cada)
  - Grupos com cores diferentes (azul + vermelho = ?)

### 4.2 — Dezenas e Unidades Pictóricas
- Para números >9, usar representação de material dourado:
  - Barra (retângulo longo) = 10
  - Bolinha = 1
  - Exemplo: 13 = `▬ ●●●`
- Agrupamento visual claro: barras à esquerda, bolinhas à direita

### 4.3 — Input na Fase Pictórica
- A criança **escreve o número à mão** no canvas (mesmo da fase abstrata)
- A representação pictórica é apenas visual — substitui o display numérico, não o input
- Fluxo: ver bolinhas → contar mentalmente → escrever resposta → enviar

### 4.4 — Transição Pictórico ↔ Abstrato
- Ao avançar de pictórico → abstrato: animação onde bolinhas se transformam em números
- Ao regredir de abstrato → pictórico: animação onde números "explodem" em bolinhas
- Primeiros exercícios da nova fase são fáceis (nível 1 da operação) para criar confiança

**Critério de conclusão**: Criança vê `●●● + ●● = ___`, conta 5, escreve "5" no canvas. Motor de progressão funciona com fase pictórica integrada.

---

## Épico 5: Fase Concreta

A criança "toca a matemática". Drag-and-drop de objetos visuais.

### 5.1 — Componente de Objetos Arrastáveis
- `npm install @dnd-kit/core @dnd-kit/sortable` (ou `react-dnd`)
- Criar `<DraggableObject />`:
  - Objetos visuais temáticos (maçãs, estrelas, bolinhas — variáveis para não cansar)
  - Tamanho grande (≥56px) para toque fácil com dedo
  - Feedback háptico/visual ao arrastar (sombra, escala 1.1x)
  - Snap to grid para facilitar agrupamento

### 5.2 — Área de Agrupamento
- Criar `<GroupingArea />`:
  - Para adição: dois grupos de objetos + uma "cesta" para onde a criança arrasta todos juntos
  - Para subtração: um grupo cheio + área de "remover" para onde a criança arrasta os que tira
  - Contador visual que atualiza em tempo real conforme objetos são movidos
  - Nenhum número aparece — apenas objetos e quantidades visuais

### 5.3 — Validação na Fase Concreta
- A resposta é a **quantidade de objetos na cesta/área final**
- Sem OCR nesta fase — a validação é por contagem de objetos
- Botão "Pronto!" (ícone ✓) quando a criança terminar de arrastar
- Feedback: correto = objetos dançam + confete. Incorreto = objetos voltam às posições + "Tente de novo!"

### 5.4 — Dezenas na Fase Concreta
- Para números >9: agrupar 10 objetos automaticamente em "pacote"
  - Visual: 10 maçãs soltas → ao juntar, viram 1 "caixa de maçãs" rotulada visualmente (não com número)
  - A criança manipula caixas (=10) e unidades soltas
  - Introduz a noção de dezena de forma tátil

### 5.5 — Transição Concreto ↔ Pictórico
- Ao avançar: animação onde objetos se simplificam em bolinhas
- Ao regredir: animação onde bolinhas se transformam em objetos coloridos
- Transição suave de 500-800ms

**Critério de conclusão**: Criança arrasta 3 maçãs + 2 maçãs para a cesta, cesta mostra 5 maçãs. Motor valida como correto. Funciona com números >9 usando caixas.

---

## Épico 6: Progresso Visual (Jornada)

A criança olha para a tela inicial e sente orgulho.

### 6.1 — Escolher Metáfora de Jornada
- Implementar como **mapa de trilha** (caminho com pontos que se revelam):
  - Cada ponto = um micro-nível dominado (maestria completa)
  - Pontos futuros são cinza/ocultos
  - Pontos conquistados são coloridos com ícone temático
  - Caminho se desenha conforme a criança avança (animação de linha)
- Alternativa: jardim que cresce (cada maestria planta uma flor)

### 6.2 — Tela Inicial (Home)
- Criar `<HomeScreen />`:
  - Mapa de jornada ocupando a maior parte da tela
  - Botão "Jogar" gigante (≥80px), sempre visível, com animação pulsante
  - Exibir estrelas acumuladas / itens colecionados
  - Último ponto conquistado em destaque
  - Zero texto obrigatório para navegar — ícones e cores apenas
  - Sem barra de porcentagem, sem rankings

### 6.3 — Recompensas por Maestria
- A cada micro-nível dominado:
  - Desbloqueio de um ponto no mapa (animação de revelação)
  - Som de conquista
  - Item colecionável (estrela, medalha, personagem — variado)
- A cada nível completo (ex: terminou adição até 10):
  - Celebração especial (tela inteira de confete + desbloqueio de "região" do mapa)
  - Novo visual no mapa (paisagem muda: floresta → praia → montanha)
- **Progresso nunca regride visualmente** — mesmo que a criança pratique níveis anteriores

### 6.4 — Sessão e Revisão
- Ao abrir o app após dias sem usar:
  - Mostrar mapa com resumo visual do que já conquistou
  - Primeira sessão começa com 2-3 exercícios de revisão do último nível dominado
  - Depois, retoma de onde parou

**Critério de conclusão**: Criança abre o app, vê mapa com 3 pontos conquistados. Joga, domina mais um micro-nível, vê novo ponto aparecer no mapa com animação.

---

## Épico 7: Persistência Local

Tudo salvo no tablet. Sem internet, sem conta.

### 7.1 — Camada de Persistência
- Usar `localStorage` para dados simples (settings, última sessão)
- Usar `IndexedDB` (via `idb` ou `Dexie.js`) para dados maiores:
  - Histórico completo de exercícios (para análise futura)
  - Estado do mapa de progressão
  - Itens desbloqueados
- Criar `lib/storage/persistence.ts`:
  - `saveProgress(state)` — serializar e salvar
  - `loadProgress()` — carregar e deserializar
  - `resetProgress()` — para recomeçar (botão oculto, só pais)

### 7.2 — Auto-Save
- Salvar automaticamente após cada exercício concluído
- Salvar estado da sessão ao sair do app (`beforeunload` / `visibilitychange`)
- Ao reabrir: carregar estado e retomar

### 7.3 — Proteção Contra Perda de Dados
- Verificar integridade dos dados ao carregar (schema validation)
- Se dados corrompidos: iniciar do zero com mensagem amigável (não erro técnico)
- Versionar schema para migrações futuras

**Critério de conclusão**: Criança joga, fecha o app, reabre 3 dias depois — tudo está lá. Mapa, estrelas, nível atual.

---

## Épico 8: Polimento & QA Final

Rodar o checklist da skill QA em tudo.

### 8.1 — QA Canvas/OCR
- Testar todos os cenários de `references/cenarios-canvas.md`
- Calibrar limiares de confiança com testes reais (idealmente com a criança)
- Verificar: canvas vazio, rabisco, dígito pequeno, dígito grande, múltiplos dígitos com espaço

### 8.2 — QA Interação
- Testar cenários de `references/cenarios-interacao.md`
- Foco em: toque rápido repetido, inatividade, fechar/abrir, rotação de tela

### 8.3 — QA Progressão
- Testar cenários de `references/cenarios-progressao.md`
- Simular: 5 acertos rápidos, 3 erros, 10 erros, transições CPA
- Verificar que subtração nunca aparece antes de maestria em adição

### 8.4 — QA Emocional
- Testar cenários de `references/cenarios-emocional.md`
- Verificar: nenhuma palavra negativa na UI, celebração proporcional, funciona sem som

### 8.5 — QA Responsividade
- Testar em: tablet landscape, tablet portrait, celular
- Verificar: canvas usável, botões não sobrepostos, rotação preserva desenho

### 8.6 — Teste com Criança Real
- Sessão de 15-20 minutos com a criança usando o app
- Observar (sem interferir):
  - Ela encontrou o botão de jogar sem ajuda?
  - Ela entendeu o que fazer em cada fase (concreto, pictórico, abstrato)?
  - Ela ficou frustrada em algum momento? Quando?
  - O OCR acertou a maioria das vezes?
  - Ela sorriu ao ver confete/celebração?
- Anotar e ajustar

**Critério de conclusão**: App sobrevive a 20 minutos de uso real por uma criança de 7 anos sem travamentos, confusões ou frustrações graves.

---

## Resumo da Sprint

| Ordem | Épico | Entrega | Ferramentas Chave |
|-------|-------|---------|-------------------|
| 0 | Setup | Ambiente pronto, PWA, sons | Vite, Zustand, Howler.js |
| 1 | Canvas + OCR | Desenhar e reconhecer 1-2 dígitos | react-signature-canvas, TensorFlow.js, MNIST |
| 2 | Motor Kumon | Progressão funcionando (sem UI) | Vitest, math.js |
| 3 | Fase Abstrata | Primeira versão jogável | Framer Motion, react-confetti |
| 4 | Fase Pictórica | Bolinhas e barras de dezena | Componentes SVG/Canvas |
| 5 | Fase Concreta | Drag-and-drop de objetos | @dnd-kit/core |
| 6 | Progresso Visual | Mapa de jornada na home | Framer Motion |
| 7 | Persistência | Tudo salvo localmente | IndexedDB (Dexie.js) |
| 8 | QA Final | App à prova de criança | Playwright, Vitest, criança real |

## Dependências entre Épicos

```
Épico 0 ─────────────────────────────────────────── (base para todos)
    │
    ▼
Épico 1 (Canvas+OCR) ──────┐
    │                       │
    ▼                       │
Épico 2 (Motor) ◄──────────┘
    │
    ├──▶ Épico 3 (Abstrato) ──▶ Épico 4 (Pictórico) ──▶ Épico 5 (Concreto)
    │                                                          │
    │                                                          ▼
    └──────────────────────────────────────────────────▶ Épico 6 (Progresso)
                                                               │
                                                               ▼
                                                        Épico 7 (Persistência)
                                                               │
                                                               ▼
                                                        Épico 8 (QA Final)
```

Épicos 3, 4 e 5 são sequenciais (abstrato primeiro porque é mais simples de implementar, depois pictórico, depois concreto). Mas a experiência da criança começa pelo concreto — o motor de progressão cuida disso.
