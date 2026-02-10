/**
 * Card Component
 *
 * Container visual para agrupar conteúdo relacionado.
 *
 * Uso:
 * ```tsx
 * <Card data-testid="exercise-card">
 *   <h2>Exercício 1</h2>
 *   <p>2 + 3 = ?</p>
 * </Card>
 * ```
 */

import { Paper, PaperProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface CardProps extends PaperProps {
  /** Test ID obrigatório */
  'data-testid': string;

  /** Conteúdo do card */
  children?: ReactNode;
}

/**
 * Card com defaults amigáveis para crianças:
 * - Sombra suave (depth)
 * - Padding generoso
 * - Bordas arredondadas
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ children, ...props }, ref) => {
    return (
      <Paper
        ref={ref}
        shadow="sm"
        p="lg"
        radius="md"
        {...props}
      >
        {children}
      </Paper>
    );
  }
);

Card.displayName = 'Card';
