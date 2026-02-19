import { Box, Text, Button, Overlay } from '@mantine/core';
import { useEffect } from 'react';

interface OCRRetryOverlayProps {
  onRetry: () => void;
  playSound?: (type: 'oops') => void;
}

/**
 * Overlay de Reescrita (<50% confiança) - VERSÃO SIMPLIFICADA
 *
 * Esta versão usa emojis/Unicode ao invés de ícones do Tabler
 * Use esta versão se ainda não instalou @tabler/icons-react
 */
export const OCRRetryOverlay: React.FC<OCRRetryOverlayProps> = ({
  onRetry,
  playSound,
}) => {
  useEffect(() => {
    playSound?.('oops');
  }, [playSound]);

  return (
    <Box
      data-testid="retry-overlay"
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
        {/* Ícone emoji grande em círculo */}
        <Box
          style={{
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <Box
            style={{
              width: '128px',
              height: '128px',
              borderRadius: '50%',
              backgroundColor: '#6C63FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(108, 99, 255, 0.4)',
            }}
          >
            <Text
              size="96px"
              style={{
                lineHeight: 1,
              }}
            >
              🤔
            </Text>
          </Box>
        </Box>

        {/* Mensagem */}
        <Text
          size="32px"
          fw={600}
          c="white"
          style={{
            marginBottom: '32px',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          Não consegui entender.
          <br />
          Vamos tentar de novo?
        </Text>

        {/* Botão */}
        <Button
          data-testid="retry-button"
          onClick={onRetry}
          size="xl"
          radius="xl"
          style={{
            minWidth: '240px',
            height: '80px',
            fontSize: '28px',
            fontWeight: 600,
            backgroundColor: '#2196F3',
            color: 'white',
            border: 'none',
            boxShadow: '0 4px 16px rgba(33, 150, 243, 0.4)',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          styles={{
            root: {
              '&:hover': {
                backgroundColor: '#1976D2',
                transform: 'scale(1.05)',
              },
              '&:active': {
                transform: 'scale(0.95)',
              },
            },
          }}
        >
          <span style={{ fontSize: '32px' }}>🔄</span>
          Tentar Novamente
        </Button>
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
