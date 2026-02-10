# UI Components — Design System

Sistema de componentes base do Kumon Math App, otimizado para crianças de 7 anos.

## Filosofia

- **Touch-friendly:** Todo botão tem ≥48x48px (guideline iOS/Android)
- **Visual feedback:** Animações de 150-200ms em toda interação
- **Alto contraste:** Paleta vibrante, WCAG AAA (7:1)
- **Testabilidade:** `data-testid` obrigatório em todos os componentes

## Componentes Disponíveis

### Button

Botão com feedback visual e variantes pedagógicas.

```tsx
import { Button } from '@/components/ui'

// Básico
<Button data-testid="submit-button" onClick={handleSubmit}>
  Enviar
</Button>

// Variantes pedagógicas
<Button data-testid="success-button" variant="success" onClick={onCorrect}>
  ✓ Acertei!
</Button>

<Button data-testid="error-button" variant="error" onClick={onWrong}>
  ✗ Tente novamente
</Button>

// Outros estilos
<Button variant="outline" data-testid="cancel-button">
  Cancelar
</Button>
```

**Props:**
- `variant`: `'filled' | 'light' | 'outline' | 'subtle' | 'success' | 'error'`
- `data-testid`: string (obrigatório)
- Aceita todas as props do Mantine Button

---

### Card

Container visual para agrupar conteúdo.

```tsx
import { Card } from '@/components/ui'

<Card data-testid="exercise-card">
  <h2>Exercício 1</h2>
  <p>2 + 3 = ?</p>
</Card>

// Com background customizado
<Card data-testid="result-card" bg="green.0">
  <p>Resposta correta!</p>
</Card>
```

**Props:**
- `data-testid`: string (obrigatório)
- Aceita todas as props do Mantine Paper (shadow, padding, radius, etc.)

---

### Container

Wrapper responsivo para limitar largura de conteúdo.

```tsx
import { Container } from '@/components/ui'

<Container size="md" data-testid="main-container">
  <h1>Meu App</h1>
</Container>
```

**Props:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`
- `data-testid`: string (obrigatório)

---

### Heading

Títulos semânticos com hierarquia (h1-h4).

```tsx
import { Heading } from '@/components/ui'

<Heading level={1} data-testid="page-title">
  Exercícios de Matemática
</Heading>

<Heading level={2} data-testid="section-title">
  Adição
</Heading>
```

**Props:**
- `level`: `1 | 2 | 3 | 4` (padrão: 1)
- `data-testid`: string (obrigatório)
- Aceita todas as props do Mantine Title

**Tamanhos:**
- h1: 40px
- h2: 32px (ideal para números)
- h3: 28px
- h4: 24px (texto base)

---

## Tokens CSS

Variáveis globais disponíveis em `src/theme/tokens.css`:

```css
/* Typography */
--font-family-primary: 'Nunito', sans-serif
--font-size-text: 24px
--font-size-number: 32px
--font-weight-bold: 700

/* Spacing */
--spacing-touch: 8px  /* Mínimo entre touch targets */
--button-min-size: 48px

/* Colors */
--color-primary: #3B82F6
--color-success: #10B981
--color-error: #EF4444
--color-surface: #FFFFFF
--color-background: #F9FAFB

/* Transitions */
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1)
```

## Uso de Classes Utilitárias

```tsx
// Texto em tamanho "número" (32px, bold)
<Text className="text-number">42</Text>

// Texto extra-grande (40px, bold)
<Text className="text-large">100</Text>
```

## Mantine Nativo

Além dos componentes customizados, você pode usar componentes do Mantine diretamente:

```tsx
import { Stack, Group, Text, Divider } from '@mantine/core'
import { notifications } from '@mantine/notifications'

// Layout
<Stack gap="md">...</Stack>
<Group gap="sm">...</Group>

// Tipografia
<Text size="md" fw={700}>Texto</Text>

// Notificações
notifications.show({
  title: 'Sucesso!',
  message: 'Operação concluída',
  color: 'green',
})
```

Documentação oficial: https://mantine.dev/

---

## Diretrizes

1. **Sempre use `data-testid`** em componentes customizados
2. **Touch targets ≥48px**: nunca crie botões menores
3. **Fonte ≥24px**: texto menor que isso é ilegível para crianças
4. **Feedback visual**: toda ação deve ter resposta visual/sonora
5. **Contraste ≥7:1**: use as cores do tema, não inventar cores fracas

## Referência da Spec

Implementado conforme `.agents/specs/ui-framework.md` (v1.0)
