# Kumon Math App

App de matemática para crianças de 7 anos, estilo Kumon.

## Rodar

```bash
npm install
npm run dev
```

## Testar

```bash
npm run test          # unitários (Vitest)
npm run test:e2e      # E2E (Playwright + Chromium)
npm run test:all      # tudo
```

## Estrutura

```
src/             — código fonte
tests/           — testes (unit + e2e)
.claude/skills/  — skills dos agentes
.agents/         — comunicação entre agentes
scripts/         — orquestrador multi-agent
docs/            — documentação do projeto
```

## Multi-Agent

```bash
# Pipeline completo (EdTech → Dev → QA)
./scripts/orchestrate.sh <nome-da-feature>

# Agente solo
./scripts/orchestrate.sh --dev "instrução"
./scripts/orchestrate.sh --edtech "instrução"
./scripts/orchestrate.sh --qa "instrução"
```
