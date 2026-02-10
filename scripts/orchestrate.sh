#!/bin/bash

# ============================================
# Orquestrador Multi-Agent para Claude Code
# ============================================

set -e

# --- Configuração de Modelos ---
MODEL_EDTECH="claude-sonnet-4-20250514"
MODEL_DEV="claude-sonnet-4-20250514"
MODEL_QA="claude-haiku-4-5-20251001"

# --- Configuração Geral ---
MAX_TURNS=15
MAX_ITERATIONS=3

# --- Cores para output ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Funções de agente solo
# ============================================

run-edtech() {
    echo -e "${BLUE}📚 Rodando EdTech solo...${NC}"
    cat scripts/prompt-edtech.md | claude --print \
        --model "$MODEL_EDTECH" \
        --max-turns "$MAX_TURNS" \
        --allowedTools "read,write,edit" \
        --appendSystemPrompt "$1"
}

run-dev() {
    echo -e "${GREEN}🔨 Rodando Dev solo...${NC}"
    cat scripts/prompt-dev.md | claude --print \
        --model "$MODEL_DEV" \
        --max-turns "$MAX_TURNS" \
        --allowedTools "read,write,edit,bash" \
        --appendSystemPrompt "$1"
}

run-qa() {
    echo -e "${YELLOW}🧪 Rodando QA solo...${NC}"
    cat scripts/prompt-qa.md | claude --print \
        --model "$MODEL_QA" \
        --max-turns "$MAX_TURNS" \
        --allowedTools "read,write,edit,bash" \
        --appendSystemPrompt "$1"
}

# ============================================
# Modo de uso
# ============================================

usage() {
    echo "Uso:"
    echo "  Pipeline completo:  ./scripts/orchestrate.sh <nome-da-feature>"
    echo "  Agente solo:        ./scripts/orchestrate.sh --dev <instrução>"
    echo "                      ./scripts/orchestrate.sh --edtech <instrução>"
    echo "                      ./scripts/orchestrate.sh --qa <instrução>"
    echo ""
    echo "Exemplos:"
    echo "  ./scripts/orchestrate.sh canvas-desenho"
    echo "  ./scripts/orchestrate.sh --dev 'Corrija o bug no botão enviar'"
    echo "  ./scripts/orchestrate.sh --qa 'Rode os testes E2E do canvas'"
    exit 1
}

# ============================================
# Rodar agente solo (se flag passada)
# ============================================

case "${1:-}" in
    --dev)
        shift
        run-dev "$*"
        exit 0
        ;;
    --edtech)
        shift
        run-edtech "$*"
        exit 0
        ;;
    --qa)
        shift
        run-qa "$*"
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

# --- Passo 1: EdTech define a spec (com cache) ---
if [ -f ".agents/specs/${FEATURE_NAME}.md" ]; then
    echo -e "${YELLOW}📋 Spec já existe. Pulando EdTech.${NC}"
    echo "   (delete .agents/specs/${FEATURE_NAME}.md para re-gerar)"
else
    echo -e "${BLUE}📚 [1/3] Agente EdTech — Definindo spec...${NC}"
    echo ""

    cat scripts/prompt-edtech.md | claude --print \
        --model "$MODEL_EDTECH" \
        --max-turns "$MAX_TURNS" \
        --allowedTools "read,write,edit" \
        --appendSystemPrompt "Leia .agents/current-task.md e produza a spec em .agents/specs/${FEATURE_NAME}.md"

    if [ ! -f ".agents/specs/${FEATURE_NAME}.md" ]; then
        echo -e "${RED}❌ EdTech não produziu a spec. Abortando.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Spec criada: .agents/specs/${FEATURE_NAME}.md${NC}"
fi

# --- Passo 2: Dev implementa ---
echo ""
echo -e "${GREEN}🔨 [2/3] Agente Dev — Implementando...${NC}"
echo ""

cat scripts/prompt-dev.md | claude --print \
    --model "$MODEL_DEV" \
    --max-turns "$MAX_TURNS" \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "Leia a spec em .agents/specs/${FEATURE_NAME}.md e implemente."

echo -e "${GREEN}✅ Implementação concluída.${NC}"

# --- Passo 3: QA testa ---
echo ""
echo -e "${YELLOW}🧪 [3/3] Agente QA — Testando...${NC}"
echo ""

cat scripts/prompt-qa.md | claude --print \
    --model "$MODEL_QA" \
    --max-turns "$MAX_TURNS" \
    --allowedTools "read,write,edit,bash" \
    --appendSystemPrompt "Teste a feature ${FEATURE_NAME}. Leia .agents/specs/${FEATURE_NAME}.md e .agents/dev-output.md."

echo -e "${GREEN}✅ QA concluído: .agents/qa/${FEATURE_NAME}.md${NC}"

# --- Passo 4: Ciclo de revisão (se QA encontrou problemas críticos) ---
if grep -q "🚫\|Crítica" ".agents/qa/${FEATURE_NAME}.md" 2>/dev/null; then
    echo ""
    echo -e "${RED}🔄 QA encontrou problemas críticos. Iniciando ciclo de revisão...${NC}"

    ITERATION=0
    while [ $ITERATION -lt $MAX_ITERATIONS ]; do
        ITERATION=$((ITERATION + 1))
        echo ""
        echo -e "${YELLOW}--- Iteração $ITERATION/$MAX_ITERATIONS ---${NC}"

        # EdTech revisa
        echo -e "${BLUE}📚 EdTech revisando...${NC}"
        cat scripts/prompt-edtech.md | claude --print \
            --model "$MODEL_EDTECH" \
            --max-turns "$MAX_TURNS" \
            --allowedTools "read,write,edit" \
            --appendSystemPrompt "MODO REVISÃO: Leia .agents/qa/${FEATURE_NAME}.md e o código. Produza revisão em .agents/reviews/${FEATURE_NAME}.md"

        # Dev corrige
        echo -e "${GREEN}🔨 Dev corrigindo...${NC}"
        cat scripts/prompt-dev.md | claude --print \
            --model "$MODEL_DEV" \
            --max-turns "$MAX_TURNS" \
            --allowedTools "read,write,edit,bash" \
            --appendSystemPrompt "MODO CORREÇÃO: Leia .agents/reviews/${FEATURE_NAME}.md e corrija."

        # QA retesta
        echo -e "${YELLOW}🧪 QA retestando...${NC}"
        cat scripts/prompt-qa.md | claude --print \
            --model "$MODEL_QA" \
            --max-turns "$MAX_TURNS" \
            --allowedTools "read,write,edit,bash" \
            --appendSystemPrompt "RETESTE da feature ${FEATURE_NAME} após correções."

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
echo "📄 QA:      .agents/qa/${FEATURE_NAME}.md"
echo "📄 Review:  .agents/reviews/${FEATURE_NAME}.md"
echo "📄 Dev:     .agents/dev-output.md"
echo "=========================================="
