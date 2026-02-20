/**
 * HomeScreen — Tela inicial do app
 *
 * Interface minimalista para criança de 7 anos:
 * - Título/logo do app
 * - Badge mostrando nível atual (ex: "Somas até 5")
 * - Total de estrelas acumuladas
 * - Botão grande "Jogar" (≥80px)
 */

import { Stack, Text, Box, Group, Badge } from '@mantine/core';
import { Button, Container } from '../ui';
import { useGameStore } from '../../stores/useGameStore';

interface HomeScreenProps {
  onPlay: () => void;
  /** Callback para abrir dashboard de progresso */
  onViewProgress?: () => void;
  /** Link discreto para dashboard dev (opcional) */
  onDevDashboard?: () => void;
}

/**
 * Formata o nível atual em texto amigável
 */
function formatLevelText(level: { operation: string; maxResult: number }): string {
  const operationName = level.operation === 'addition' ? 'Somas' : 'Subtrações';
  return `${operationName} até ${level.maxResult}`;
}

export default function HomeScreen({ onPlay, onViewProgress, onDevDashboard }: HomeScreenProps) {
  const currentLevel = useGameStore((state) => state.currentLevel);
  const totalStars = useGameStore((state) => state.totalStars);
  const resetProgress = useGameStore((state) => state.resetProgress);

  const handleReset = () => {
    if (window.confirm('Resetar todo o progresso? Isso não pode ser desfeito.')) {
      resetProgress();
    }
  };

  return (
    <Container size="sm" py="xl" data-testid="home-screen">
      <Stack gap="xl" align="center" style={{ minHeight: '80vh', justifyContent: 'center' }}>
        {/* Logo/Título */}
        <Box ta="center">
          <Text
            size="72px"
            fw={800}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              lineHeight: 1.2,
            }}
          >
            ✨ Kumon Math
          </Text>
          <Text size="24px" c="dimmed" fw={500} mt="xs">
            Aprenda matemática brincando
          </Text>
        </Box>

        {/* Badge de nível atual */}
        <Group gap="md">
          <Badge
            size="xl"
            radius="md"
            variant="gradient"
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            style={{
              fontSize: '20px',
              padding: '16px 24px',
              height: 'auto',
            }}
          >
            {formatLevelText(currentLevel)}
          </Badge>
        </Group>

        {/* Estrelas acumuladas */}
        <Box ta="center">
          <Text size="64px" fw={700} style={{ lineHeight: 1 }}>
            {totalStars} ★
          </Text>
          <Text size="18px" c="dimmed" fw={500}>
            {totalStars === 1 ? 'estrela' : 'estrelas'} conquistadas
          </Text>
        </Box>

        {/* Botão Jogar */}
        <Button
          data-testid="play-button"
          onClick={onPlay}
          size="xl"
          style={{
            minHeight: '80px',
            fontSize: '32px',
            fontWeight: 700,
            width: '100%',
            maxWidth: '400px',
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            border: 'none',
            boxShadow: '0 8px 24px rgba(76, 175, 80, 0.4)',
          }}
        >
          🎮 Jogar
        </Button>

        {/* Botão Ver Progresso */}
        {onViewProgress && (
          <Button
            data-testid="view-progress-button"
            onClick={onViewProgress}
            size="lg"
            variant="outline"
            style={{
              minHeight: '64px',
              fontSize: '24px',
              fontWeight: 600,
              width: '100%',
              maxWidth: '400px',
              borderWidth: '3px',
              borderColor: '#667eea',
              color: '#667eea',
            }}
          >
            🗺️ Ver Progresso
          </Button>
        )}

        {/* Links discretos (dev e reset) */}
        <Group gap="xl">
          {onDevDashboard && (
            <Text
              size="sm"
              c="dimmed"
              style={{ cursor: 'pointer', textDecoration: 'underline' }}
              onClick={onDevDashboard}
            >
              dev
            </Text>
          )}
          <Text
            size="sm"
            c="dimmed"
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={handleReset}
            data-testid="reset-progress-link"
          >
            resetar progresso
          </Text>
        </Group>
      </Stack>
    </Container>
  );
}
