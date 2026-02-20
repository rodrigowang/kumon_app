/**
 * SessionSummaryScreen — Tela de resumo após completar uma sessão de exercícios
 *
 * Mostra: acertos, tempo, estrelas ganhas, e botões para jogar de novo ou voltar.
 * Design amigável para criança de 7 anos: fontes grandes, cores vibrantes, celebração.
 */

import { useState, useEffect, useRef } from 'react';
import { Stack, Text, Box, Group, Badge } from '@mantine/core';
import { Button, Container } from '../ui';
import { useGameStore } from '../../stores/useGameStore';
import { usePetStore } from '../../stores/usePetStore';
import type { SessionSummary } from '../../stores/useGameStore';
import type { CompletedLessonResult } from '../../stores/usePetStore';

interface SessionSummaryScreenProps {
  summary: SessionSummary;
  onPlayAgain: () => void;
  onGoHome: () => void;
}

/**
 * Formata duração em minutos:segundos
 */
function formatDuration(ms: number): string {
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}

/**
 * Mensagem motivacional baseada na performance
 */
function getMotivationalMessage(accuracy: number): { title: string; subtitle: string } {
  if (accuracy >= 1) {
    return { title: 'Perfeito!', subtitle: 'Todas certas, parabéns!' };
  }
  if (accuracy >= 0.8) {
    return { title: 'Muito bem!', subtitle: 'Ótimo resultado!' };
  }
  if (accuracy >= 0.6) {
    return { title: 'Bom trabalho!', subtitle: 'Você está melhorando!' };
  }
  return { title: 'Continue tentando!', subtitle: 'Cada exercício te deixa mais forte!' };
}

export default function SessionSummaryScreen({
  summary,
  onPlayAgain,
  onGoHome,
}: SessionSummaryScreenProps) {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const { title, subtitle } = getMotivationalMessage(summary.accuracy);
  const [isVisible, setIsVisible] = useState(false);
  const [lessonResult, setLessonResult] = useState<CompletedLessonResult | null>(null);

  const operationName = currentLevel.operation === 'addition' ? 'Somas' : 'Subtrações';
  const levelText = `${operationName} até ${currentLevel.maxResult}`;

  // Animação de entrada (flip in)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Registra a lição concluída no pet store — executa UMA VEZ ao montar.
  // useRef garante idempotência mesmo com StrictMode (que remonta efeitos 2x no dev).
  const completedRef = useRef(false);
  const { coinsEarned } = summary;
  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    const result = usePetStore.getState().completedLesson(coinsEarned);
    setLessonResult(result);
  }, [coinsEarned]);

  return (
    <>
      {/* CSS de Animação */}
      <style>
        {`
          @keyframes sessionSummaryFlipIn {
            0% {
              opacity: 0;
              transform: perspective(1000px) rotateY(20deg) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: perspective(1000px) rotateY(0deg) scale(1);
            }
          }

          .session-summary-enter {
            animation: sessionSummaryFlipIn 0.8s ease-out forwards;
          }
        `}
      </style>

      <Container
        size="sm"
        py="xl"
        data-testid="session-summary-screen"
        className={isVisible ? 'session-summary-enter' : ''}
        style={{
          opacity: isVisible ? 1 : 0,
        }}
      >
      <Stack gap="xl" align="center" style={{ minHeight: '80vh', justifyContent: 'center' }}>
        {/* Título motivacional */}
        <Box ta="center">
          <Text
            size="56px"
            fw={800}
            style={{
              background: summary.accuracy >= 0.8
                ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            {title}
          </Text>
          <Text size="24px" c="dimmed" fw={500} mt="xs">
            {subtitle}
          </Text>
        </Box>

        {/* Estrelas ganhas */}
        <Box ta="center">
          <Text size="72px" fw={700} style={{ lineHeight: 1 }}>
            {'★'.repeat(summary.starsEarned)}
          </Text>
          <Text size="20px" c="dimmed" fw={500} mt="xs">
            +{summary.starsEarned} {summary.starsEarned === 1 ? 'estrela' : 'estrelas'}
          </Text>
        </Box>

        {/* Estatísticas da sessão */}
        <Box
          style={{
            background: '#FFFFFF',
            borderRadius: '16px',
            padding: '24px 32px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            width: '100%',
            maxWidth: '360px',
          }}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="20px" fw={500} c="dimmed">Acertos</Text>
              <Text size="24px" fw={700} c="green">
                {summary.correct} de {summary.total}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="20px" fw={500} c="dimmed">Tempo</Text>
              <Text size="24px" fw={700} c="blue">
                {formatDuration(summary.durationMs)}
              </Text>
            </Group>

            <Group justify="space-between">
              <Text size="20px" fw={500} c="dimmed">Nível</Text>
              <Badge
                size="lg"
                radius="md"
                variant="gradient"
                gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                style={{ fontSize: '16px', padding: '8px 16px', height: 'auto' }}
              >
                {levelText}
              </Badge>
            </Group>
          </Stack>
        </Box>

        {/* Barra de acerto visual */}
        <Box style={{ width: '100%', maxWidth: '360px' }}>
          <Box
            style={{
              height: '12px',
              borderRadius: '6px',
              background: '#E0E0E0',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${Math.round(summary.accuracy * 100)}%`,
                borderRadius: '6px',
                background: summary.accuracy >= 0.8
                  ? 'linear-gradient(90deg, #4CAF50, #8BC34A)'
                  : summary.accuracy >= 0.6
                  ? 'linear-gradient(90deg, #FFC107, #FFD54F)'
                  : 'linear-gradient(90deg, #FF9800, #FFB74D)',
                transition: 'width 1s ease-out',
              }}
            />
          </Box>
          <Text size="16px" c="dimmed" ta="center" mt="xs">
            {Math.round(summary.accuracy * 100)}% de acerto
          </Text>
        </Box>

        {/* Moedas ganhas */}
        <Box
          data-testid="coins-earned-display"
          style={{
            background: 'linear-gradient(135deg, #FFF8E1 0%, #FFF3CD 100%)',
            border: '2px solid #FFD54F',
            borderRadius: '16px',
            padding: '20px 28px',
            width: '100%',
            maxWidth: '360px',
            textAlign: 'center',
          }}
        >
          <Text size="32px" fw={800} style={{ lineHeight: 1.1 }}>
            🪙 +{summary.coinsEarned} moedas
          </Text>
          {summary.speedBonus && (
            <Text size="18px" fw={600} c="orange" mt="xs">
              ⚡ Velocidade! ×2 aplicado
            </Text>
          )}
          {lessonResult?.emergencyRescue && (
            <Text size="16px" fw={600} c="teal" mt="sm">
              💊 Kit de emergência: seu bichinho foi curado!
            </Text>
          )}
          {lessonResult?.trophyUnlocked && (
            <Text size="18px" fw={700} c="yellow.7" mt="sm">
              🏆 7 dias seguidos! Troféu desbloqueado!
            </Text>
          )}
          {lessonResult && lessonResult.newStreak > 0 && !lessonResult.trophyUnlocked && (
            <Text size="16px" fw={600} c="orange" mt="sm">
              🔥 {lessonResult.newStreak} {lessonResult.newStreak === 1 ? 'dia seguido' : 'dias seguidos'}!
            </Text>
          )}
          {lessonResult?.streakBroken && (
            <Text size="14px" fw={500} c="dimmed" mt="xs">
              Seu streak reiniciou — jogue amanhã para manter!
            </Text>
          )}
        </Box>

        {/* Botões de ação */}
        <Group gap="md" style={{ width: '100%', maxWidth: '400px' }} grow>
          <Button
            data-testid="play-again-button"
            onClick={onPlayAgain}
            size="xl"
            style={{
              minHeight: '70px',
              fontSize: '28px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
              border: 'none',
              boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
            }}
          >
            Jogar de novo
          </Button>

          <Button
            data-testid="go-home-button"
            onClick={onGoHome}
            size="xl"
            variant="outline"
            style={{
              minHeight: '70px',
              fontSize: '24px',
              fontWeight: 600,
            }}
          >
            Voltar ao quarto
          </Button>
        </Group>
      </Stack>
    </Container>
    </>
  );
}
