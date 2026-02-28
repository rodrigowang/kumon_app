/**
 * PetHub — Tela principal do app
 *
 * Layout:
 * - Status bar (streak + moedas)
 * - PetDisplay centralizado
 * - Inventário (usar itens no pet)
 * - Loja compacta
 * - Seleção de nível (operação + dificuldade)
 * - Botão grande "Começar!"
 * - Links discretos (progresso, dev, reset)
 *
 * Design para criança de 7 anos: touch targets ≥48px, fontes grandes, zero leitura obrigatória.
 */

import { useState, useCallback, useEffect } from 'react'
import { Stack, Text, Box, Group, Badge, SimpleGrid, UnstyledButton } from '@mantine/core'
import { Button, Container, PetDisplay, StreakDisplay, TrophyDisplay } from '../ui'
import { useGameStore } from '../../stores/useGameStore'
import { usePetStore } from '../../stores/usePetStore'
import { ITEM_PRICES } from '../../lib/coinCalculator'
import { derivePetStatus, canFeedPet, canBuyItem, getPetStatusLabel } from '../../lib/petActions'
import { DIFFICULTY_COINS } from '../../types'
import type { GameMode, OperationMode, DifficultyLevel } from '../../types'
import type { PetDisplayStatus } from '../ui'
import type { ItemType } from '../../lib/petActions'

interface PetHubProps {
  onPlay: (mode: GameMode) => void
  onViewProgress?: () => void
  onDevDashboard?: () => void
}

// ─── Configurações de itens ──────────────────────────────────────────────────

interface ItemConfig {
  emoji: string
  label: string
  price: number
}

const ITEMS: Record<ItemType, ItemConfig> = {
  water: { emoji: '💧', label: 'Água', price: ITEM_PRICES.water },
  food: { emoji: '🍎', label: 'Comida', price: ITEM_PRICES.food },
  medicine: { emoji: '💊', label: 'Remédio', price: ITEM_PRICES.medicine },
}

// ─── Configurações de nível ──────────────────────────────────────────────────

interface OperationOption {
  value: OperationMode
  label: string
  color: string
  activeColor: string
}

const OPERATION_OPTIONS: OperationOption[] = [
  { value: 'addition', label: '+', color: '#E8F5E9', activeColor: '#4CAF50' },
  { value: 'mixed', label: '+ −', color: '#F3E5F5', activeColor: '#9C27B0' },
]

interface DifficultyOption {
  value: DifficultyLevel
  label: string
  coins: number
  example: string
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { value: '1digit', label: '1–9', coins: DIFFICULTY_COINS['1digit'], example: '3 + 5 = ?' },
  { value: '2digit', label: '10–99', coins: DIFFICULTY_COINS['2digit'], example: '45 + 8 = ?' },
  { value: '3digit', label: '100–999', coins: DIFFICULTY_COINS['3digit'], example: '247 + 5 = ?' },
]

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PetHub({ onPlay, onViewProgress, onDevDashboard }: PetHubProps) {
  // Game store
  const selectedMode = useGameStore((s) => s.selectedMode)
  const setSelectedMode = useGameStore((s) => s.setSelectedMode)
  const totalStars = useGameStore((s) => s.totalStars)
  const resetGameProgress = useGameStore((s) => s.resetProgress)

  // Pet store
  const coins = usePetStore((s) => s.coins)
  const lastFedAt = usePetStore((s) => s.lastFedAt)
  const lastWateredAt = usePetStore((s) => s.lastWateredAt)
  const inventory = usePetStore((s) => s.inventory)
  const streak = usePetStore((s) => s.streak)
  const hasTrophy = usePetStore((s) => s.hasTrophy7Days)
  const feedPet = usePetStore((s) => s.feedPet)
  const buyItem = usePetStore((s) => s.buyItem)
  const resetPetProgress = usePetStore((s) => s.resetPetProgress)

  // Seleção de nível local (inicializa com modo salvo)
  const [operation, setOperation] = useState<OperationMode>(selectedMode.operation)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(selectedMode.difficulty)

  // Status derivado do pet
  const petStatus = derivePetStatus(lastFedAt, lastWateredAt)
  const [displayStatus, setDisplayStatus] = useState<PetDisplayStatus>(petStatus)

  useEffect(() => {
    if (displayStatus !== 'eating') {
      setDisplayStatus(petStatus)
    }
  }, [petStatus, displayStatus])

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleFeed = useCallback((type: ItemType) => {
    const ok = feedPet(type)
    if (ok) {
      setDisplayStatus('eating')
    }
  }, [feedPet])

  const handleEatingEnd = useCallback(() => {
    const { lastFedAt: fed, lastWateredAt: wat } = usePetStore.getState()
    const realStatus = derivePetStatus(fed, wat)
    setDisplayStatus(realStatus)
  }, [])

  const handleBuy = useCallback((type: ItemType) => {
    buyItem(type)
  }, [buyItem])

  const handlePlay = () => {
    const mode: GameMode = { operation, difficulty }
    setSelectedMode(mode)
    onPlay(mode)
  }

  const handleReset = () => {
    if (window.confirm('Resetar todo o progresso? Isso não pode ser desfeito.')) {
      resetGameProgress()
      resetPetProgress()
      setOperation('addition')
      setDifficulty('1digit')
    }
  }

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

  const needsRescueWarning = petStatus === 'sick' && coins < ITEM_PRICES.medicine
  const currentDifficultyOption = DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)!
  const coinsPerCorrect = currentDifficultyOption.coins

  // Exemplo dinâmico baseado na seleção
  const exampleText = operation === 'mixed'
    ? (Math.random() < 0.5
        ? currentDifficultyOption.example
        : currentDifficultyOption.example.replace('+', '−'))
    : currentDifficultyOption.example

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container size="sm" py="md" data-testid="home-screen">
      <Stack gap="md" align="center" style={{ minHeight: '100vh', justifyContent: 'space-between', paddingBottom: '16px' }}>

        {/* ─── Status Bar (topo) ────────────────────────────────────────── */}
        <Group justify="space-between" style={{ width: '100%', maxWidth: '400px' }}>
          <StreakDisplay current={streak.current} hasTrophy={hasTrophy} variant="compact" />

          <Box
            data-testid="coins-display"
            aria-label={`${coins} moedas`}
            role="status"
            style={{
              background: '#FFF8E1',
              borderRadius: '12px',
              padding: '8px 16px',
            }}
          >
            <Text size="20px" fw={700}>
              <span aria-hidden="true">🪙</span> {coins}
            </Text>
          </Box>

          <Box style={{ textAlign: 'right' }}>
            <Text size="14px" fw={600} c="dimmed">
              {totalStars} ★
            </Text>
          </Box>
        </Group>

        {/* ─── Troféu ──────────────────────────────────────────────────── */}
        <TrophyDisplay visible={hasTrophy} />

        {/* ─── Pet Display ─────────────────────────────────────────────── */}
        <Box
          aria-live="polite"
          aria-label={
            displayStatus === 'eating'
              ? 'Bichinho comendo'
              : `Bichinho: ${getPetStatusLabel(displayStatus)}`
          }
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}
        >
          <PetDisplay
            status={displayStatus}
            size={140}
            onEatingEnd={handleEatingEnd}
          />
        </Box>

        {/* ─── Aviso de emergência ─────────────────────────────────────── */}
        {needsRescueWarning && (
          <Box
            data-testid="rescue-warning"
            style={{
              background: '#FCE4EC',
              border: '2px solid #E91E63',
              borderRadius: '12px',
              padding: '12px 16px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            <Text size="16px" fw={600} c="pink.8">
              Seu bichinho está doente! Complete uma lição e ele será curado! 🏥
            </Text>
          </Box>
        )}

        {/* ─── Inventário (usar itens) ─────────────────────────────────── */}
        <Box
          component="section"
          aria-label="Inventário — usar itens no bichinho"
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <Text size="16px" fw={700} c="gray.7" mb="xs">
            Inventário
          </Text>
          <SimpleGrid cols={3} spacing="sm">
            {(['water', 'food', 'medicine'] as const).map((type) => {
              const item = ITEMS[type]
              const qty = inventory[type]
              const canUse = canFeedPet(petStatus, inventory, type)

              return (
                <Button
                  key={type}
                  data-testid={`use-${type}-button`}
                  aria-label={`Usar ${item.label}, ${qty} disponível`}
                  onClick={() => handleFeed(type)}
                  disabled={!canUse}
                  variant="outline"
                  size="md"
                  style={{
                    minHeight: '64px',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    opacity: canUse ? 1 : 0.5,
                  }}
                >
                  <Text size="28px" style={{ lineHeight: 1 }} aria-hidden="true">
                    {item.emoji}
                  </Text>
                  <Text size="14px" fw={600}>
                    {qty}x {item.label}
                  </Text>
                </Button>
              )
            })}
          </SimpleGrid>
        </Box>

        {/* ─── Loja ────────────────────────────────────────────────────── */}
        <Box
          component="section"
          aria-label="Loja — comprar itens para o bichinho"
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <Text size="16px" fw={700} c="gray.7" mb="xs">
            Loja
          </Text>
          <SimpleGrid cols={3} spacing="sm">
            {(['water', 'food', 'medicine'] as const).map((type) => {
              const item = ITEMS[type]
              const canAfford = canBuyItem(coins, type)

              return (
                <Button
                  key={type}
                  data-testid={`buy-${type}-button`}
                  aria-label={`Comprar ${item.label} por ${item.price} moedas`}
                  onClick={() => handleBuy(type)}
                  disabled={!canAfford}
                  variant="filled"
                  size="md"
                  style={{
                    minHeight: '64px',
                    fontSize: '14px',
                    fontWeight: 600,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    background: canAfford
                      ? 'linear-gradient(135deg, #7E57C2 0%, #5C6BC0 100%)'
                      : '#BDBDBD',
                    border: 'none',
                    opacity: canAfford ? 1 : 0.6,
                  }}
                >
                  <Text size="28px" style={{ lineHeight: 1 }} aria-hidden="true">
                    {item.emoji}
                  </Text>
                  <Text size="14px" fw={600} c="white">
                    {item.price} moedas
                  </Text>
                </Button>
              )
            })}
          </SimpleGrid>
        </Box>

        {/* ─── Seleção de Nível ────────────────────────────────────────── */}
        <Box
          component="section"
          aria-label="Escolher nível de exercício"
          data-testid="level-selector"
          style={{ width: '100%', maxWidth: '400px' }}
        >
          <Text size="18px" fw={700} c="gray.8" mb="sm" ta="center">
            O que vamos praticar?
          </Text>

          {/* Operação */}
          <Group gap="sm" justify="center" mb="sm">
            {OPERATION_OPTIONS.map((opt) => {
              const isActive = operation === opt.value
              return (
                <UnstyledButton
                  key={opt.value}
                  data-testid={`op-${opt.value}`}
                  aria-label={opt.value === 'addition' ? 'Só soma' : 'Soma e subtração'}
                  aria-pressed={isActive}
                  onClick={() => setOperation(opt.value)}
                  style={{
                    minWidth: '100px',
                    minHeight: '56px',
                    borderRadius: '14px',
                    border: isActive
                      ? `3px solid ${opt.activeColor}`
                      : '3px solid #E0E0E0',
                    background: isActive ? opt.activeColor : opt.color,
                    color: isActive ? '#fff' : '#333',
                    fontWeight: 800,
                    fontSize: '28px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? `0 4px 12px ${opt.activeColor}44` : 'none',
                  }}
                >
                  {opt.label}
                </UnstyledButton>
              )
            })}
          </Group>

          {/* Dificuldade */}
          <Group gap="sm" justify="center" mb="sm">
            {DIFFICULTY_OPTIONS.map((opt) => {
              const isActive = difficulty === opt.value
              return (
                <UnstyledButton
                  key={opt.value}
                  data-testid={`diff-${opt.value}`}
                  aria-label={`Resultados de ${opt.label}`}
                  aria-pressed={isActive}
                  onClick={() => setDifficulty(opt.value)}
                  style={{
                    minWidth: '90px',
                    minHeight: '52px',
                    borderRadius: '14px',
                    border: isActive
                      ? '3px solid #1976D2'
                      : '3px solid #E0E0E0',
                    background: isActive ? '#1976D2' : '#E3F2FD',
                    color: isActive ? '#fff' : '#333',
                    fontWeight: 700,
                    fontSize: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive ? '0 4px 12px #1976D244' : 'none',
                  }}
                >
                  {opt.label}
                </UnstyledButton>
              )
            })}
          </Group>

          {/* Info: exemplo + moedas */}
          <Box ta="center">
            <Text size="18px" c="dimmed" fw={500}>
              Ex: {exampleText}
            </Text>
            <Badge
              size="lg"
              variant="light"
              color="yellow"
              style={{ fontSize: '14px', marginTop: '4px' }}
            >
              🪙 {coinsPerCorrect}c por acerto
            </Badge>
          </Box>
        </Box>

        {/* ─── Botão Começar Lição ──────────────────────────────────────── */}
        <Button
          data-testid="play-button"
          onClick={handlePlay}
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
          🎮 Começar!
        </Button>

        {/* ─── Links discretos ──────────────────────────────────────────── */}
        <Group gap="xl">
          {onViewProgress && (
            <UnstyledButton
              onClick={onViewProgress}
              aria-label="Ver progresso"
            >
              <Text size="sm" c="dimmed" style={{ textDecoration: 'underline' }}>
                progresso
              </Text>
            </UnstyledButton>
          )}
          {onDevDashboard && (
            <UnstyledButton
              onClick={onDevDashboard}
              aria-label="Painel de desenvolvimento"
            >
              <Text size="sm" c="dimmed" style={{ textDecoration: 'underline' }}>
                dev
              </Text>
            </UnstyledButton>
          )}
          <UnstyledButton
            onClick={handleReset}
            data-testid="reset-progress-link"
            aria-label="Resetar todo o progresso"
          >
            <Text size="sm" c="dimmed" style={{ textDecoration: 'underline' }}>
              resetar progresso
            </Text>
          </UnstyledButton>
        </Group>
      </Stack>
    </Container>
  )
}
