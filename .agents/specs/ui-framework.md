# SPEC: UI Framework (0.2)

**Agente:** EdTech
**Data:** 2026-02-10
**Versão:** 1.0

## Requisitos Pedagógicos

### 1. Acessibilidade Visual (7 anos)
- **Fonte primária:** Nunito (Google Fonts), peso 700 (bold) para números
- **Tamanho de fonte:** mínimo 24px (texto), 32px+ (números)
- **Contraste:** mínimo 7:1 (WCAG AAA) para conteúdo crítico
- **Cores vibrantes:** paleta alegre, sem tons pastéis fracos

### 2. Touch Targets (Motor Skills)
- **Botões:** mínimo 48x48px (seguindo guideline iOS/Android)
- **Espaçamento:** mínimo 8px entre elementos tocáveis
- **Área ativa:** sempre maior ou igual à área visual

### 3. Feedback Imediato (CPA - Concreto)
- Todo botão DEVE ter resposta visual no `onPress` (scale, shadow, color shift)
- Animações curtas: 150-200ms (não mais, não menos)
- Estados claros: idle, pressed, disabled, success, error

### 4. Consistência (Maestria)
- Uma única biblioteca de componentes (Shadcn OU Mantine, não ambos)
- Tokens CSS definidos globalmente (CSS variables)
- Componentes reutilizáveis para: Button, Card, Container, Heading

## Critérios de Aceitação

**✅ DEVE ter:**
1. Fonte Nunito carregada via Google Fonts
2. Tokens CSS definidos:
   - `--font-size-number: 32px`
   - `--button-min-size: 48px`
   - `--spacing-touch: 8px`
   - Paleta de cores (primary, success, error, surface)
3. Componente `<Button>` com:
   - Tamanho mínimo 48px
   - Estados visuais (hover, active, disabled)
   - `data-testid` obrigatório
4. Tema aplicado globalmente (não inline styles)
5. Documentação: como usar componentes (em comentários ou README)

**⚠️ PODE ter:**
- Dark mode (não obrigatório para MVP)
- Animações adicionais (desde que não atrasem feedback)

**🚫 NÃO DEVE:**
- Usar fonte menor que 24px em qualquer texto
- Criar botões menores que 48px
- Usar cores de baixo contraste (<4.5:1)
- Misturar Shadcn + Mantine (escolha UM)
- Deixar componentes sem `data-testid`

## Anti-Patterns

- ❌ Fonte genérica (Arial, sans-serif) sem carregar Nunito
- ❌ Botões com padding inconsistente
- ❌ Estilos inline em vez de tema global
- ❌ Componentes sem estados hover/active
- ❌ Animações longas (>300ms) que atrasam feedback

## Notas de Implementação

- **Shadcn:** mais controle, menos opinionated. Requer configuração manual de tokens.
- **Mantine:** mais batteries-included, tema já tem touch-friendly defaults.
- **Recomendação:** Mantine se o dev quiser velocidade. Shadcn se quiser controle total.

## Validação QA

Após implementação, QA DEVE testar:
1. Fonte Nunito renderizando em todos os navegadores
2. Botões respondem ao toque em tablet (touch events)
3. Contraste de cores passa validação WCAG AAA
4. Tokens CSS aplicados consistentemente

---

**Aprovação necessária:** Dev pode escolher Shadcn OU Mantine, mas deve justificar escolha em `.agents/dev-output.md`.
