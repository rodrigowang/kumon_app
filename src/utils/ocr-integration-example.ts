/**
 * EXEMPLO DE INTEGRAÇÃO: OCR + Feedback Overlays
 *
 * Este arquivo demonstra como integrar os overlays de feedback
 * com o pipeline OCR (Task 1.5) e validação matemática (Task 1.8).
 *
 * NÃO É CÓDIGO DE PRODUÇÃO - apenas referência para implementação futura.
 */

import type { LayersModel } from '@tensorflow/tfjs';
import { useGameStore } from '../stores/useGameStore';

/**
 * Tipo de resultado do OCR
 * (baseado na spec da Task 1.5)
 */
interface OCRResult {
  digit: number | null;
  confidence: number;
}

/**
 * Mock da função predictNumber (Task 1.5)
 * Na implementação real, isso virá de utils/ocr/predict.ts
 */
async function predictNumber(
  _canvas: HTMLCanvasElement,
  _model: LayersModel
): Promise<OCRResult> {
  // TODO: Implementar na Task 1.5
  // Aqui seria feito:
  // 1. Crop da região desenhada
  // 2. Pré-processamento (resize 28x28, normalização)
  // 3. Predição com TensorFlow.js
  // 4. Calcular confiança (max da softmax)
  // 5. Retornar { digit, confidence }

  // Mock: simula resultado aleatório
  const mockDigit = Math.floor(Math.random() * 10);
  const mockConfidence = Math.random(); // 0.0 - 1.0

  return {
    digit: mockConfidence >= 0.5 ? mockDigit : null,
    confidence: mockConfidence,
  };
}

/**
 * Mock da função validateAnswer (Task 1.8)
 * Na implementação real, isso virá de utils/validation.ts
 */
function validateAnswer(digit: number, expectedAnswer: number): boolean {
  // TODO: Implementar na Task 1.8
  return digit === expectedAnswer;
}

/**
 * EXEMPLO 1: Handler de submit no ExerciseScreen
 *
 * Este é o callback que seria passado para o componente ExerciseScreen.
 * Ele integra OCR + Feedback Overlays.
 */
export async function handleSubmitWithOCRFeedback(
  imageData: string | null,
  model: LayersModel | null,
  expectedAnswer: number
): Promise<void> {
  if (!imageData || !model) {
    console.error('Canvas vazio ou modelo OCR não carregado');
    return;
  }

  const { setOCRFeedbackState } = useGameStore.getState();

  // 1. Criar canvas temporário a partir do imageData
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const img = new Image();
  img.src = imageData;
  await img.decode();

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // 2. Executar predição OCR
  const result = await predictNumber(canvas, model);

  // 3. Determinar overlay baseado na confiança
  const { digit, confidence } = result;

  if (confidence >= 0.8) {
    // FLUXO SILENCIOSO (≥80%)
    // Prossegue direto para validação matemática, sem overlay
    setOCRFeedbackState('validating', { digit, confidence });

    // Validar resposta
    if (digit !== null) {
      const isCorrect = validateAnswer(digit, expectedAnswer);

      if (isCorrect) {
        // TODO: Exibir overlay de "Correto!" (Task 1.7.2)
        console.log('✅ Resposta correta!');
      } else {
        // TODO: Exibir overlay de "Tente novamente" (Task 1.7.2)
        console.log('❌ Resposta incorreta. Tente novamente!');
      }
    }

    // Limpar estado após validação
    setTimeout(() => {
      setOCRFeedbackState('idle');
    }, 2000);

  } else if (confidence >= 0.5) {
    // OVERLAY DE CONFIRMAÇÃO (50-79%)
    // OCR tem dúvida, pede confirmação da criança
    setOCRFeedbackState('confirming', { digit, confidence });

    // A partir daqui, os callbacks do OCRFeedbackOverlay assumem:
    // - onConfirm: criança confirma → prossegue para validação
    // - onReject: criança rejeita → limpa canvas, volta para idle

  } else {
    // OVERLAY DE REESCRITA (<50%)
    // OCR não conseguiu reconhecer, pede para criança tentar novamente
    setOCRFeedbackState('retry', { digit: null, confidence });

    // Callback onRetry do OCRFeedbackOverlay:
    // - Limpa canvas
    // - Volta para idle
  }
}

/**
 * EXEMPLO 2: Callbacks do OCRFeedbackOverlay
 *
 * Estes são os callbacks passados para o componente OCRFeedbackOverlay.
 */
export const ocrFeedbackCallbacks = {
  /**
   * Criança confirmou o dígito detectado (50-79% confiança)
   */
  onConfirm: async (
    digit: number,
    expectedAnswer: number,
    canvasRef: React.RefObject<{ clear: () => void }>
  ) => {
    const { setOCRFeedbackState } = useGameStore.getState();

    // Prossegue para validação matemática
    setOCRFeedbackState('validating', { digit, confidence: 0.65 }); // confiança original preservada

    const isCorrect = validateAnswer(digit, expectedAnswer);

    if (isCorrect) {
      // TODO: Exibir overlay de "Correto!" (Task 1.7.2)
      console.log('✅ Resposta correta!');
    } else {
      // TODO: Exibir overlay de "Tente novamente" (Task 1.7.2)
      console.log('❌ Resposta incorreta. Tente novamente!');
    }

    // Limpar canvas e estado após validação
    setTimeout(() => {
      canvasRef.current?.clear();
      setOCRFeedbackState('idle');
    }, 2000);
  },

  /**
   * Criança rejeitou o dígito detectado (50-79% confiança)
   */
  onReject: (canvasRef: React.RefObject<{ clear: () => void }>) => {
    // Limpa canvas e volta para estado idle
    canvasRef.current?.clear();
    console.log('❌ Criança rejeitou a detecção. Canvas limpo.');
  },

  /**
   * Criança vai tentar novamente (<50% confiança)
   */
  onRetry: (canvasRef: React.RefObject<{ clear: () => void }>) => {
    // Limpa canvas e volta para estado idle
    canvasRef.current?.clear();
    console.log('🔄 Criança vai tentar novamente. Canvas limpo.');
  },

  /**
   * Toca som de feedback (integração futura com Howler.js)
   */
  playSound: (type: 'doubt' | 'oops') => {
    // TODO: Implementar com Howler.js
    console.log(`🔊 Som: ${type === 'doubt' ? 'Dúvida' : 'Oops'}`);
  },
};

/**
 * EXEMPLO 3: Integração completa no componente ExerciseScreen
 *
 * ```tsx
 * import { useRef } from 'react';
 * import { ExerciseScreen } from '@/components/exercises';
 * import { OCRFeedbackOverlay } from '@/components/ui';
 * import { useOCRModel } from '@/hooks';
 * import { handleSubmitWithOCRFeedback, ocrFeedbackCallbacks } from '@/utils/ocr-integration-example';
 *
 * function MathExercise() {
 *   const { model } = useOCRModel();
 *   const canvasRef = useRef(null);
 *   const expectedAnswer = 8; // 5 + 3 = 8
 *
 *   return (
 *     <Box style={{ position: 'relative' }}>
 *       <ExerciseScreen
 *         exerciseText="5 + 3 = ?"
 *         onSubmit={(imageData) =>
 *           handleSubmitWithOCRFeedback(imageData, model, expectedAnswer)
 *         }
 *         onClear={() => console.log('Canvas limpo')}
 *         ref={canvasRef}
 *       />
 *
 *       <OCRFeedbackOverlay
 *         onConfirm={(digit) =>
 *           ocrFeedbackCallbacks.onConfirm(digit, expectedAnswer, canvasRef)
 *         }
 *         onReject={() => ocrFeedbackCallbacks.onReject(canvasRef)}
 *         onRetry={() => ocrFeedbackCallbacks.onRetry(canvasRef)}
 *         playSound={ocrFeedbackCallbacks.playSound}
 *       />
 *     </Box>
 *   );
 * }
 * ```
 */

/**
 * EXEMPLO 4: Fluxo completo passo a passo
 *
 * 1. Criança desenha "8" no canvas
 * 2. Criança clica "Enviar"
 * 3. ExerciseScreen chama handleSubmitWithOCRFeedback(imageData, model, 8)
 * 4. OCR processa e retorna { digit: 8, confidence: 0.65 }
 * 5. Confiança é 50-79% → setOCRFeedbackState('confirming', { digit: 8, confidence: 0.65 })
 * 6. OCRFeedbackOverlay renderiza OCRConfirmationOverlay
 * 7. Criança vê: "Você escreveu 8?" com botões ✓ e ✗
 * 8a. Criança clica ✓ → onConfirm(8) → valida resposta → Correto! → próximo exercício
 * 8b. Criança clica ✗ → onReject() → limpa canvas → aguarda nova escrita
 *
 * OU
 *
 * 4. OCR processa e retorna { digit: null, confidence: 0.35 }
 * 5. Confiança é <50% → setOCRFeedbackState('retry', { digit: null, confidence: 0.35 })
 * 6. OCRFeedbackOverlay renderiza OCRRetryOverlay
 * 7. Criança vê: "Não consegui entender. Vamos tentar de novo?"
 * 8. Criança clica "Tentar Novamente" → onRetry() → limpa canvas → aguarda nova escrita
 *
 * OU
 *
 * 4. OCR processa e retorna { digit: 8, confidence: 0.92 }
 * 5. Confiança é ≥80% → setOCRFeedbackState('validating', { digit: 8, confidence: 0.92 })
 * 6. NENHUM overlay é renderizado (fluxo silencioso)
 * 7. Valida resposta imediatamente → Correto! → próximo exercício
 */
