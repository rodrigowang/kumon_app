/**
 * E2E: Fluxo principal do app
 *
 * PetHub → Lição (mockOCR) → Resumo com moedas → Voltar → Pet feliz
 *
 * Usa ?e2e query param para pular loading do modelo OCR.
 * O mockOCR responde via window.prompt() interceptado pelo Playwright.
 */

import { test, expect, type Page } from '@playwright/test'

const BASE_URL = 'http://localhost:5173/?e2e'

/** Submete uma resposta via mockOCR (intercepta o prompt) */
async function submitAnswer(page: Page, answer: string | number) {
  page.once('dialog', async (dialog) => {
    await dialog.accept(String(answer))
  })
  await page.getByTestId('submit-button').click()
}

/** Completa uma sessão inteira de 10 exercícios respondendo ao mockOCR */
async function completeFakeSession(page: Page) {
  for (let i = 0; i < 10; i++) {
    // Aguarda a tela de exercício estar pronta
    await page.waitForSelector('[data-testid="exercise-screen"]', { timeout: 5000 })

    // Registra handler do dialog ANTES de clicar submit
    const dialogPromise = page.waitForEvent('dialog', { timeout: 5000 }).catch(() => null)
    await page.getByTestId('submit-button').click()

    const dialog = await dialogPromise
    if (dialog) {
      // Extrai resposta correta da mensagem do prompt (se disponível), senão responde '5'
      const message = dialog.message()
      const match = message.match(/resposta correta:\s*(\d+)/)
      const answer = match ? match[1] : '5'
      await dialog.accept(answer)
    }

    // Aguarda transição para próximo exercício ou sumário
    await page.waitForTimeout(400)
  }
}

// ─── Testes ───────────────────────────────────────────────────────────────

test.describe('Fluxo principal — PetHub → Lição → Resumo → PetHub', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    // Aguarda PetHub carregar
    await page.waitForSelector('[data-testid="home-screen"]', { timeout: 10000 })
  })

  test('PetHub renderiza com todos os elementos essenciais', async ({ page }) => {
    await expect(page.getByTestId('home-screen')).toBeVisible()
    await expect(page.getByTestId('play-button')).toBeVisible()
    await expect(page.getByTestId('coins-display')).toBeVisible()
    await expect(page.getByTestId('streak-display')).toBeVisible()
  })

  test('play-button tem touch target ≥ 80px (botão principal)', async ({ page }) => {
    const box = await page.getByTestId('play-button').boundingBox()
    expect(box).not.toBeNull()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(80)
      expect(box.width).toBeGreaterThanOrEqual(200)
    }
  })

  test('clicar em Começar Lição navega para exercise-screen', async ({ page }) => {
    await page.getByTestId('play-button').click()
    await expect(page.getByTestId('exercise-screen')).toBeVisible({ timeout: 5000 })
  })

  test('fluxo completo: PetHub → 10 exercícios → Resumo com moedas → Voltar', async ({ page }) => {
    // 1. Iniciar lição
    await page.getByTestId('play-button').click()
    await page.waitForSelector('[data-testid="exercise-screen"]', { timeout: 5000 })

    // 2. Completar 10 exercícios com mockOCR
    await completeFakeSession(page)

    // 3. Sessão completa → tela de resumo
    await page.waitForSelector('[data-testid="session-summary-screen"]', { timeout: 10000 })
    await expect(page.getByTestId('session-summary-screen')).toBeVisible()

    // 4. Resumo deve mostrar moedas ganhas
    await expect(page.getByTestId('coins-earned-display')).toBeVisible()

    // 5. Clicar em Voltar para o Quarto
    await page.getByTestId('go-home-button').click()

    // 6. PetHub visível novamente com pet
    await page.waitForSelector('[data-testid="home-screen"]', { timeout: 5000 })
    await expect(page.getByTestId('home-screen')).toBeVisible()
    await expect(page.getByTestId('play-button')).toBeVisible()
  })

  test('botão Jogar Novamente no resumo inicia nova sessão', async ({ page }) => {
    await page.getByTestId('play-button').click()
    await page.waitForSelector('[data-testid="exercise-screen"]', { timeout: 5000 })

    await completeFakeSession(page)

    await page.waitForSelector('[data-testid="session-summary-screen"]', { timeout: 10000 })
    await page.getByTestId('play-again-button').click()

    // Deve ir direto para nova sessão
    await page.waitForSelector('[data-testid="exercise-screen"]', { timeout: 5000 })
    await expect(page.getByTestId('exercise-screen')).toBeVisible()
  })
})

test.describe('PetHub — Loja e Inventário', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL)
    await page.waitForSelector('[data-testid="home-screen"]', { timeout: 10000 })
  })

  test('botões de compra têm touch target ≥ 48px', async ({ page }) => {
    for (const item of ['water', 'food', 'medicine']) {
      const box = await page.getByTestId(`buy-${item}-button`).boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48)
        expect(box.width).toBeGreaterThanOrEqual(48)
      }
    }
  })

  test('botões de usar têm touch target ≥ 48px', async ({ page }) => {
    for (const item of ['water', 'food', 'medicine']) {
      const box = await page.getByTestId(`use-${item}-button`).boundingBox()
      expect(box).not.toBeNull()
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48)
      }
    }
  })
})
