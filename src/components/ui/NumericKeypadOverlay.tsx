import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

interface NumericKeypadOverlayProps {
  onSubmit: (digit: number) => void;
  onClose: () => void;
  playSound?: (sound: string) => void;
}

/**
 * Modal de teclado numérico simplificado (0-9)
 * Fallback para quando OCR falha 3+ vezes
 *
 * Requisitos:
 * - Botões grandes ≥64px (touch target)
 * - Layout 3x4 (1-9 + clear/0/submit)
 * - Visual infantil (cores, espaçamento)
 * - Som ao tocar botão
 */
export function NumericKeypadOverlay({
  onSubmit,
  onClose,
  playSound,
}: NumericKeypadOverlayProps) {
  const [currentInput, setCurrentInput] = useState<string>('');

  const handleNumberClick = (num: number) => {
    playSound?.('tap');
    setCurrentInput(num.toString());
  };

  const handleClear = () => {
    playSound?.('tap');
    setCurrentInput('');
  };

  const handleSubmit = () => {
    if (currentInput !== '') {
      playSound?.('confirm');
      const digit = parseInt(currentInput, 10);
      if (!isNaN(digit) && digit >= 0 && digit <= 9) {
        onSubmit(digit);
      }
    }
  };

  const handleCancel = () => {
    playSound?.('tap');
    onClose();
  };

  // Grid de botões: 1-9
  const numberButtons = Array.from({ length: 9 }, (_, i) => i + 1);

  return (
    <Box
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        animation: 'fadeIn 200ms ease-out',
      }}
      data-testid="numeric-keypad-overlay"
    >
      <Box
        style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '32px',
          width: '90%',
          maxWidth: '420px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Stack gap="lg">
          {/* Cabeçalho */}
          <Stack gap="xs" align="center">
            <Text
              size="32px"
              fw={700}
              c="blue.7"
              style={{ lineHeight: 1.2 }}
            >
              ⌨️
            </Text>
            <Text
              size="24px"
              fw={600}
              c="gray.8"
              ta="center"
              style={{ lineHeight: 1.3 }}
            >
              Escreva o número aqui
            </Text>
          </Stack>

          {/* Display do número digitado */}
          <Box
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '16px',
              padding: '24px',
              textAlign: 'center',
              minHeight: '80px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #e9ecef',
            }}
            data-testid="keypad-display"
          >
            <Text
              size="72px"
              fw={700}
              c={currentInput ? 'blue.7' : 'gray.4'}
              style={{ lineHeight: 1 }}
            >
              {currentInput || '?'}
            </Text>
          </Box>

          {/* Grid de botões 1-9 */}
          <Box>
            <Group gap="md" justify="center" wrap="wrap">
              {numberButtons.map((num) => (
                <Button
                  key={num}
                  size="xl"
                  variant="filled"
                  color="blue.6"
                  radius="md"
                  onClick={() => handleNumberClick(num)}
                  style={{
                    width: '100px',
                    height: '80px',
                    fontSize: '36px',
                    fontWeight: 700,
                    flexGrow: 0,
                    flexShrink: 0,
                  }}
                  data-testid={`keypad-button-${num}`}
                >
                  {num}
                </Button>
              ))}
            </Group>
          </Box>

          {/* Linha de botões: Clear, 0, OK */}
          <Group gap="md" justify="center" grow>
            <Button
              size="xl"
              variant="outline"
              color="gray.6"
              radius="md"
              onClick={handleClear}
              style={{
                height: '80px',
                fontSize: '24px',
                fontWeight: 600,
              }}
              data-testid="keypad-clear"
            >
              Limpar
            </Button>
            <Button
              size="xl"
              variant="filled"
              color="blue.6"
              radius="md"
              onClick={() => handleNumberClick(0)}
              style={{
                height: '80px',
                fontSize: '36px',
                fontWeight: 700,
              }}
              data-testid="keypad-button-0"
            >
              0
            </Button>
            <Button
              size="xl"
              variant="filled"
              color="green.6"
              radius="md"
              onClick={handleSubmit}
              disabled={currentInput === ''}
              style={{
                height: '80px',
                fontSize: '28px',
                fontWeight: 700,
              }}
              data-testid="keypad-submit"
            >
              ✓ OK
            </Button>
          </Group>

          {/* Botão Cancelar */}
          <Button
            size="md"
            variant="subtle"
            color="gray.6"
            radius="md"
            onClick={handleCancel}
            style={{
              fontSize: '18px',
              fontWeight: 500,
            }}
            data-testid="keypad-cancel"
          >
            Cancelar
          </Button>
        </Stack>
      </Box>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </Box>
  );
}
