import { useRef, useState, useCallback } from 'react';
import { Box, Flex, Text, Button, Group, Loader } from '@mantine/core';
import DrawingCanvas, { DrawingCanvasHandle } from '../canvas/DrawingCanvas';

interface ExerciseScreenProps {
  /** Texto do exercício (ex: "5 + 3 = ?") */
  exerciseText?: string;
  /** Callback ao enviar a resposta */
  onSubmit?: (imageData: string | null) => void;
  /** Callback ao limpar o canvas */
  onClear?: () => void;
}

/**
 * Tela principal de exercício.
 * Layout responsivo: landscape (lado a lado) / portrait (empilhado).
 * Canvas domina a tela (≥60% da viewport).
 *
 * Estados do botão Enviar:
 * - Desabilitado: canvas vazio (cinza, not-allowed)
 * - Pronto: traço detectado (verde vibrante, pointer)
 * - Processando: OCR rodando (spinner + texto, disabled)
 */
export default function ExerciseScreen({
  exerciseText = '5 + 3 = ?',
  onSubmit,
  onClear,
}: ExerciseScreenProps) {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [hasDrawing, setHasDrawing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrawingChange = useCallback((hasContent: boolean) => {
    setHasDrawing(hasContent);
  }, []);

  const handleClear = () => {
    canvasRef.current?.clear();
    setHasDrawing(false);
    onClear?.();
  };

  const handleSubmit = async () => {
    if (!hasDrawing || isProcessing) return;

    setIsProcessing(true);
    const imageData = canvasRef.current?.getImageData();

    // Callback assíncrono (se onSubmit for async, aguarda)
    await onSubmit?.(imageData ?? null);

    setIsProcessing(false);
  };

  return (
    <Box
      data-testid="exercise-screen"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#F5F7FA', // Fundo neutro
        padding: '16px',
        boxSizing: 'border-box',
      }}
    >
      {/* Layout responsivo via Mantine Flex */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="xl"
        h="100%"
        w="100%"
      >
        {/* Painel do Exercício */}
        <Box
          data-testid="exercise-display"
          w={{ base: '100%', md: '35%' }}
          h={{ base: 'auto', md: '100%' }}
          miw={{ base: '100%', md: '35%' }}
          maw={{ base: '100%', md: '35%' }}
          display="flex"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFFFF',
            border: '3px solid #4A90E2',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <Text
            data-testid="exercise-prompt"
            size="48px"
            fw={700}
            c="#2C3E50"
            style={{
              textAlign: 'center',
              lineHeight: 1.2,
              userSelect: 'none',
            }}
          >
            {exerciseText}
          </Text>
        </Box>

        {/* Área do Canvas + Botões */}
        <Box
          data-testid="canvas-container"
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            minHeight: 0,
            minWidth: 0,
          }}
        >
          {/* Canvas de Desenho — tamanho contido para melhor OCR */}
          <Box
            style={{
              width: '100%',
              maxWidth: '340px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <DrawingCanvas
              ref={canvasRef}
              width="100%"
              height={180}
              onDrawingChange={handleDrawingChange}
            />
          </Box>

          {/* Botões de Ação */}
          <Group
            data-testid="action-buttons"
            gap="md"
            grow
            style={{
              flex: '0 0 auto',
            }}
          >
            <Button
              data-testid="clear-button"
              onClick={handleClear}
              size="xl"
              variant="outline"
              color="red"
              disabled={isProcessing}
              style={{
                minHeight: '60px',
                minWidth: '48px',
                fontSize: '24px',
                fontWeight: 600,
              }}
            >
              🗑️ Limpar
            </Button>

            <Button
              data-testid="submit-button"
              onClick={handleSubmit}
              size="xl"
              variant="filled"
              color="green"
              disabled={!hasDrawing || isProcessing}
              style={{
                minHeight: '64px',
                minWidth: '64px',
                fontSize: '24px',
                fontWeight: 600,
                backgroundColor: !hasDrawing
                  ? '#CCCCCC'
                  : isProcessing
                  ? 'rgba(76, 175, 80, 0.7)'
                  : '#4CAF50',
                cursor: !hasDrawing || isProcessing ? 'not-allowed' : 'pointer',
                transition: 'background-color 200ms ease-in-out',
              }}
            >
              {isProcessing ? (
                <Box
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <Loader size="sm" color="white" />
                  <Text size="sm" c="white" fw={500}>
                    Analisando...
                  </Text>
                </Box>
              ) : (
                <>✅ Enviar</>
              )}
            </Button>
          </Group>
        </Box>
      </Flex>
    </Box>
  );
}
