import { Box, Text, Button, FocusTrap, Group } from '@mantine/core';
import { useEffect } from 'react';

interface OCRConfirmationOverlayProps {
  digit: number;
  onConfirm: () => void;
  onReject: () => void;
  playSound?: (type: 'doubt') => void;
}

/**
 * Overlay de Confirmação (50-79% confiança) - VERSÃO SIMPLIFICADA
 *
 * Exibe o dígito reconhecido e pergunta se está correto.
 * Botões grandes ✓ (verde) e ✗ (laranja).
 */
export const OCRConfirmationOverlay: React.FC<OCRConfirmationOverlayProps> = ({
  digit,
  onConfirm,
  onReject,
  playSound,
}) => {
  useEffect(() => {
    playSound?.('doubt');
  }, [playSound]);

  // Suporte a teclado: Enter = confirmar, Escape/N = rejeitar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        onReject();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onReject]);

  return (
    <FocusTrap active>
    <Box
      data-testid="confirmation-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Confirmação: você escreveu ${digit}?`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        animation: 'fadeIn 200ms ease-in',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        style={{
          textAlign: 'center',
          width: '90%',
          maxWidth: '400px',
        }}
      >
        {/* Ícone emoji */}
        <Text
          size="64px"
          style={{
            marginBottom: '16px',
            lineHeight: 1,
          }}
        >
          🔍
        </Text>

        {/* Dígito detectado */}
        <Text
          size="96px"
          fw={700}
          c="white"
          style={{
            lineHeight: 1,
            marginBottom: '16px',
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {digit}
        </Text>

        {/* Pergunta */}
        <Text
          size="28px"
          fw={600}
          c="white"
          style={{
            marginBottom: '24px',
            textShadow: '0 1px 4px rgba(0,0,0,0.3)',
          }}
        >
          Você escreveu {digit}?
        </Text>

        {/* Botões */}
        <Group justify="center" gap="xl">
          <Button
            data-testid="confirm-yes"
            aria-label="Sim, está correto (Enter)"
            data-autofocus
            onClick={onConfirm}
            size="xl"
            radius="xl"
            style={{
              width: '120px',
              height: '80px',
              fontSize: '48px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(76, 175, 80, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            <span aria-hidden="true">✓</span>
          </Button>

          <Button
            data-testid="confirm-no"
            aria-label="Não, está errado (Escape)"
            onClick={onReject}
            size="xl"
            radius="xl"
            style={{
              width: '120px',
              height: '80px',
              fontSize: '48px',
              backgroundColor: '#FF9800',
              color: 'white',
              border: 'none',
              boxShadow: '0 4px 12px rgba(255, 152, 0, 0.4)',
              transition: 'all 0.2s',
            }}
          >
            <span aria-hidden="true">✗</span>
          </Button>
        </Group>
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `}
      </style>
    </Box>
    </FocusTrap>
  );
};
