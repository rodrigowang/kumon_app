import { useState } from 'react';
import { Box, Button, Card, Group, Stack, Text, Title } from '@mantine/core';
import { useGameStore } from '../../stores/useGameStore';
import { OCRFeedbackOverlay } from '../ui';

/**
 * Componente de teste para o fallback de teclado numérico
 * Permite simular múltiplas tentativas falhas e testar o fluxo completo
 */
export function KeypadFallbackTester() {
  const {
    ocrFeedbackState,
    ocrFailedAttempts,
    setOCRFeedbackState,
    incrementOCRFailedAttempts,
    resetOCRFailedAttempts,
    clearOCRFeedback,
  } = useGameStore();

  const [lastSubmittedDigit, setLastSubmittedDigit] = useState<number | null>(null);

  // Simular tentativa falha (confiança <50%)
  const handleSimulateFailure = () => {
    incrementOCRFailedAttempts();
    setOCRFeedbackState('retry', { digit: null, confidence: 0.35 });
  };

  // Simular confirmação (confiança 50-79%)
  const handleSimulateConfirmation = () => {
    const randomDigit = Math.floor(Math.random() * 10);
    setOCRFeedbackState('confirming', { digit: randomDigit, confidence: 0.65 });
  };

  // Reset completo
  const handleReset = () => {
    resetOCRFailedAttempts();
    clearOCRFeedback();
    setLastSubmittedDigit(null);
  };

  // Callback quando usuário confirma um dígito
  const handleConfirm = (digit: number) => {
    console.log('✅ Dígito confirmado:', digit);
    setLastSubmittedDigit(digit);
    // Em produção, aqui seria disparado o fluxo de validação matemática
  };

  // Callback quando usuário rejeita
  const handleReject = () => {
    console.log('❌ Dígito rejeitado');
    incrementOCRFailedAttempts();
  };

  // Callback quando usuário tenta novamente
  const handleRetry = () => {
    console.log('🔄 Tentando novamente');
  };

  return (
    <Box p="xl" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Stack gap="lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <Title order={2}>🧪 Testador de Fallback de Teclado</Title>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Estado Atual
            </Text>

            <Group gap="md">
              <Box
                style={{
                  backgroundColor: '#e7f5ff',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  flex: 1,
                }}
              >
                <Text size="sm" c="dimmed">
                  Estado OCR
                </Text>
                <Text size="lg" fw={600} c="blue">
                  {ocrFeedbackState}
                </Text>
              </Box>

              <Box
                style={{
                  backgroundColor: ocrFailedAttempts >= 3 ? '#fff3e0' : '#f1f3f5',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  flex: 1,
                }}
              >
                <Text size="sm" c="dimmed">
                  Tentativas Falhas
                </Text>
                <Text size="lg" fw={600} c={ocrFailedAttempts >= 3 ? 'orange' : 'gray'}>
                  {ocrFailedAttempts} / 3
                </Text>
              </Box>

              {lastSubmittedDigit !== null && (
                <Box
                  style={{
                    backgroundColor: '#d3f9d8',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    flex: 1,
                  }}
                >
                  <Text size="sm" c="dimmed">
                    Último Dígito
                  </Text>
                  <Text size="lg" fw={600} c="green">
                    {lastSubmittedDigit}
                  </Text>
                </Box>
              )}
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Ações de Teste
            </Text>

            <Group gap="md" grow>
              <Button
                size="lg"
                variant="filled"
                color="red"
                onClick={handleSimulateFailure}
              >
                ❌ Simular Falha
                <br />
                <Text size="xs" c="white" opacity={0.8}>
                  (confiança &lt;50%)
                </Text>
              </Button>

              <Button
                size="lg"
                variant="filled"
                color="orange"
                onClick={handleSimulateConfirmation}
              >
                ❓ Simular Confirmação
                <br />
                <Text size="xs" c="white" opacity={0.8}>
                  (confiança 50-79%)
                </Text>
              </Button>

              <Button size="lg" variant="filled" color="gray" onClick={handleReset}>
                🔄 Reset
              </Button>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Text size="lg" fw={600}>
              Instruções
            </Text>

            <Stack gap="xs">
              <Text size="sm">
                1. Clique 3x em "❌ Simular Falha" para ativar o fallback
              </Text>
              <Text size="sm">
                2. Após 3 tentativas, o botão flutuante de teclado ⌨️ aparecerá no canto
                inferior direito
              </Text>
              <Text size="sm">
                3. Clique no botão flutuante para abrir o teclado numérico
              </Text>
              <Text size="sm">
                4. Digite um número e clique em "✓ OK" para submeter
              </Text>
              <Text size="sm" c="dimmed">
                Nota: O botão flutuante também aparece junto com overlays de confirmação/reescrita
              </Text>
            </Stack>
          </Stack>
        </Card>

        {ocrFailedAttempts >= 3 && (
          <Card shadow="sm" padding="lg" radius="md" withBorder bg="orange.0">
            <Group gap="md">
              <Text size="48px">⚠️</Text>
              <Stack gap={0}>
                <Text size="lg" fw={600} c="orange.8">
                  Fallback Ativado!
                </Text>
                <Text size="sm" c="orange.7">
                  O botão flutuante de teclado deve estar visível agora.
                </Text>
              </Stack>
            </Group>
          </Card>
        )}
      </Stack>

      {/* Overlays de Feedback OCR */}
      <OCRFeedbackOverlay
        onConfirm={handleConfirm}
        onReject={handleReject}
        onRetry={handleRetry}
        playSound={(type) => console.log('🔊 Som:', type)}
      />
    </Box>
  );
}
