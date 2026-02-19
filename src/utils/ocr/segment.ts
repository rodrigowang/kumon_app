/**
 * Segmentação de Múltiplos Dígitos
 *
 * Analisa canvas horizontalmente para separar dígitos distintos.
 * Retorna um tensor preparado para cada dígito encontrado.
 */

import * as tf from '@tensorflow/tfjs';
import { extractImageData, cropToDigit, type BoundingBox } from './imageProcessing';
import { prepareForModel } from './tensorOps';

/**
 * Calcula projeção horizontal do canvas (soma de pixels por coluna)
 *
 * @param imageData - Dados de pixels do canvas
 * @param alphaThreshold - Valor mínimo de alpha para considerar pixel como "traço"
 * @returns Array onde cada índice é a soma de pixels da coluna correspondente
 */
function horizontalProjection(
  imageData: ImageData,
  alphaThreshold: number = 50
): number[] {
  const { width, height, data } = imageData;
  const projection = new Array(width).fill(0);

  // Para cada coluna, soma os pixels que passam o threshold
  for (let x = 0; x < width; x++) {
    let columnSum = 0;
    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha >= alphaThreshold) {
        columnSum++;
      }
    }
    projection[x] = columnSum;
  }

  return projection;
}

/**
 * Encontra regiões de dígitos a partir da projeção horizontal
 *
 * Identifica "ilhas" de pixels separadas por vales (colunas vazias).
 * Usa tolerância para evitar que espaços pequenos (como dentro do "8") separem o dígito.
 *
 * @param projection - Array de projeção horizontal
 * @param minGapWidth - Largura mínima de gap (em pixels) para considerar separação entre dígitos
 * @param minDigitWidth - Largura mínima (em pixels) para considerar uma região como dígito válido
 * @returns Array de ranges [start, end] representando cada dígito
 */
function findDigitRanges(
  projection: number[],
  minGapWidth: number = 8,
  minDigitWidth: number = 5
): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let inDigit = false;
  let digitStart = 0;
  let gapStart = 0;
  let gapWidth = 0;

  for (let x = 0; x < projection.length; x++) {
    const hasPixels = projection[x] > 0;

    if (hasPixels) {
      if (!inDigit) {
        // Começou um novo dígito
        digitStart = x;
        inDigit = true;
        gapWidth = 0;
      } else {
        // Continuando dentro do dígito, reseta contador de gap
        gapWidth = 0;
      }
    } else {
      if (inDigit) {
        if (gapWidth === 0) {
          // Início de um possível gap
          gapStart = x;
        }
        gapWidth++;

        // Se o gap for largo o suficiente, termina o dígito atual
        if (gapWidth >= minGapWidth) {
          const digitEnd = gapStart - 1;
          const width = digitEnd - digitStart + 1;

          // Valida largura mínima antes de adicionar
          if (width >= minDigitWidth) {
            ranges.push([digitStart, digitEnd]);
          }

          inDigit = false;
          gapWidth = 0;
        }
      }
    }
  }

  // Se terminou ainda dentro de um dígito, fecha o último range
  if (inDigit) {
    const digitEnd = projection.length - 1;
    const width = digitEnd - digitStart + 1;
    if (width >= minDigitWidth) {
      ranges.push([digitStart, digitEnd]);
    }
  }

  return ranges;
}

/**
 * Segmenta múltiplos dígitos do canvas e retorna tensors prontos para o modelo
 *
 * Pipeline:
 * 1. Analisa projeção horizontal do canvas
 * 2. Identifica regiões de dígitos separadas por gaps
 * 3. Recorta cada dígito em um canvas separado
 * 4. Prepara cada canvas como tensor para o modelo MNIST
 *
 * @param canvas - Canvas contendo um ou mais dígitos desenhados
 * @param options - Configurações de segmentação
 * @param options.minGapWidth - Largura mínima de espaço entre dígitos (padrão: 8px)
 * @param options.minDigitWidth - Largura mínima de um dígito válido (padrão: 5px)
 * @param options.alphaThreshold - Threshold para considerar pixel como traço (padrão: 50)
 * @param options.padding - Padding vertical ao redor de cada dígito (padrão: 10px)
 * @returns Array de tensors [1, 28, 28, 1] prontos para inferência, ou array vazio se canvas vazio
 *
 * @example
 * ```ts
 * const tensors = segmentDigits(canvas);
 *
 * tensors.forEach((tensor, i) => {
 *   const prediction = model.predict(tensor);
 *   console.log(`Dígito ${i}:`, prediction);
 *   tensor.dispose();
 * });
 * ```
 */
export function segmentDigits(
  canvas: HTMLCanvasElement,
  options: {
    minGapWidth?: number;
    minDigitWidth?: number;
    alphaThreshold?: number;
    padding?: number;
  } = {}
): tf.Tensor4D[] {
  const {
    minGapWidth = 8,
    minDigitWidth = 5,
    alphaThreshold = 50,
    padding = 10,
  } = options;

  // Extrai dados do canvas
  const imageData = extractImageData(canvas);

  // Calcula projeção horizontal
  const projection = horizontalProjection(imageData, alphaThreshold);

  // Encontra ranges de dígitos
  const digitRanges = findDigitRanges(projection, minGapWidth, minDigitWidth);

  // Se não encontrou nenhum dígito, retorna array vazio
  if (digitRanges.length === 0) {
    return [];
  }

  // Para cada range, recorta o dígito e prepara o tensor
  const tensors: tf.Tensor4D[] = [];

  // Encontra a altura total do desenho (para calcular padding vertical)
  let minY = canvas.height;
  let maxY = 0;
  const { width, height, data } = imageData;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      const alpha = data[index + 3];
      if (alpha >= alphaThreshold) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Aplica padding vertical e limita aos bounds
  const y1 = Math.max(0, minY - padding);
  const y2 = Math.min(canvas.height, maxY + padding);

  // Recorta cada dígito
  for (const [x1, x2] of digitRanges) {
    const box: BoundingBox = {
      x1: Math.max(0, x1),
      y1,
      x2: Math.min(canvas.width, x2 + 1),
      y2,
    };

    try {
      const croppedCanvas = cropToDigit(canvas, box);
      const tensor = prepareForModel(croppedCanvas);
      tensors.push(tensor);
    } catch (err) {
      console.error('[segmentDigits] Erro ao processar dígito:', err);
      // Continua processando os outros dígitos mesmo se um falhar
    }
  }

  return tensors;
}

/**
 * Versão debug que retorna informações sobre a segmentação
 *
 * Útil para desenvolvimento e troubleshooting.
 *
 * @param canvas - Canvas contendo dígitos
 * @param options - Mesmas opções de segmentDigits
 * @returns Objeto com tensors e metadados da segmentação
 */
export function segmentDigitsDebug(
  canvas: HTMLCanvasElement,
  options: Parameters<typeof segmentDigits>[1] = {}
): {
  tensors: tf.Tensor4D[];
  metadata: {
    digitCount: number;
    ranges: Array<[number, number]>;
    projection: number[];
  };
} {
  const {
    minGapWidth = 8,
    minDigitWidth = 5,
    alphaThreshold = 50,
  } = options;

  const imageData = extractImageData(canvas);
  const projection = horizontalProjection(imageData, alphaThreshold);
  const digitRanges = findDigitRanges(projection, minGapWidth, minDigitWidth);
  const tensors = segmentDigits(canvas, options);

  return {
    tensors,
    metadata: {
      digitCount: digitRanges.length,
      ranges: digitRanges,
      projection,
    },
  };
}
