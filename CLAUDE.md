# Kumon Math App

App de matemática para crianças de 7 anos, estilo Kumon. Escrita à mão (OCR) como input principal.

## Stack

React 18 + TypeScript 5 + Vite. Rodar em browser (tablet/celular). Linux Mint.

## Skills

| Agente | Skill | Quando usar |
|--------|-------|-------------|
| Dev | `.claude/skills/senior-opensource-dev/SKILL.md` | Implementar features, instalar libs, escrever código |
| EdTech | `.claude/skills/edtech-specialist/SKILL.md` | Definir requisitos pedagógicos, revisar features |
| QA | `.claude/skills/child-qa-tester/SKILL.md` | Testar, gerar cenários, validar antes de release |

**Regra**: Leia APENAS a skill indicada no prompt. Não leia as outras.

## Comunicação entre agentes

```
.agents/
├── current-task.md    ← Descrição da task atual
├── specs/             ← EdTech escreve specs aqui
├── reviews/           ← EdTech escreve revisões aqui
├── qa/                ← QA escreve relatórios aqui
└── dev-output.md      ← Dev lista arquivos criados/modificados
```

## Regras globais

- Público-alvo: crianças de 7 anos. Toda decisão de UI passa por esse filtro.
- Filosofia dev: importar bibliotecas > escrever do zero.
- Touch targets ≥ 48px. Fonte ≥ 24px. Zero dependência de leitura para navegar.
- Feedback visual + sonoro em toda interação. Erros tratados com gentileza, nunca punição.
- TypeScript strict. Sem `any`.
- Todo componente interativo DEVE ter `data-testid`. Convenção: `drawing-canvas`, `submit-button`, `clear-button`, `feedback-overlay`, `exercise-screen`, `score-display`, `home-screen`, `play-button`.
- NÃO faça `git commit`. Liste arquivos criados/modificados em `.agents/dev-output.md`. Commit é responsabilidade do humano.
