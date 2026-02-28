/**
 * Validação de Canvas antes do OCR
 *
 * Verifica se o canvas contém input válido antes de gastar processamento
 * com segmentação e inferência. Detecta canvas vazio, rabiscos aleatórios
 * e traços muito pequenos.
 *
 * Todas as análises são feitas em pixel data puro (sem TensorFlow),
 * então são muito rápidas (~1ms).
 */

/**
 * Razão pela qual o canvas foi rejeitado
 */
export type CanvasRejectionReason = 'empty' | 'too_sparse' | 'too_dense' | 'too_small';

/**
 * Resultado da validação do canvas
 */
export interface CanvasValidationResult {
  /** Se o canvas contém input válido para OCR */
  valid: boolean;
  /** Razão da rejeição (só presente se valid === false) */
  reason?: CanvasRejectionReason;
  /** Mensagem amigável para a criança (só presente se valid === false) */
  message?: string;
}

/** Thresholds de validação */
const THRESHOLDS = {
  /** Canvas com menos que isso é considerado vazio */
  EMPTY: 0.005,        // 0.5%
  /** Canvas com menos que isso tem traço muito fraco/pequeno */
  TOO_SPARSE: 0.015,   // 1.5%
  /** Canvas com mais que isso é rabisco/preenchimento */
  TOO_DENSE: 0.40,     // 40%
  /** Bounding box menor que isso (fração do canvas) é traço muito pequeno */
  MIN_BBOX_RATIO: 0.10, // 10% da dimensão do canvas
} as const;

/** Mensagens amigáveis para cada tipo de rejeição */
const MESSAGES: Record<CanvasRejectionReason, string> = {
  empty: 'Escreva um número!',
  too_sparse: 'Escreva um pouco maior!',
  too_dense: 'Tente escrever só o número!',
  too_small: 'Escreva um pouco maior!',
};

/**
 * Valida se o canvas contém input adequado para OCR
 *
 * Análises (em ordem, retorna na primeira falha):
 * 1. Pixels preenchidos < 0.5% → "Escreva um número!"
 * 2. Pixels preenchidos > 40% → "Tente escrever só o número!"
 * 3. Pixels preenchidos < 1.5% → "Escreva um pouco maior!"
 * 4. Bounding box < 10% do canvas → "Escreva um pouco maior!"
 *
 * @param canvas - Canvas com o desenho da criança
 * @returns Resultado da validação com mensagem amigável se inválido
 */
export function validateCanvas(canvas: HTMLCanvasElement): CanvasValidationResult {
  const { width, height } = canvas;

  if (width === 0 || height === 0) {
    return { valid: false, reason: 'empty', message: MESSAGES.empty };
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { valid: false, reason: 'empty', message: MESSAGES.empty };
  }

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data; // RGBA

  const totalPixels = width * height;
  let filledCount = 0;

  // Bounding box tracking
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  // Contar pixels preenchidos (não-brancos e não-transparentes)
  // Canvas de desenho: fundo branco/transparente, traço preto/escuro
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];

    // Pixel é "preenchido" se não é branco E não é transparente
    // Luminância < 200 (escuro o suficiente) E alpha > 50 (visível)
    const luminance = (r + g + b) / 3;
    if (luminance < 200 && a > 50) {
      filledCount++;

      // Atualizar bounding box
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }

  const fillRatio = filledCount / totalPixels;

  // 1. Canvas vazio
  if (fillRatio < THRESHOLDS.EMPTY) {
    return { valid: false, reason: 'empty', message: MESSAGES.empty };
  }

  // 2. Rabisco/preenchimento total
  if (fillRatio > THRESHOLDS.TOO_DENSE) {
    return { valid: false, reason: 'too_dense', message: MESSAGES.too_dense };
  }

  // 3. Traço muito fraco/pequeno (pouco preenchimento)
  if (fillRatio < THRESHOLDS.TOO_SPARSE) {
    return { valid: false, reason: 'too_sparse', message: MESSAGES.too_sparse };
  }

  // 4. Bounding box muito pequena (ponto ou traço mínimo)
  const bboxWidth = maxX - minX + 1;
  const bboxHeight = maxY - minY + 1;
  const bboxWidthRatio = bboxWidth / width;
  const bboxHeightRatio = bboxHeight / height;

  if (bboxWidthRatio < THRESHOLDS.MIN_BBOX_RATIO && bboxHeightRatio < THRESHOLDS.MIN_BBOX_RATIO) {
    return { valid: false, reason: 'too_small', message: MESSAGES.too_small };
  }

  return { valid: true };
}
