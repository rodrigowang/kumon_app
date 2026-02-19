/**
 * FeedbackOverlay — Feedback visual rico para exercícios
 *
 * Níveis de feedback:
 * - Acerto normal: confetti leve (2s)
 * - Acerto após erros: confetti intenso + mensagem especial
 * - 5-streak: celebração grande
 * - 10-streak: mega celebração
 * - Erro 1-2: shake suave + "Tente de novo!"
 * - Erro 3: "Você está aprendendo!" + dica
 * - Erro 5+: "Vamos ver de outro jeito!" + sugestão CPA regress
 */

import { useEffect, useState } from 'react';
import { Box, Text, Stack } from '@mantine/core';

export type FeedbackType =
  | 'correct'
  | 'correct-after-errors'
  | 'streak-5'
  | 'streak-10'
  | 'error-gentle'
  | 'error-learning'
  | 'error-regress';

export interface FeedbackOverlayProps {
  /** Tipo de feedback a exibir */
  type: FeedbackType;
  /** Se está visível */
  visible: boolean;
  /** Mensagem principal */
  message: string;
  /** Mensagem secundária (opcional) */
  subMessage?: string;
  /** Resposta correta (mostrada em erros) */
  correctAnswer?: string;
  /** Duração em ms antes de auto-fechar (default: 2000) */
  duration?: number;
  /** Callback ao fechar */
  onClose?: () => void;
}

/** Número de partículas de confetti por tipo */
const CONFETTI_COUNT: Record<string, number> = {
  'correct': 15,
  'correct-after-errors': 25,
  'streak-5': 40,
  'streak-10': 60,
};

/** Cores do confetti */
const CONFETTI_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9800', '#4CAF50'];

/** Gera estilo CSS para uma partícula de confetti */
function getConfettiStyle(index: number): React.CSSProperties {
  const left = Math.random() * 100;
  const delay = Math.random() * 0.5;
  const duration = 1.5 + Math.random() * 1.5;
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 6 + Math.random() * 8;
  const rotation = Math.random() * 360;

  return {
    position: 'absolute',
    top: '-10px',
    left: `${left}%`,
    width: `${size}px`,
    height: `${size * 0.6}px`,
    backgroundColor: color,
    borderRadius: '2px',
    opacity: 0,
    transform: `rotate(${rotation}deg)`,
    animation: `confettiFall ${duration}s ease-out ${delay}s forwards`,
    pointerEvents: 'none',
  };
}

/** Configurações visuais por tipo de feedback */
function getFeedbackConfig(type: FeedbackType) {
  switch (type) {
    case 'correct':
      return {
        bg: 'rgba(76, 175, 80, 0.95)',
        emoji: '🎉',
        animation: 'feedbackBounceIn',
        shake: false,
      };
    case 'correct-after-errors':
      return {
        bg: 'rgba(76, 175, 80, 0.95)',
        emoji: '💪',
        animation: 'feedbackBounceIn',
        shake: false,
      };
    case 'streak-5':
      return {
        bg: 'linear-gradient(135deg, rgba(76, 175, 80, 0.95), rgba(33, 150, 243, 0.95))',
        emoji: '🌟',
        animation: 'feedbackBounceIn',
        shake: false,
      };
    case 'streak-10':
      return {
        bg: 'linear-gradient(135deg, rgba(255, 152, 0, 0.95), rgba(233, 30, 99, 0.95), rgba(156, 39, 176, 0.95))',
        emoji: '🏆',
        animation: 'feedbackBounceIn',
        shake: false,
      };
    case 'error-gentle':
      return {
        bg: 'rgba(244, 67, 54, 0.92)',
        emoji: '🤔',
        animation: 'feedbackShake',
        shake: true,
      };
    case 'error-learning':
      return {
        bg: 'rgba(255, 152, 0, 0.92)',
        emoji: '📚',
        animation: 'feedbackShake',
        shake: true,
      };
    case 'error-regress':
      return {
        bg: 'rgba(156, 39, 176, 0.92)',
        emoji: '🤗',
        animation: 'feedbackShake',
        shake: true,
      };
  }
}

export default function FeedbackOverlay({
  type,
  visible,
  message,
  subMessage,
  correctAnswer,
  duration = 2000,
  onClose,
}: FeedbackOverlayProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
    setIsAnimating(false);
  }, [visible, duration, onClose]);

  if (!visible && !isAnimating) return null;

  const config = getFeedbackConfig(type);
  const confettiCount = CONFETTI_COUNT[type] ?? 0;
  const isSuccess = type.startsWith('correct') || type.startsWith('streak');

  return (
    <>
      {/* CSS Keyframes (injetadas uma vez) */}
      <style>{`
        @keyframes confettiFall {
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(90vh) rotate(720deg) scale(0.5);
          }
        }
        @keyframes feedbackBounceIn {
          0% { transform: scale(0.3); opacity: 0; }
          50% { transform: scale(1.05); opacity: 1; }
          70% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes feedbackShake {
          0% { transform: translateX(0); opacity: 0; }
          10% { transform: translateX(0); opacity: 1; }
          20% { transform: translateX(-8px); }
          30% { transform: translateX(8px); }
          40% { transform: translateX(-6px); }
          50% { transform: translateX(6px); }
          60% { transform: translateX(-3px); }
          70% { transform: translateX(3px); }
          80% { transform: translateX(0); }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes feedbackFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes emojiPulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        @keyframes streakGlow {
          0% { text-shadow: 0 0 10px rgba(255,255,255,0.5); }
          50% { text-shadow: 0 0 30px rgba(255,255,255,0.9), 0 0 60px rgba(255,255,255,0.3); }
          100% { text-shadow: 0 0 10px rgba(255,255,255,0.5); }
        }
      `}</style>

      {/* Overlay */}
      <Box
        data-testid="feedback-overlay"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: config.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          overflow: 'hidden',
          animation: `${config.animation} 0.4s ease-out`,
        }}
      >
        {/* Confetti (apenas para sucesso) */}
        {isSuccess && Array.from({ length: confettiCount }).map((_, i) => (
          <Box
            key={i}
            style={getConfettiStyle(i)}
          />
        ))}

        {/* Conteúdo central */}
        <Stack
          align="center"
          gap="md"
          style={{
            padding: '32px',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Emoji grande */}
          <Text
            style={{
              fontSize: type === 'streak-10' ? '80px' : type === 'streak-5' ? '72px' : '56px',
              lineHeight: 1,
              animation: isSuccess ? 'emojiPulse 0.6s ease-in-out infinite' : undefined,
            }}
          >
            {config.emoji}
          </Text>

          {/* Mensagem principal */}
          <Text
            size="32px"
            fw={700}
            c="white"
            style={{
              animation: (type === 'streak-5' || type === 'streak-10')
                ? 'streakGlow 1.5s ease-in-out infinite'
                : undefined,
            }}
          >
            {message}
          </Text>

          {/* Resposta correta (em erros) */}
          {correctAnswer && !isSuccess && (
            <Text size="24px" fw={500} c="white" style={{ opacity: 0.9 }}>
              {correctAnswer}
            </Text>
          )}

          {/* Sub-mensagem */}
          {subMessage && (
            <Text
              size="20px"
              fw={400}
              c="white"
              style={{ opacity: 0.85, maxWidth: '400px' }}
            >
              {subMessage}
            </Text>
          )}
        </Stack>
      </Box>
    </>
  );
}
