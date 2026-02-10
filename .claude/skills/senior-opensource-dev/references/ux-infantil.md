# Diretrizes de UX Infantil

Apps para crianças exigem atenção especial. Aplique estas diretrizes em toda decisão de UI.

## Touch Targets e Ergonomia

- **Mínimo 48×48px** para qualquer elemento interativo (botões, campos, canvas)
- Prefira **botões grandes e espaçados** — dedos de criança são imprecisos
- A área de desenho (canvas) deve ocupar a maior parte da tela possível
- Evite gestos complexos (pinch, swipe longo) — toque simples e arrastar são suficientes

## Feedback Imediato

- Todo acerto deve ter **feedback visual + sonoro** (confete, estrela, som de celebração)
- Todo erro deve ter feedback **gentil e encorajador** — nunca punitivo (ex: "Tente de novo!" com animação suave, não "Errado!")
- Use animações curtas (<500ms) para manter o ritmo sem distrair
- Mostre progresso visual (barra, estrelas coletadas, caminho percorrido)

## Navegação e Layout

- **Zero dependência de leitura de texto para navegação** — use ícones, cores e formas
- Ícones devem ser autoexplicativos (▶ para começar, ✓ para confirmar, ← para voltar)
- Fluxo linear e previsível: a criança nunca deve se perder
- Evite menus, dropdowns, modais — componentes que crianças não sabem operar

## Cores e Tipografia

- Use cores vibrantes e contrastantes (sem tons pastéis sutis que se confundem)
- Fonte grande e legível — mínimo 24px para texto principal, 32px+ para números/contas
- Use fontes arredondadas e amigáveis (ex: Nunito, Quicksand, Comic Neue)

## Acessibilidade

- Suporte a modo escuro/claro (pais podem preferir)
- Considere daltonismo — não dependa apenas de cor para comunicar acerto/erro (combine cor + ícone + som)
- Canvas de desenho deve ter espessura de traço generosa (mínimo 4px) para visibilidade
