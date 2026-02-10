/**
 * Mantine Theme Configuration
 *
 * Configuração customizada para atender requisitos pedagógicos:
 * - Touch targets ≥48px
 * - Fonte Nunito
 * - Cores de alto contraste
 * - Feedback visual consistente
 */

import { createTheme, MantineColorsTuple } from '@mantine/core';

// Cores customizadas (high contrast)
const primaryColor: MantineColorsTuple = [
  '#EFF6FF', // 0
  '#DBEAFE', // 1
  '#BFDBFE', // 2
  '#93C5FD', // 3
  '#60A5FA', // 4
  '#3B82F6', // 5 (base)
  '#2563EB', // 6
  '#1D4ED8', // 7
  '#1E40AF', // 8
  '#1E3A8A', // 9
];

const successColor: MantineColorsTuple = [
  '#ECFDF5',
  '#D1FAE5',
  '#A7F3D0',
  '#6EE7B7',
  '#34D399',
  '#10B981', // base
  '#059669',
  '#047857',
  '#065F46',
  '#064E3B',
];

const errorColor: MantineColorsTuple = [
  '#FEF2F2',
  '#FEE2E2',
  '#FECACA',
  '#FCA5A5',
  '#F87171',
  '#EF4444', // base
  '#DC2626',
  '#B91C1C',
  '#991B1B',
  '#7F1D1D',
];

export const theme = createTheme({
  /** Font family */
  fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
  fontFamilyMonospace: 'ui-monospace, SFMono-Regular, Monaco, monospace',
  headings: {
    fontFamily: 'Nunito, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '40px', lineHeight: '1.2' },
      h2: { fontSize: '32px', lineHeight: '1.3' },
      h3: { fontSize: '28px', lineHeight: '1.4' },
      h4: { fontSize: '24px', lineHeight: '1.4' },
    },
  },

  /** Font sizes */
  fontSizes: {
    xs: '18px',
    sm: '20px',
    md: '24px', // base (requisito: ≥24px)
    lg: '28px',
    xl: '32px', // números
  },

  /** Primary color */
  primaryColor: 'blue',
  colors: {
    blue: primaryColor,
    green: successColor,
    red: errorColor,
  },

  /** Spacing */
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  /** Border radius */
  radius: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
  },

  /** Shadows */
  shadows: {
    xs: '0 1px 3px rgba(0, 0, 0, 0.12)',
    sm: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
  },

  /** Component defaults */
  components: {
    Button: {
      defaultProps: {
        size: 'lg',
        radius: 'md',
      },
      styles: {
        root: {
          minHeight: '48px',
          minWidth: '48px',
          fontSize: '24px',
          fontWeight: 700,
          transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',

          // Touch feedback
          '&:active': {
            transform: 'scale(0.95)',
          },
        },
      },
    },

    Card: {
      defaultProps: {
        shadow: 'sm',
        padding: 'lg',
        radius: 'md',
      },
    },

    Container: {
      defaultProps: {
        sizes: {
          xs: 540,
          sm: 720,
          md: 960,
          lg: 1140,
          xl: 1320,
        },
      },
    },

    Text: {
      defaultProps: {
        size: 'md', // 24px
      },
    },

    Title: {
      styles: {
        root: {
          fontWeight: 700,
        },
      },
    },
  },

  /** Other tokens */
  white: '#FFFFFF',
  black: '#111827',
  lineHeights: {
    xs: '1.4',
    sm: '1.45',
    md: '1.5',
    lg: '1.6',
    xl: '1.65',
  },
});
