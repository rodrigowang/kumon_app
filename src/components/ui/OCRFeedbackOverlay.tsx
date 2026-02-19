import { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { OCRConfirmationOverlay } from './OCRConfirmationOverlay';
import { OCRRetryOverlay } from './OCRRetryOverlay';
import { FloatingKeypadButton } from './FloatingKeypadButton';
import { NumericKeypadOverlay } from './NumericKeypadOverlay';

interface OCRFeedbackOverlayProps {
  onConfirm?: (digit: number) => void;
  onReject?: () => void;
  onRetry?: () => void;
  playSound?: (type: 'doubt' | 'oops' | 'tap' | 'confirm') => void;
}

/**
 * Componente wrapper que renderiza o overlay correto baseado no estado do OCR
 *
 * Fluxo:
 * - 'idle': nenhum overlay (mas pode mostrar botão flutuante se ≥3 tentativas falhas)
 * - 'confirming': overlay de confirmação (50-79% confiança)
 * - 'retry': overlay de reescrita (<50% confiança)
 * - 'validating': nenhum overlay (≥80% confiança, prossegue direto)
 *
 * Fallback após 3 tentativas falhas:
 * - Exibe botão flutuante de teclado
 * - Ao clicar, abre modal de teclado numérico
 * - Entrada manual dispara fluxo de validação
 */
export const OCRFeedbackOverlay: React.FC<OCRFeedbackOverlayProps> = ({
  onConfirm,
  onReject,
  onRetry,
  playSound,
}) => {
  const { ocrFeedbackState, ocrFeedbackData, ocrFailedAttempts, clearOCRFeedback } = useGameStore();
  const [showKeypad, setShowKeypad] = useState(false);

  // Modal de teclado numérico (aberto manualmente via botão flutuante)
  if (showKeypad) {
    return (
      <NumericKeypadOverlay
        onSubmit={(digit) => {
          setShowKeypad(false);
          onConfirm?.(digit);
        }}
        onClose={() => setShowKeypad(false)}
        playSound={playSound}
      />
    );
  }

  // Botão flutuante de teclado (aparece após 3 tentativas falhas)
  const shouldShowFloatingButton =
    ocrFailedAttempts >= 3 &&
    (ocrFeedbackState === 'idle' || ocrFeedbackState === 'retry');

  // Overlay de confirmação (50-79%)
  if (ocrFeedbackState === 'confirming' && ocrFeedbackData?.digit !== null) {
    return (
      <>
        <OCRConfirmationOverlay
          digit={ocrFeedbackData.digit as number}
          onConfirm={() => {
            onConfirm?.(ocrFeedbackData.digit as number);
            clearOCRFeedback();
          }}
          onReject={() => {
            onReject?.();
            clearOCRFeedback();
          }}
          playSound={playSound}
        />
        {shouldShowFloatingButton && (
          <FloatingKeypadButton
            onClick={() => setShowKeypad(true)}
            playSound={playSound}
          />
        )}
      </>
    );
  }

  // Overlay de reescrita (<50%)
  if (ocrFeedbackState === 'retry') {
    return (
      <>
        <OCRRetryOverlay
          onRetry={() => {
            onRetry?.();
            clearOCRFeedback();
          }}
          playSound={playSound}
        />
        {shouldShowFloatingButton && (
          <FloatingKeypadButton
            onClick={() => setShowKeypad(true)}
            playSound={playSound}
          />
        )}
      </>
    );
  }

  // Estado idle ou validating: apenas botão flutuante (se necessário)
  if (shouldShowFloatingButton) {
    return (
      <FloatingKeypadButton
        onClick={() => setShowKeypad(true)}
        playSound={playSound}
      />
    );
  }

  return null;
};
