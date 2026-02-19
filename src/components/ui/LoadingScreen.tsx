/**
 * LoadingScreen — Tela de carregamento do modelo OCR
 *
 * Componente amigável para crianças que exibe o estado de carregamento
 * do modelo MNIST. Inclui animação, feedback visual e tratamento de erros.
 *
 * Specs:
 * - Animação suave e não-intrusiva
 * - Mensagens claras e adequadas para crianças de 7 anos
 * - Botão "Tentar Novamente" em caso de erro de rede
 * - Acessibilidade: role="alert" para erros
 */

import { Stack, Loader, Text, Center, Paper } from '@mantine/core';
import { Button } from './Button';

interface LoadingScreenProps {
  /** Mensagem de erro, se houver */
  error?: string | null;
  /** Callback para tentar carregar novamente */
  onRetry?: () => void;
  /** ID para testes */
  'data-testid'?: string;
}

/**
 * Tela de carregamento do modelo OCR
 *
 * @param {LoadingScreenProps} props - Props do componente
 * @returns {JSX.Element} Tela de loading ou erro
 */
export const LoadingScreen = ({ error, onRetry, 'data-testid': dataTestId }: LoadingScreenProps) => {
  // Se houver erro, exibir tela de erro
  if (error) {
    return (
      <Center h="100vh" p="xl" data-testid={dataTestId || 'loading-screen'}>
        <Paper
          p="xl"
          withBorder
          shadow="md"
          style={{
            maxWidth: 500,
            backgroundColor: 'var(--mantine-color-red-0)',
            borderColor: 'var(--mantine-color-red-4)',
          }}
          role="alert"
          data-testid="error-screen"
        >
          <Stack gap="lg" align="center">
            {/* Ícone de erro */}
            <Text size="4rem" style={{ lineHeight: 1 }}>
              😞
            </Text>

            {/* Título */}
            <Text size="xl" fw={700} c="red.9" ta="center">
              Ops! Algo deu errado
            </Text>

            {/* Mensagem de erro */}
            <Text size="md" c="red.7" ta="center">
              {error}
            </Text>

            {/* Botão "Tentar Novamente" */}
            {onRetry && (
              <Button
                onClick={onRetry}
                size="lg"
                fullWidth
                data-testid="retry-button"
                style={{ minHeight: 56 }}
              >
                🔄 Tentar Novamente
              </Button>
            )}
          </Stack>
        </Paper>
      </Center>
    );
  }

  // Tela de carregamento normal
  return (
    <Center h="100vh" p="xl" data-testid={dataTestId || 'loading-screen'}>
      <Stack gap="xl" align="center">
        {/* Loader animado */}
        <Loader size="xl" color="blue" type="dots" />

        {/* Mensagem amigável */}
        <Stack gap="xs" align="center">
          <Text size="xl" fw={700} c="blue.9" ta="center">
            Preparando tudo para você...
          </Text>
          <Text size="md" c="gray.7" ta="center">
            Só mais um pouquinho!
          </Text>
        </Stack>

        {/* Ícone decorativo */}
        <Text size="3rem" style={{ lineHeight: 1, opacity: 0.6 }}>
          📚
        </Text>
      </Stack>
    </Center>
  );
};
