# SPEC: Layout Tela de Exercício - Estrutura (1.6.1)

**Público-alvo:** Crianças de 7 anos
**Componente:** `<ExerciseScreen />`
**Pedagogia:** Método Kumon (autonomia, foco, repetição)

---

## Requisitos Pedagógicos

### 1. Hierarquia Visual Clara (CPA - Concrete)
- **Exercício sempre visível e fixo.** A criança não pode perder o contexto da pergunta enquanto escreve.
- **Canvas grande e proeminente.** Desenhar é a ação principal. Canvas deve dominar a tela.
- **Botões secundários.** "Limpar" e "Enviar" são auxiliares, não devem competir por atenção com o canvas.

### 2. Zero Fricção Cognitiva
- Criança de 7 anos não deve pensar em "onde escrevo?". Layout deve tornar óbvio que:
  1. Primeiro você lê o exercício
  2. Depois você escreve no canvas
  3. Depois você envia
- **Espaçamento generoso.** Elementos não devem se tocar. Mínimo 16px entre blocos funcionais.

### 3. Responsividade Orientada à Maestria
- **Landscape (tablet deitado):** Lado a lado permite olhar para o exercício enquanto escreve. Isso reduz carga cognitiva.
- **Portrait/Mobile:** Empilhamento vertical é aceitável, MAS o exercício deve estar sempre acima do canvas (ordem de leitura natural).
- **Canvas nunca menor que 60% da viewport.** Se a criança não tem espaço para desenhar confortavelmente, ela vai desistir ou errar por falta de precisão motora.

---

## Critérios de Aceitação

### ✅ Layout Funcional
- [ ] Componente `<ExerciseScreen />` criado em `src/components/exercises/ExerciseScreen.tsx`
- [ ] Layout responsivo funciona em:
  - Tablet landscape (1024×768)
  - Tablet portrait (768×1024)
  - Mobile (375×667)
- [ ] Canvas ocupa ≥60% da área visível em todos os breakpoints
- [ ] Exercício fixo no topo (portrait) ou à esquerda (landscape)

### ✅ Placeholders Estruturais
- [ ] Placeholder para display do exercício (ex: `<Text>5 + 3 = ?</Text>`)
- [ ] Placeholder para `<DrawingCanvas />` (já implementado, pode importar)
- [ ] Placeholder para botões "Limpar" e "Enviar" (não implementar lógica, só UI)

### ✅ Acessibilidade e Testabilidade
- [ ] `data-testid="exercise-screen"` no container principal
- [ ] `data-testid="exercise-display"` no display do exercício
- [ ] `data-testid="canvas-container"` no container do canvas
- [ ] `data-testid="action-buttons"` no grupo de botões

### ✅ UX Infantil
- [ ] Touch targets ≥48px (botões)
- [ ] Fonte do exercício ≥32px (legibilidade)
- [ ] Contraste suficiente (AAA para texto)
- [ ] Nenhum elemento sobreposto ou truncado em nenhum breakpoint

---

## Anti-Patterns (O Que NÃO Fazer)

❌ **Canvas pequeno demais.** Se a criança precisa fazer zoom ou desenhar em área menor que 300×300px, ela vai ter dificuldade motora.
❌ **Exercício escondido/rolável.** A criança não deve precisar rolar a tela para ver a pergunta enquanto escreve.
❌ **Botões grandes demais.** "Enviar" e "Limpar" não devem competir visualmente com o canvas.
❌ **Layout complexo.** Evite Grids de 12 colunas. Use Flex simples ou Grid de 2 colunas no máximo.
❌ **Animações desnecessárias.** Nesta etapa, nenhuma animação. Layout estático e previsível.
❌ **Rolagem horizontal.** Nunca. Crianças não rolam horizontalmente de forma intuitiva.

---

## Orientações para Implementação

### Mantine (Recomendação)
```tsx
// Landscape: Flex com direction="row"
// Portrait: Flex com direction="column"
// Breakpoint: <Tablet é column, ≥Tablet é row
```

### Proporções Sugeridas
- **Landscape:** Exercício 35%, Canvas 65%
- **Portrait:** Exercício 20%, Canvas 70%, Botões 10%

### Ordem de Renderização (Portrait)
1. Display do exercício (topo)
2. Canvas (meio)
3. Botões (rodapé)

---

## Revisão Pedagógica

Esta spec será revisada quando o componente estiver implementado. Checklist de revisão:
1. A criança consegue ver o exercício E o canvas ao mesmo tempo?
2. O canvas é grande o suficiente para desenhar com os dedos sem frustração?
3. Os botões estão acessíveis mas não distraem?
4. O layout funciona em TODOS os dispositivos-alvo?

**Status:** Aguardando implementação
**Próxima etapa:** Dev implementa skeleton → EdTech revisa → QA testa
