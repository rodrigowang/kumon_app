/**
 * Notificação de mudança de nível
 *
 * Aparece com animação quando o nível muda durante a sessão
 */

import { useEffect, useState } from 'react';
import { Box, Text } from '@mantine/core';
import type { MasteryLevel } from '../../types';
import { formatLevelName, getLevelChangeDirection } from '../../utils/levelFormat';

interface LevelChangeNotificationProps {
  /** Nível anterior */
  oldLevel: MasteryLevel;
  /** Novo nível */
  newLevel: MasteryLevel;
  /** Quando fechar (após animação) */
  onClose: () => void;
}

export function LevelChangeNotification({
  oldLevel,
  newLevel,
  onClose,
}: LevelChangeNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);
  const direction = getLevelChangeDirection(oldLevel, newLevel);
  const newLevelText = formatLevelName(newLevel);

  useEffect(() => {
    // Fade out após 3s
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Remover do DOM após animação
      setTimeout(onClose, 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getMessage = () => {
    if (direction === 'increase') {
      return {
        title: 'Novo desafio!',
        subtitle: `Agora você está em ${newLevelText}`,
        emoji: '🎉',
        color: '#4CAF50',
      };
    }

    if (direction === 'decrease') {
      return {
        title: 'Vamos praticar mais um pouco',
        subtitle: `Voltamos para ${newLevelText}`,
        emoji: '💪',
        color: '#FF9800',
      };
    }

    // Mudança de fase CPA ou outra mudança
    return {
      title: 'Nível atualizado',
      subtitle: newLevelText,
      emoji: '✨',
      color: '#4A90E2',
    };
  };

  const message = getMessage();

  return (
    <Box
      data-testid="level-change-notification"
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 1000,
        background: 'white',
        borderRadius: '24px',
        padding: '32px 48px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        border: `4px solid ${message.color}`,
        minWidth: '400px',
        textAlign: 'center',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        animation: 'levelChangePulse 0.6s ease-in-out',
      }}
    >
      <style>
        {`
          @keyframes levelChangePulse {
            0% {
              transform: translate(-50%, -50%) scale(0.8);
              opacity: 0;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.05);
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>

      <Text
        size="56px"
        style={{
          marginBottom: '16px',
          userSelect: 'none',
        }}
      >
        {message.emoji}
      </Text>

      <Text
        size="32px"
        fw={700}
        c={message.color}
        style={{
          marginBottom: '8px',
          userSelect: 'none',
        }}
      >
        {message.title}
      </Text>

      <Text
        size="20px"
        c="#666"
        style={{
          userSelect: 'none',
        }}
      >
        {message.subtitle}
      </Text>
    </Box>
  );
}
