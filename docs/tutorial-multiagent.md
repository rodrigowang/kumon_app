---
title: "Tutorial: Multi-Agent com Claude Code"
subtitle: "Fluxo de trabalho com 3 agentes + estratégias de economia de tokens"
---

# Tutorial: Multi-Agent com Claude Code

## Índice

1. Conceito e Arquitetura
2. Estrutura do Projeto
3. Configuração Passo a Passo
4. O Orquestrador (script bash)
5. Fluxo Completo de uma Feature
6. Economia de Tokens — Estratégias Práticas
7. Troubleshooting

---

## 1. Conceito e Arquitetura

### O que é multi-agent no Claude Code?

Múltiplas invocações independentes do Claude Code, cada uma com seu próprio
contexto e skill, se comunicando através de **arquivos no disco**.

```
Você (humano)
  │
  ▼
Orquestrador (script bash)
  │
  ├──▶ Agente 1: EdTech ──▶ escreve specs em /docs
  │
  ├──▶ Agente 2: Dev ──────▶ lê specs, escreve código em /src
  │
  └──▶ Agente 3: QA ───────▶ lê código, escreve relatório em /qa
        │
        └──▶ (se houver bugs) ──▶ volta para Agente 2
```

A "conversa" entre agentes acontece via **arquivos Markdown** numa
pasta compartilhada. Cada agente lê o output do anterior e produz o seu.

### Por que isso funciona?

- Cada agente tem contexto limpo (menos tokens gastos)
- Cada agente lê APENAS sua skill (foco total)
- O output é rastreável (você pode ver o que cada um produziu)
- Agentes não "contaminam" o raciocínio um do outro

---

## 2. Estrutura do Projeto

```
kumon-app/
│
├── CLAUDE.md                    ← Instrução base (mínima)
│
├── .claude/
│   └── skills/
│       ├── senior-opensource-dev/
│       │   └── SKILL.md
│       ├── edtech-specialist/
│       │   └── SKILL.md
│       └── child-qa-tester/
│           └── SKILL.md
│
├── scripts/
│   └── orchestrate.sh           ← Orquestrador multi-agent
│
├── .agents/                     ← Pasta de comunicação entre agentes
│   ├── specs/                   ← EdTech escreve aqui
│   ├── reviews/                 ← EdTech escreve revisões aqui
│   ├── qa/                      ← QA escreve aqui
│   └── current-task.md          ← Descrição da task atual
│
├── src/                         ← Dev escreve aqui
├── tests/                       ← QA pode gerar testes aqui
└── package.json
```

---

## 3. Configuração Passo a Passo

### 3.1 Crie a estrutura

```bash
# Na raiz do projeto
mkdir -p .agents/specs .agents/reviews .agents/qa
mkdir -p scripts
```

### 3.2 Crie o CLAUDE.md mínimo (raiz)

Esse arquivo é lido por TODOS os agentes. Mantenha-o CURTO para economizar tokens.

```markdown
# Kumon Math App

App de matemática para crianças de 7 anos, estilo Kumon.
React + TypeScript + Vite.

## Comunicação entre agentes
- Specs: .agents/specs/
- Reviews: .agents/reviews/
- QA Reports: .agents/qa/
- Task atual: .agents/current-task.md

## Regra
Leia APENAS a skill indicada no prompt. Não leia as outras skills.
```

### 3.3 Crie arquivos de prompt para cada agente

Estes são os "scripts" que dizem a cada agente o que fazer.

**scripts/prompt-edtech.md**

```markdown
# Sua Função

Você é o agente EdTech. Leia sua skill em `.claude/skills/edtech-specialist/SKILL.md`.

## Sua Tarefa

1. Leia a task em `.agents/current-task.md`
2. Produza uma SPEC pedagógica em `.agents/specs/<nome-da-feature>.md`
3. A spec deve conter:
   - Requisitos pedagógicos (CPA, maestria, feedback)
   - Critérios de aceitação claros e verificáveis
   - O que NÃO fazer (anti-patterns)
4. Seja conciso. Máximo 100 linhas.

## Se for uma REVISÃO

1. Leia o código em `src/` indicado na task
2. Leia a spec original em `.agents/specs/`
3. Produza uma revisão em `.agents/reviews/<nome-da-feature>.md`
4. Use o formato: ✅ Aprovado / ⚠️ Ajustes / 🚫 Vetado / 💡 Sugestões
```

**scripts/prompt-dev.md**

```markdown
# Sua Função

Você é o agente Dev. Leia sua skill em `.claude/skills/senior-opensource-dev/SKILL.md`.

## Sua Tarefa

1. Leia a spec em `.agents/specs/<nome-da-feature>.md`
2. Implemente o código em `src/`
3. Use APENAS bibliotecas consolidadas (npm install primeiro)
4. Siga a estrutura de projeto definida na skill
5. Ao terminar, liste os arquivos criados/modificados em
   `.agents/dev-output.md`

## Se houver REVISÃO com ajustes

1. Leia `.agents/reviews/<nome-da-feature>.md`
2. Corrija os pontos ⚠️ e 🚫
3. Atualize `.agents/dev-output.md`
```

**scripts/prompt-qa.md**

```markdown
# Sua Função

Você é o agente QA. Leia sua skill em `.claude/skills/child-qa-tester/SKILL.md`.

## Sua Tarefa

1. Leia a spec em `.agents/specs/<nome-da-feature>.md`
2. Leia os arquivos criados listados em `.agents/dev-output.md`
3. Produza um relatório em `.agents/qa/<nome-da-feature>.md` contendo:
   - Cenários testados (da sua skill)
   - Bugs encontrados (formato da skill)
   - Checklist pré-release (com ☐/☑)
4. Se possível, gere testes automatizados em `tests/`
5. Seja conciso. Foque nos problemas, não no que está OK.
```

---

## 4. O Orquestrador

### scripts/orchestrate.sh

```bash
#!/bin/bash

# ============================================
# Orquestrador Multi-Agent para Claude Code
# ============================================

set -e

# --- Configuração ---
FEATURE_NAME="$1"
MAX_ITERATIONS=3    # máximo de ciclos dev↔review

if [ -z "$FEATURE_NAME" ]; then
    echo "Uso: ./scripts/orchestrate.sh <nome-da-feature>"
    echo "Exemplo: ./scripts/orchestrate.sh tela-adicao-simples"
    exit 1
fi

echo "=========================================="
echo "🚀 Iniciando pipeline para: $FEATURE_NAME"
echo "=========================================="

# --- Passo 1: EdTech define a spec ---
echo ""
echo "📚 [1/3] Agente EdTech — Definindo spec pedagógica..."
echo ""

cat scripts/prompt-edtech.md | claude --print \
    --allowedTools "read,write,edit" \
    --appendSystemPrompt "Leia .agents/current-task.md e produza a spec em .agents/specs/${FEATURE_NAME}.md"

# Verifica se a spec foi criada
if [ ! -f ".agents/specs/${FEATURE_NAME}.md" ]; then
    echo "❌ Erro: EdTech não produziu a spec. Abortando."
    exit 1
fi
echo "✅ Spec criada: .agents/specs/${FEATURE_NAME}.md"

# --- Passo 2: Dev implementa ---
echo ""
echo "🔨 [2/3] Agente Dev — Implementando..."
echo ""

cat scripts/prompt-dev.md | claude --print \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "Leia a spec em .agents/specs/${FEATURE_NAME}.md e implemente."

echo "✅ Implementação concluída."

# --- Passo 3: QA testa ---
echo ""
echo "🧪 [3/3] Agente QA — Testando..."
echo ""

cat scripts/prompt-qa.md | claude --print \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "Teste a feature ${FEATURE_NAME}."

echo "✅ QA concluído: .agents/qa/${FEATURE_NAME}.md"

# --- Passo 4: EdTech revisa (se QA encontrou problemas) ---
if grep -q "🚫\|Crítica\|Bug" ".agents/qa/${FEATURE_NAME}.md" 2>/dev/null; then
    echo ""
    echo "🔄 QA encontrou problemas. Iniciando ciclo de revisão..."

    ITERATION=0
    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))
        echo ""
        echo "--- Iteração $ITERATION/$MAX_ITERATIONS ---"

        # EdTech revisa
        echo "📚 EdTech revisando implementação..."
        cat scripts/prompt-edtech.md | claude --print \
            --allowedTools "read,write,edit" \
            --appendSystemPrompt "MODO REVISÃO: Leia .agents/qa/${FEATURE_NAME}.md e o código. Produza revisão em .agents/reviews/${FEATURE_NAME}.md"

        # Dev corrige
        echo "🔨 Dev corrigindo..."
        cat scripts/prompt-dev.md | claude --print \
            --allowedTools "read,write,edit,bash" \
            --appendSystemPrompt "MODO CORREÇÃO: Leia .agents/reviews/${FEATURE_NAME}.md e corrija."

        # QA retesta
        echo "🧪 QA retestando..."
        cat scripts/prompt-qa.md | claude --print \
            --allowedTools "read,write,edit,bash" \
            --appendSystemPrompt "RETESTE da feature ${FEATURE_NAME} após correções."

        # Verifica se ainda há problemas críticos
        if ! grep -q "🚫\|Crítica" ".agents/qa/${FEATURE_NAME}.md" 2>/dev/null; then
            echo "✅ Todos os problemas críticos resolvidos!"
            break
        fi
    done
fi

echo ""
echo "=========================================="
echo "✅ Pipeline concluído para: $FEATURE_NAME"
echo ""
echo "📄 Spec:    .agents/specs/${FEATURE_NAME}.md"
echo "📄 QA:      .agents/qa/${FEATURE_NAME}.md"
echo "📄 Review:  .agents/reviews/${FEATURE_NAME}.md"
echo "=========================================="
```

### Dê permissão de execução

```bash
chmod +x scripts/orchestrate.sh
```

---

## 5. Fluxo Completo de uma Feature

### Passo 1: Descreva a task

```bash
cat > .agents/current-task.md << 'EOF'
# Task: Tela de Exercício de Adição Simples

Implementar a tela principal onde a criança resolve exercícios de
adição com resultado até 10.

Requisitos:
- Deve suportar as 3 fases CPA
- Canvas de escrita à mão para a fase abstrata
- Feedback visual e sonoro para acerto/erro
- Lógica de progressão (maestria antes de avançar)
EOF
```

### Passo 2: Execute o pipeline

```bash
./scripts/orchestrate.sh tela-adicao-simples
```

### Passo 3: Observe

O script vai:
1. EdTech produz `.agents/specs/tela-adicao-simples.md`
2. Dev lê a spec, faz `npm install`, cria componentes em `src/`
3. QA lê o código, testa cenários, produz `.agents/qa/tela-adicao-simples.md`
4. Se QA encontra bugs críticos → ciclo de correção automático (máx 3x)

### Passo 4: Revise você mesmo

Depois do pipeline, olhe os arquivos em `.agents/` para entender
o que cada agente produziu. Você é o decisor final.

---

## 6. Economia de Tokens — Estratégias Práticas

### O problema

Cada invocação do Claude Code consome tokens. Com 3 agentes + ciclos
de revisão, o consumo pode ser 3-6x maior que single-agent.

### Estratégia 1: CLAUDE.md mínimo

O CLAUDE.md é lido em TODA invocação. Cada palavra ali custa tokens
multiplicados pelo número total de chamadas.

```
❌ CLAUDE.md com 200 linhas (descrição detalhada do projeto, história, motivação)
✅ CLAUDE.md com 20 linhas (só o essencial: stack, paths, regra de leitura)
```

Regra de ouro: **tudo que pode estar na skill NÃO deve estar no CLAUDE.md**.

### Estratégia 2: Skills enxutas com referências externas

Em vez de uma skill de 300 linhas, faça:

```
skill/
├── SKILL.md           ← 80-100 linhas (core)
└── references/
    ├── curriculo.md   ← Detalhamento do currículo (lido sob demanda)
    ├── cenarios.md    ← Tabelas de cenários de teste
    └── exemplos.md    ← Exemplos detalhados
```

Na SKILL.md, referencie:
```markdown
Para o currículo completo, leia `references/curriculo.md`.
```

O agente só lê o arquivo de referência quando precisa, em vez de
carregar tudo sempre.

### Estratégia 3: Prompts cirúrgicos

Quanto mais específico o prompt, menos tokens o agente gasta "pensando".

```
❌ "Implemente a tela de adição"
   → Agente lê tudo, analisa tudo, decide tudo = muitos tokens

✅ "Implemente o componente AdditionCanvas em src/components/canvas/
    seguindo a spec em .agents/specs/tela-adicao.md, seção 'Fase Abstrata'.
    Use react-signature-canvas. Apenas este componente, nada mais."
   → Agente tem escopo fechado = poucos tokens
```

### Estratégia 4: --print e --max-turns

```bash
# --print faz o agente imprimir e sair (não fica em modo interativo)
claude --print "sua tarefa aqui"

# Limite o número de turns para evitar loops infinitos
claude --print --max-turns 10 "sua tarefa aqui"
```

### Estratégia 5: Use o modelo certo para cada agente

O Claude Code permite escolher o modelo. Nem todo agente precisa
do modelo mais caro.

```bash
# EdTech (define specs) — precisa de raciocínio forte
claude --model claude-sonnet-4-20250514 --print "..."

# Dev (implementa) — precisa de raciocínio forte + código
claude --model claude-sonnet-4-20250514 --print "..."

# QA (checklists e cenários) — modelo mais leve pode dar conta
claude --model claude-haiku-4-5-20251001 --print "..."
```

Haiku é significativamente mais barato e para tarefas de checklist
estruturado (que é o grosso do trabalho do QA), costuma ser suficiente.

### Estratégia 6: Cache de specs

Se a spec do EdTech não mudou, não re-gere. O orquestrador pode verificar:

```bash
# No orchestrate.sh, antes de chamar o EdTech:
if [ -f ".agents/specs/${FEATURE_NAME}.md" ]; then
    echo "📋 Spec já existe. Pulando EdTech."
    echo "   (delete .agents/specs/${FEATURE_NAME}.md para re-gerar)"
else
    # chama o agente EdTech
fi
```

### Estratégia 7: Decomponha features em micro-tasks

Em vez de "Implemente a tela inteira de exercícios", quebre em:

1. "Crie o componente de canvas de escrita" (Dev)
2. "Crie o pipeline de OCR" (Dev)
3. "Crie o componente de feedback visual" (Dev)
4. "Integre os 3 componentes na tela de exercício" (Dev)

Cada micro-task tem contexto pequeno = menos tokens por chamada.
E se uma falhar, você não perde o trabalho das outras.

### Estratégia 8: .claudeignore

Crie um arquivo `.claudeignore` na raiz para evitar que o Claude Code
leia arquivos desnecessários (node_modules, builds, etc.):

```
node_modules/
dist/
build/
.git/
*.lock
```

Menos arquivos no contexto = menos tokens.

### Resumo de economia

| Estratégia | Economia estimada | Esforço |
|------------|-------------------|---------|
| CLAUDE.md mínimo | 10-20% por chamada | Baixo |
| Skills com referências externas | 15-30% por chamada | Médio |
| Prompts cirúrgicos | 20-40% por chamada | Médio |
| --print + --max-turns | Evita desperdício | Baixo |
| Modelo certo por agente | 50-70% no agente QA | Baixo |
| Cache de specs | Elimina chamadas inteiras | Baixo |
| Micro-tasks | 30-50% por feature | Médio |
| .claudeignore | 5-15% por chamada | Baixo |

---

## 7. Troubleshooting

### "O agente não leu a skill"

Verifique se o path está correto no prompt. Use path relativo a partir
da raiz do projeto:
```
✅ .claude/skills/edtech-specialist/SKILL.md
❌ /home/user/projeto/.claude/skills/edtech-specialist/SKILL.md
```

### "O agente fez mais do que deveria"

Seus prompts estão amplos demais. Restrinja:
- Nomeie exatamente quais arquivos ler
- Nomeie exatamente quais arquivos escrever
- Diga explicitamente "Não modifique nenhum outro arquivo"

### "Os agentes estão se contradizendo"

Isso acontece quando a spec é ambígua. Melhore a spec do EdTech antes
de re-rodar o pipeline. A spec é o "contrato" entre agentes.

### "Estou gastando tokens demais nos ciclos de revisão"

Reduza MAX_ITERATIONS para 1 no orquestrador. Faça a revisão manual
você mesmo olhando o relatório do QA e decidindo o que corrigir.

### "O orquestrador falhou no meio"

Os arquivos em `.agents/` persistem. Você pode:
- Re-rodar apenas o agente que falhou
- Ou deletar os arquivos e re-rodar tudo

---

## Próximos Passos

1. Configure a estrutura do projeto
2. Copie as 3 skills para `.claude/skills/`
3. Crie o CLAUDE.md mínimo
4. Escreva sua primeira task em `.agents/current-task.md`
5. Rode `./scripts/orchestrate.sh` e observe
6. Ajuste os prompts baseado nos resultados

Comece com uma feature simples (ex: "componente de canvas de escrita")
antes de tentar features complexas. Isso permite calibrar os prompts
e entender o consumo de tokens real do seu setup.
