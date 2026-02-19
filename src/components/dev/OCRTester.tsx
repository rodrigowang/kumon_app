/**
 * Componente de teste para o hook useOCRModel
 *
 * Exibe o estado de carregamento do modelo MNIST e permite
 * testar o reconhecimento de dígitos (quando integrado com canvas).
 *
 * IMPORTANTE: Este componente é apenas para DEV/DEBUG.
 * Não deve ser usado em produção.
 */

import { Paper, Badge, Stack, Text, Title, Code } from '@mantine/core';
import { useOCRModel } from '@/hooks';

export const OCRTester = () => {
  const { model, isLoading, error } = useOCRModel();

  return (
    <Paper p="xl" withBorder shadow="sm" style={{ maxWidth: 800, margin: '0 auto' }}>
      <Stack gap="md">
        <Title order={2}>🧠 OCR Model Tester</Title>

        {/* Status do modelo */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Status do Modelo
          </Text>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <Badge
              color={isLoading ? 'yellow' : model ? 'green' : 'red'}
              variant="filled"
              size="lg"
            >
              {isLoading ? '⏳ Carregando...' : model ? '✓ Pronto' : '✗ Erro'}
            </Badge>

            {model && (
              <>
                <Badge color="blue" variant="light">
                  Input: {model.inputs[0].shape?.toString()}
                </Badge>
                <Badge color="blue" variant="light">
                  Output: {model.outputs[0].shape?.toString()}
                </Badge>
              </>
            )}
          </div>
        </Stack>

        {/* Mensagem de erro */}
        {error && (
          <Paper bg="red.1" p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-6)' }}>
            <Text c="red.9" fw={600} size="sm">
              ❌ {error}
            </Text>
            <Text c="red.7" size="xs" mt="xs">
              Verifique se os arquivos do modelo estão em{' '}
              <Code>/public/models/mnist/model.json</Code>
            </Text>
          </Paper>
        )}

        {/* Modelo carregado com sucesso */}
        {model && (
          <Paper bg="green.1" p="md" withBorder style={{ borderColor: 'var(--mantine-color-green-6)' }}>
            <Text c="green.9" fw={600} size="sm">
              ✅ Modelo MNIST carregado com sucesso!
            </Text>
            <Text c="green.7" size="xs" mt="xs">
              O modelo está pronto para reconhecer dígitos manuscritos (0-9).
            </Text>
            <Text c="green.7" size="xs" mt="4">
              Próxima etapa: integrar com DrawingCanvas para reconhecimento em tempo real.
            </Text>
          </Paper>
        )}

        {/* Informações técnicas */}
        <Stack gap="xs">
          <Text size="sm" fw={600}>
            Informações Técnicas
          </Text>
          <Paper bg="gray.0" p="sm" withBorder>
            <Stack gap="4">
              <Text size="xs" c="dimmed">
                <strong>Framework:</strong> TensorFlow.js
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Modelo:</strong> MNIST (dígitos manuscritos 0-9)
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Input esperado:</strong> Tensor [1, 28, 28, 1] (grayscale)
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Output:</strong> Tensor [1, 10] (probabilidades de cada dígito)
              </Text>
              <Text size="xs" c="dimmed">
                <strong>Cache:</strong> Service Worker ativo (offline-ready após 1º carregamento)
              </Text>
            </Stack>
          </Paper>
        </Stack>

        {/* Próximos passos */}
        {model && (
          <Stack gap="xs">
            <Text size="sm" fw={600}>
              🚀 Próximos Passos
            </Text>
            <Paper bg="blue.0" p="sm" withBorder>
              <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem', color: 'var(--mantine-color-blue-7)' }}>
                <li>Implementar pré-processamento de canvas → tensor (Task 1.2.2)</li>
                <li>Integrar com DrawingCanvas (Task 1.2.3)</li>
                <li>Adicionar botão "Reconhecer" no canvas</li>
                <li>Exibir dígito reconhecido com confiança (%)</li>
                <li>Feedback sonoro ao reconhecer</li>
              </ol>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
};
