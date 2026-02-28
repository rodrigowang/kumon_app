/**
 * Test-Time Augmentation (TTA) para OCR
 *
 * Para cada dígito segmentado, gera 4 variações geométricas, prediz todas
 * com o modelo e faz média das probabilidades softmax. A predição final é
 * mais robusta porque compensa variações de ângulo e tamanho na escrita infantil.
 *
 * IMPORTANTE: sem flip horizontal/vertical — "6" viraria "9"!
 *
 * Variações geradas por dígito:
 *   1. Original (sem mudança)
 *   2. Rotação -5° (levemente torto para a esquerda)
 *   3. Rotação +5° (levemente torto para a direita)
 *   4. Scale 0.9x (dígito um pouco menor, mais centralizado)
 */

import * as tf from '@tensorflow/tfjs';
import type { DigitPrediction } from './predict';

/** Tamanho do grid MNIST */
const IMAGE_SIZE = 28;

/** Centro do grid para transformações afins */
const CENTER = IMAGE_SIZE / 2 - 0.5; // 13.5

/**
 * Constrói matriz de transformação afim para rotação
 *
 * Convenção tf.image.transform: mapeia coordenadas de OUTPUT para INPUT.
 * Rotação em torno do centro (13.5, 13.5) do grid 28x28.
 *
 * @param degrees - Ângulo em graus (positivo = sentido horário)
 * @returns Array com 8 valores da matriz afim [a0,a1,a2,b0,b1,b2,c0,c1]
 */
function buildRotationMatrix(degrees: number): number[] {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  return [
    cos,                         // a0: x_in = cos·x_out + ...
    sin,                         // a1
    CENTER * (1 - cos) - CENTER * sin, // a2: tradução para rotação em (cx, cy)
    -sin,                        // b0
    cos,                         // b1
    CENTER * sin + CENTER * (1 - cos), // b2
    0,                           // c0 (sem perspectiva)
    0,                           // c1
  ];
}

/**
 * Constrói matriz de transformação afim para escala uniforme
 *
 * factor < 1 → dígito menor (zoom out) — mais padding ao redor
 * factor > 1 → dígito maior (zoom in)
 *
 * @param factor - Fator de escala (0.9 = 90% do tamanho original)
 * @returns Array com 8 valores da matriz afim
 */
function buildScaleMatrix(factor: number): number[] {
  const inv = 1 / factor;

  return [
    inv,                   // a0
    0,                     // a1
    CENTER * (1 - inv),    // a2: centraliza a escala em (cx, cy)
    0,                     // b0
    inv,                   // b1
    CENTER * (1 - inv),    // b2
    0,                     // c0
    0,                     // c1
  ];
}

/**
 * Aplica transformação afim a um tensor [1, 28, 28, 1]
 *
 * Interpolação bilinear. Pixels fora dos limites → 0 (fundo MNIST preto).
 * O tensor retornado NÃO é gerenciado por nenhum tidy interno —
 * o chamador é responsável por descartá-lo.
 *
 * @param tensor4D - Tensor de entrada [1, 28, 28, 1]
 * @param matrix - Matriz afim com 8 valores
 * @returns Novo tensor [1, 28, 28, 1] transformado
 */
function applyAffineTransform(tensor4D: tf.Tensor4D, matrix: number[]): tf.Tensor4D {
  return tf.tidy(() => {
    const transforms = tf.tensor2d([matrix], [1, 8]);
    return tf.image.transform(
      tensor4D,
      transforms,
      'bilinear',
      'constant',
      0
    ) as tf.Tensor4D;
  });
}

/**
 * Prediz um dígito com Test-Time Augmentation
 *
 * Gera 4 variações geométricas, roda model.predict() em cada uma,
 * faz média das probabilidades softmax e retorna argMax da média.
 *
 * Gerenciamento de memória:
 * - O tensor original NÃO é descartado (responsabilidade do chamador)
 * - As variantes augmentadas são criadas e descartadas internamente
 * - Tensors intermediários da inferência ficam dentro de tf.tidy()
 *
 * @param model - Modelo MNIST CNN carregado
 * @param tensor - Tensor de entrada [1, 28, 28, 1]
 * @returns Predição com dígito e confiança baseada na média TTA
 */
/**
 * Resultado estendido de TTA com probabilidades top-K
 */
export interface TTAPrediction extends DigitPrediction {
  /** Top-K candidatos ordenados por probabilidade (inclui top-1) */
  topK: DigitPrediction[];
}

export function predictWithTTA(
  model: tf.LayersModel,
  tensor: tf.Tensor4D
): TTAPrediction {
  // Gera variantes augmentadas fora do tidy (precisam sobreviver até a inferência)
  const rotNeg5 = applyAffineTransform(tensor, buildRotationMatrix(-5));
  const rotPos5 = applyAffineTransform(tensor, buildRotationMatrix(5));
  const scaled09 = applyAffineTransform(tensor, buildScaleMatrix(0.9));

  try {
    // Executa predições e faz média das distribuições softmax
    // NOTA: tf.tidy() não aceita retorno de objetos custom (DigitPrediction[])
    // Extraímos os dados numéricos dentro do tidy e montamos o resultado fora
    let allProbabilities: number[];

    tf.tidy(() => {
      const variants: tf.Tensor4D[] = [tensor, rotNeg5, rotPos5, scaled09];

      // Coleta [10] de probabilidades de cada variante
      const allProbs = variants.map(v => {
        const logits = model.predict(v) as tf.Tensor;
        return logits.squeeze() as tf.Tensor1D;
      });

      // Stack → [4, 10], média no eixo 0 → [10]
      const stacked = tf.stack(allProbs); // [4, 10]
      const averaged = stacked.mean(0) as tf.Tensor1D; // [10]

      // Extrai dados numéricos via dataSync (bloqueante mas necessário)
      allProbabilities = Array.from(averaged.dataSync());
    });

    // Monta resultado fora do tidy (objetos JS puros, sem tensors)
    const topK: DigitPrediction[] = allProbabilities!
      .map((prob, idx) => ({ digit: idx, confidence: prob }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    return {
      digit: topK[0].digit,
      confidence: topK[0].confidence,
      topK,
    };
  } finally {
    // Descarta apenas as variantes criadas aqui — tensor original é do chamador
    rotNeg5.dispose();
    rotPos5.dispose();
    scaled09.dispose();
  }
}
