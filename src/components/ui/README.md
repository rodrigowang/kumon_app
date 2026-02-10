# UI Components — Touch-Friendly para Crianças de 7 Anos

## Princípios

- **Touch targets**: ≥ 48px (coordenação motora infantil)
- **Espaçamento**: ≥ 16px entre elementos (evita toques acidentais)
- **Tipografia**: ≥ 24px, sans-serif arredondada
- **Contraste**: ≥ 4.5:1 (WCAG AA)
- **Feedback**: visual + sonoro em toda interação
- **Testabilidade**: todo componente interativo tem `data-testid`

## Componentes Planejados

- `Button.tsx` — Botão grande, arredondado, com feedback tátil
- `IconButton.tsx` — Ícone grande (≥ 48px), sem dependência de texto
- `FeedbackOverlay.tsx` — Animação de sucesso/erro/incentivo
- `ProgressBar.tsx` — Barra visual de progresso (maestria)
