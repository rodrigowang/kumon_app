import { Box, Button } from '@mantine/core';

interface FloatingKeypadButtonProps {
  onClick: () => void;
  playSound?: (sound: string) => void;
}

/**
 * Botão flutuante discreto de teclado numérico
 * Aparece após 3 tentativas falhas de OCR
 *
 * Requisitos:
 * - Posição fixa no canto inferior direito
 * - Touch target ≥64px
 * - Animação suave de entrada
 * - Visual discreto mas perceptível
 */
export function FloatingKeypadButton({
  onClick,
  playSound,
}: FloatingKeypadButtonProps) {
  const handleClick = () => {
    playSound?.('tap');
    onClick();
  };

  return (
    <Box
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 500,
        animation: 'slideInRight 300ms ease-out',
      }}
      data-testid="floating-keypad-button"
    >
      <Button
        size="xl"
        variant="filled"
        color="blue.6"
        radius="50%"
        onClick={handleClick}
        style={{
          width: '72px',
          height: '72px',
          fontSize: '36px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
        aria-label="Abrir teclado numérico"
      >
        ⌨️
      </Button>

      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(100px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </Box>
  );
}
