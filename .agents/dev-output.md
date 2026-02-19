# Dev Output — Upgrade OCR: Modelo CNN Pré-treinado

**Data**: 2026-02-11
**Task**: Trocar modelo OCR Dense por CNN pré-treinado
**Status**: ✅ Implementado

---

## TL;DR

O modelo MNIST era uma única camada Dense (regressão logística, ~92% acurácia). Substituído por CNN pré-treinado do SciSharp/Keras.NET (Conv2D×2 + Dense, ~99% acurácia). Ajustado todo o pipeline de tensors para shape 4D `[1, 28, 28, 1]`.

---

## Problema

- Modelo antigo: 1 camada Dense (784→10), 7.840 parâmetros, ~92% no MNIST limpo
- Escrita de criança de 7 anos: acurácia muito inferior
- Input era achatado [1, 784] — perdia informação espacial

## Solução

### Modelo novo (SciSharp/Keras.NET)
- Conv2D(32, 3×3, ReLU) → Conv2D(64, 3×3, ReLU) → MaxPool(2×2) → Dropout(0.25) → Dense(128, ReLU) → Dropout(0.5) → Dense(10, Softmax)
- Input: [1, 28, 28, 1] (preserva informação espacial)
- ~600K parâmetros, ~99% acurácia no MNIST
- Tamanho: ~4.8MB (model.json + 2 weight shards)

---

## Arquivos modificados

1. `public/models/mnist/model.json` — Substituído por modelo CNN
2. `public/models/mnist/group1-shard1of2.bin` — Weight shard 1 (novo)
3. `public/models/mnist/group1-shard2of2.bin` — Weight shard 2 (novo)
4. `src/utils/ocr/tensorOps.ts` — Output de `Tensor2D [1,784]` → `Tensor4D [1,28,28,1]`
5. `src/utils/ocr/predict.ts` — Tipos atualizados para `Tensor4D`
6. `src/utils/ocr/segment.ts` — Tipo de retorno atualizado para `Tensor4D[]`
7. `src/hooks/useOCRModel.ts` — Warmup shape atualizado para `[1,28,28,1]`

## Fix: devicePixelRatio no DrawingCanvas

### Problema
O canvas não escalava por `devicePixelRatio`. Em tablet com DPR=2:
- Criança desenhava numa área visual de 800×600 device pixels
- Canvas interno tinha apenas 400×300 pixels
- CSS esticava 2x → resolução do desenho era metade do visível
- OCR recebia imagem de baixa resolução

### Correção (`DrawingCanvas.tsx`)
- `canvas.width/height` agora multiplicado por `devicePixelRatio`
- `ctx.scale(dpr, dpr)` aplicado para manter coordenadas CSS 1:1
- `setTransform` + `scale` em cada repaint para evitar scale acumulativo
- `clear()` também reseta transform corretamente

## Arquivos removidos

1. `public/models/mnist/group1-shard1of1` — Weight do modelo Dense antigo

## Todos os arquivos modificados (resumo final)

1. `public/models/mnist/*` — Modelo CNN substituído
2. `src/utils/ocr/tensorOps.ts` — Shape `[1,784]` → `[1,28,28,1]`
3. `src/utils/ocr/predict.ts` — Tipos `Tensor2D` → `Tensor4D`
4. `src/utils/ocr/segment.ts` — Retorno `Tensor2D[]` → `Tensor4D[]`
5. `src/hooks/useOCRModel.ts` — Warmup shape corrigido
6. `src/components/canvas/DrawingCanvas.tsx` — DPR scaling
