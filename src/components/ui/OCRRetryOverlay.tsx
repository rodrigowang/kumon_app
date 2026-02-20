import { Box, Text, Button, Overlay } from '@mantine/core';
import { IconQuestionMark, IconRefresh } from '@tabler/icons-react';
import { useEffect } from 'react';

interface OCRRetryOverlayProps {
  onRetry: () => void;
  playSound?: (type: 'doubt' | 'oops' | 'tap' | 'confirm') => void;
}

/**
 * Overlay de Reescrita (<50% confiança)
 *
 * Princípios pedagógicos:
 * - Não é erro da criança, é limitação do OCR
 * - Tom encorajador, nunca punitivo
 * - Convite para melhorar: "Vamos tentar de novo?"
 */
export const OCRRetryOverlay: React.FC<OCRRetryOverlayProps> = ({
  onRetry,
  playSound,
}) => {
  useEffect(() => {
    // Som encorajador ao aparecer
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
      {/* Overlay semi-transparente */}
      <Overlay
        opacity={0.7}
        color="#000"
        blur={2}
        style={{
          borderRadius: '12px',
        }}
      />

      {/* Conteúdo centralizado */}
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
        {/* Ícone de interrogação/dúvida */}
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
            <IconQuestionMark
              size={96}
              stroke={3}
              color="white"
            />
          </Box>
        </Box>

        {/* Mensagem encorajadora */}
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

        {/* Botão de tentar novamente */}
        <Button
          data-testid="retry-button"
          onClick={onRetry}
          size="xl"
          radius="xl"
          leftSection={<IconRefresh size={32} stroke={2.5} />}
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
          Tentar Novamente
        </Button>
      </Box>

      {/* Animação CSS */}
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
