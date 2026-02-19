import { useRef, useState } from 'react';
import { Box, Stack, Button, Group, Text } from '@mantine/core';
import DrawingCanvas, { DrawingCanvasHandle } from '../canvas/DrawingCanvas';
import { OCRFeedbackOverlay } from '../ui/OCRFeedbackOverlay';
import { useGameStore } from '../../stores/useGameStore';

/**
 * Componente de teste para OCR Feedback Overlays
 *
 * Simula os três cenários de confiança do OCR:
 * - Alta (≥80%): sem overlay, prossegue direto
 * - Média (50-79%): overlay de confirmação
 * - Baixa (<50%): overlay de reescrita
 */
export const OCRFeedbackTester: React.FC = () => {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const { setOCRFeedbackState } = useGameStore();
  const [lastAction, setLastAction] = useState<string>('');

  // Simula OCR com alta confiança (≥80%)
  const simulateHighConfidence = () => {
    const mockDigit = Math.floor(Math.random() * 10);
    setLastAction(`OCR detectou: ${mockDigit} (confiança: 85%) → Prossegue direto`);
    setOCRFeedbackState('validating', { digit: mockDigit, confidence: 0.85 });

    // Simula validação matemática após 1s
    setTimeout(() => {
      setOCRFeedbackState('idle');
      setLastAction(`Validação matemática concluída para ${mockDigit}`);
    }, 1000);
  };

  // Simula OCR com média confiança (50-79%)
  const simulateMediumConfidence = () => {
    const mockDigit = Math.floor(Math.random() * 10);
    setLastAction(`OCR detectou: ${mockDigit} (confiança: 65%) → Aguardando confirmação`);
    setOCRFeedbackState('confirming', { digit: mockDigit, confidence: 0.65 });
  };

  // Simula OCR com baixa confiança (<50%)
  const simulateLowConfidence = () => {
    setLastAction('OCR não conseguiu reconhecer (confiança: 35%) → Pedindo reescrita');
    setOCRFeedbackState('retry', { digit: null, confidence: 0.35 });
  };

  // Handlers dos overlays
  const handleConfirm = (digit: number) => {
    setLastAction(`✓ Criança confirmou: ${digit} → Prossegue para validação`);
    canvasRef.current?.clear();
    setOCRFeedbackState('validating', { digit, confidence: 0.65 });

    setTimeout(() => {
      setOCRFeedbackState('idle');
      setLastAction(`Validação matemática concluída para ${digit}`);
    }, 1000);
  };

  const handleReject = () => {
    setLastAction('✗ Criança rejeitou → Canvas limpo, aguardando nova escrita');
    canvasRef.current?.clear();
  };

  const handleRetry = () => {
    setLastAction('🔄 Criança vai tentar de novo → Canvas limpo');
    canvasRef.current?.clear();
  };

  const playSound = (type: 'doubt' | 'oops') => {
    console.log(`[Som] ${type === 'doubt' ? '🤔 Dúvida' : '😅 Oops'}`);
    // TODO: integrar com Howler.js quando implementar sistema de som
  };

  return (
    <Box p="xl">
      <Stack gap="lg">
        {/* Título */}
        <Box>
          <Text size="xl" fw={700} mb="xs">
            OCR Feedback Overlays — Tester
          </Text>
          <Text size="sm" c="dimmed">
            Simula os três cenários de confiança do OCR e testa os overlays
          </Text>
        </Box>

        {/* Canvas com overlays */}
        <Box
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '500px',
          }}
        >
          <DrawingCanvas
            ref={canvasRef}
            width="100%"
            height={400}
          />

          {/* Overlays renderizados condicionalmente */}
          <OCRFeedbackOverlay
            onConfirm={handleConfirm}
            onReject={handleReject}
            onRetry={handleRetry}
            playSound={playSound}
          />
        </Box>

        {/* Controles de simulação */}
        <Group gap="md">
          <Button
            onClick={simulateHighConfidence}
            color="green"
            variant="filled"
          >
            Simular Alta Confiança (≥80%)
          </Button>

          <Button
            onClick={simulateMediumConfidence}
            color="yellow"
            variant="filled"
          >
            Simular Média Confiança (50-79%)
          </Button>

          <Button
            onClick={simulateLowConfidence}
            color="red"
            variant="filled"
          >
            Simular Baixa Confiança (&lt;50%)
          </Button>

          <Button
            onClick={() => {
              canvasRef.current?.clear();
              setOCRFeedbackState('idle');
              setLastAction('');
            }}
            variant="outline"
          >
            Resetar
          </Button>
        </Group>

        {/* Log de ações */}
        {lastAction && (
          <Box
            p="md"
            style={{
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #dee2e6',
            }}
          >
            <Text size="sm" fw={500} mb={4}>
              Última ação:
            </Text>
            <Text size="sm" c="dimmed">
              {lastAction}
            </Text>
          </Box>
        )}

        {/* Instruções */}
        <Box
          p="md"
          style={{
            backgroundColor: '#e7f5ff',
            borderRadius: '8px',
            border: '1px solid #339af0',
          }}
        >
          <Text size="sm" fw={600} mb={8}>
            Como testar:
          </Text>
          <Stack gap={4}>
            <Text size="sm">
              1. Desenhe um dígito no canvas (opcional)
            </Text>
            <Text size="sm">
              2. Clique em um dos botões de simulação para testar cada cenário
            </Text>
            <Text size="sm">
              3. Interaja com os overlays (confirmar/rejeitar/tentar novamente)
            </Text>
            <Text size="sm">
              4. Observe o log de ações para entender o fluxo
            </Text>
          </Stack>
        </Box>

        {/* Checklist pedagógico */}
        <Box
          p="md"
          style={{
            backgroundColor: '#fff3bf',
            borderRadius: '8px',
            border: '1px solid #ffd43b',
          }}
        >
          <Text size="sm" fw={600} mb={8}>
            ✅ Checklist Pedagógico:
          </Text>
          <Stack gap={4}>
            <Text size="sm">• Botões grandes (≥64px) para toques imprecisos?</Text>
            <Text size="sm">• Overlay de confirmação parece "ajuda", não "erro"?</Text>
            <Text size="sm">• Overlay de reescrita é encorajador, não punitivo?</Text>
            <Text size="sm">• Criança consegue entender sem ler nada?</Text>
            <Text size="sm">• Animações são suaves (fade-in 200ms)?</Text>
            <Text size="sm">• Canvas não fica bloqueado indefinidamente?</Text>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

export default OCRFeedbackTester;
