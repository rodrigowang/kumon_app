#!/bin/bash

# ============================================
# Orquestrador Multi-Agent para Claude Code
# ============================================

set -e

# --- Configuração de Modelos ---
# Aliases funcionam: "sonnet", "haiku", "opus"
# Ou nome completo: "claude-sonnet-4-20250514"
MODEL_EDTECH="sonnet"
MODEL_DEV="sonnet"
MODEL_QA="haiku"

# --- Configuração Geral ---
MAX_TURNS=30
MAX_ITERATIONS=3

# --- Cores ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# ============================================
# Funções de agente solo
# ============================================

run_edtech() {
    echo -e "${BLUE}📚 Rodando EdTech solo...${NC}"
    claude -p --dangerously-skip-permissions --model "$MODEL_EDTECH" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit" --append-system-prompt "$1" < scripts/prompt-edtech.md
}

run_dev() {
    echo -e "${GREEN}🔨 Rodando Dev solo...${NC}"
    claude -p --dangerously-skip-permissions --model "$MODEL_DEV" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "$1" < scripts/prompt-dev.md
}

run_qa() {
    echo -e "${YELLOW}🧪 Rodando QA solo...${NC}"
    claude -p --dangerously-skip-permissions --model "$MODEL_QA" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "$1" < scripts/prompt-qa.md
}

# ============================================
# Uso
# ============================================

usage() {
    echo "Uso:"
    echo "  Pipeline completo:  ./scripts/orchestrate.sh <nome-da-feature>"
    echo "  Agente solo:        ./scripts/orchestrate.sh --dev 'instrução'"
    echo "                      ./scripts/orchestrate.sh --edtech 'instrução'"
    echo "                      ./scripts/orchestrate.sh --qa 'instrução'"
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/orchestrate.sh setup-projeto"
    echo "  ./scripts/orchestrate.sh --dev 'Corrija o bug no botão enviar'"
    echo "  ./scripts/orchestrate.sh --qa 'Rode os testes E2E do canvas'"
    exit 1
}

# ============================================
# Agente solo (se flag passada)
# ============================================

case "${1:-}" in
    --dev)
        shift
        run_dev "$*"
        exit 0
        ;;
    --edtech)
        shift
        run_edtech "$*"
        exit 0
        ;;
    --qa)
        shift
        run_qa "$*"
        exit 0
        ;;
    --help|-h)
        usage
        ;;
    "")
        usage
        ;;
esac

# ============================================
# Pipeline completo
# ============================================

FEATURE_NAME="$1"

echo "=========================================="
echo -e "🚀 Pipeline para: ${GREEN}$FEATURE_NAME${NC}"
echo "=========================================="
echo "Modelos: EdTech=$MODEL_EDTECH | Dev=$MODEL_DEV | QA=$MODEL_QA"
echo ""

# --- Passo 1: EdTech ---
if [ -f ".agents/specs/${FEATURE_NAME}.md" ]; then
    echo -e "${YELLOW}📋 Spec já existe. Pulando EdTech.${NC}"
    echo "   (delete .agents/specs/${FEATURE_NAME}.md para re-gerar)"
else
    echo -e "${BLUE}📚 [1/3] Agente EdTech — Definindo spec...${NC}"
    echo ""

    claude -p --dangerously-skip-permissions --model "$MODEL_EDTECH" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit" --append-system-prompt "Leia .agents/current-task.md e escreva a spec EXATAMENTE no arquivo .agents/specs/${FEATURE_NAME}.md — use esse nome exato, não invente outro. Escreva o arquivo diretamente." < scripts/prompt-edtech.md

    if [ ! -f ".agents/specs/${FEATURE_NAME}.md" ]; then
        echo -e "${RED}❌ EdTech não produziu a spec em .agents/specs/${FEATURE_NAME}.md${NC}"
        echo "Verificando se salvou com outro nome..."
        ls -la .agents/specs/ 2>/dev/null || echo "Pasta vazia"
        exit 1
    fi
    echo -e "${GREEN}✅ Spec criada: .agents/specs/${FEATURE_NAME}.md${NC}"
fi

# --- Passo 2: Dev ---
echo ""
echo -e "${GREEN}🔨 [2/3] Agente Dev — Implementando...${NC}"
echo ""

claude -p --dangerously-skip-permissions --model "$MODEL_DEV" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "Leia a spec em .agents/specs/${FEATURE_NAME}.md e implemente. Escreva os arquivos diretamente. Liste arquivos criados em .agents/dev-output.md." < scripts/prompt-dev.md

echo -e "${GREEN}✅ Implementação concluída.${NC}"

# --- Passo 3: QA ---
echo ""
echo -e "${YELLOW}🧪 [3/3] Agente QA — Testando...${NC}"
echo ""

claude -p --dangerously-skip-permissions --model "$MODEL_QA" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "Teste a feature ${FEATURE_NAME}. Leia .agents/specs/${FEATURE_NAME}.md e .agents/dev-output.md. Escreva o relatório EXATAMENTE em .agents/qa/${FEATURE_NAME}.md." < scripts/prompt-qa.md

echo -e "${GREEN}✅ QA concluído: .agents/qa/${FEATURE_NAME}.md${NC}"

# --- Passo 4: Ciclo de revisão ---
if [ -f ".agents/qa/${FEATURE_NAME}.md" ] && grep -q "🚫\|Crítica" ".agents/qa/${FEATURE_NAME}.md" 2>/dev/null; then
    echo ""
    echo -e "${RED}🔄 QA encontrou problemas críticos. Ciclo de revisão...${NC}"

    ITERATION=0
    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))
        echo ""
        echo -e "${YELLOW}--- Iteração $ITERATION/$MAX_ITERATIONS ---${NC}"

        echo -e "${BLUE}📚 EdTech revisando...${NC}"
        claude -p --dangerously-skip-permissions --model "$MODEL_EDTECH" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit" --append-system-prompt "MODO REVISÃO: Leia .agents/qa/${FEATURE_NAME}.md e o código. Escreva revisão em .agents/reviews/${FEATURE_NAME}.md." < scripts/prompt-edtech.md

        echo -e "${GREEN}🔨 Dev corrigindo...${NC}"
        claude -p --dangerously-skip-permissions --model "$MODEL_DEV" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "MODO CORREÇÃO: Leia .agents/reviews/${FEATURE_NAME}.md e corrija os problemas." < scripts/prompt-dev.md

        echo -e "${YELLOW}🧪 QA retestando...${NC}"
        claude -p --dangerously-skip-permissions --model "$MODEL_QA" --max-turns "$MAX_TURNS" --allowedTools "Read,Write,Edit,Bash" --append-system-prompt "RETESTE da feature ${FEATURE_NAME}. Escreva relatório em .agents/qa/${FEATURE_NAME}.md." < scripts/prompt-qa.md

        if ! grep -q "🚫\|Crítica" ".agents/qa/${FEATURE_NAME}.md" 2>/dev/null; then
            echo -e "${GREEN}✅ Problemas críticos resolvidos!${NC}"
            break
        fi
    done
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✅ Pipeline concluído: $FEATURE_NAME${NC}"
echo ""
echo "📄 Spec:    .agents/specs/${FEATURE_NAME}.md"
echo "📄 Dev:     .agents/dev-output.md"
echo "📄 QA:      .agents/qa/${FEATURE_NAME}.md"
echo "📄 Review:  .agents/reviews/${FEATURE_NAME}.md"
echo "=========================================="
