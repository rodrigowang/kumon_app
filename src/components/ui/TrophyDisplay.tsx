/**
 * TrophyDisplay — Badge visual do troféu de 7 dias consecutivos
 *
 * Aparece no PetHub quando hasTrophy7Days é true.
 * CSS pulse animation para chamar atenção.
 */

import { Box, Text } from '@mantine/core'

interface TrophyDisplayProps {
  /** Se true, mostra o troféu. Se false, não renderiza nada. */
  visible: boolean
}

export default function TrophyDisplay({ visible }: TrophyDisplayProps) {
  if (!visible) return null

  return (
    <>
      <style>
        {`
          @keyframes trophyPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.08); }
          }
          .trophy-badge {
            animation: trophyPulse 2.5s ease-in-out infinite;
          }
        `}
      </style>
      <Box
        data-testid="trophy-display"
        className="trophy-badge"
        style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA000 100%)',
          borderRadius: '16px',
          padding: '12px 24px',
          textAlign: 'center',
          boxShadow: '0 4px 16px rgba(255, 215, 0, 0.4)',
        }}
      >
        <Text size="20px" fw={800} c="white" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.2)' }}>
          🏆 7 dias seguidos!
        </Text>
      </Box>
    </>
  )
}
