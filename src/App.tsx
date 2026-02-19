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
import { SoundTester, CanvasTester, OCRTester, ExerciseTester } from './components/dev'
import { useOCRModel } from './hooks'
import { useGameStore } from './stores/useGameStore'

function App() {
  const [count, setCount] = useState(0)
  const [retryKey, setRetryKey] = useState(0)

  // Carregar modelo OCR e sincronizar com a store
  const { model, isLoading, error } = useOCRModel()
  const { setOCRStatus } = useGameStore()

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

  // Exibir tela de loading enquanto o modelo carrega
  if (isLoading) {
    return <LoadingScreen data-testid="ocr-loading-screen" />
  }

  // Exibir tela de erro se houver falha no carregamento
  if (error) {
    return (
      <LoadingScreen
        error={error}
        onRetry={handleRetry}
        data-testid="ocr-error-screen"
      />
    )
  }

  // App principal (só renderiza quando modelo estiver pronto)
  return (
    <Container key={retryKey} size="md" data-testid="main-container" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Heading level={1} data-testid="page-title" ta="center">
          Kumon Math App
        </Heading>

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
