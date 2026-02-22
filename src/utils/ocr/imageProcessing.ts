/**
 * Processamento de Imagem para OCR
 *
 * Funções puras para extrair e recortar dígitos desenhados no canvas.
 * Isola a área relevante do traço para maximizar acurácia do modelo.
 */

export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/**
 * Extrai dados brutos de pixels do canvas
 *
 * @param canvas - Canvas HTML contendo o desenho
 * @returns ImageData com pixels RGBA
 */
export function extractImageData(canvas: HTMLCanvasElement): ImageData {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas context not available');
  }

  return ctx.getImageData(0, 0, canvas.width, canvas.height);
}

/**
 * Detecta se um pixel é traço usando luminância + alpha
 *
 * Compõe com fundo branco e inverte: traço escuro → valor alto, fundo claro → 0.
 * Robusto para fundo transparente e fundo branco opaco.
 */
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

/**
 * Calcula bounding box da área com tinta no canvas
 *
 * Usa luminância invertida para detectar traços (robusto a fundo branco/transparente).
 *
 * @param imageData - Dados de pixels do canvas
 * @param intensityThreshold - Valor mínimo de intensidade invertida para considerar traço (0-255)
 * @param padding - Margem em pixels ao redor do traço
 * @returns Coordenadas do retângulo delimitador ou null se canvas vazio
 */
export function findBoundingBox(
  imageData: ImageData,
  intensityThreshold: number = 50,
  padding: number = 10
): BoundingBox | null {
  const { width, height, data } = imageData;

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let hasPixels = false;

  // Varre todos os pixels procurando traços via luminância invertida
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;

      if (isStrokePixel(data, index, intensityThreshold)) {
        hasPixels = true;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  // Canvas vazio
  if (!hasPixels) {
    return null;
  }

  // Adiciona padding (segurança para bordas finas) e limita aos bounds do canvas
  const x1 = Math.max(0, minX - padding);
  const y1 = Math.max(0, minY - padding);
  const x2 = Math.min(width, maxX + padding);
  const y2 = Math.min(height, maxY + padding);

  return { x1, y1, x2, y2 };
}

/**
 * Recorta região específica do canvas em um novo canvas
 *
 * @param canvas - Canvas original
 * @param box - Coordenadas da região a recortar
 * @returns Novo canvas contendo apenas a região especificada
 */
export function cropToDigit(
  canvas: HTMLCanvasElement,
  box: BoundingBox
): HTMLCanvasElement {
  const { x1, y1, x2, y2 } = box;

  const croppedWidth = x2 - x1;
  const croppedHeight = y2 - y1;

  if (croppedWidth <= 0 || croppedHeight <= 0) {
    throw new Error('Invalid bounding box: dimensions must be positive');
  }

  // Cria novo canvas com dimensões da região
  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = croppedWidth;
  croppedCanvas.height = croppedHeight;

  const ctx = croppedCanvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  // Copia apenas a região especificada
  ctx.drawImage(
    canvas,
    x1, y1, croppedWidth, croppedHeight,  // source
    0, 0, croppedWidth, croppedHeight     // destination
  );

  return croppedCanvas;
}

/**
 * Pipeline completo: extrai ImageData, calcula bounding box e recorta
 *
 * @param canvas - Canvas com desenho
 * @returns Canvas recortado ou null se canvas vazio
 */
export function extractAndCropDigit(canvas: HTMLCanvasElement): HTMLCanvasElement | null {
  const imageData = extractImageData(canvas);
  const box = findBoundingBox(imageData);

  if (!box) {
    return null;
  }

  return cropToDigit(canvas, box);
}
