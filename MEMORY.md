# 🧠 Memória do Projeto

## 1. Objetivo Geral

**Kumon Math App** é um aplicativo web educacional para crianças de 7 anos aprenderem matemática (estilo método Kumon) usando **escrita à mão como input principal**. O sistema utiliza OCR (Reconhecimento Óptico de Caracteres) com TensorFlow.js para reconhecer dígitos desenhados pela criança em um canvas touch-friendly, oferecendo feedback pedagógico adequado à faixa etária.

**Problema que resolve**: Proporciona experiência de aprendizado interativa, autônoma e encorajadora, onde a criança pratica matemática de forma natural (escrevendo à mão), sem depender de digitação ou teclado numérico.

---

## 2. Estrutura de Diretórios

```
kumon-app/
├── .agents/                      # Comunicação entre agentes (EdTech, Dev, QA)
│   ├── current-task.md           # Task em andamento
│   ├── dev-output.md             # Log de arquivos criados/modificados pelo Dev
│   ├── specs/                    # Especificações pedagógicas (EdTech escreve)
│   ├── reviews/                  # Revisões de features (EdTech valida)
│   └── qa/                       # Relatórios de testes (QA escreve)
│
├── .claude/                      # Configuração de agentes e skills
│   └── skills/                   # Skills especializadas
│       ├── senior-opensource-dev/   # Dev: implementação e bibliotecas
│       ├── edtech-specialist/       # EdTech: pedagogia e requisitos
│       └── child-qa-tester/         # QA: testes focados em crianças
│
├── public/
│   └── models/mnist/             # Modelo CNN pré-treinado para OCR (TensorFlow.js)
│       ├── model.json
│       └── group1-shard*.bin     # Pesos do modelo (~4.8MB, ~99% acurácia)
│
├── src/
│   ├── components/
│   │   ├── canvas/               # DrawingCanvas.tsx (canvas touch com perfect-freehand)
│   │   ├── exercises/            # ExerciseScreen.tsx (tela de exercícios)
│   │   ├── ui/                   # Componentes UI (Overlays OCR, Keypad, etc.)
│   │   └── dev/                  # Testers de desenvolvimento
│   │
│   ├── hooks/
│   │   ├── useOCRModel.ts        # Carrega e aquece modelo TensorFlow.js
│   │   ├── useDrawingCanvas.ts   # Lógica do canvas (desenho, clear, export)
│   │   └── useSound.ts           # Feedback sonoro (Howler.js)
│   │
│   ├── stores/                   # Estado global (Zustand)
│   │   ├── useGameStore.ts       # Estado do jogo (exercícios, OCR, tentativas)
│   │   ├── useProgressStore.ts   # Progresso da criança
│   │   └── useSettingsStore.ts   # Configurações (som, etc.)
│   │
│   ├── utils/ocr/                # Pipeline OCR
│   │   ├── predict.ts            # Inferência TensorFlow.js
│   │   ├── tensorOps.ts          # Conversão canvas → Tensor4D [1,28,28,1]
│   │   ├── segment.ts            # Segmentação de dígitos (multi-dígito no futuro)
│   │   └── imageProcessing.ts    # Pré-processamento (crop, resize, threshold)
│   │
│   └── theme/mantine.ts          # Tema Mantine (UI framework)
│
├── tests/
│   ├── unit/                     # Testes unitários (Vitest)
│   └── e2e/                      # Testes E2E (Playwright + Chromium)
│
├── scripts/orchestrate.sh        # Orquestrador multi-agente (EdTech → Dev → QA)
├── CLAUDE.md                     # Instruções para agentes Claude
└── package.json                  # Dependências e scripts
```

---

## 3. Arquitetura e Agentes

### Sistema Multi-Agente

O projeto utiliza **3 agentes especializados** que colaboram via arquivos markdown em `.agents/`:

| Agente | Skill | Responsabilidade |
|--------|-------|------------------|
| **EdTech Specialist** | `.claude/skills/edtech-specialist/` | Define requisitos pedagógicos, valida se features atendem necessidades de crianças de 7 anos, aprova/veta decisões de UX. **Autoridade final sobre aspectos pedagógicos.** |
| **Senior Dev** | `.claude/skills/senior-opensource-dev/` | Implementa features, integra bibliotecas open source, escreve código TypeScript. Filosofia: "importar > escrever do zero". |
| **QA Child Tester** | `.claude/skills/child-qa-tester/` | Testa do ponto de vista infantil, gera cenários de uso imprevisível (rabiscos, toques repetidos, canvas vazio), valida critérios de aceitação. |

### Fluxo de Trabalho

```
1. EdTech escreve spec em .agents/specs/
2. Dev implementa e registra em .agents/dev-output.md
3. QA testa e escreve relatório em .agents/qa/
4. EdTech revisa em .agents/reviews/ (aprova ou pede ajustes)
```

### Comunicação entre Agentes

- **current-task.md**: Task em andamento (lida por todos)
- **dev-output.md**: Lista de arquivos criados/modificados (Dev → QA/EdTech)
- **specs/**: Especificações técnicas/pedagógicas (EdTech → Dev)
- **qa/**: Relatórios de teste (QA → Dev/EdTech)
- **reviews/**: Revisões finais (EdTech → Dev)

---

## 4. Como Executar e Testar

### Instalação

```bash
npm install
```

### Desenvolvimento

```bash
npm run dev
# Inicia servidor Vite em http://localhost:5173
# Hot reload habilitado (mudanças refletem automaticamente)
```

### Build de Produção

```bash
npm run build
# TypeScript compila + Vite bundler
# Output em dist/ (pronto para deploy)
```

### Preview de Produção

```bash
npm run preview
# Serve o build de dist/ localmente para validação
```

### Testes

```bash
# Testes unitários (Vitest)
npm run test

# Testes E2E (Playwright com Chromium)
npm run test:e2e

# Rodar TODOS os testes (unit + e2e)
npm run test:all
```

### Linting

```bash
npm run lint
# ESLint com regras TypeScript, React, JSX a11y
# Strict mode, zero tolerância a 'any'
```

### Orquestração Multi-Agente

```bash
# Pipeline completo: EdTech → Dev → QA
./scripts/orchestrate.sh <nome-da-feature>

# Invocar agente específico
./scripts/orchestrate.sh --dev "implementar X"
./scripts/orchestrate.sh --edtech "validar Y"
./scripts/orchestrate.sh --qa "testar cenário Z"
```

---

## 5. O Que Já Foi Feito

### ✅ Infraestrutura Base (Commits c7c8132 → 833b809)
- Vite + React 18 + TypeScript 5 configurado
- Estrutura de pastas (src, tests, .agents, .claude)
- ESLint + Prettier + TypeScript strict mode
- Git setup com .gitignore

### ✅ UI Framework (Commit 902e461)
- **Mantine UI** integrado (componentes acessíveis, touch-friendly)
- Tema customizado para crianças (cores vibrantes, fontes grandes ≥24px)
- Touch targets ≥48px garantidos
- Componentes base: Button, Card, Container, Heading

### ✅ Gerenciamento de Estado (Commit 902e461)
- **Zustand** configurado (3 stores)
  - `useGameStore`: exercícios, OCR, tentativas de falha
  - `useProgressStore`: progresso da criança (acertos, níveis)
  - `useSettingsStore`: configurações (som, volume)

### ✅ Sistema de Som (Commit 833b809)
- **Howler.js** integrado
- Hook `useSound` para feedback sonoro
- Sons sintéticos (`syntheticSounds.ts`) prontos para uso

### ✅ Canvas de Desenho (Task 1.3 - Semana 1)
- **DrawingCanvas.tsx** com `perfect-freehand` (traço suave e natural)
- Hook `useDrawingCanvas` (lógica de desenho, clear, export)
- **DPR (devicePixelRatio) scaling** implementado (resolve baixa resolução em tablets)
- Touch-friendly, data-testid presente

### ✅ OCR Pipeline Completo (Tasks 1.4, 1.5, 1.6 - Semana 1)
- **Modelo CNN pré-treinado** (SciSharp/Keras.NET, ~99% acurácia MNIST)
  - Conv2D×2 + MaxPool + Dense, ~600K parâmetros
  - Input: Tensor4D `[1, 28, 28, 1]` (preserva informação espacial)
  - Substituiu modelo Dense antigo (~92% acurácia)
- **Hook `useOCRModel`**: carrega modelo, warmup, inferência
- **Utils OCR completos**:
  - `tensorOps.ts`: canvas → Tensor4D (resize 28×28, normalização)
  - `predict.ts`: inferência + confiança (softmax max)
  - `imageProcessing.ts`: crop, threshold, preprocessing
  - `segment.ts`: segmentação de dígitos (base para multi-dígito)

### ✅ Feedback OCR com Overlays (Task 1.7.1 - Semana 1)
- **OCRConfirmationOverlay**: confiança 50-79% → criança confirma (✓/✗)
- **OCRRetryOverlay**: confiança <50% → "Vamos tentar de novo?"
- **OCRFeedbackOverlay**: wrapper com lógica de decisão
- Tom pedagógico: encorajador, nunca punitivo
- Animações suaves, botões grandes (≥64px)

### ✅ Testes E2E (Commit ba2b229)
- **Playwright** configurado com Chromium
- Setup para testes de interação touch/canvas
- Scripts `test:e2e` e `test:all` prontos

### ✅ Especificações Pedagógicas (EdTech)
- Specs detalhadas em `.agents/specs/`:
  - Canvas infra, OCR crop, Layout skeleton, Layout logic, OCR feedback UI
- Princípios Kumon aplicados: autonomia gradual, feedback diferenciado, redução de carga cognitiva

### ✅ QA Reports (QA Agent)
- Relatórios em `.agents/qa/`:
  - Validações de UI framework, Zustand, canvas infra, OCR crop, layout, feedback UI
- Cenários de teste para criança de 7 anos definidos

---

## 6. O Que Falta Fazer (Roadmap)

### 🔵 Em Andamento (Current Task)
**Task 1.7.2: Fluxo Fallback - Teclado Numérico**
- Contador de tentativas falhas no `useGameStore`
- Após 3 falhas OCR consecutivas → exibir ícone de teclado numérico
- Modal de teclado numérico como alternativa ao desenho
- Garantir que input manual também dispare fluxo de conclusão

### 🔴 Pendente - Próximas Tasks

#### 📌 Task 1.8: Validação Matemática
- Receber dígito confirmado do OCR
- Comparar com resposta esperada do exercício
- Feedback visual/sonoro (acerto ✅ / erro ❌)
- Atualizar `useProgressStore` (pontuação, streak)

#### 📌 Task 1.9: Progressão de Exercícios
- Sistema de níveis (somas simples → compostas)
- Gerador de exercícios (Task 1.1 incompleto?)
- Transição automática entre exercícios
- Tela de conclusão de nível

#### 📌 Task 2.x: Gestão de Progresso
- Persistência de dados (localStorage ou IndexedDB)
- Dashboard de progresso (gráficos, estatísticas)
- Sistema de recompensas (badges, estrelas)

#### 📌 Task 3.x: PWA e Offline
- `vite-plugin-pwa` configurado mas não ativado
- Service Worker para cache de assets
- Funcionar offline após primeira visita
- Ícones e manifest.json

#### 📌 Task 4.x: Multi-Dígito OCR
- Segmentação de múltiplos dígitos (`segment.ts` tem base)
- Reconhecimento de números de 2-3 dígitos
- Espaçamento entre dígitos (UX)

#### 📌 Task 5.x: Acessibilidade e A11y
- ARIA labels completos
- Suporte a navegação por teclado (para tablets com teclado)
- Contrast ratio validado (WCAG AA)
- Screen reader friendly (para pais)

#### 📌 Task 6.x: Gamificação Avançada
- Sons de celebração (acertos em streak)
- Animações de confete/estrelas
- Sistema de níveis visuais (medalhas, progressão)

---

## 📋 Regras Críticas do Projeto

### Design para Criança de 7 Anos
- **Touch targets ≥ 48px** (toques imprecisos)
- **Fonte ≥ 24px** (legibilidade)
- **Zero dependência de leitura** para navegar (ícones predominam)
- **Feedback visual + sonoro** em toda interação
- **Erros tratados com gentileza** (nunca punição)

### Desenvolvimento
- **TypeScript strict**, zero `any`
- **Filosofia**: importar bibliotecas > escrever do zero
- **data-testid** obrigatório em componentes interativos
- **NÃO fazer git commit** (Dev lista em `.agents/dev-output.md`, humano commita)

### Stack Principal
- React 18 + TypeScript 5 + Vite
- Mantine (UI) + Zustand (state) + Howler (sound)
- TensorFlow.js (OCR) + perfect-freehand (canvas)
- Vitest (unit) + Playwright (e2e)

---

**Instrução Permanente:** Mantenha este arquivo atualizado após cada mudança significativa. Registre decisões arquiteturais, features concluídas e lições aprendidas.
