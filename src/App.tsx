/**
 * App Root
 *
 * Página de demonstração do UI Framework.
 * Componentes: Button, Card, Container, Heading
 */

import { useState, useEffect } from 'react'
import { Stack, Group, Text } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { Button, Card, Container, Heading, LoadingScreen } from './components/ui'
import { PetHub, SessionSummaryScreen, ProgressDashboard } from './components/screens'
import { SoundTester, CanvasTester, OCRTester, ExerciseTester, AbstractExerciseTester } from './components/dev'
import { useOCRModel } from './hooks'
import { useGameStore } from './stores/useGameStore'

import type { SessionSummary } from './stores/useGameStore'
import type { GameMode } from './types'

type AppView = 'home' | 'exercise' | 'dev-dashboard' | 'session-summary' | 'progress-dashboard'

// Modo E2E: ativa mockOCR e pula tela de carregamento OCR
// Ativado via query param: /?e2e (ex: testes Playwright)
const IS_E2E = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('e2e')

function App() {
  const [currentView, setCurrentView] = useState<AppView>('home')
  const [count, setCount] = useState(0)
  const [retryKey, setRetryKey] = useState(0)
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null)

  // Carregar modelo OCR e sincronizar com a store
  const { model, isLoading, error } = useOCRModel()
  const { setOCRStatus, startSession, endSession } = useGameStore()

  // Sincronizar status do OCR com a store global
  useEffect(() => {
    setOCRStatus({
      isReady: !!model && !isLoading && !error,
      isLoading,
      error,
    })
  }, [model, isLoading, error, setOCRStatus])

  // Handler para retry do carregamento
  const handleRetry = () => {
    // Forçar remontagem do App para recarregar o hook useOCRModel
    setRetryKey((prev) => prev + 1)
  }

  const handleSuccess = () => {
    notifications.show({
      title: 'Muito bem!',
      message: 'Resposta correta!',
      color: 'green',
      autoClose: 3000,
    })
  }

  const handleError = () => {
    notifications.show({
      title: 'Ops!',
      message: 'Tente novamente',
      color: 'red',
      autoClose: 3000,
    })
  }

  // Exibir tela de loading enquanto o modelo carrega (pulado em modo E2E)
  if (!IS_E2E && isLoading) {
    return <LoadingScreen data-testid="ocr-loading-screen" />
  }

  // Exibir tela de erro se houver falha no carregamento (pulado em modo E2E)
  if (!IS_E2E && error) {
    return (
      <LoadingScreen
        error={error}
        onRetry={handleRetry}
        data-testid="ocr-error-screen"
      />
    )
  }

  // Handler: iniciar sessão de exercícios
  const handlePlay = (mode: GameMode) => {
    startSession(mode)
    setCurrentView('exercise')
  }

  // Handler: sessão completa (10 exercícios)
  const handleSessionComplete = () => {
    const summary = endSession()
    setSessionSummary(summary)
    setCurrentView('session-summary')
  }

  // Handler: jogar de novo (usa último modo selecionado)
  const handlePlayAgain = () => {
    startSession()
    setCurrentView('exercise')
  }

  // Tela de Exercício (fullscreen)
  if (currentView === 'exercise') {
    return (
      <AbstractExerciseTester
        onBack={() => setCurrentView('home')}
        ocrModel={model}
        onSessionComplete={handleSessionComplete}
      />
    )
  }

  // Tela de Resumo da Sessão
  if (currentView === 'session-summary' && sessionSummary) {
    return (
      <SessionSummaryScreen
        summary={sessionSummary}
        onPlayAgain={handlePlayAgain}
        onGoHome={() => setCurrentView('home')}
      />
    )
  }

  // Progress Dashboard (mapa de níveis)
  if (currentView === 'progress-dashboard') {
    const currentLevel = useGameStore.getState().currentLevel
    const totalStars = useGameStore.getState().totalStars

    return (
      <ProgressDashboard
        currentLevel={currentLevel}
        totalStars={totalStars}
        onBack={() => setCurrentView('home')}
      />
    )
  }

  // Pet Hub (tela principal com bichinho virtual)
  if (currentView === 'home') {
    return (
      <PetHub
        onPlay={handlePlay}
        onViewProgress={() => setCurrentView('progress-dashboard')}
        onDevDashboard={() => setCurrentView('dev-dashboard')}
      />
    )
  }

  // Dev Dashboard (só renderiza quando modelo estiver pronto)
  return (
    <Container key={retryKey} size="md" data-testid="main-container" py="xl">
      <Stack gap="xl">
        {/* Header com botão de volta */}
        <Group justify="space-between" align="center">
          <Heading level={1} data-testid="page-title">
            Kumon Math App — Dev Dashboard
          </Heading>
          <Button
            data-testid="back-to-home-button"
            variant="outline"
            onClick={() => setCurrentView('home')}
          >
            ← Voltar para Home
          </Button>
        </Group>

        {/* Demo Card */}
        <Card data-testid="demo-card">
          <Stack gap="md">
            <Heading level={2} data-testid="demo-heading">
              UI Framework — Demo
            </Heading>

            <Text size="md">
              Framework de UI com componentes otimizados para crianças de 7 anos.
            </Text>

            <Text className="text-number" c="blue">
              Contador: {count}
            </Text>

            <Group gap="sm">
              <Button
                data-testid="increment-button"
                onClick={() => setCount((c) => c + 1)}
              >
                + Adicionar
              </Button>

              <Button
                data-testid="reset-button"
                variant="outline"
                onClick={() => setCount(0)}
              >
                Resetar
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Feedback Demo */}
        <Card data-testid="feedback-card">
          <Stack gap="md">
            <Heading level={3} data-testid="feedback-heading">
              Feedback Visual
            </Heading>

            <Text size="md">
              Botões com feedback pedagógico (success/error):
            </Text>

            <Group gap="sm">
              <Button
                data-testid="success-button"
                variant="success"
                onClick={handleSuccess}
              >
                ✓ Acertei!
              </Button>

              <Button
                data-testid="error-button"
                variant="error"
                onClick={handleError}
              >
                ✗ Errei
              </Button>
            </Group>
          </Stack>
        </Card>

        {/* Sound Tester */}
        <SoundTester />

        {/* Canvas Tester */}
        <CanvasTester />

        {/* OCR Tester */}
        <OCRTester />

        {/* Exercise Screen Tester */}
        <ExerciseTester />

        {/* Abstract Exercise Tester (Fase Abstrata Completa) */}
        <Card data-testid="abstract-exercise-card">
          <Stack gap="md">
            <Heading level={3} data-testid="abstract-exercise-heading">🎮 Fase Abstrata - Motor Completo</Heading>
            <Text size="md">
              Tela de exercício com integração completa: gerador + hesitação + maestria
            </Text>
            <Button
              data-testid="open-abstract-exercise"
              onClick={() => setCurrentView('exercise')}
            >
              Abrir Tela de Exercício
            </Button>
          </Stack>
        </Card>

        {/* Specs Info */}
        <Card data-testid="specs-card" bg="blue.0">
          <Stack gap="xs">
            <Text size="sm" fw={700}>
              ✅ Requisitos atendidos:
            </Text>
            <Text size="sm">
              • Fonte Nunito carregada via Google Fonts
              <br />
              • Tokens CSS: --button-min-size (48px), --font-size-number (32px)
              <br />
              • Botões ≥48px com estados visuais (hover, active, disabled)
              <br />
              • Tema Mantine customizado (cores vibrantes, alto contraste)
              <br />
              • Todos os componentes com data-testid obrigatório
              <br />
              • Feedback visual em 150ms (transform: scale)
              <br />• Hook useSound com 4 sons (sintéticos via Web Audio API)
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  )
}

export default App
