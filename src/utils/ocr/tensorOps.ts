/**
 * Operações de Tensor para OCR com TensorFlow.js
 *
 * Funções puras para normalizar e preparar imagens para o modelo MNIST CNN.
 * Todas as operações usam tf.tidy() para evitar memory leaks.
 *
 * O pipeline converte o canvas (traço preto em fundo transparente) para
 * o formato MNIST (traço branco em fundo preto, 28×28, grayscale).
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Converte canvas para tensor grayscale normalizado [h, w, 1]
 *
 * Extrai o canal alpha (traço=255, fundo=0) pois o DrawingCanvas
 * desenha traços pretos em fundo transparente. O alpha já representa
 * o formato MNIST: traço branco (1.0) sobre fundo preto (0.0).
 *
 * @param canvas - Canvas com dígito desenhado
 * @returns Tensor3D normalizado [h, w, 1] com valores [0, 1]
 */
export function normalize(canvas: HTMLCanvasElement): tf.Tensor3D {
  return tf.tidy(() => {
    const rgba = tf.browser.fromPixels(canvas, 4);

    // Extrai canal alpha (índice 3) — traço=255, fundo=0
    // Isso já dá o formato MNIST: traço branco sobre fundo preto
    const alpha = rgba.slice([0, 0, 3], [-1, -1, 1]);

    return alpha.toFloat().div(255) as tf.Tensor3D;
  });
}

/**
 * Centraliza e redimensiona tensor para 28×28 pixels
 *
 * Redimensiona o dígito para caber em 20×20 (convenção MNIST)
 * e centraliza na grade 28×28 com padding de zeros (fundo preto).
 *
 * @param tensor - Tensor grayscale [h, w, 1]
 * @param srcWidth - Largura original do canvas
 * @param srcHeight - Altura original do canvas
 * @returns Tensor3D [28, 28, 1] centralizado
 */
export function centerAndResize(
  tensor: tf.Tensor3D,
  srcWidth: number,
  srcHeight: number
): tf.Tensor3D {
  return tf.tidy(() => {
    const targetSize = 28;
    // MNIST convenciona dígito em ~20×20 centralizado em 28×28
    const digitArea = 20;

    // Escala mantendo aspect ratio para caber em digitArea×digitArea
    const scale = Math.min(digitArea / srcWidth, digitArea / srcHeight);
    const scaledW = Math.max(1, Math.round(srcWidth * scale));
    const scaledH = Math.max(1, Math.round(srcHeight * scale));

    // Redimensiona com interpolação bilinear
    const resized = tf.image.resizeBilinear(tensor, [scaledH, scaledW]);

    // Centraliza na grade 28×28 com zero-padding (fundo preto)
    const padTop = Math.floor((targetSize - scaledH) / 2);
    const padBottom = targetSize - scaledH - padTop;
    const padLeft = Math.floor((targetSize - scaledW) / 2);
    const padRight = targetSize - scaledW - padLeft;

    return tf.pad(resized, [
      [padTop, padBottom],
      [padLeft, padRight],
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
 * Combina normalize, centerAndResize e toModelInput.
 * Trabalha inteiramente em espaço de tensors (sem roundtrip canvas→tensor→canvas).
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

    // 1. Extrai canal alpha normalizado [h, w, 1]
    const normalized = normalize(canvas);

    // 2. Centraliza e redimensiona para [28, 28, 1]
    const centered = centerAndResize(normalized, width, height);

    // 3. Expande para [1, 28, 28, 1] (batch dimension)
    return toModelInput(centered);
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
