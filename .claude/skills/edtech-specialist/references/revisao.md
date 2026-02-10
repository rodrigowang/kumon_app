# Protocolo de Revisão Crítica

Quando uma feature for implementada, avalie usando estes checklists.

## Checklist Pedagógico

1. ☐ **CPA respeitado?** A feature introduz conceitos partindo do concreto? Ou pula direto para o abstrato?
2. ☐ **Small steps?** A progressão é incremental? Ou há saltos de dificuldade?
3. ☐ **Maestria antes de avanço?** O sistema exige fluência antes de progredir? Ou avança por quantidade de exercícios feitos?
4. ☐ **Repetição disfarçada?** Quando há erro, a repetição vem com roupagem nova? Ou repete o mesmo exercício?
5. ☐ **Handwriting first?** O canvas de escrita é o input principal? Ou o teclado domina?

## Checklist Emocional

6. ☐ **Feedback gentil?** O erro é tratado como aprendizado? Ou há linguagem punitiva?
7. ☐ **Celebração proporcional?** Acertos são celebrados? Maestria é celebrada de forma especial?
8. ☐ **Sem ansiedade?** Não há timer visível, ranking, ou pressão competitiva?
9. ☐ **Progresso tangível?** A criança vê seu avanço de forma concreta e colecionável?

## Checklist UX Infantil

10. ☐ **Sem leitura obrigatória?** A criança navega por ícones e cores, não por texto?
11. ☐ **Botões grandes?** Touch targets ≥ 48px?
12. ☐ **Zero distração?** Tela limpa, sem elementos competindo por atenção?
13. ☐ **Fluxo linear?** A criança sabe intuitivamente o que fazer a seguir?

## Formato de Revisão

```
## Revisão: [Nome da Feature]

### ✅ Aprovado
- [O que está correto e alinhado com os princípios]

### ⚠️ Ajustes Necessários
- [O que precisa mudar, com justificativa pedagógica]

### 🚫 Vetado
- [O que viola princípios invioláveis e deve ser removido/refeito]

### 💡 Sugestões
- [Melhorias opcionais que elevariam a qualidade]
```

## Exemplos de Avaliação

### Exemplo 1 — Feature: Tela de exercício de soma

> O dev implementou uma tela com `3 + 2 = ___` e um campo de input de teclado.

Revisão:
- 🚫 **Vetado**: Input de teclado como elemento principal viola o princípio Handwriting First. O canvas de escrita deve ser o input central.
- 🚫 **Vetado**: Exercício começa na fase abstrata sem oferecer CPA. Onde está a fase concreta (arrastar objetos)?
- ⚠️ Falta feedback sonoro e visual para acerto/erro.
- 💡 Adicionar um botão "Ver com objetos" que regride para visualização concreta como dica.

### Exemplo 2 — Feature: Sistema de progresso com barra de porcentagem

> O dev implementou uma barra que mostra "45% concluído" no topo da tela.

Revisão:
- 🚫 **Vetado**: Porcentagem é abstrata demais para 7 anos. Substituir por metáfora visual (mapa, jardim, álbum).
- ⚠️ A barra está fixa no topo, ocupando espaço durante os exercícios. Progresso deve ser visível na tela inicial, não durante a prática (distração).
- 💡 Criar um "mundo" que a criança constrói peça a peça — cada maestria desbloqueia uma parte nova.
