import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Canvas de Desenho - Infra (Feature 1.1.1)
 *
 * Valida os requisitos pedagógicos definidos na spec:
 * - R1: Área de desenho confortável
 * - R2: Resposta tátil imediata
 * - R3: Botão "Limpar" acessível
 */

test.describe('Canvas de Desenho - Infra', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('R1.1: Canvas ocupa ≥60% da largura da viewport', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas-container');
    await expect(canvas).toBeVisible();

    const viewport = page.viewportSize();
    const canvasBox = await canvas.boundingBox();

    expect(viewport).not.toBeNull();
    expect(canvasBox).not.toBeNull();

    if (viewport && canvasBox) {
      const widthPercentage = (canvasBox.width / viewport.width) * 100;
      expect(widthPercentage).toBeGreaterThanOrEqual(60);
    }
  });

  test('R1.2: Canvas tem altura suficiente (≥200px)', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas-container');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    if (canvasBox) {
      expect(canvasBox.height).toBeGreaterThanOrEqual(200);
    }
  });

  test('R1.3: Canvas tem borda visual clara', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas-container');
    await expect(canvas).toBeVisible();

    // Verifica se há borda aplicada
    const borderWidth = await canvas.evaluate((el) =>
      window.getComputedStyle(el).borderWidth
    );
    expect(parseFloat(borderWidth)).toBeGreaterThan(0);
  });

  test('R1.3: Canvas tem label "Escreva aqui"', async ({ page }) => {
    const label = page.getByText(/escreva aqui/i);
    await expect(label).toBeVisible();
  });

  test('R2.1: Traço aparece ao desenhar (responsividade)', async ({
    page,
  }) => {
    const canvas = page.getByTestId('drawing-canvas');
    await expect(canvas).toBeVisible();

    // Simula desenho no canvas
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      // Desenha uma linha simples
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 50);
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();

      // Aguarda um frame para renderização
      await page.waitForTimeout(50);

      // Verifica se o canvas não está mais vazio
      const isEmpty = await canvas.evaluate((el) => {
        const canvasEl = el as HTMLCanvasElement;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return true;

        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );
        // Se houver qualquer pixel não transparente, canvas não está vazio
        return !imageData.data.some((value, index) => {
          // Verifica canal alpha (cada 4º valor)
          return index % 4 === 3 && value > 0;
        });
      });

      expect(isEmpty).toBe(false);
    }
  });

  test('R3.1: Botão Limpar tem ≥48px de touch target', async ({ page }) => {
    const clearButton = page.getByTestId('clear-button');
    await expect(clearButton).toBeVisible();

    const box = await clearButton.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(48);
      expect(box.width).toBeGreaterThanOrEqual(48);
    }
  });

  test('R3.2: Botão Limpar está sempre visível', async ({ page }) => {
    const clearButton = page.getByTestId('clear-button');
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeEnabled();
  });

  test('R3.3: Apertar Limpar apaga todo o conteúdo instantaneamente', async ({
    page,
  }) => {
    const canvas = page.getByTestId('drawing-canvas');
    const clearButton = page.getByTestId('clear-button');

    await expect(canvas).toBeVisible();

    // Desenha algo no canvas
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();

    if (box) {
      await page.mouse.move(box.x + 50, box.y + 50);
      await page.mouse.down();
      await page.mouse.move(box.x + 150, box.y + 150);
      await page.mouse.up();

      await page.waitForTimeout(50);

      // Verifica que canvas tem conteúdo
      let isEmpty = await canvas.evaluate((el) => {
        const canvasEl = el as HTMLCanvasElement;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return true;

        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );
        return !imageData.data.some(
          (value, index) => index % 4 === 3 && value > 0
        );
      });

      expect(isEmpty).toBe(false);

      // Clica em Limpar
      await clearButton.click();
      await page.waitForTimeout(50);

      // Verifica que canvas está vazio
      isEmpty = await canvas.evaluate((el) => {
        const canvasEl = el as HTMLCanvasElement;
        const ctx = canvasEl.getContext('2d');
        if (!ctx) return true;

        const imageData = ctx.getImageData(
          0,
          0,
          canvasEl.width,
          canvasEl.height
        );
        return !imageData.data.some(
          (value, index) => index % 4 === 3 && value > 0
        );
      });

      expect(isEmpty).toBe(true);
    }
  });

  test('Teste de Responsividade: Canvas adapta a viewport 768px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();

    const canvas = page.getByTestId('drawing-canvas-container');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    if (canvasBox) {
      const widthPercentage = (canvasBox.width / 768) * 100;
      expect(widthPercentage).toBeGreaterThanOrEqual(60);
    }
  });

  test('Teste de Responsividade: Canvas adapta a viewport 1024px', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.reload();

    const canvas = page.getByTestId('drawing-canvas-container');
    await expect(canvas).toBeVisible();

    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();

    if (canvasBox) {
      const widthPercentage = (canvasBox.width / 1024) * 100;
      expect(widthPercentage).toBeGreaterThanOrEqual(60);
    }
  });
});
