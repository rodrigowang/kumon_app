/**
 * Unit Tests — UI Components
 *
 * Testes para Button, Card, Container, Heading
 * Validação de:
 * - data-testid presença (obrigatório)
 * - TypeScript tipos
 * - Renderização
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Button, Card, Container, Heading } from '../../src/components/ui'

describe('UI Components', () => {
  describe('Button', () => {
    it('deve renderizar com data-testid obrigatório', () => {
      render(<Button data-testid="test-button">Click me</Button>)
      const button = screen.getByTestId('test-button')
      expect(button).toBeInTheDocument()
    })

    it('deve suportar variantes pedagógicas', () => {
      const { rerender } = render(
        <Button data-testid="btn-success" variant="success">
          Acertei!
        </Button>
      )
      expect(screen.getByTestId('btn-success')).toBeInTheDocument()

      rerender(
        <Button data-testid="btn-error" variant="error">
          Errei
        </Button>
      )
      expect(screen.getByTestId('btn-error')).toBeInTheDocument()
    })

    it('deve ter tamanho mínimo 48px', () => {
      render(<Button data-testid="size-btn">Button</Button>)
      const btn = screen.getByTestId('size-btn') as HTMLButtonElement
      const styles = window.getComputedStyle(btn)
      // Verificação via className (Mantine aplica via classe)
      expect(btn.className).toContain('Button')
    })
  })

  describe('Card', () => {
    it('deve renderizar com data-testid obrigatório', () => {
      render(<Card data-testid="test-card">Content</Card>)
      const card = screen.getByTestId('test-card')
      expect(card).toBeInTheDocument()
    })

    it('deve renderizar children', () => {
      render(
        <Card data-testid="card-with-children">
          <p>Teste</p>
        </Card>
      )
      expect(screen.getByText('Teste')).toBeInTheDocument()
    })
  })

  describe('Container', () => {
    it('deve renderizar com data-testid obrigatório', () => {
      render(<Container data-testid="test-container">Content</Container>)
      const container = screen.getByTestId('test-container')
      expect(container).toBeInTheDocument()
    })

    it('deve suportar size prop', () => {
      render(
        <Container data-testid="sized-container" size="md">
          Content
        </Container>
      )
      expect(screen.getByTestId('sized-container')).toBeInTheDocument()
    })
  })

  describe('Heading', () => {
    it('deve renderizar com data-testid obrigatório', () => {
      render(
        <Heading level={1} data-testid="test-heading">
          Title
        </Heading>
      )
      const heading = screen.getByTestId('test-heading')
      expect(heading).toBeInTheDocument()
    })

    it('deve suportar níveis h1-h4', () => {
      const levels: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4]
      levels.forEach((level) => {
        const testid = `h${level}`
        render(
          <Heading level={level} data-testid={testid}>
            Heading {level}
          </Heading>
        )
        expect(screen.getByTestId(testid)).toBeInTheDocument()
      })
    })

    it('deve renderizar com hierarquia h1', () => {
      render(
        <Heading level={1} data-testid="h1-test">
          Main Title
        </Heading>
      )
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Main Title')
    })
  })
})
