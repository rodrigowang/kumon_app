/**
 * Tester: Abstract Exercise Screen
 *
 * Demonstração completa da tela de exercício abstrata com motor de progressão
 */

import { useState } from 'react';
import { Box, Button, Stack, Text, Group, Badge } from '@mantine/core';
import * as tf from '@tensorflow/tfjs';
import AbstractExerciseScreen from '../exercises/AbstractExerciseScreen';
import { MasteryTracker } from '../../lib/progression';
import type { MasteryLevel, ExerciseResult } from '../../types';

interface AbstractExerciseTesterProps {
  onBack?: () => void;
  /** Modelo OCR carregado (opcional — sem ele usa mockOCR) */
  ocrModel?: tf.LayersModel | null;
}

export default function AbstractExerciseTester({ onBack, ocrModel }: AbstractExerciseTesterProps) {
  const [currentLevel, setCurrentLevel] = useState<MasteryLevel>({
    operation: 'addition',
    maxResult: 5,
    cpaPhase: 'abstract',
  });

  const [tracker] = useState(
    () => new MasteryTracker(currentLevel)
  );

  const [stats, setStats] = useState({
    totalExercises: 0,
    correct: 0,
    incorrect: 0,
    fastCount: 0,
    slowCount: 0,
    hesitantCount: 0,
  });

  const [lastDecision, setLastDecision] = useState<string>('maintain');

  const handleSubmitExercise = (result: ExerciseResult) => {
    // Adicionar resultado ao tracker
    tracker.addResult(result);

    // Analisar progressão
    const analysis = tracker.analyze();

    // Atualizar estatísticas
    setStats((prev) => ({
      totalExercises: prev.totalExercises + 1,
      correct: prev.correct + (result.correct ? 1 : 0),
      incorrect: prev.incorrect + (result.correct ? 0 : 1),
      fastCount: prev.fastCount + (result.speed === 'fast' ? 1 : 0),
      slowCount: prev.slowCount + (result.speed === 'slow' ? 1 : 0),
      hesitantCount: prev.hesitantCount + (result.speed === 'hesitant' ? 1 : 0),
    }));

    setLastDecision(analysis.decision);

    // Aplicar decisão de progressão
    if (analysis.decision !== 'maintain' && analysis.newLevel) {
      console.log('📈 Mudança de nível:', analysis.decision);
      console.log('  Anterior:', currentLevel);
      console.log('  Novo:', analysis.newLevel);
      console.log('  Motivo:', analysis.reason);

      tracker.updateLevel(analysis.newLevel);
      setCurrentLevel(analysis.newLevel);
    }
  };

  const handleReset = () => {
    const initialLevel: MasteryLevel = {
      operation: 'addition',
      maxResult: 5,
      cpaPhase: 'abstract',
    };

    tracker.clearResults();
    tracker.updateLevel(initialLevel);
    setCurrentLevel(initialLevel);

    setStats({
      totalExercises: 0,
      correct: 0,
      incorrect: 0,
      fastCount: 0,
      slowCount: 0,
      hesitantCount: 0,
    });

    setLastDecision('maintain');
  };

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
              onClick={handleReset}
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
            )}</Group>
        </Stack>
      </Box>

      {/* Tela de Exercício */}
      <AbstractExerciseScreen
        currentLevel={currentLevel}
        onSubmitExercise={handleSubmitExercise}
        ocrModel={ocrModel}
        mockOCR={!ocrModel}
      />
    </Box>
  );
}
