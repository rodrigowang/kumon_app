import { Box, Text, Button, Group, Overlay } from '@mantine/core';
import { IconCheck, IconX, IconSearch } from '@tabler/icons-react';
import { useEffect } from 'react';

interface OCRConfirmationOverlayProps {
  digit: number;
  onConfirm: () => void;
  onReject: () => void;
  playSound?: (type: 'doubt' | 'oops' | 'tap' | 'confirm') => void;
}

/**
 * Overlay de Confirmação (50-79% confiança)
 *
 * Princípios pedagógicos:
 * - Não é um erro, é uma parceria: "Vamos checar juntos?"
 * - Criança valida o que o sistema leu
 * - Feedback visual + sonoro neutro (dúvida, não erro)
 */
export const OCRConfirmationOverlay: React.FC<OCRConfirmationOverlayProps> = ({
  digit,
  onConfirm,
  onReject,
  playSound,
}) => {
  useEffect(() => {
    // Som de dúvida ao aparecer
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
        {/* Ícone de lupa/dúvida */}
        <Box
          style={{
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IconSearch
            size={64}
            stroke={2}
            color="#FFD93D"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
            }}
          />
        </Box>

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

        {/* Botões de confirmação */}
        <Group justify="center" gap="xl">
          {/* Botão SIM (verde) */}
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
            <IconCheck size={48} stroke={3} />
          </Button>

          {/* Botão NÃO (amarelo/laranja) */}
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
            <IconX size={48} stroke={3} />
          </Button>
        </Group>
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
