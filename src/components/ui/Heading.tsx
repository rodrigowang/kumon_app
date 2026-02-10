/**
 * Heading Component
 *
 * Títulos e cabeçalhos semânticos.
 *
 * Uso:
 * ```tsx
 * <Heading level={1} data-testid="page-title">
 *   Exercícios de Matemática
 * </Heading>
 * ```
 */

import { Title, TitleProps } from '@mantine/core';
import { forwardRef, ReactNode } from 'react';

export interface HeadingProps extends Omit<TitleProps, 'order'> {
  /** Nível do heading (h1-h4) */
  level?: 1 | 2 | 3 | 4;

  /** Test ID obrigatório */
  'data-testid': string;

  /** Conteúdo do heading */
  children?: ReactNode;
}

/**
 * Heading com hierarquia semântica (h1-h4).
 *
 * Tamanhos:
 * - h1: 40px
 * - h2: 32px (números)
 * - h3: 28px
 * - h4: 24px (texto base)
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ level = 1, children, ...props }, ref) => {
    return (
      <Title
        ref={ref}
        order={level}
        {...props}
      >
        {children}
      </Title>
    );
  }
);

Heading.displayName = 'Heading';
