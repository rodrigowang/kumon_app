/**
 * Tester: Abstract Exercise Screen
 *
 * Demonstração completa da tela de exercício abstrata com motor de progressão.
 * Agora lê estado diretamente da useGameStore (sem duplicação).
 */

import { useState } from 'react';
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

  const [debugOpen, setDebugOpen] = useState(false);

  return (
    <Box style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      {/* Botão de toggle do Debug Panel (sempre visível, discreto) */}
      <Box
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 2000,
        }}
      >
        {!debugOpen ? (
          <Button
            size="compact-xs"
            variant="subtle"
            color="gray"
            onClick={() => setDebugOpen(true)}
            style={{ opacity: 0.5, fontSize: '11px', padding: '2px 8px' }}
          >
            dev
          </Button>
        ) : (
          <Box
            data-testid="debug-panel"
            style={{
              background: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '8px 10px',
              maxWidth: '220px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontSize: '11px',
            }}
          >
            <Stack gap={4}>
              <Group gap="xs" justify="space-between">
                <Text size="xs" fw={700} c="#2C3E50">
                  Debug
                </Text>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  color="gray"
                  onClick={() => setDebugOpen(false)}
                  style={{ fontSize: '10px', padding: '0 4px' }}
                >
                  ✕
                </Button>
              </Group>

              {/* Nível */}
              <Group gap={4} wrap="wrap">
                <Badge color="blue" size="xs">{currentLevel.operation}</Badge>
                <Badge color="green" size="xs">max:{currentLevel.maxResult}</Badge>
                <Badge color="orange" size="xs">{currentLevel.cpaPhase}</Badge>
              </Group>

              {/* Stats compacto */}
              <Text size="xs" c="dimmed" style={{ lineHeight: 1.3 }}>
                ✓{stats.correct} ✗{stats.incorrect} | F:{stats.fastCount} S:{stats.slowCount}
                {sessionRound.isActive && ` | Ex ${sessionRound.exerciseIndex}/10`}
              </Text>

              {/* Última Decisão */}
              <Badge
                color={
                  lastDecision.includes('advance')
                    ? 'green'
                    : lastDecision.includes('regress')
                    ? 'red'
                    : 'gray'
                }
                size="xs"
              >
                {lastDecision}
              </Badge>

              {/* Botões */}
              <Group gap={4}>
                <Button size="compact-xs" variant="outline" color="red" onClick={resetProgress} style={{ fontSize: '10px' }}>
                  Reset
                </Button>
                {onBack && (
                  <Button size="compact-xs" variant="outline" color="gray" onClick={onBack} style={{ fontSize: '10px' }}>
                    Voltar
                  </Button>
                )}
              </Group>
            </Stack>
          </Box>
        )}
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
