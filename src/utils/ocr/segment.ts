/**
 * Segmentação de Múltiplos Dígitos (Sprint 5.2)
 *
 * Usa Connected Component Labeling (CCL) em vez de projeção horizontal.
 * Pipeline: binarizar → CCL → merge componentes próximos → split largos → ordenar L→R
 *
 * Fallback para projeção horizontal se CCL encontra 0 componentes.
 */

import * as tf from '@tensorflow/tfjs';
import { extractImageData, cropToDigit, type BoundingBox } from './imageProcessing';
import { prepareForModel } from './tensorOps';

// --- Detecção de traço (luminância invertida, Sprint 5.1) ---

function isStrokePixel(data: Uint8ClampedArray, index: number, threshold: number): boolean {
  const r = data[index];
  const g = data[index + 1];
  const b = data[index + 2];
  const a = data[index + 3];

  const alphaNorm = a / 255;
  const luminance = (r + g + b) / 3;
  const composited = luminance * alphaNorm + 255 * (1 - alphaNorm);
  const inverted = 255 - composited;
  return inverted >= threshold;
}

// --- Mapa binário ---

function toBinaryMap(imageData: ImageData, threshold: number): Uint8Array {
  const { width, height, data } = imageData;
  const binary = new Uint8Array(width * height);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const rgbaIndex = (y * width + x) * 4;
      binary[y * width + x] = isStrokePixel(data, rgbaIndex, threshold) ? 1 : 0;
    }
  }

  return binary;
}

// --- Connected Component Labeling (flood-fill) ---

interface ComponentBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  pixelCount: number;
}

function connectedComponentLabeling(
  binary: Uint8Array,
  width: number,
  height: number
): ComponentBox[] {
  const labels = new Int32Array(width * height).fill(-1);
  const components: ComponentBox[] = [];

  // Flood-fill BFS para cada pixel não-visitado
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (binary[idx] === 0 || labels[idx] !== -1) continue;

      // Novo componente encontrado
      const componentId = components.length;
      const box: ComponentBox = {
        minX: x, minY: y, maxX: x, maxY: y, pixelCount: 0,
      };

      // BFS
      const queue: number[] = [idx];
      labels[idx] = componentId;

      while (queue.length > 0) {
        const cur = queue.pop()!;
        const cx = cur % width;
        const cy = (cur - cx) / width;

        box.minX = Math.min(box.minX, cx);
        box.minY = Math.min(box.minY, cy);
        box.maxX = Math.max(box.maxX, cx);
        box.maxY = Math.max(box.maxY, cy);
        box.pixelCount++;

        // 4-connectivity: cima, baixo, esquerda, direita
        const neighbors = [
          cy > 0 ? cur - width : -1,
          cy < height - 1 ? cur + width : -1,
          cx > 0 ? cur - 1 : -1,
          cx < width - 1 ? cur + 1 : -1,
        ];

        for (const n of neighbors) {
          if (n >= 0 && binary[n] === 1 && labels[n] === -1) {
            labels[n] = componentId;
            queue.push(n);
          }
        }
      }

      components.push(box);
    }
  }

  return components;
}

// --- Filtrar ruído ---

function filterNoise(components: ComponentBox[], canvasHeight: number): ComponentBox[] {
  if (components.length === 0) return [];

  // Calcula área mediana para referência
  const areas = components.map(c => c.pixelCount).sort((a, b) => a - b);
  const medianArea = areas[Math.floor(areas.length / 2)];

  // Filtra componentes muito pequenos (ruído)
  // Mantém se: área > 5% da mediana OU altura > 20% do canvas (pode ser "1" fino)
  const minArea = Math.max(3, medianArea * 0.05);

  return components.filter(c => {
    const compHeight = c.maxY - c.minY + 1;
    const compWidth = c.maxX - c.minX + 1;
    const aspectRatio = compHeight / Math.max(1, compWidth);

    // "1" é estreito e alto — não filtrar
    if (aspectRatio > 3.0 && compHeight > canvasHeight * 0.2) return true;

    return c.pixelCount >= minArea;
  });
}

// --- Merge componentes próximos (partes do mesmo dígito) ---

function mergeCloseComponents(components: ComponentBox[]): ComponentBox[] {
  if (components.length <= 1) return components;

  // Ordena por posição X
  const sorted = [...components].sort((a, b) => a.minX - b.minX);

  // Calcula largura média dos componentes
  const avgWidth = sorted.reduce((sum, c) => sum + (c.maxX - c.minX + 1), 0) / sorted.length;
  const mergeThreshold = avgWidth * 0.15;

  const merged: ComponentBox[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // Gap horizontal entre componentes
    const gap = current.minX - last.maxX;

    // Overlap vertical: os componentes se sobrepõem verticalmente?
    const verticalOverlap =
      current.minY <= last.maxY && current.maxY >= last.minY;

    // Merge se gap pequeno E overlap vertical (partes do mesmo dígito)
    if (gap < mergeThreshold && verticalOverlap) {
      last.minX = Math.min(last.minX, current.minX);
      last.minY = Math.min(last.minY, current.minY);
      last.maxX = Math.max(last.maxX, current.maxX);
      last.maxY = Math.max(last.maxY, current.maxY);
      last.pixelCount += current.pixelCount;
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

// --- Split componentes largos ("10" grudado) ---

function splitWideComponents(
  components: ComponentBox[],
  binary: Uint8Array,
  imgWidth: number
): ComponentBox[] {
  if (components.length === 0) return [];

  // Calcula largura mediana
  const widths = components.map(c => c.maxX - c.minX + 1).sort((a, b) => a - b);
  const medianWidth = widths[Math.floor(widths.length / 2)];

  const result: ComponentBox[] = [];

  for (const comp of components) {
    const compWidth = comp.maxX - comp.minX + 1;
    const compHeight = comp.maxY - comp.minY + 1;

    // Se largura > 1.8x da mediana, tenta split
    if (compWidth > medianWidth * 1.8 && components.length > 0 && medianWidth > 3) {
      const splitResult = trySplitVertical(comp, binary, imgWidth, compWidth, compHeight);
      if (splitResult) {
        result.push(splitResult.left, splitResult.right);
        continue;
      }
    }

    result.push(comp);
  }

  return result;
}

function trySplitVertical(
  comp: ComponentBox,
  binary: Uint8Array,
  imgWidth: number,
  compWidth: number,
  compHeight: number
): { left: ComponentBox; right: ComponentBox } | null {
  // Calcula densidade vertical por coluna dentro do componente
  const densities = new Array(compWidth).fill(0);
  let maxDensity = 0;

  for (let dx = 0; dx < compWidth; dx++) {
    const x = comp.minX + dx;
    let colSum = 0;
    for (let y = comp.minY; y <= comp.maxY; y++) {
      if (binary[y * imgWidth + x] === 1) colSum++;
    }
    densities[dx] = colSum;
    maxDensity = Math.max(maxDensity, colSum);
  }

  if (maxDensity === 0) return null;

  // Procura vale de mínima densidade no terço central
  const searchStart = Math.floor(compWidth * 0.25);
  const searchEnd = Math.ceil(compWidth * 0.75);

  let minDensity = Infinity;
  let splitCol = -1;

  for (let dx = searchStart; dx < searchEnd; dx++) {
    // Usa janela de 3 colunas para suavizar
    const windowDensity =
      (densities[dx - 1] || 0) + densities[dx] + (densities[dx + 1] || 0);
    if (windowDensity < minDensity) {
      minDensity = windowDensity;
      splitCol = dx;
    }
  }

  // Só faz split se o vale é < 20% da densidade máxima
  if (splitCol < 0 || densities[splitCol] > maxDensity * 0.2) return null;

  const splitX = comp.minX + splitCol;

  // Recalcula bounding boxes das duas metades
  const left = recalcBounds(binary, imgWidth, comp.minX, comp.minY, splitX - 1, comp.maxY);
  const right = recalcBounds(binary, imgWidth, splitX, comp.minY, comp.maxX, comp.maxY);

  if (!left || !right) return null;

  // Valida que ambas as partes têm pixels suficientes
  if (left.pixelCount < 3 || right.pixelCount < 3) return null;

  // Valida que a altura de ambas as partes > 20% do componente original
  const leftH = left.maxY - left.minY + 1;
  const rightH = right.maxY - right.minY + 1;
  if (leftH < compHeight * 0.2 || rightH < compHeight * 0.2) return null;

  return { left, right };
}

function recalcBounds(
  binary: Uint8Array,
  imgWidth: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): ComponentBox | null {
  const box: ComponentBox = {
    minX: x2, minY: y2, maxX: x1, maxY: y1, pixelCount: 0,
  };

  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (binary[y * imgWidth + x] === 1) {
        box.minX = Math.min(box.minX, x);
        box.minY = Math.min(box.minY, y);
        box.maxX = Math.max(box.maxX, x);
        box.maxY = Math.max(box.maxY, y);
        box.pixelCount++;
      }
    }
  }

  return box.pixelCount > 0 ? box : null;
}

// --- Fallback: projeção horizontal (legado) ---

function horizontalProjection(imageData: ImageData, threshold: number): number[] {
  const { width, height, data } = imageData;
  const projection = new Array(width).fill(0);

  for (let x = 0; x < width; x++) {
    let columnSum = 0;
    for (let y = 0; y < height; y++) {
      const index = (y * width + x) * 4;
      if (isStrokePixel(data, index, threshold)) columnSum++;
    }
    projection[x] = columnSum;
  }

  return projection;
}

function findDigitRangesProjection(
  projection: number[],
  minGapWidth: number,
  minDigitWidth: number
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
        digitStart = x;
        inDigit = true;
      }
      gapWidth = 0;
    } else if (inDigit) {
      if (gapWidth === 0) gapStart = x;
      gapWidth++;

      if (gapWidth >= minGapWidth) {
        const digitEnd = gapStart - 1;
        if (digitEnd - digitStart + 1 >= minDigitWidth) {
          ranges.push([digitStart, digitEnd]);
        }
        inDigit = false;
        gapWidth = 0;
      }
    }
  }

  if (inDigit) {
    const digitEnd = projection.length - 1;
    if (digitEnd - digitStart + 1 >= minDigitWidth) {
      ranges.push([digitStart, digitEnd]);
    }
  }

  return ranges;
}

function fallbackProjectionBoxes(
  imageData: ImageData,
  threshold: number
): ComponentBox[] {
  const projection = horizontalProjection(imageData, threshold);
  const ranges = findDigitRangesProjection(projection, 8, 3);

  if (ranges.length === 0) return [];

  // Encontra bounds verticais globais
  const { width, height, data } = imageData;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      if (isStrokePixel(data, index, threshold)) {
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return ranges.map(([x1, x2]) => ({
    minX: x1, minY, maxX: x2, maxY, pixelCount: 0,
  }));
}

// --- Componentes → BoundingBox com padding ---

function componentsToBoundingBoxes(
  components: ComponentBox[],
  padding: number,
  canvasWidth: number,
  canvasHeight: number
): BoundingBox[] {
  return components
    .sort((a, b) => a.minX - b.minX) // Ordenar L→R
    .map(c => ({
      x1: Math.max(0, c.minX - padding),
      y1: Math.max(0, c.minY - padding),
      x2: Math.min(canvasWidth, c.maxX + 1 + padding),
      y2: Math.min(canvasHeight, c.maxY + 1 + padding),
    }));
}

// --- API pública ---

/**
 * Segmenta múltiplos dígitos do canvas usando CCL + merge + split
 *
 * Pipeline (Sprint 5.2):
 * 1. Binariza imagem (luminância invertida)
 * 2. Connected Component Labeling (flood-fill)
 * 3. Filtra ruído (componentes minúsculos)
 * 4. Merge componentes próximos (partes do mesmo dígito, ex: "8" quebrado)
 * 5. Split componentes largos (dígitos grudados, ex: "10")
 * 6. Ordena esquerda→direita
 * 7. Fallback: projeção horizontal se CCL encontra 0 componentes
 *
 * @param canvas - Canvas contendo um ou mais dígitos desenhados
 * @param options - Configurações de segmentação
 * @returns Array de tensors [1, 28, 28, 1] prontos para inferência
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
    alphaThreshold = 50,
    padding = 10,
  } = options;

  const imageData = extractImageData(canvas);
  const binary = toBinaryMap(imageData, alphaThreshold);
  const { width, height } = imageData;

  // 1. CCL
  let components = connectedComponentLabeling(binary, width, height);

  // 2. Filtra ruído
  components = filterNoise(components, height);

  // 3. Merge próximos
  components = mergeCloseComponents(components);

  // 4. Split largos
  components = splitWideComponents(components, binary, width);

  // 5. Fallback se CCL encontrou 0
  if (components.length === 0) {
    components = fallbackProjectionBoxes(imageData, alphaThreshold);
  }

  if (components.length === 0) return [];

  // 6. Converte para BoundingBox com padding e ordena L→R
  const boxes = componentsToBoundingBoxes(components, padding, canvas.width, canvas.height);

  // 7. Recorta e prepara tensors
  const tensors: tf.Tensor4D[] = [];

  for (const box of boxes) {
    try {
      const croppedCanvas = cropToDigit(canvas, box);
      const tensor = prepareForModel(croppedCanvas);
      tensors.push(tensor);
    } catch (err) {
      console.error('[segmentDigits] Erro ao processar dígito:', err);
    }
  }

  return tensors;
}

/**
 * Versão debug com metadados da segmentação
 */
export function segmentDigitsDebug(
  canvas: HTMLCanvasElement,
  options: Parameters<typeof segmentDigits>[1] = {}
): {
  tensors: tf.Tensor4D[];
  metadata: {
    digitCount: number;
    boxes: BoundingBox[];
    method: 'ccl' | 'projection-fallback';
  };
} {
  const { alphaThreshold = 50, padding = 10 } = options;

  const imageData = extractImageData(canvas);
  const binary = toBinaryMap(imageData, alphaThreshold);
  const { width, height } = imageData;

  let components = connectedComponentLabeling(binary, width, height);
  components = filterNoise(components, height);
  components = mergeCloseComponents(components);
  components = splitWideComponents(components, binary, width);

  let method: 'ccl' | 'projection-fallback' = 'ccl';
  if (components.length === 0) {
    components = fallbackProjectionBoxes(imageData, alphaThreshold);
    method = 'projection-fallback';
  }

  const boxes = componentsToBoundingBoxes(components, padding, canvas.width, canvas.height);
  const tensors = segmentDigits(canvas, options);

  return {
    tensors,
    metadata: {
      digitCount: boxes.length,
      boxes,
      method,
    },
  };
}
