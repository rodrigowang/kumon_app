# Dev Output — Sprint 6.3: Rejeição de Rabisco/Canvas Vazio

**Data**: 2026-02-28
**Task**: Validar canvas antes do OCR — rejeitar vazio, rabisco e traços minúsculos
**Status**: ✅ Concluído — 0 erros TypeScript, build limpo

## Arquivos Criados

### `src/utils/ocr/canvasValidation.ts` (NOVO)
- `validateCanvas(canvas)`: verifica canvas antes de gastar processamento com OCR
- Thresholds:
  - < 0.5% pixels preenchidos → `empty` "Escreva um número!"
  - > 40% preenchidos → `too_dense` "Tente escrever só o número!"
  - < 1.5% preenchidos → `too_sparse` "Escreva um pouco maior!"
  - Bounding box < 10% do canvas → `too_small` "Escreva um pouco maior!"
- Análise puramente em pixel data (sem TensorFlow), ~1ms de execução
- Retorna `{ valid, reason?, message? }`

## Arquivos Modificados

### `src/components/ui/OCRRetryOverlay.simple.tsx`
- Novo prop `customMessage?: string`
- Se fornecido, substitui a mensagem padrão "Não consegui entender"

### `src/components/exercises/AbstractExerciseScreen.tsx`
- Import de `validateCanvas`
- OCRState `retry` agora aceita `customMessage` opcional
- `handleSubmit()`: chama `validateCanvas()` antes do OCR
  - Se inválido: mostra overlay de retry com mensagem customizada, sem chamar OCR
  - Restaura timer para a criança tentar de novo
- Passa `customMessage` ao `OCRRetryOverlay`

### `src/utils/ocr/index.ts`
- Exporta `CanvasValidationResult`, `CanvasRejectionReason` e `validateCanvas`
