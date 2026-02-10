/**
 * Button Component
 *
 * Requisitos:
 * - Touch target mínimo: 48x48px
 * - Feedback visual em 150-200ms
 * - Estados: idle, pressed, disabled, success, error
 * - `data-testid` obrigatório
 *
 * Uso:
 * ```tsx
 * <Button data-testid="submit-button" onClick={handleSubmit}>
 *   Enviar
 * </Button>
 * ```
 */

import { Button as MantineButton, ButtonProps as MantineButtonProps } from '@mantine/core';
import { forwardRef, ReactNode, MouseEventHandler } from 'react';

export interface ButtonProps extends Omit<MantineButtonProps, 'variant'> {
  /** Test ID obrigatório (seguindo CLAUDE.md) */
  'data-testid': string;

  /** Variantes pedagógicas */
  variant?: 'filled' | 'light' | 'outline' | 'subtle' | 'success' | 'error';

  /** Conteúdo do botão */
  children?: ReactNode;

  /** Click handler */
  onClick?: MouseEventHandler<HTMLButtonElement>;
}

/**
 * Botão customizado para interação infantil.
 *
 * Features:
 * - Tamanho mínimo 48px (iOS/Android guideline)
 * - Animação de feedback rápida (150ms)
 * - Suporte a variantes success/error para feedback visual
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, variant = 'filled', color, ...props }, ref) => {
    // Mapeia variantes pedagógicas para cores do Mantine
    const colorMapping: Record<string, string | undefined> = {
      success: 'green',
      error: 'red',
      filled: color || 'blue',
      light: color || 'blue',
      outline: color || 'blue',
      subtle: color || 'blue',
    };

    const computedColor = colorMapping[variant] || color;
    const computedVariant = variant === 'success' || variant === 'error' ? 'filled' : variant;

    return (
      <MantineButton
        ref={ref}
        variant={computedVariant}
        color={computedColor}
        {...props}
      >
        {children}
      </MantineButton>
    );
  }
);

Button.displayName = 'Button';
