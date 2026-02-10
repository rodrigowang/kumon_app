# Exercises — Canvas de Desenho e Verificação

## Componentes Planejados

- `DrawingCanvas.tsx` — Canvas de captura de escrita manual (react-signature-canvas + perfect-freehand)
- `ExerciseScreen.tsx` — Tela principal de resolução (problema + canvas + submit)
- `SubmitButton.tsx` — Botão de envio com feedback visual
- `ClearButton.tsx` — Botão de limpar canvas (com confirmação infantil)
- `FeedbackOverlay.tsx` — Overlay de feedback (correto/incorreto/quase lá)

## Testabilidade

Todos os componentes devem ter `data-testid`:
- `drawing-canvas`
- `submit-button`
- `clear-button`
- `feedback-overlay`
- `exercise-screen`
