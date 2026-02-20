/**
 * Dashboard de Progresso - Mapa visual de níveis
 *
 * Mostra grid de níveis estilo mapa de jogo:
 * - Níveis desbloqueados: coloridos
 * - Níveis bloqueados: cinza com cadeado
 * - Nível atual: brilhando/pulsando
 */

import { Box, Text, Button, SimpleGrid, Badge, Flex } from '@mantine/core';
import { IconLock, IconStar, IconTrophy } from '@tabler/icons-react';
import type { MasteryLevel, Operation } from '../../types';
import { MICROLEVEL_PROGRESSION } from '../../types/mastery';
import { formatLevelName } from '../../utils/levelFormat';

interface ProgressDashboardProps {
  /** Nível atual do jogador */
  currentLevel: MasteryLevel;
  /** Total de estrelas acumuladas */
  totalStars: number;
  /** Callback para voltar */
  onBack: () => void;
}

interface LevelCardData {
  operation: Operation;
  maxResult: number;
  isUnlocked: boolean;
  isCurrent: boolean;
  starsEarned: number;
}

/**
 * Determina quais níveis estão desbloqueados baseado no nível atual
 */
function getLevelCardData(currentLevel: MasteryLevel): LevelCardData[] {
  const cards: LevelCardData[] = [];
  const currentOp = currentLevel.operation;
  const currentMax = currentLevel.maxResult;

  // Por enquanto, só mostrar níveis de adição (fase abstract)
  const additionLevels = MICROLEVEL_PROGRESSION.addition;

  for (const maxResult of additionLevels) {
    const isUnlocked = maxResult <= currentMax;
    const isCurrent = currentOp === 'addition' && maxResult === currentMax;

    cards.push({
      operation: 'addition',
      maxResult,
      isUnlocked,
      isCurrent,
      starsEarned: 0, // TODO: rastrear estrelas por nível
    });
  }

  return cards;
}

/**
 * Card individual de nível
 */
function LevelCard({ level, index }: { level: LevelCardData; index: number }) {
  const levelText = formatLevelName({
    operation: level.operation,
    maxResult: level.maxResult,
    cpaPhase: 'abstract',
  });

  // Cores
  const bgColor = level.isUnlocked
    ? level.isCurrent
      ? '#4CAF50' // Verde vibrante (atual)
      : '#81C784' // Verde claro (desbloqueado)
    : '#E0E0E0'; // Cinza (bloqueado)

  const borderColor = level.isCurrent ? '#2E7D32' : 'transparent';
  const textColor = level.isUnlocked ? 'white' : '#9E9E9E';

  return (
    <Box
      data-testid={`level-card-${index}`}
      style={{
        position: 'relative',
        background: bgColor,
        border: `4px solid ${borderColor}`,
        borderRadius: '16px',
        padding: '24px',
        minHeight: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: level.isUnlocked ? 'pointer' : 'not-allowed',
        boxShadow: level.isCurrent
          ? '0 8px 24px rgba(76, 175, 80, 0.4)'
          : level.isUnlocked
          ? '0 4px 12px rgba(0, 0, 0, 0.1)'
          : 'none',
        animation: level.isCurrent ? 'levelPulse 2s ease-in-out infinite' : 'none',
        userSelect: 'none',
      }}
    >
      <style>
        {`
          @keyframes levelPulse {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 8px 24px rgba(76, 175, 80, 0.4);
            }
            50% {
              transform: scale(1.05);
              box-shadow: 0 12px 32px rgba(76, 175, 80, 0.6);
            }
          }
        `}
      </style>

      {/* Número do nível (badge) */}
      <Badge
        size="lg"
        variant="filled"
        style={{
          position: 'absolute',
          top: '8px',
          left: '8px',
          backgroundColor: level.isUnlocked ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
          color: textColor,
        }}
      >
        {index + 1}
      </Badge>

      {/* Ícone de cadeado (se bloqueado) */}
      {!level.isUnlocked && (
        <IconLock size={48} color="#9E9E9E" strokeWidth={2} />
      )}

      {/* Ícone de troféu (se atual) */}
      {level.isCurrent && (
        <IconTrophy size={48} color="white" strokeWidth={2} />
      )}

      {/* Nome do nível */}
      <Text
        size="20px"
        fw={700}
        c={textColor}
        style={{
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {levelText}
      </Text>

      {/* Estrelas (placeholder) */}
      {level.isUnlocked && level.starsEarned > 0 && (
        <Flex gap={4} align="center">
          <IconStar size={20} fill="gold" color="gold" />
          <Text size="16px" c={textColor} fw={600}>
            {level.starsEarned}
          </Text>
        </Flex>
      )}

      {/* Label "Atual" */}
      {level.isCurrent && (
        <Badge
          size="sm"
          variant="filled"
          color="yellow"
          style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
          }}
        >
          Atual
        </Badge>
      )}
    </Box>
  );
}

export default function ProgressDashboard({
  currentLevel,
  totalStars,
  onBack,
}: ProgressDashboardProps) {
  const levels = getLevelCardData(currentLevel);

  return (
    <Box
      data-testid="progress-dashboard"
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '24px',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-between"
        align={{ base: 'center', md: 'flex-start' }}
        gap="md"
        mb="xl"
      >
        <Box>
          <Text
            size="48px"
            fw={700}
            c="white"
            style={{
              textAlign: 'center',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            Seu Progresso
          </Text>
          <Flex gap={8} align="center" justify="center" mt="sm">
            <IconStar size={32} fill="gold" color="gold" />
            <Text size="32px" fw={700} c="white">
              {totalStars} estrelas
            </Text>
          </Flex>
        </Box>

        <Button
          data-testid="back-button"
          onClick={onBack}
          size="lg"
          variant="white"
          style={{
            minHeight: '56px',
            fontSize: '20px',
            fontWeight: 600,
          }}
        >
          ← Voltar
        </Button>
      </Flex>

      {/* Grid de níveis */}
      <SimpleGrid
        cols={{ base: 1, sm: 2, md: 3, lg: 4 }}
        spacing="xl"
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        {levels.map((level, index) => (
          <LevelCard key={index} level={level} index={index} />
        ))}
      </SimpleGrid>

      {/* Footer motivacional */}
      <Box mt="xl" style={{ textAlign: 'center' }}>
        <Text size="24px" c="white" fw={600} style={{ opacity: 0.9 }}>
          Continue praticando para desbloquear novos desafios! 🚀
        </Text>
      </Box>
    </Box>
  );
}
