# Boas Práticas — Profissionalismo, Escalabilidade & Economia

---

## 1. Economia de Tokens (impacto imediato)

### 1.1 — .claudeignore

Você ainda não tem. Crie na raiz do projeto:

```
# .claudeignore
node_modules/
dist/
build/
.git/
*.lock
package-lock.json
.agents/specs/*.md.bak
.agents/reviews/*.md.bak
coverage/
playwright-report/
test-results/
*.png
*.jpg
*.mp3
*.wav
*.bin
```

Sem isso, o Claude Code pode ler `node_modules` ou arquivos de peso
do MNIST — milhares de tokens jogados fora. Cada agente paga esse custo.

### 1.2 — Tasks atômicas com escopo fechado

O maior desperdício de tokens é task vaga. Compare:

```
❌ "Implemente o sistema de feedback"
   → Agente lê todas as skills, todos os arquivos de referência,
     analisa tudo, decide tudo = 3000-5000 tokens de input

✅ "Crie o componente FeedbackOverlay em src/components/feedback/FeedbackOverlay.tsx.
    Use framer-motion para animação de shake no erro. Use react-confetti para acerto.
    Props: { type: 'correct' | 'wrong', onComplete: () => void }.
    Ler references/cenarios-emocional.md da skill QA para os textos."
   → Agente sabe exatamente o que fazer = 800-1200 tokens de input
```

Regra: se a task cabe em 5 linhas, o agente gasta menos pensando.

### 1.3 — Pular agentes desnecessários

Nem toda task precisa dos 3 agentes. O orquestrador roda EdTech → Dev → QA
sempre, mas muitas tasks só precisam de 1:

| Tipo de task | Quem precisa rodar |
|--------------|-------------------|
| Setup/infra (Épico 0) | Dev sozinho |
| Definir currículo | EdTech sozinho |
| Corrigir bug específico | Dev sozinho |
| Rodar testes | QA sozinho |
| Feature nova com UX | EdTech → Dev → QA (pipeline completo) |

Crie atalhos no script para rodar um agente só:

```bash
# Adicionar ao orchestrate.sh ou criar scripts separados:

# Rodar só o Dev
run-dev() {
  cat scripts/prompt-dev.md | claude --print \
    --model "$MODEL_DEV" \
    --max-turns "$MAX_TURNS" \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "$1"
}

# Rodar só o QA
run-qa() {
  cat scripts/prompt-qa.md | claude --print \
    --model "$MODEL_QA" \
    --max-turns "$MAX_TURNS" \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "$1"
}

# Rodar só o EdTech
run-edtech() {
  cat scripts/prompt-edtech.md | claude --print \
    --model "$MODEL_EDTECH" \
    --max-turns "$MAX_TURNS" \
    --allowedTools "read,write,edit" \
    --appendSystemPrompt "$1"
}
```

Isso corta 66% dos tokens em tasks que só precisam de 1 agente.

### 1.4 — Cache de specs que não mudaram

Adicione no orchestrate.sh:

```bash
# Antes de chamar EdTech:
if [ -f ".agents/specs/${FEATURE_NAME}.md" ]; then
    echo "📋 Spec já existe. Pulando EdTech."
    echo "   (delete o arquivo para re-gerar)"
else
    # chama EdTech
fi
```

Re-rodar o Dev para corrigir um bug não precisa re-gerar a spec.

### 1.5 — Haiku para tasks simples

Além do QA em Haiku, considere Haiku para:
- Setup/infra (task 0.1-0.5) — são receitas de bolo
- Corrigir bugs pontuais — escopo fechado
- Gerar testes unitários — padrão repetitivo

Só mantenha Sonnet para tasks de raciocínio complexo (motor de maestria,
pipeline OCR, integração entre sistemas).

---

## 2. Profissionalismo

### 2.1 — Git desde o dia zero

```bash
git init
git add .
git commit -m "chore: project setup"
```

Commitar após cada task concluída com sucesso. Convenção:

```
feat: componente DrawingCanvas
fix: botão enviar aceita cliques duplos
test: testes E2E do canvas
chore: configurar PWA
refactor: extrair pipeline OCR para lib/
```

Se uma task quebrar algo, `git diff` mostra o que mudou e
`git checkout .` reverte tudo. Sem Git, um agente pode destruir
trabalho anterior e você não tem como voltar.

Adicione no prompt-dev.md:

```markdown
## Git
Após concluir a implementação, NÃO faça commit.
Liste os arquivos criados/modificados em .agents/dev-output.md.
O commit é responsabilidade do humano após revisão.
```

### 2.2 — Variáveis de Ambiente

Crie `.env` e `.env.example`:

```bash
# .env.example
VITE_MNIST_MODEL_URL=https://cdn.example.com/mnist/model.json
VITE_ENABLE_OCR_MOCK=false
VITE_DEBUG_PROGRESSION=false
```

- `VITE_ENABLE_OCR_MOCK=true` → usa mock nos testes e no dev
- `VITE_DEBUG_PROGRESSION=true` → expõe estado do Zustand em `window.__gameStore`
- Nunca hardcode URLs de modelo ou flags de debug

### 2.3 — Error Boundary

Crie um Error Boundary global para que se algo quebrar em produção,
a criança nunca veja um stack trace:

```typescript
// src/components/ErrorBoundary.tsx
// Mostra: ícone triste + "Algo deu errado, vamos recomeçar!" + botão de recarregar
// Log do erro no console para debug
```

Isso é uma task do Dev no Épico 0 que faltou no plano original.

### 2.4 — Linting rigoroso

```bash
npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
npm install -D eslint-plugin-react-hooks eslint-plugin-react-refresh
```

Regras essenciais no `.eslintrc`:
- `no-explicit-any: error`
- `react-hooks/exhaustive-deps: warn`
- `no-console: warn` (evitar console.log esquecido na UI)

### 2.5 — README mínimo

Não para o agente (ele tem as skills) — para você daqui a 3 meses:

```markdown
# Kumon Math App

App de matemática para crianças de 7 anos.

## Rodar
npm install && npm run dev

## Testar
npm run test          # unitários
npm run test:e2e      # E2E (precisa de chromium)
npm run test:all      # tudo

## Estrutura
- src/ — código fonte
- tests/ — testes
- .claude/skills/ — skills dos agentes
- .agents/ — comunicação entre agentes
- docs/ — documentação do projeto
```

---

## 3. Escalabilidade

### 3.1 — Separar lógica de UI desde o início

A estrutura de pastas já prevê isso, mas reforce no prompt do Dev:

```
src/lib/     → Lógica pura, zero React. Testável com Vitest sem browser.
src/hooks/   → Ponte entre lib/ e componentes. Usa React mas não renderiza.
src/components/ → Apenas renderização. Zero lógica de negócio.
```

Por que importa: quando quiser adicionar multiplicação e divisão no futuro,
você mexe em `lib/math/` e `lib/progression/` sem tocar em nenhum componente.

### 3.2 — Sistema de níveis como dados, não código

Em vez de:
```typescript
// ❌ Hardcoded
if (level === 1) maxResult = 5;
if (level === 2) maxResult = 10;
```

Faça:
```typescript
// ✅ Configuração como dados
// src/lib/math/curriculum.ts
export const CURRICULUM: Level[] = [
  { id: 'add-1', operation: 'addition', maxResult: 5, label: 'Somas até 5' },
  { id: 'add-2', operation: 'addition', maxResult: 10, label: 'Somas até 10' },
  { id: 'add-3', operation: 'addition', maxResult: 15, label: 'Somas até 15' },
  { id: 'add-4', operation: 'addition', maxResult: 20, label: 'Somas até 20' },
  { id: 'sub-1', operation: 'subtraction', maxResult: 5, label: 'Subtrações até 5' },
  // ...
];
```

Quando quiser adicionar multiplicação: basta adicionar entradas no array.
O motor de maestria, o gerador de problemas, e a UI já funcionam
com qualquer operação que siga a interface.

### 3.3 — Tipagem como contrato

Crie types que forcem consistência:

```typescript
// src/types/index.ts
export interface Problem {
  id: string;
  numA: number;
  numB: number;
  operator: Operator;
  result: number;
  level: string;
  cpaPhase: CpaPhase;
}

export interface ProblemResult {
  problemId: string;
  correct: boolean;
  timeMs: number;
  attempts: number;
  ocrConfidence: number;
  timestamp: number;
}

export interface MasteryState {
  currentLevel: string;
  currentPhase: CpaPhase;
  history: ProblemResult[];
  consecutiveCorrect: number;
  consecutiveWrong: number;
}
```

Esses tipos são o contrato entre todos os módulos. Se alguém mudar
a interface, TypeScript strict quebra em todos os lugares que precisam
se adaptar.

### 3.4 — Indexação do histórico para analytics futuro

O `ProblemResult` guarda `timestamp` e `timeMs`. Parece desnecessário
agora, mas no futuro permite:
- Gráfico de evolução da criança ao longo de semanas
- Identificar horários em que ela aprende melhor
- Detectar padrões de erro (sempre erra "8+7" mas acerta "7+8"?)
- Dashboard para pais

Não construa nada disso agora — mas salve os dados desde o dia 1.

### 3.5 — Schema versionado no IndexedDB

```typescript
// src/lib/storage/schema.ts
export const DB_VERSION = 1;

export const schema = {
  1: (db) => {
    db.createObjectStore('progress');
    db.createObjectStore('history');
    db.createObjectStore('settings');
  },
  // Futuro:
  // 2: (db) => {
  //   db.createObjectStore('achievements');
  // },
};
```

Quando adicionar features, incrementa a versão e migra.
Dados antigos não se perdem.

### 3.6 — Feature flags simples

```typescript
// src/lib/flags.ts
export const FLAGS = {
  SUBTRACTION_ENABLED: true,
  MULTIPLICATION_ENABLED: false,  // futuro
  DIVISION_ENABLED: false,         // futuro
  SOUND_ENABLED: true,
  DEBUG_MODE: import.meta.env.DEV,
};
```

Permite ligar/desligar features sem deploy. Quando multiplicação
estiver pronta, muda um `false` para `true`.

---

## Checklist: O que adicionar ao projeto agora

Antes de começar a Sprint 1:

1. ☐ Criar `.claudeignore`
2. ☐ `git init` + primeiro commit
3. ☐ Criar `.env.example`
4. ☐ Adicionar regra de `data-testid` no `prompt-dev.md`
5. ☐ Adicionar regra de "quando rodar testes" no `prompt-qa.md`
6. ☐ Adicionar regra de "não fazer commit" no `prompt-dev.md`
7. ☐ Adicionar atalhos `run-dev`, `run-qa`, `run-edtech` no script
8. ☐ Adicionar cache de specs no `orchestrate.sh`
9. ☐ Adicionar task 0.6: Error Boundary no Épico 0

Tempo estimado: 30 minutos de setup manual. Economia ao longo do projeto: horas.
