/**
 * PetHub — Tela principal do app (substitui HomeScreen)
 *
 * Layout:
 * - Status bar (streak + moedas)
 * - PetDisplay centralizado
 * - Inventário (usar itens no pet)
 * - Loja compacta
 * - Botão grande "Começar Lição"
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

import type { PetDisplayStatus } from '../ui'
import type { ItemType } from '../../lib/petActions'

interface PetHubProps {
  onPlay: () => void
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

// ─── Componente ──────────────────────────────────────────────────────────────

export default function PetHub({ onPlay, onViewProgress, onDevDashboard }: PetHubProps) {
  // Game store (nível, estrelas)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const totalStars = useGameStore((s) => s.totalStars)
  const resetGameProgress = useGameStore((s) => s.resetProgress)
  const subtractionBannerSeen = useGameStore((s) => s.subtractionBannerSeen)
  const dismissSubtractionBanner = useGameStore((s) => s.dismissSubtractionBanner)
  const multiDigitBannerSeen = useGameStore((s) => s.multiDigitBannerSeen)
  const dismissMultiDigitBanner = useGameStore((s) => s.dismissMultiDigitBanner)

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

  // Status derivado
  const petStatus = derivePetStatus(lastFedAt, lastWateredAt)

  // Estado local: animação de eating
  const [displayStatus, setDisplayStatus] = useState<PetDisplayStatus>(petStatus)

  // Sincronizar displayStatus com petStatus real (exceto durante eating)
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
    // Re-derivar status real após animação de eating
    const { lastFedAt: fed, lastWateredAt: wat } = usePetStore.getState()
    const realStatus = derivePetStatus(fed, wat)
    setDisplayStatus(realStatus)
  }, [])

  const handleBuy = useCallback((type: ItemType) => {
    buyItem(type)
  }, [buyItem])

  const handleReset = () => {
    if (window.confirm('Resetar todo o progresso? Isso não pode ser desfeito.')) {
      resetGameProgress()
      resetPetProgress()
    }
  }

  // ─── Helpers de UI ──────────────────────────────────────────────────────────

  const operationName = currentLevel.operation === 'addition' ? 'Somas' : 'Subtrações'
  const levelText = `${operationName} até ${currentLevel.maxResult}`

  const needsRescueWarning = petStatus === 'sick' && coins < ITEM_PRICES.medicine
  const showSubtractionBanner = currentLevel.operation === 'subtraction' && !subtractionBannerSeen
  const showMultiDigitBanner = currentLevel.maxResult >= 99 && !multiDigitBannerSeen

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Container size="sm" py="md" data-testid="home-screen">
      <Stack gap="md" align="center" style={{ minHeight: '100vh', justifyContent: 'space-between', paddingBottom: '16px' }}>

        {/* ─── Status Bar (topo) ────────────────────────────────────────── */}
        <Group justify="space-between" style={{ width: '100%', maxWidth: '400px' }}>
          {/* Streak */}
          <StreakDisplay current={streak.current} hasTrophy={hasTrophy} variant="compact" />

          {/* Moedas */}
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

          {/* Nível + Estrelas */}
          <Box style={{ textAlign: 'right' }}>
            <Badge
              size="md"
              radius="md"
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
              style={{ fontSize: '12px', padding: '4px 10px', height: 'auto' }}
            >
              {levelText}
            </Badge>
            <Text size="14px" fw={600} c="dimmed">
              {totalStars} ★
            </Text>
          </Box>
        </Group>

        {/* ─── Troféu ──────────────────────────────────────────────────── */}
        <TrophyDisplay visible={hasTrophy} />

        {/* ─── Banner: Subtração desbloqueada ──────────────────────────── */}
        {showSubtractionBanner && (
          <Box
            data-testid="subtraction-unlock-banner"
            style={{
              background: 'linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%)',
              border: '2px solid #66BB6A',
              borderRadius: '16px',
              padding: '16px 20px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            <Text size="28px" mb={4}>🐾</Text>
            <Text size="20px" fw={800} c="green.8" mb="xs">
              Agora vamos subtrair!
            </Text>
            <Text size="16px" c="green.7" mb="md">
              Seu bichinho vai adorar! 🎉
            </Text>
            <Button
              data-testid="subtraction-banner-dismiss"
              onClick={dismissSubtractionBanner}
              size="md"
              style={{
                minHeight: '48px',
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              Entendi! Vamos lá! ✨
            </Button>
          </Box>
        )}

        {/* ─── Banner: Multi-dígitos desbloqueados ─────────────────────── */}
        {showMultiDigitBanner && (
          <Box
            data-testid="multidigit-unlock-banner"
            style={{
              background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
              border: '2px solid #42A5F5',
              borderRadius: '16px',
              padding: '16px 20px',
              width: '100%',
              maxWidth: '400px',
              textAlign: 'center',
            }}
          >
            <Text size="28px" mb={4}>🔢</Text>
            <Text size="20px" fw={800} c="blue.8" mb="xs">
              Números maiores!
            </Text>
            <Text size="16px" c="blue.7" mb="md">
              Agora com dezenas e centenas! 🚀
            </Text>
            <Button
              data-testid="multidigit-banner-dismiss"
              onClick={dismissMultiDigitBanner}
              size="md"
              style={{
                minHeight: '48px',
                background: 'linear-gradient(135deg, #2196F3 0%, #1E88E5 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: '18px',
              }}
            >
              Entendi! Vamos lá! ✨
            </Button>
          </Box>
        )}

        {/* ─── Pet Display ─────────────────────────────────────────────── */}
        <Box
          aria-live="polite"
          aria-label={
            displayStatus === 'eating' ? 'Bichinho comendo' :
            `Bichinho: ${getPetStatusLabel(displayStatus === 'eating' ? 'happy' : displayStatus)}`
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

        {/* ─── Botão Começar Lição ──────────────────────────────────────── */}
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
          🎮 Começar Lição
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
