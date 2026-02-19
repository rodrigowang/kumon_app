/**
 * OCR Utilities
 *
 * Exporta funções de processamento de imagem e tensor para reconhecimento de dígitos
 */

// Processamento de imagem (crop e bounding box)
export type { BoundingBox } from './imageProcessing';
export {
  extractImageData,
  findBoundingBox,
  cropToDigit,
  extractAndCropDigit,
} from './imageProcessing';

// Operações de tensor (normalização e preparação para modelo)
export {
  centerAndResize,
  normalize,
  toModelInput,
  prepareForModel,
  disposeTensor,
} from './tensorOps';

// Segmentação de múltiplos dígitos
export {
  segmentDigits,
  segmentDigitsDebug,
} from './segment';

// Motor de predição
export type { DigitPrediction, PredictionStatus, NumberPredictionResult } from './predict';
export {
  predictDigits,
  predictDigitsAsync,
  filterByConfidence,
  predictionsToString,
  predictionsToNumber,
  predictNumber,
  calculateAverageConfidence,
  calculateWeightedConfidence,
} from './predict';
