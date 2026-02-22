/**
 * Motor de Predição OCR
 *
 * Executa inferência do modelo MNIST em segmentos de dígitos.
 * Gerencia memória de tensors e retorna predições com confiança.
 */

import * as tf from '@tensorflow/tfjs';
import { predictWithTTA } from './tta';

/**
 * Resultado de predição de um dígito
 */
export interface DigitPrediction {
  /** Dígito reconhecido (0-9) */
  digit: number;
  /** Confiança da predição (0-1) */
  confidence: number;
}

/**
 * Executa predição em um único tensor
 *
 * @param model - Modelo MNIST CNN carregado
 * @param tensor - Tensor de entrada [1, 28, 28, 1]
 * @returns Predição do dígito com confiança
 */
function predictSingleDigit(
  model: tf.LayersModel,
  tensor: tf.Tensor4D
): DigitPrediction {
  return tf.tidy(() => {
    // Executa inferência
    const prediction = model.predict(tensor) as tf.Tensor;

    // Extrai probabilidades [1, 10] -> [10]
    const probabilities = prediction.squeeze() as tf.Tensor1D;

    // Encontra índice com maior probabilidade (o dígito reconhecido)
    const digitTensor = probabilities.argMax();
    const confidenceTensor = probabilities.max();

    // Extrai valores síncronos
    // IMPORTANTE: dataSync() é bloqueante mas necessário aqui
    // porque precisamos dos valores para retornar
    const digit = digitTensor.dataSync()[0];
    const confidence = confidenceTensor.dataSync()[0];

    return {
      digit,
      confidence,
    };
  });
}

/**
 * Executa predição em múltiplos tensors de dígitos
 *
 * Pipeline:
 * 1. Para cada tensor, executa model.predict()
 * 2. Extrai dígito reconhecido e confiança
 * 3. Libera tensors automaticamente via tf.tidy()
 * 4. Retorna array de predições na mesma ordem dos tensors
 *
 * @param model - Modelo MNIST CNN carregado
 * @param tensors - Array de tensors [1, 28, 28, 1] da segmentação
 * @returns Array de predições { digit, confidence }
 *
 * @example
 * ```ts
 * const tensors = segmentDigits(canvas);
 * const predictions = predictDigits(model, tensors);
 *
 * predictions.forEach((p, i) => {
 *   console.log(`Dígito ${i}: ${p.digit} (confiança: ${p.confidence.toFixed(2)})`);
 * });
 *
 * // Libera memória dos tensors após uso
 * tensors.forEach(t => t.dispose());
 * ```
 */
/**
 * Opções para controle do pipeline de predição
 */
export interface PredictOptions {
  /**
   * Habilita Test-Time Augmentation (4 variações geométricas + média softmax).
   * Melhora precisão em ~3-5% mas aumenta latência ~4x.
   * Padrão: true
   */
  useTTA?: boolean;
}

export function predictDigits(
  model: tf.LayersModel,
  tensors: tf.Tensor4D[],
  options?: PredictOptions
): DigitPrediction[] {
  // Valida entrada
  if (!model) {
    throw new Error('[predictDigits] Modelo não fornecido');
  }

  if (!tensors || tensors.length === 0) {
    return [];
  }

  const useTTA = options?.useTTA !== false; // default true

  // Prediz cada tensor individualmente
  // Cada predição é isolada em tf.tidy() para gerenciamento de memória
  const predictions: DigitPrediction[] = [];

  for (let i = 0; i < tensors.length; i++) {
    try {
      const prediction = useTTA
        ? predictWithTTA(model, tensors[i])
        : predictSingleDigit(model, tensors[i]);
      predictions.push(prediction);
    } catch (err) {
      console.error(`[predictDigits] Erro ao predizer dígito ${i}:`, err);
      // Retorna predição com confiança zero em caso de erro
      predictions.push({ digit: -1, confidence: 0 });
    }
  }

  return predictions;
}

/**
 * Versão assíncrona de predictDigits usando await
 *
 * Permite que o browser respire entre predições, evitando bloqueio da UI.
 * Útil para processar muitos dígitos sem travar a interface.
 *
 * @param model - Modelo MNIST CNN carregado
 * @param tensors - Array de tensors [1, 28, 28, 1]
 * @returns Promise com array de predições
 */
export async function predictDigitsAsync(
  model: tf.LayersModel,
  tensors: tf.Tensor4D[],
  options?: PredictOptions
): Promise<DigitPrediction[]> {
  if (!model) {
    throw new Error('[predictDigitsAsync] Modelo não fornecido');
  }

  if (!tensors || tensors.length === 0) {
    return [];
  }

  const useTTA = options?.useTTA !== false; // default true
  const predictions: DigitPrediction[] = [];

  for (let i = 0; i < tensors.length; i++) {
    try {
      // TTA ou predição simples — ambas usam tf.tidy() internamente
      const prediction = useTTA
        ? predictWithTTA(model, tensors[i])
        : predictSingleDigit(model, tensors[i]);

      predictions.push(prediction);

      // Yield para o event loop a cada predição (TTA é ~4x mais pesado)
      await tf.nextFrame();
    } catch (err) {
      console.error(`[predictDigitsAsync] Erro ao predizer dígito ${i}:`, err);
      predictions.push({ digit: -1, confidence: 0 });
    }
  }

  return predictions;
}

/**
 * Filtra predições por confiança mínima
 *
 * @param predictions - Array de predições
 * @param minConfidence - Confiança mínima (0-1)
 * @returns Predições filtradas
 */
export function filterByConfidence(
  predictions: DigitPrediction[],
  minConfidence: number = 0.5
): DigitPrediction[] {
  return predictions.filter(p => p.confidence >= minConfidence && p.digit >= 0);
}

/**
 * Converte array de predições para string de dígitos
 *
 * @param predictions - Array de predições
 * @param minConfidence - Confiança mínima para incluir (padrão: 0)
 * @returns String com dígitos concatenados (ex: "123")
 */
export function predictionsToString(
  predictions: DigitPrediction[],
  minConfidence: number = 0
): string {
  return predictions
    .filter(p => p.confidence >= minConfidence && p.digit >= 0)
    .map(p => p.digit.toString())
    .join('');
}

/**
 * Converte array de predições para número
 *
 * @param predictions - Array de predições
 * @param minConfidence - Confiança mínima para incluir (padrão: 0)
 * @returns Número formado pelos dígitos ou NaN se inválido
 */
export function predictionsToNumber(
  predictions: DigitPrediction[],
  minConfidence: number = 0
): number {
  const str = predictionsToString(predictions, minConfidence);
  return str.length > 0 ? parseInt(str, 10) : NaN;
}

/**
 * Status da predição final baseado em confiança
 */
export type PredictionStatus = 'accepted' | 'confirmation' | 'retry';

/**
 * Resultado final da predição OCR com número e status
 */
export interface NumberPredictionResult {
  /** Número reconhecido (concatenação dos dígitos) */
  number: number;
  /** Status baseado em confiança */
  status: PredictionStatus;
  /** Confiança geral (0-1) */
  confidence: number;
  /** Predições individuais dos dígitos */
  digits: DigitPrediction[];
}

/**
 * Prediz número completo a partir de canvas e modelo
 *
 * Pipeline completo:
 * 1. Segmenta canvas em dígitos individuais
 * 2. Executa predição em cada dígito
 * 3. Concatena dígitos em número final
 * 4. Calcula confiança geral
 * 5. Define status baseado em limiares:
 *    - ≥80%: "accepted" (aceito automaticamente)
 *    - 50-79%: "confirmation" (pedir confirmação)
 *    - <50%: "retry" (pedir para reescrever)
 *
 * @param canvas - Canvas com o desenho da criança
 * @param model - Modelo MNIST carregado
 * @param segmentFn - Função de segmentação (default: segmentDigits)
 * @returns Resultado com número, status, confiança e dígitos
 *
 * @example
 * ```ts
 * const result = await predictNumber(canvas, model);
 *
 * if (result.status === 'accepted') {
 *   // Aceitar automaticamente
 *   submitAnswer(result.number);
 * } else if (result.status === 'confirmation') {
 *   // Pedir confirmação
 *   askConfirmation(`Você escreveu ${result.number}?`);
 * } else {
 *   // Pedir para reescrever
 *   showMessage('Tente desenhar novamente!');
 * }
 * ```
 */
export async function predictNumber(
  canvas: HTMLCanvasElement,
  model: tf.LayersModel,
  options?: {
    /** Função de segmentação customizada */
    segmentFn?: (canvas: HTMLCanvasElement) => tf.Tensor4D[];
    /** Opções de predição (TTA etc.) */
    predictOptions?: PredictOptions;
  }
): Promise<NumberPredictionResult | null> {
  // Lazy import para evitar dependência circular
  const { segmentDigits } = await import('./segment');
  const segmentFn = options?.segmentFn ?? segmentDigits;

  // 1. Segmenta canvas em dígitos individuais
  const tensors = segmentFn(canvas);

  // Canvas vazio ou sem dígitos detectados
  if (tensors.length === 0) {
    return null;
  }

  try {
    // 2. Executa predição em cada dígito (TTA habilitado por padrão)
    const predictions = await predictDigitsAsync(model, tensors, options?.predictOptions);

    // 3. Valida se temos predições válidas
    if (predictions.length === 0 || predictions.every(p => p.digit < 0)) {
      return null;
    }

    // 4. Concatena dígitos em número final
    const number = predictionsToNumber(predictions);

    if (isNaN(number)) {
      return null;
    }

    // 5. Calcula confiança geral usando a MENOR confiança do conjunto
    // (abordagem conservadora: a corrente é tão forte quanto seu elo mais fraco)
    const overallConfidence = Math.min(...predictions.map(p => p.confidence));

    // 6. Define status baseado em limiares
    let status: PredictionStatus;

    if (overallConfidence >= 0.8) {
      status = 'accepted';
    } else if (overallConfidence >= 0.5) {
      status = 'confirmation';
    } else {
      status = 'retry';
    }

    return {
      number,
      status,
      confidence: overallConfidence,
      digits: predictions,
    };
  } finally {
    // Libera memória dos tensors
    tensors.forEach(t => t.dispose());
  }
}

/**
 * Calcula confiança média das predições (alternativa ao min)
 *
 * Útil para comparar diferentes estratégias de cálculo de confiança.
 *
 * @param predictions - Array de predições
 * @returns Confiança média (0-1)
 */
export function calculateAverageConfidence(
  predictions: DigitPrediction[]
): number {
  if (predictions.length === 0) {
    return 0;
  }

  const validPredictions = predictions.filter(p => p.digit >= 0);
  if (validPredictions.length === 0) {
    return 0;
  }

  const sum = validPredictions.reduce((acc, p) => acc + p.confidence, 0);
  return sum / validPredictions.length;
}

/**
 * Calcula confiança ponderada (média harmônica)
 *
 * Penaliza mais fortemente predições de baixa confiança.
 * Útil quando queremos ser mais conservadores.
 *
 * @param predictions - Array de predições
 * @returns Confiança ponderada (0-1)
 */
export function calculateWeightedConfidence(
  predictions: DigitPrediction[]
): number {
  if (predictions.length === 0) {
    return 0;
  }

  const validPredictions = predictions.filter(p => p.digit >= 0 && p.confidence > 0);
  if (validPredictions.length === 0) {
    return 0;
  }

  // Média harmônica: n / (1/c1 + 1/c2 + ... + 1/cn)
  const sumOfReciprocals = validPredictions.reduce(
    (acc, p) => acc + 1 / p.confidence,
    0
  );

  return validPredictions.length / sumOfReciprocals;
}
