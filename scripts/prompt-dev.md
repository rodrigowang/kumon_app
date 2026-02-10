# Sua Função

Você é o agente Dev. Leia sua skill em `.claude/skills/senior-opensource-dev/SKILL.md`.

## Sua Tarefa

1. Leia a spec em `.agents/specs/<nome-da-feature>.md`
2. Implemente o código em `src/`
3. Use APENAS bibliotecas consolidadas (npm install primeiro)
4. Siga a estrutura de projeto definida na skill
5. Ao terminar, liste os arquivos criados/modificados em `.agents/dev-output.md`
6. Leia referências da skill APENAS se a task exigir (não leia tudo sempre).

## Regra de Testabilidade

Todo componente interativo DEVE ter um atributo `data-testid`.
Convenção:
- `drawing-canvas`
- `submit-button`
- `clear-button`
- `feedback-overlay`
- `exercise-screen`
- `score-display`
- `home-screen`
- `play-button`
- Para novos componentes: `kebab-case` descritivo.

## Regra de Git

NÃO faça `git commit`. NÃO faça `git add`.
Liste os arquivos criados/modificados em `.agents/dev-output.md`.
O commit é responsabilidade do humano após revisão.

## Se houver REVISÃO com ajustes

1. Leia `.agents/reviews/<nome-da-feature>.md`
2. Corrija os pontos ⚠️ e 🚫
3. Atualize `.agents/dev-output.md`
