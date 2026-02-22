/**
 * Operações de Tensor para OCR com TensorFlow.js
 *
 * Funções puras para normalizar e preparar imagens para o modelo MNIST CNN.
 * Todas as operações usam tf.tidy() para evitar memory leaks.
 *
 * O pipeline converte o canvas (traço preto em fundo branco/transparente) para
 * o formato MNIST (traço branco em fundo preto, 28×28, grayscale).
 *
 * Melhorias (Sprint 5.1):
 * - Luminância em vez de canal alpha (robusto a fundo branco opaco)
 * - Centro de massa em vez de centro geométrico (como MNIST original)
 * - Binarização com threshold (remove ruído de antialiasing)
 * - Normalização de espessura de traço (erosão/dilatação morfológica)
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Converte canvas para tensor grayscale no formato MNIST [h, w, 1]
 *
 * Usa luminância (média RGB) e inverte: traço escuro → branco, fundo claro → preto.
 * Robusto tanto para fundo transparente quanto branco opaco.
 *
 * @param canvas - Canvas com dígito desenhado
 * @returns Tensor3D normalizado [h, w, 1] com valores [0, 1]
 */
export function normalize(canvas: HTMLCanvasElement): tf.Tensor3D {
  return tf.tidy(() => {
    const rgba = tf.browser.fromPixels(canvas, 4);
    const floatRgba = rgba.toFloat();

    // Extrai canais separados
    const r = floatRgba.slice([0, 0, 0], [-1, -1, 1]);
    const g = floatRgba.slice([0, 0, 1], [-1, -1, 1]);
    const b = floatRgba.slice([0, 0, 2], [-1, -1, 1]);
    const a = floatRgba.slice([0, 0, 3], [-1, -1, 1]);

    // Luminância: (R + G + B) / 3
    const luminance = r.add(g).add(b).div(3);

    // Compõe com fundo branco onde alpha < 255 (fundo transparente → branco)
    // composited = lum * (alpha/255) + 255 * (1 - alpha/255)
    const alphaNorm = a.div(255);
    const composited = luminance.mul(alphaNorm).add(
      tf.scalar(255).mul(tf.scalar(1).sub(alphaNorm))
    );

    // Inverte: traço escuro (0) → branco (1.0), fundo claro (255) → preto (0.0)
    const inverted = tf.scalar(255).sub(composited).div(255);

    return inverted as tf.Tensor3D;
  });
}

/**
 * Aplica binarização com threshold para remover ruído de antialiasing
 *
 * Pixels acima do threshold viram 1.0 (traço), abaixo viram 0.0 (fundo).
 *
 * @param tensor - Tensor grayscale [h, w, 1] com valores [0, 1]
 * @param threshold - Valor de corte (padrão: 0.3)
 * @returns Tensor3D binarizado [h, w, 1]
 */
export function binarize(tensor: tf.Tensor3D, threshold: number = 0.3): tf.Tensor3D {
  return tf.tidy(() => {
    // pixel > threshold ? 1.0 : 0.0
    return tensor.greater(threshold).toFloat() as tf.Tensor3D;
  });
}

/**
 * Aplica dilatação morfológica 3x3 (expande traços)
 *
 * Equivalente a max-pooling com padding same.
 * Cada pixel assume o valor máximo dos seus 8 vizinhos + ele mesmo.
 */
function dilate(tensor: tf.Tensor3D): tf.Tensor3D {
  return tf.tidy(() => {
    // maxPool precisa de 4D: [1, h, w, 1]
    const batched = tensor.expandDims(0) as tf.Tensor4D;
    const dilated = tf.maxPool(batched, 3, 1, 'same');
    return dilated.squeeze([0]) as tf.Tensor3D;
  });
}

/**
 * Aplica erosão morfológica 3x3 (encolhe traços)
 *
 * Erosão = inverso da dilatação do inverso.
 * Cada pixel assume o valor mínimo dos vizinhos (min-pool).
 */
function erode(tensor: tf.Tensor3D): tf.Tensor3D {
  return tf.tidy(() => {
    // min-pool = negar → max-pool → negar
    const inverted = tf.scalar(1).sub(tensor);
    const batched = inverted.expandDims(0) as tf.Tensor4D;
    const dilated = tf.maxPool(batched, 3, 1, 'same');
    return tf.scalar(1).sub(dilated.squeeze([0])) as tf.Tensor3D;
  });
}

/**
 * Normaliza espessura do traço para ~2-3px no espaço 28x28 (como MNIST)
 *
 * Calcula a fração de pixels de traço (stroke ratio).
 * Se traço muito grosso (>15% dos pixels), aplica erosão para afinar.
 * Se traço muito fino (<5% dos pixels), aplica dilatação para engrossar.
 *
 * @param tensor - Tensor binarizado [h, w, 1]
 * @returns Tensor3D com espessura normalizada [h, w, 1]
 */
export function normalizeStrokeWidth(tensor: tf.Tensor3D): tf.Tensor3D {
  // Calcula stroke ratio fora do tidy para usar o valor
  const meanVal = tensor.mean().dataSync()[0];

  // Limites calibrados para MNIST (~8-12% de pixels brancos em 28x28)
  const thickThreshold = 0.15;
  const thinThreshold = 0.05;

  if (meanVal > thickThreshold) {
    // Traço muito grosso → erosão para afinar
    return erode(tensor);
  } else if (meanVal < thinThreshold && meanVal > 0.001) {
    // Traço muito fino → dilatação para engrossar (mas não se vazio)
    return dilate(tensor);
  }

  // Espessura OK — retorna cópia
  return tf.tidy(() => tensor.clone() as tf.Tensor3D);
}

/**
 * Calcula centro de massa do tensor (como o MNIST original foi preprocessado)
 *
 * Retorna coordenadas (cx, cy) do centroide ponderado por intensidade.
 *
 * @param tensor - Tensor grayscale [h, w, 1]
 * @returns { cx, cy } coordenadas do centro de massa
 */
export function centerOfMass(tensor: tf.Tensor3D): { cx: number; cy: number } {
  const data = tensor.dataSync();
  const [h, w] = tensor.shape;

  let totalMass = 0;
  let sumX = 0;
  let sumY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const val = data[y * w + x];
      totalMass += val;
      sumX += x * val;
      sumY += y * val;
    }
  }

  if (totalMass === 0) {
    return { cx: w / 2, cy: h / 2 };
  }

  return {
    cx: sumX / totalMass,
    cy: sumY / totalMass,
  };
}

/**
 * Centraliza tensor pelo centro de massa e redimensiona para 28x28
 *
 * Posiciona o centroide no centro do grid 28x28, como o MNIST original.
 * O dígito é redimensionado para caber em 20x20 (convenção MNIST).
 *
 * @param tensor - Tensor grayscale [h, w, 1]
 * @param srcWidth - Largura original
 * @param srcHeight - Altura original
 * @returns Tensor3D [28, 28, 1] centralizado pelo centro de massa
 */
export function centerAndResize(
  tensor: tf.Tensor3D,
  srcWidth: number,
  srcHeight: number
): tf.Tensor3D {
  return tf.tidy(() => {
    const targetSize = 28;
    const digitArea = 20;

    // Redimensiona mantendo aspect ratio para caber em 20x20
    const scale = Math.min(digitArea / srcWidth, digitArea / srcHeight);
    const scaledW = Math.max(1, Math.round(srcWidth * scale));
    const scaledH = Math.max(1, Math.round(srcHeight * scale));

    const resized = tf.image.resizeBilinear(tensor, [scaledH, scaledW]);

    // Calcula centro de massa no espaço redimensionado
    const com = centerOfMass(resized);

    // Offset para posicionar o centro de massa no centro do grid 28x28
    const targetCenter = targetSize / 2; // 14
    const shiftX = Math.round(targetCenter - com.cx);
    const shiftY = Math.round(targetCenter - com.cy);

    // Calcula padding assimétrico baseado no centro de massa
    const padLeft = Math.max(0, shiftX);
    const padTop = Math.max(0, shiftY);
    const padRight = Math.max(0, targetSize - scaledW - padLeft);
    const padBottom = Math.max(0, targetSize - scaledH - padTop);

    // Se o padding resultante não dá exatamente 28x28, ajusta
    const totalW = padLeft + scaledW + padRight;
    const totalH = padTop + scaledH + padBottom;

    let adjustedPadRight = padRight;
    let adjustedPadBottom = padBottom;
    let adjustedPadLeft = padLeft;
    let adjustedPadTop = padTop;

    if (totalW < targetSize) {
      adjustedPadRight += targetSize - totalW;
    } else if (totalW > targetSize) {
      // Reduz padding se excede — recorta do lado que tem mais
      const excess = totalW - targetSize;
      if (adjustedPadRight >= excess) {
        adjustedPadRight -= excess;
      } else {
        adjustedPadLeft -= excess - adjustedPadRight;
        adjustedPadRight = 0;
      }
    }

    if (totalH < targetSize) {
      adjustedPadBottom += targetSize - totalH;
    } else if (totalH > targetSize) {
      const excess = totalH - targetSize;
      if (adjustedPadBottom >= excess) {
        adjustedPadBottom -= excess;
      } else {
        adjustedPadTop -= excess - adjustedPadBottom;
        adjustedPadBottom = 0;
      }
    }

    // Garante não-negativo
    adjustedPadLeft = Math.max(0, adjustedPadLeft);
    adjustedPadRight = Math.max(0, adjustedPadRight);
    adjustedPadTop = Math.max(0, adjustedPadTop);
    adjustedPadBottom = Math.max(0, adjustedPadBottom);

    // Se a imagem redimensionada é maior que 28, crop ao centro
    let topad = resized;
    if (scaledW > targetSize || scaledH > targetSize) {
      const cropX = Math.max(0, Math.floor((scaledW - targetSize) / 2));
      const cropY = Math.max(0, Math.floor((scaledH - targetSize) / 2));
      const cropW = Math.min(scaledW, targetSize);
      const cropH = Math.min(scaledH, targetSize);
      topad = resized.slice([cropY, cropX, 0], [cropH, cropW, 1]);
      adjustedPadLeft = Math.max(0, Math.floor((targetSize - cropW) / 2));
      adjustedPadRight = Math.max(0, targetSize - cropW - adjustedPadLeft);
      adjustedPadTop = Math.max(0, Math.floor((targetSize - cropH) / 2));
      adjustedPadBottom = Math.max(0, targetSize - cropH - adjustedPadTop);
    }

    return tf.pad(topad, [
      [adjustedPadTop, adjustedPadBottom],
      [adjustedPadLeft, adjustedPadRight],
      [0, 0],
    ]) as tf.Tensor3D;
  });
}

/**
 * Converte tensor normalizado para formato de entrada do modelo CNN
 *
 * Adiciona dimensão de batch: [28, 28, 1] → [1, 28, 28, 1] para modelo Conv2D.
 *
 * @param tensor - Tensor normalizado [28, 28, 1]
 * @returns Tensor4D pronto para inferência [1, 28, 28, 1]
 */
export function toModelInput(tensor: tf.Tensor3D): tf.Tensor4D {
  return tf.tidy(() => {
    return tensor.expandDims(0) as tf.Tensor4D;
  });
}

/**
 * Pipeline completo: canvas → tensor de entrada do modelo CNN
 *
 * Etapas (Sprint 5.1):
 * 1. Luminância invertida (traço escuro → branco, fundo claro → preto)
 * 2. Binarização (remove ruído de antialiasing)
 * 3. Centralização pelo centro de massa (como MNIST original)
 * 4. Normalização de espessura de traço
 * 5. Expansão para batch dimension
 *
 * @param canvas - Canvas recortado com dígito
 * @returns Tensor4D [1, 28, 28, 1] pronto para modelo MNIST CNN
 */
export function prepareForModel(canvas: HTMLCanvasElement): tf.Tensor4D {
  return tf.tidy(() => {
    const { width, height } = canvas;

    if (width === 0 || height === 0) {
      return tf.zeros([1, 28, 28, 1]) as tf.Tensor4D;
    }

    // 1. Luminância invertida [h, w, 1] — robusto a fundo branco ou transparente
    const normalized = normalize(canvas);

    // 2. Binarização — remove artefatos de antialiasing
    const binary = binarize(normalized);

    // 3. Centraliza pelo centro de massa e redimensiona para [28, 28, 1]
    const centered = centerAndResize(binary, width, height);

    // 4. Normaliza espessura do traço
    const strokeNorm = normalizeStrokeWidth(centered);

    // 5. Expande para [1, 28, 28, 1] (batch dimension)
    return toModelInput(strokeNorm);
  });
}

/**
 * Libera memória de tensor manualmente
 *
 * @param tensor - Tensor a ser descartado
 */
export function disposeTensor(tensor: tf.Tensor): void {
  tensor.dispose();
}
