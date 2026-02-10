/**
 * Container Component
 *
 * Wrapper responsivo para limitar largura de conteúdo.
 *
 * Uso:
 * ```tsx
 * <Container size="md" data-testid="main-container">
 *   <h1>Meu App</h1>
 * </Container>
 * ```
 */

import { Container as MantineContainer, ContainerProps as MantineContainerProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface ContainerProps extends MantineContainerProps {
  /** Test ID obrigatório */
  'data-testid': string;

  /** Conteúdo do container */
  children?: ReactNode;
}

/**
 * Container responsivo com tamanhos predefinidos.
 */
export const Container = forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, size = 'md', ...props }, ref) => {
    return (
      <MantineContainer
        ref={ref}
        size={size}
        {...props}
      >
        {children}
      </MantineContainer>
    );
  }
);

Container.displayName = 'Container';
