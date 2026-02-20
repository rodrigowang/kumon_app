/**
 * PetDisplay — Componente visual do bichinho virtual
 *
 * Renderiza o gatinho com a animação correta para cada estado.
 * Sprites: CC0 "Tiny Cat Sprite" (OpenGameArt.org)
 *
 * - happy  → animação idle (loop)
 * - hungry → animação hurt (loop devagar)
 * - sick   → animação dead (loop bem devagar)
 * - eating → animação run (auto-retorna para happy após 1.2s)
 */

import { useState, useEffect, useRef } from 'react'
import { Box, Text } from '@mantine/core'

import petHappyGif from '../../assets/sprites/pet_happy.gif'
import petHungryGif from '../../assets/sprites/pet_hungry.gif'
import petSickGif from '../../assets/sprites/pet_sick.gif'
import petEatingGif from '../../assets/sprites/pet_eating.gif'

import type { PetStatus } from '../../lib/petActions'

export type PetDisplayStatus = PetStatus | 'eating'

interface PetDisplayProps {
  status: PetDisplayStatus
  /** Tamanho do sprite em px (default: 160) */
  size?: number
  /** Callback chamado quando a animação "eating" termina */
  onEatingEnd?: () => void
}

// ─── Configurações por estado ─────────────────────────────────────────────────

interface StatusConfig {
  gif: string
  label: string
  bgColor: string
  borderColor: string
  /** Duração da animação eating antes de retornar para happy (ms) */
  eatingDuration?: number
}

const STATUS_CONFIG: Record<PetDisplayStatus, StatusConfig> = {
  happy: {
    gif: petHappyGif,
    label: 'Feliz! 😊',
    bgColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  hungry: {
    gif: petHungryGif,
    label: 'Com fome... 😢',
    bgColor: '#FFF8E1',
    borderColor: '#FFC107',
  },
  sick: {
    gif: petSickGif,
    label: 'Doentinho 🤒',
    bgColor: '#FCE4EC',
    borderColor: '#E91E63',
  },
  eating: {
    gif: petEatingGif,
    label: 'Comendo! 😋',
    bgColor: '#E3F2FD',
    borderColor: '#2196F3',
    eatingDuration: 1200,
  },
}

// ─── Componente ───────────────────────────────────────────────────────────────

export default function PetDisplay({
  status,
  size = 160,
  onEatingEnd,
}: PetDisplayProps) {
  const config = STATUS_CONFIG[status]

  // Força re-render do GIF ao mudar de estado (bug em alguns browsers onde GIF fica congelado)
  const [gifKey, setGifKey] = useState(0)
  const prevStatusRef = useRef<PetDisplayStatus>(status)
  const eatingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (status !== prevStatusRef.current) {
      setGifKey((k) => k + 1)
      prevStatusRef.current = status
    }
  }, [status])

  // Auto-retorno da animação "eating" para happy
  useEffect(() => {
    if (status === 'eating' && config.eatingDuration) {
      eatingTimerRef.current = setTimeout(() => {
        onEatingEnd?.()
      }, config.eatingDuration)
    }

    return () => {
      if (eatingTimerRef.current) {
        clearTimeout(eatingTimerRef.current)
        eatingTimerRef.current = null
      }
    }
  }, [status, config.eatingDuration, onEatingEnd])

  return (
    <Box
      data-testid="pet-display"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
      }}
    >
      {/* Moldura do bichinho */}
      <Box
        style={{
          width: size + 24,
          height: size + 24,
          borderRadius: '50%',
          background: config.bgColor,
          border: `4px solid ${config.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 16px ${config.borderColor}44`,
          transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease',
        }}
      >
        <img
          key={gifKey}
          src={config.gif}
          alt={config.label}
          width={size}
          height={size}
          style={{
            objectFit: 'contain',
            imageRendering: 'auto',
            // Leve opacidade quando doente para reforçar visual
            opacity: status === 'sick' ? 0.85 : 1,
            filter: status === 'sick' ? 'grayscale(30%)' : 'none',
            transition: 'opacity 0.4s ease, filter 0.4s ease',
          }}
        />
      </Box>

      {/* Label de status */}
      <Text
        data-testid="pet-status-label"
        size="20px"
        fw={700}
        style={{ color: config.borderColor, transition: 'color 0.4s ease' }}
      >
        {config.label}
      </Text>
    </Box>
  )
}
