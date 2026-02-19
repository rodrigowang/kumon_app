import { Box, Text, Button, Group, Overlay } from '@mantine/core';
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
 * Esta versão usa emojis/Unicode ao invés de ícones do Tabler
 * Use esta versão se ainda não instalou @tabler/icons-react
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

  return (
    <Box
      data-testid="confirmation-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        animation: 'fadeIn 200ms ease-in',
      }}
    >
      <Overlay
        opacity={0.7}
        color="#000"
        blur={2}
        style={{
          borderRadius: '12px',
        }}
      />

      <Box
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
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
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: '#45a049',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
            }}
          >
            ✓
          </Button>

          <Button
            data-testid="confirm-no"
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
            styles={{
              root: {
                '&:hover': {
                  backgroundColor: '#F57C00',
                  transform: 'scale(1.05)',
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              },
            }}
          >
            ✗
          </Button>
        </Group>
      </Box>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
        `}
      </style>
    </Box>
  );
};
