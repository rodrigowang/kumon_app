/**
 * StreakDisplay — Exibe o streak diário com visual rico
 *
 * Estados visuais:
 * - 0 dias: cinza, "Comece hoje!"
 * - 1–6 dias: laranja com contador e barra de progresso para o troféu
 * - 7+ dias: dourado com brilho
 */

import { Box, Text, Group } from '@mantine/core'

interface StreakDisplayProps {
  /** Número de dias consecutivos */
  current: number
  /** Se o troféu de 7 dias já foi desbloqueado */
  hasTrophy: boolean
  /** Tamanho compacto (status bar) ou expandido (detalhes) */
  variant?: 'compact' | 'expanded'
}

export default function StreakDisplay({
  current,
  hasTrophy,
  variant = 'compact',
}: StreakDisplayProps) {
  const isActive = current > 0
  const isMilestone = current >= 7

  if (variant === 'compact') {
    return (
      <Box
        data-testid="streak-display"
        style={{
          background: isMilestone ? '#FFF8E1' : isActive ? '#FFF3E0' : '#F5F5F5',
          borderRadius: '12px',
          padding: '8px 16px',
          border: isMilestone ? '2px solid #FFD54F' : 'none',
        }}
      >
        <Text size="20px" fw={700}>
          {isActive ? '🔥' : '💤'} {current} {current === 1 ? 'dia' : 'dias'}
        </Text>
      </Box>
    )
  }

  // Variante expandida — mostra barra de progresso até o troféu
  const progressToTrophy = hasTrophy ? 7 : Math.min(current, 7)
  const progressPct = Math.round((progressToTrophy / 7) * 100)

  return (
    <Box
      data-testid="streak-display"
      style={{
        background: isMilestone
          ? 'linear-gradient(135deg, #FFF8E1 0%, #FFE082 100%)'
          : isActive
            ? '#FFF3E0'
            : '#F5F5F5',
        borderRadius: '16px',
        padding: '16px 20px',
        width: '100%',
        maxWidth: '400px',
        border: isMilestone ? '2px solid #FFD54F' : '2px solid transparent',
      }}
    >
      <Group justify="space-between" align="center" mb="xs">
        <Text size="24px" fw={800}>
          {isActive ? '🔥' : '💤'} {current} {current === 1 ? 'dia seguido' : 'dias seguidos'}
        </Text>
        {isMilestone && <Text size="20px">🏆</Text>}
      </Group>

      {/* Barra de progresso para o troféu de 7 dias */}
      {!hasTrophy && (
        <>
          <Box
            style={{
              height: '8px',
              borderRadius: '4px',
              background: '#E0E0E0',
              overflow: 'hidden',
            }}
          >
            <Box
              style={{
                height: '100%',
                width: `${progressPct}%`,
                borderRadius: '4px',
                background: isMilestone
                  ? 'linear-gradient(90deg, #FFD54F, #FFA000)'
                  : 'linear-gradient(90deg, #FF9800, #FFB74D)',
                transition: 'width 0.6s ease-out',
              }}
            />
          </Box>
          <Text size="14px" c="dimmed" ta="right" mt={4}>
            {progressToTrophy}/7 para o troféu 🏆
          </Text>
        </>
      )}

      {!isActive && (
        <Text size="16px" c="dimmed" mt="xs">
          Complete uma lição para começar!
        </Text>
      )}
    </Box>
  )
}
