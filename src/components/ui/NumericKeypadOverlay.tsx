import { Box, Button, Group, Stack, Text } from '@mantine/core';
import { useState } from 'react';

interface NumericKeypadOverlayProps {
  /** Chamado com o número digitado (pode ser multi-dígito) */
  onSubmit: (number: number) => void;
  onClose: () => void;
  playSound?: (sound: string) => void;
  /** Limite máximo de dígitos (padrão: 2, suficiente para respostas até 99) */
  maxDigits?: number;
}

/**
 * Modal de teclado numérico (0-9, multi-dígito)
 * Fallback para quando OCR falha 2+ vezes
 *
 * Requisitos:
 * - Botões grandes ≥64px (touch target)
 * - Layout 3x4 (1-9 + clear/0/submit)
 * - Visual infantil (cores, espaçamento)
 * - Som ao tocar botão
 * - Suporta respostas multi-dígito (ex: 12, 20)
 */
export function NumericKeypadOverlay({
  onSubmit,
  onClose,
  playSound,
  maxDigits = 2,
}: NumericKeypadOverlayProps) {
  const [currentInput, setCurrentInput] = useState<string>('');

  const handleNumberClick = (num: number) => {
    playSound?.('tap');
    // Append digit (multi-dígito), respeitar limite
    if (currentInput.length < maxDigits) {
      setCurrentInput((prev) => prev + num.toString());
    }
  };

  const handleBackspace = () => {
    playSound?.('tap');
    setCurrentInput((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    playSound?.('tap');
    setCurrentInput('');
  };

  const handleSubmit = () => {
    if (currentInput !== '') {
      playSound?.('confirm');
      const value = parseInt(currentInput, 10);
      if (!isNaN(value)) {
        onSubmit(value);
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
        animation: 'keypadFadeIn 200ms ease-out',
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
              Digite o número
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

          {/* Linha de botões: Apagar, 0, OK */}
          <Group gap="md" justify="center" grow>
            <Button
              size="xl"
              variant="outline"
              color="gray.6"
              radius="md"
              onClick={currentInput.length > 0 ? handleBackspace : handleClear}
              style={{
                height: '80px',
                fontSize: '24px',
                fontWeight: 600,
              }}
              data-testid="keypad-clear"
            >
              {currentInput.length > 1 ? '⌫' : 'Limpar'}
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

          {/* Botão Cancelar (volta para desenho) */}
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
            Voltar para desenho
          </Button>
        </Stack>
      </Box>

      <style>{`
        @keyframes keypadFadeIn {
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
