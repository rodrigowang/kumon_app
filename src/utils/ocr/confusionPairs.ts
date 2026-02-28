/**
 * Confusion-Pair Heuristics para OCR
 *
 * Quando o modelo hesita entre dois dígitos similares (diferença de confiança < 15%),
 * aplica heurísticas geométricas baseadas na distribuição de pixels para desempatar.
 *
 * REGRA DE SEGURANÇA: quando a heurística não tem certeza, mantém o top-1 original.
 * Só troca se a evidência geométrica é clara. Nunca piorar o que o modelo já decidiu.
 *
 * Pares tratados:
 * - 1↔7: "7" tem traço horizontal no topo
 * - 6↔0: "6" tem extensão/cauda no topo-esquerdo
 * - 4↔9: "4" tem abertura no topo-direito, "9" é fechado
 * - 5↔3: "5" tem traço horizontal no topo, "3" não
 * - 5↔6: "5" tem topo aberto/reto, "6" tem topo curvo fechado
 *
 * Todas as heurísticas operam no tensor [1, 28, 28, 1] já preprocessado
 * (branco em fundo preto, binarizado).
 */

import * as tf from '@tensorflow/tfjs';
import type { DigitPrediction } from './predict';

/** Pares de confusão conhecidos (ordem não importa) */
const CONFUSION_PAIRS: ReadonlySet<string> = new Set([
  '1-7', '7-1',
  '6-0', '0-6',
  '4-9', '9-4',
  '5-3', '3-5',
  '5-6', '6-5',
]);

/** Diferença máxima de confiança para considerar confusão (15%) */
const MAX_CONFIDENCE_GAP = 0.15;

/** Margem mínima de score para trocar o top-1 (evita trocas por margem ínfima) */
const MIN_SWAP_MARGIN = 0.05;

/**
 * Resultado da resolução de confusão
 */
export interface ConfusionResolution {
  /** Dígito escolhido pela heurística */
  resolvedDigit: number;
  /** Confiança ajustada (boost de +5% se heurística confirma) */
  resolvedConfidence: number;
  /** Se houve troca em relação ao top-1 original */
  swapped: boolean;
}

/**
 * Extrai dados de pixels do tensor [1, 28, 28, 1] como array 28×28
 */
function extractPixels(tensor: tf.Tensor4D): Float32Array | Int32Array | Uint8Array {
  return tf.tidy(() => {
    const squeezed = tensor.squeeze([0, 3]); // [28, 28]
    return squeezed.dataSync();
  });
}

/**
 * Calcula densidade de pixels (fração de pixels brancos) em uma região do grid 28×28
 */
function regionDensity(
  pixels: Float32Array | Int32Array | Uint8Array,
  rowStart: number,
  rowEnd: number,
  colStart: number,
  colEnd: number,
): number {
  let count = 0;
  let total = 0;

  for (let r = rowStart; r < rowEnd; r++) {
    for (let c = colStart; c < colEnd; c++) {
      total++;
      if (pixels[r * 28 + c] > 0.5) {
        count++;
      }
    }
  }

  return total > 0 ? count / total : 0;
}

/**
 * Resultado interno de uma heurística: scores para cada candidato.
 * Se a diferença de scores é < MIN_SWAP_MARGIN, mantém o top-1 (seguro).
 */
interface HeuristicScores {
  digitA: number;
  scoreA: number;
  digitB: number;
  scoreB: number;
}

/**
 * Dado os scores, decide qual dígito retornar.
 * Só troca do top-1 se a margem de score é clara (>= MIN_SWAP_MARGIN).
 */
function resolveFromScores(scores: HeuristicScores, top1Digit: number): number {
  const { digitA, scoreA, digitB, scoreB } = scores;
  const winner = scoreA > scoreB ? digitA : digitB;
  const margin = Math.abs(scoreA - scoreB);

  // Se a heurística concorda com top-1, manter
  if (winner === top1Digit) return top1Digit;

  // Se quer trocar, só trocar se a margem é significativa
  if (margin >= MIN_SWAP_MARGIN) return winner;

  // Margem muito pequena — manter top-1 (seguro)
  return top1Digit;
}

/**
 * Heurística 1↔7: "7" tem traço horizontal proeminente no topo
 */
function score1vs7(pixels: Float32Array | Int32Array | Uint8Array): HeuristicScores {
  const topDensity = regionDensity(pixels, 2, 8, 4, 24);
  const midCenterDensity = regionDensity(pixels, 10, 18, 10, 18);
  const midLeftDensity = regionDensity(pixels, 10, 18, 2, 10);

  // "7" tem topo denso + meio-esquerdo vazio (traço desce para direita)
  const sevenScore = topDensity * (1 - midLeftDensity);
  // "1" tem centro vertical fino, topo pouco denso
  const oneScore = midCenterDensity * (1 - topDensity * 0.5);

  return { digitA: 7, scoreA: sevenScore, digitB: 1, scoreB: oneScore };
}

/**
 * Heurística 6↔0: "6" tem cauda no topo-esquerdo, "0" é simétrico
 */
function score6vs0(pixels: Float32Array | Int32Array | Uint8Array): HeuristicScores {
  const topLeftDensity = regionDensity(pixels, 2, 10, 2, 14);
  const topRightDensity = regionDensity(pixels, 2, 10, 14, 26);
  const topCenterDensity = regionDensity(pixels, 2, 8, 8, 20);
  const bottomDensity = regionDensity(pixels, 16, 26, 4, 24);

  // "6": assimetria no topo (esquerda > direita) + topo-centro preenchido
  const asymmetry = topLeftDensity - topRightDensity;
  const sixScore = Math.max(0, asymmetry) * 2 + topCenterDensity * 0.5;

  // "0": simétrico + fundo denso (loop fechado embaixo)
  const symmetry = 1 - Math.abs(asymmetry);
  const zeroScore = symmetry * 0.5 + bottomDensity * 0.3;

  return { digitA: 6, scoreA: sixScore, digitB: 0, scoreB: zeroScore };
}

/**
 * Heurística 4↔9: "4" tem abertura no topo-direito, "9" tem loop fechado
 */
function score4vs9(pixels: Float32Array | Int32Array | Uint8Array): HeuristicScores {
  const topDensity = regionDensity(pixels, 2, 14, 4, 24);
  const topRightDensity = regionDensity(pixels, 2, 10, 16, 26);
  const midDensity = regionDensity(pixels, 10, 16, 4, 24);
  const bottomLeftDensity = regionDensity(pixels, 18, 26, 2, 14);
  const bottomRightDensity = regionDensity(pixels, 18, 26, 14, 26);

  // "4" tem meio denso (traço horizontal) + topo-direito vazio
  const fourScore = midDensity * (1 - topRightDensity * 0.5);
  // "9" tem topo denso (loop) + fundo assimétrico para direita (cauda)
  const nineScore = topDensity * (bottomRightDensity - bottomLeftDensity + 0.5);

  return { digitA: 4, scoreA: fourScore, digitB: 9, scoreB: nineScore };
}

/**
 * Heurística 5↔3: "5" tem traço horizontal no topo-esquerdo, "3" tem curvas
 */
function score5vs3(pixels: Float32Array | Int32Array | Uint8Array): HeuristicScores {
  const topLeftDensity = regionDensity(pixels, 2, 7, 2, 16);
  const topRightDensity = regionDensity(pixels, 2, 7, 12, 26);
  const midLeftDensity = regionDensity(pixels, 10, 16, 2, 10);
  const midRightDensity = regionDensity(pixels, 10, 16, 16, 26);

  // "5": topo-esquerdo denso + meio-direito com curva + meio-esquerdo vazio
  const fiveScore = topLeftDensity + midRightDensity * 0.5 + (1 - midLeftDensity) * 0.3;
  // "3": topo-direito denso + sem traço horizontal esquerdo + meio-esquerdo preenchido
  const threeScore = topRightDensity + (1 - topLeftDensity) * 0.3 + midLeftDensity * 0.3;

  return { digitA: 5, scoreA: fiveScore, digitB: 3, scoreB: threeScore };
}

/**
 * Heurística 5↔6: "5" tem topo aberto/reto, "6" tem topo curvo que fecha
 *
 * Diferença chave: "6" tem uma curva contínua que fecha no lado esquerdo do topo,
 * enquanto "5" tem um traço horizontal reto no topo que NÃO conecta com a parte de baixo.
 * "6" também tem o loop inferior mais centralizado/simétrico que o "5".
 */
function score5vs6(pixels: Float32Array | Int32Array | Uint8Array): HeuristicScores {
  // Parte superior: "5" tem traço horizontal reto, "6" tem curva
  // "5" preenche topo-esquerdo mas NÃO topo-direito (traço horizontal + descida vertical)
  // "6" preenche topo como arco contínuo — mais simétrico
  const topLeftDensity = regionDensity(pixels, 2, 8, 2, 14);
  const topRightDensity = regionDensity(pixels, 2, 8, 14, 26);
  const topSymmetry = 1 - Math.abs(topLeftDensity - topRightDensity);

  // Meio-esquerdo: "5" tem um traço vertical descendo pela esquerda antes de curvar
  // "6" tem a curva do loop já começando (mais preenchido no centro)
  const midLeftDensity = regionDensity(pixels, 8, 14, 2, 10);
  const midCenterDensity = regionDensity(pixels, 8, 14, 8, 20);

  // Parte inferior: "6" fecha um loop circular mais definido
  // "5" tem curva aberta para a esquerda
  const bottomLeftDensity = regionDensity(pixels, 18, 26, 2, 14);
  const bottomRightDensity = regionDensity(pixels, 18, 26, 14, 26);
  const bottomSymmetry = 1 - Math.abs(bottomLeftDensity - bottomRightDensity);

  // "6": topo simétrico (arco), loop inferior simétrico, centro preenchido
  const sixScore = topSymmetry * 0.4 + bottomSymmetry * 0.3 + midCenterDensity * 0.3;

  // "5": topo assimétrico (traço esquerdo), meio-esquerdo denso (traço vertical)
  const topAsymmetry = Math.max(0, topLeftDensity - topRightDensity);
  const fiveScore = topAsymmetry * 0.5 + midLeftDensity * 0.3 + (1 - bottomSymmetry) * 0.2;

  return { digitA: 5, scoreA: fiveScore, digitB: 6, scoreB: sixScore };
}

/**
 * Tenta resolver confusão entre top-1 e top-2 usando heurísticas geométricas
 *
 * Condições para ativar:
 * 1. top-1 e top-2 formam um par de confusão conhecido
 * 2. Diferença de confiança entre top-1 e top-2 é < 15%
 *
 * REGRA DE SEGURANÇA: se a heurística não tem certeza (margem < 5%), mantém top-1.
 *
 * @param tensor - Tensor [1, 28, 28, 1] do dígito preprocessado
 * @param topK - Top-K predições ordenadas por confiança
 * @returns Resolução se aplicável, null caso contrário
 */
export function resolveConfusion(
  tensor: tf.Tensor4D,
  topK: DigitPrediction[],
): ConfusionResolution | null {
  if (!topK || topK.length < 2) {
    return null;
  }

  const top1 = topK[0];
  const top2 = topK[1];

  // Verificar se formam par de confusão
  const pairKey = `${top1.digit}-${top2.digit}`;
  if (!CONFUSION_PAIRS.has(pairKey)) {
    return null;
  }

  // Verificar se a diferença é pequena o suficiente para heurística ter valor
  const gap = top1.confidence - top2.confidence;
  if (gap > MAX_CONFIDENCE_GAP) {
    return null;
  }

  // Extrair pixels para análise geométrica
  const pixels = extractPixels(tensor);

  // Calcular scores para o par
  let scores: HeuristicScores;
  const d1 = top1.digit;
  const d2 = top2.digit;

  if ((d1 === 1 && d2 === 7) || (d1 === 7 && d2 === 1)) {
    scores = score1vs7(pixels);
  } else if ((d1 === 6 && d2 === 0) || (d1 === 0 && d2 === 6)) {
    scores = score6vs0(pixels);
  } else if ((d1 === 4 && d2 === 9) || (d1 === 9 && d2 === 4)) {
    scores = score4vs9(pixels);
  } else if ((d1 === 5 && d2 === 3) || (d1 === 3 && d2 === 5)) {
    scores = score5vs3(pixels);
  } else if ((d1 === 5 && d2 === 6) || (d1 === 6 && d2 === 5)) {
    scores = score5vs6(pixels);
  } else {
    return null;
  }

  // Resolver usando scores, respeitando o top-1 quando incerto
  const resolvedDigit = resolveFromScores(scores, top1.digit);
  const swapped = resolvedDigit !== top1.digit;

  // Confiança: se a heurística confirma top-1, boost de +5%.
  // Se troca para top-2, usa confiança do top-2 + boost de +5%.
  const baseConfidence = swapped ? top2.confidence : top1.confidence;
  const resolvedConfidence = Math.min(1, baseConfidence + 0.05);

  return {
    resolvedDigit,
    resolvedConfidence,
    swapped,
  };
}
