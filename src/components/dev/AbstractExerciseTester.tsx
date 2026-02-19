/**
 * Tester: Abstract Exercise Screen
 *
 * Demonstração completa da tela de exercício abstrata com motor de progressão.
 * Agora lê estado diretamente da useGameStore (sem duplicação).
 */

import { Box, Button, Stack, Text, Group, Badge } from '@mantine/core';
import * as tf from '@tensorflow/tfjs';
import AbstractExerciseScreen from '../exercises/AbstractExerciseScreen';
import { useGameStore } from '../../stores/useGameStore';

interface AbstractExerciseTesterProps {
  onBack?: () => void;
  /** Modelo OCR carregado (opcional — sem ele usa mockOCR) */
  ocrModel?: tf.LayersModel | null;
  /** Callback quando a sessão de 10 exercícios terminar */
  onSessionComplete?: () => void;
}

export default function AbstractExerciseTester({ onBack, ocrModel, onSessionComplete }: AbstractExerciseTesterProps) {
  // Ler estado diretamente da store
  const currentLevel = useGameStore((state) => state.currentLevel);
  const stats = useGameStore((state) => state.sessionStats);
  const lastDecision = useGameStore((state) => state.lastProgressionDecision);
  const sessionRound = useGameStore((state) => state.sessionRound);
  const resetProgress = useGameStore((state) => state.resetProgress);

  return (
    <Box style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Painel de Debug (canto superior direito) */}
      <Box
        data-testid="debug-panel"
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2000,
          background: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #4A90E2',
          borderRadius: '12px',
          padding: '16px',
          maxWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        <Stack gap="xs">
          <Text size="sm" fw={700} c="#2C3E50">
            🎮 Debug Panel
          </Text>

          {/* Nível Atual */}
          <Box>
            <Text size="xs" c="dimmed">
              Nível Atual
            </Text>
            <Group gap="xs">
              <Badge color="blue" size="sm">
                {currentLevel.operation}
              </Badge>
              <Badge color="green" size="sm">
                maxResult: {currentLevel.maxResult}
              </Badge>
              <Badge color="orange" size="sm">
                {currentLevel.cpaPhase}
              </Badge>
            </Group>
          </Box>

          {/* Estatísticas */}
          <Box>
            <Text size="xs" c="dimmed">
              Estatísticas
            </Text>
            <Text size="xs">
              Total: {stats.totalExercises} | ✓ {stats.correct} | ✗{' '}
              {stats.incorrect}
            </Text>
            <Text size="xs">
              Fast: {stats.fastCount} | Slow: {stats.slowCount} | Hesitant:{' '}
              {stats.hesitantCount}
            </Text>
          </Box>

          {/* Sessão Atual */}
          {sessionRound.isActive && (
            <Box>
              <Text size="xs" c="dimmed">
                Sessão
              </Text>
              <Text size="xs">
                Ex: {sessionRound.exerciseIndex}/10 | ✓ {sessionRound.correct} | ✗ {sessionRound.incorrect}
              </Text>
            </Box>
          )}

          {/* Última Decisão */}
          <Box>
            <Text size="xs" c="dimmed">
              Última Decisão
            </Text>
            <Badge
              color={
                lastDecision.includes('advance')
                  ? 'green'
                  : lastDecision.includes('regress')
                  ? 'red'
                  : 'gray'
              }
              size="sm"
            >
              {lastDecision}
            </Badge>
          </Box>

          {/* Botões */}
          <Group gap="xs" grow>
            <Button
              size="xs"
              variant="outline"
              color="red"
              onClick={resetProgress}
            >
              🔄 Reset
            </Button>

            {onBack && (
              <Button
                size="xs"
                variant="outline"
                color="gray"
                onClick={onBack}
              >
                ← Voltar
              </Button>
            )}
          </Group>
        </Stack>
      </Box>

      {/* Tela de Exercício */}
      <AbstractExerciseScreen
        ocrModel={ocrModel}
        mockOCR={!ocrModel}
        onSessionComplete={onSessionComplete}
      />
    </Box>
  );
}
