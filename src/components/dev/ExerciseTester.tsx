import { useState } from 'react';
import { Box, Text, Stack, Code, Paper, Badge, Group } from '@mantine/core';
import { ExerciseScreen } from '../exercises';
import { useOCRModel } from '../../hooks/useOCRModel';
import { predictNumber } from '../../utils/ocr/predict';

/**
 * Converte data URL (base64) para HTMLCanvasElement
 */
function dataURLToCanvas(dataURL: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataURL;
  });
}

/**
 * Componente de teste para ExerciseScreen com OCR integrado.
 * Desenha dígitos, envia, e exibe o resultado do reconhecimento.
 */
export default function ExerciseTester() {
  const [lastAction, setLastAction] = useState<string>('Aguardando interação...');
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const { model, isLoading, error } = useOCRModel();

  const handleSubmit = async (data: string | null) => {
    if (!data) {
      setLastAction('Canvas vazio');
      setOcrResult(null);
      return;
    }

    if (!model) {
      setLastAction('Modelo OCR não carregado');
      setOcrResult(null);
      return;
    }

    setLastAction('Analisando...');
    setOcrResult(null);

    try {
      const canvas = await dataURLToCanvas(data);
      const result = await predictNumber(canvas, model);

      if (!result) {
        setLastAction('Nenhum dígito detectado');
        setOcrResult(null);
        return;
      }

      const statusLabel =
        result.status === 'accepted'
          ? 'Aceito'
          : result.status === 'confirmation'
          ? 'Confirmar'
          : 'Tentar novamente';

      setLastAction(
        `Reconhecido: ${result.number} (${(result.confidence * 100).toFixed(0)}% - ${statusLabel})`
      );
      setOcrResult(
        `Número: ${result.number} | Confiança: ${(result.confidence * 100).toFixed(1)}% | Status: ${statusLabel}\n` +
        `Dígitos: ${result.digits.map((d) => `${d.digit}(${(d.confidence * 100).toFixed(0)}%)`).join(', ')}`
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro desconhecido';
      setLastAction(`Erro OCR: ${msg}`);
      setOcrResult(null);
      console.error('[ExerciseTester] OCR error:', err);
    }
  };

  const handleClear = () => {
    setLastAction('Canvas limpo');
    setOcrResult(null);
  };

  return (
    <Box style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Painel de Debug (topo fixo) */}
      <Paper
        shadow="sm"
        p="md"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#1A1B1E',
          borderBottom: '2px solid #4A90E2',
        }}
      >
        <Stack gap="xs">
          <Group gap="sm">
            <Text size="sm" c="dimmed" fw={700}>
              ExerciseScreen Tester
            </Text>
            <Badge
              size="sm"
              color={isLoading ? 'yellow' : error ? 'red' : model ? 'green' : 'gray'}
            >
              {isLoading ? 'Carregando modelo...' : error ? 'Erro modelo' : model ? 'OCR pronto' : 'Sem modelo'}
            </Badge>
          </Group>
          <Code block color="dark">
            {lastAction}
          </Code>
          {ocrResult && (
            <Code block color="blue">
              {ocrResult}
            </Code>
          )}
          {error && (
            <Text size="xs" c="red">
              {error}
            </Text>
          )}
        </Stack>
      </Paper>

      {/* ExerciseScreen ocupa toda a tela */}
      <Box style={{ marginTop: '140px', flex: 1 }}>
        <ExerciseScreen
          exerciseText="5 + 3 = ?"
          onSubmit={handleSubmit}
          onClear={handleClear}
        />
      </Box>
    </Box>
  );
}
