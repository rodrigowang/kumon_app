import { Box, Text, Button, FocusTrap, Stack } from '@mantine/core';
import { useEffect } from 'react';

interface OCRRetryOverlayProps {
  onRetry: () => void;
  playSound?: (type: 'doubt' | 'oops' | 'tap' | 'confirm') => void;
  /** Número de retries consecutivos neste exercício */
  retryCount?: number;
  /** Chamado quando o usuário quer usar o teclado numérico */
  onUseKeypad?: () => void;
  /** Número de dígitos esperados na resposta (ativa dica de espaçamento) */
  expectedDigits?: number;
}

/**
 * Overlay de Reescrita (<50% confiança)
 *
 * Pede para a criança tentar desenhar novamente.
 * Após 2+ retries, mostra botão de teclado numérico como alternativa.
 */
export const OCRRetryOverlay: React.FC<OCRRetryOverlayProps> = ({
  onRetry,
  playSound,
  retryCount = 0,
  onUseKeypad,
  expectedDigits,
}) => {
  useEffect(() => {
    playSound?.('oops');
  }, [playSound]);

  const showKeypadButton = retryCount >= 2 && onUseKeypad;
  // Dica de espaçamento: só no primeiro retry, quando a resposta tem 2+ dígitos
  const showSpacingTip = !showKeypadButton && expectedDigits !== undefined && expectedDigits > 1;

  // Suporte a teclado: Enter = retry, K = teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        onRetry();
      } else if ((e.key === 'k' || e.key === 'K') && showKeypadButton) {
        e.preventDefault();
        onUseKeypad?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onRetry, onUseKeypad, showKeypadButton]);

  return (
    <FocusTrap active>
    <Box
      data-testid="retry-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Não consegui entender o desenho"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        animation: 'retryFadeIn 200ms ease-in',
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
            marginBottom: showSpacingTip ? '12px' : '32px',
            lineHeight: 1.3,
            textShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          {showKeypadButton
            ? 'Não consegui entender.\nQuer usar o teclado?'
            : 'Não consegui entender.\nVamos tentar de novo?'}
        </Text>

        {/* Dica de espaçamento para multi-dígitos */}
        {showSpacingTip && (
          <Box
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '12px 20px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Text size="28px" style={{ lineHeight: 1 }}>💡</Text>
            <Text size="22px" c="white" fw={500} style={{ lineHeight: 1.3 }}>
              Escreva os números mais separados!
            </Text>
          </Box>
        )}

        {/* Botões */}
        <Stack gap="md" align="center">
          <Button
            data-testid="retry-button"
            data-autofocus
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
          >
            <span style={{ fontSize: '32px' }}>🔄</span>
            Desenhar de novo
          </Button>

          {/* Botão de teclado (aparece após 2+ retries) */}
          {showKeypadButton && (
            <Button
              data-testid="use-keypad-button"
              onClick={onUseKeypad}
              size="xl"
              radius="xl"
              style={{
                minWidth: '240px',
                height: '80px',
                fontSize: '28px',
                fontWeight: 600,
                backgroundColor: '#FF9800',
                color: 'white',
                border: 'none',
                boxShadow: '0 4px 16px rgba(255, 152, 0, 0.4)',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                animation: 'keypadBounce 0.5s ease-out',
              }}
            >
              <span style={{ fontSize: '32px' }}>⌨️</span>
              Usar teclado
            </Button>
          )}
        </Stack>
      </Box>

      <style>
        {`
          @keyframes retryFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes keypadBounce {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.05); }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </Box>
    </FocusTrap>
  );
};
