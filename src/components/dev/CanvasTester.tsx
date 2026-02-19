import { useRef, useState } from 'react';
import { Container, Stack, Title, Text, Card, Group, Badge } from '@mantine/core';
import { DrawingCanvas, DrawingCanvasHandle } from '../canvas';

/**
 * Componente de teste para o DrawingCanvas
 * Demonstra funcionalidades básicas e permite testar interações
 */
export default function CanvasTester() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const [hasContent, setHasContent] = useState(false);
  const [strokeCount, setStrokeCount] = useState(0);

  const handleDrawStart = () => {
    console.log('Início do desenho');
  };

  const handleDrawEnd = () => {
    console.log('Fim do desenho');
    console.log('Canvas vazio?', canvasRef.current?.isEmpty());
    setStrokeCount((prev) => prev + 1);
  };

  const handleDrawingChange = (hasContent: boolean) => {
    console.log('Canvas tem conteúdo:', hasContent);
    setHasContent(hasContent);
    if (!hasContent) {
      setStrokeCount(0);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        <div>
          <Title order={1} mb="sm">
            🎨 Canvas de Desenho - Teste
          </Title>
          <Text c="dimmed" size="lg">
            Teste a infraestrutura do canvas de escrita à mão para crianças de
            7 anos.
          </Text>
        </div>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Title order={3}>Área de Desenho</Title>
              <Group gap="xs">
                <Badge color={hasContent ? 'green' : 'gray'} variant="light">
                  {hasContent ? '✓ Com conteúdo' : 'Vazio'}
                </Badge>
                <Badge color="blue" variant="light">
                  {strokeCount} traço{strokeCount !== 1 ? 's' : ''}
                </Badge>
              </Group>
            </Group>
            <Text size="sm" c="dimmed">
              Desenhe com o dedo ou mouse. O traço deve aparecer instantaneamente e ser suave (espessura 8px, preto).
            </Text>

            <DrawingCanvas
              ref={canvasRef}
              height={300}
              onDrawStart={handleDrawStart}
              onDrawEnd={handleDrawEnd}
              onDrawingChange={handleDrawingChange}
            />
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Title order={4}>Critérios de Teste (v1.1.2 - Refinamento)</Title>
            <Group gap="xs">
              <Text size="sm">✅ Canvas ocupa ≥60% da largura</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Altura suficiente (300px)</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Borda visual clara (azul, 3px)</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Label "Escreva aqui" com ícone (desaparece ao desenhar)</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Traço suave usando perfect-freehand</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Traço preto (#000) com espessura mínima 8px</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ onDrawingChange dispara a cada traço finalizado</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Botão Limpar ≥48px (60px)</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Limpar remove conteúdo e reseta estado</Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">✅ Resize mantém strokes (redesenha corretamente)</Text>
            </Group>
          </Stack>
        </Card>

        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="sm">
            <Title order={4}>Como Testar</Title>
            <Text size="sm">1. Desenhe um número (ex: 8 ou 9) no canvas</Text>
            <Text size="sm">
              2. Verifique se o traço aparece instantaneamente
            </Text>
            <Text size="sm">
              3. Verifique se o traço é suave (não pixelado)
            </Text>
            <Text size="sm">4. Clique em "Limpar"</Text>
            <Text size="sm">
              5. Verifique se o canvas é limpo instantaneamente
            </Text>
            <Text size="sm" mt="md" fw={600}>
              ✨ Em dispositivos touch, teste com o dedo!
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}
