/**
 * Badge discreto mostrando nível atual
 *
 * Aparece no canto superior da tela de exercício
 */

import { Badge } from '@mantine/core';
import type { MasteryLevel } from '../../types';
import { formatLevelName } from '../../utils/levelFormat';

interface LevelBadgeProps {
  level: MasteryLevel;
}

export function LevelBadge({ level }: LevelBadgeProps) {
  const levelText = formatLevelName(level);
  const color = level.operation === 'addition' ? 'green' : 'orange';

  return (
    <Badge
      data-testid="level-badge"
      size="lg"
      color={color}
      variant="light"
      style={{
        fontSize: '16px',
        fontWeight: 600,
        padding: '12px 20px',
        borderRadius: '12px',
        textTransform: 'none',
      }}
    >
      {levelText}
    </Badge>
  );
}
