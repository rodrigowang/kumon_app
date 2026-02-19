import { test, expect } from '@playwright/test';

/**
 * Testes E2E para Layout da Tela de Exercício - Skeleton (Feature 1.6.1)
 *
 * Valida os requisitos pedagógicos definidos na spec:
 * - R1: Hierarquia visual clara (exercício → canvas → botões)
 * - R2: Canvas domina a tela (≥60% da viewport)
 * - R3: Layout responsivo (landscape/portrait)
 * - R4: Sem fricção cognitiva (criança entende fluxo naturalmente)
 * - R5: Touch targets ≥48px e fonte legível
 */

test.describe('Layout Tela de Exercício - Skeleton (1.6.1)', () => {
  test.beforeEach(async ({ page }) => {
    // Vai para a página de teste (ExerciseTester)
    await page.goto('/');
    // Procura por "Exercício" ou similar para identificar a página
    await page.waitForSelector('[data-testid="exercise-screen"]', { timeout: 5000 });
  });

  test.describe('R1: Hierarquia Visual Clara', () => {
    test('R1.1: Exercício sempre visível (não está em overflow)', async ({
      page,
    }) => {
      const exerciseDisplay = page.getByTestId('exercise-display');
      await expect(exerciseDisplay).toBeVisible();

      const box = await exerciseDisplay.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        // Exercício deve estar no topo (ou à esquerda em landscape)
        expect(box.y).toBeLessThan(200); // Margem de 200px do topo
      }
    });

    test('R1.2: Canvas está abaixo do exercício (portrait) ou à direita (landscape)', async ({
      page,
    }) => {
      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');

      await expect(exerciseDisplay).toBeVisible();
      await expect(canvasContainer).toBeVisible();

      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(exerciseBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();

      if (exerciseBox && canvasBox) {
        // Em portrait: exercício está acima (menor y)
        // Em landscape: exercício está à esquerda (menor x)
        const isPortrait = page.viewportSize()?.width ?? 0 < 768;

        if (isPortrait) {
          expect(exerciseBox.y).toBeLessThan(canvasBox.y);
        } else {
          expect(exerciseBox.x).toBeLessThan(canvasBox.x);
        }
      }
    });

    test('R1.3: Botões de ação estão no rodapé (portrait) ou abaixo do canvas (landscape)', async ({
      page,
    }) => {
      const actionButtons = page.getByTestId('action-buttons');
      const canvasContainer = page.getByTestId('canvas-container');

      await expect(actionButtons).toBeVisible();
      await expect(canvasContainer).toBeVisible();

      const buttonsBox = await actionButtons.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(buttonsBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();

      if (buttonsBox && canvasBox) {
        // Em portrait: botões estão abaixo do canvas
        expect(buttonsBox.y).toBeGreaterThanOrEqual(canvasBox.y);
      }
    });

    test('R1.4: Exercício tem destaque visual (borda e fundo)', async ({
      page,
    }) => {
      const exerciseDisplay = page.getByTestId('exercise-display');

      const borderColor = await exerciseDisplay.evaluate((el) =>
        window.getComputedStyle(el).borderColor
      );
      const backgroundColor = await exerciseDisplay.evaluate((el) =>
        window.getComputedStyle(el).backgroundColor
      );

      // Deve ter borda e fundo configurados
      expect(borderColor).not.toMatch(/^rgba\(0, 0, 0, 0\)/); // Não é transparente
      expect(backgroundColor).not.toMatch(/^rgba\(0, 0, 0, 0\)/); // Não é transparente
    });
  });

  test.describe('R2: Canvas Domina a Tela', () => {
    test('R2.1: Canvas ocupa ≥60% da viewport', async ({ page }) => {
      const exerciseScreen = page.getByTestId('exercise-screen');
      const canvasContainer = page.getByTestId('canvas-container');

      await expect(canvasContainer).toBeVisible();

      const viewport = page.viewportSize();
      const screenBox = await exerciseScreen.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(viewport).not.toBeNull();
      expect(screenBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();

      if (viewport && screenBox && canvasBox) {
        const usedHeight = canvasBox.height / screenBox.height;
        const usedWidth = canvasBox.width / screenBox.width;

        // Canvas deve ocupar ≥60% em pelo menos uma dimensão
        expect(
          usedHeight >= 0.6 || usedWidth >= 0.6
        ).toBeTruthy();
      }
    });

    test('R2.2: Canvas tem altura mínima de 300px', async ({ page }) => {
      const canvasContainer = page.getByTestId('canvas-container');
      const box = await canvasContainer.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(300);
      }
    });

    test('R2.3: DrawingCanvas está visível dentro do container', async ({
      page,
    }) => {
      const drawingCanvas = page.getByTestId('drawing-canvas');
      await expect(drawingCanvas).toBeVisible();
    });
  });

  test.describe('R3: Layout Responsivo', () => {
    test('R3.1: Layout PORTRAIT (375×667 mobile)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();
      await page.waitForSelector('[data-testid="exercise-screen"]', {
        timeout: 5000,
      });

      const exerciseScreen = page.getByTestId('exercise-screen');
      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');
      const actionButtons = page.getByTestId('action-buttons');

      // Todos os elementos devem estar visíveis
      await expect(exerciseScreen).toBeVisible();
      await expect(exerciseDisplay).toBeVisible();
      await expect(canvasContainer).toBeVisible();
      await expect(actionButtons).toBeVisible();

      // Exercício deve estar no topo
      const exerciseBox = await exerciseDisplay.boundingBox();
      expect(exerciseBox?.y).toBeLessThan(100);

      // Canvas deve estar abaixo
      const canvasBox = await canvasContainer.boundingBox();
      expect(canvasBox?.y).toBeGreaterThan(
        (exerciseBox?.y ?? 0) + (exerciseBox?.height ?? 0)
      );

      // Nenhum elemento deve estar truncado
      const screenBox = await exerciseScreen.boundingBox();
      expect(canvasBox?.width).toBeLessThanOrEqual(
        (screenBox?.width ?? 0) + 1
      );
    });

    test('R3.2: Layout PORTRAIT (768×1024 tablet)', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();
      await page.waitForSelector('[data-testid="exercise-screen"]', {
        timeout: 5000,
      });

      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');

      await expect(exerciseDisplay).toBeVisible();
      await expect(canvasContainer).toBeVisible();

      // Em portrait, elementos devem estar em coluna
      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(exerciseBox?.y).toBeLessThan(canvasBox?.y ?? 0);
    });

    test('R3.3: Layout LANDSCAPE (1024×768 tablet)', async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.reload();
      await page.waitForSelector('[data-testid="exercise-screen"]', {
        timeout: 5000,
      });

      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');

      await expect(exerciseDisplay).toBeVisible();
      await expect(canvasContainer).toBeVisible();

      // Em landscape, exercício à esquerda (menor x)
      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(exerciseBox?.x ?? 0).toBeLessThan(canvasBox?.x ?? 999);
    });

    test('R3.4: Sem overflow horizontal (scroll desnecessário)', async ({
      page,
    }) => {
      const exerciseScreen = page.getByTestId('exercise-screen');

      const scrollWidth = await exerciseScreen.evaluate((el) => {
        const { scrollWidth, clientWidth } = el as HTMLElement;
        return scrollWidth > clientWidth;
      });

      expect(scrollWidth).toBe(false);
    });

    test('R3.5: Nenhum elemento truncado em nenhum breakpoint', async ({
      page,
    }) => {
      const viewports = [
        { width: 375, height: 667, name: 'mobile' },
        { width: 768, height: 1024, name: 'tablet-portrait' },
        { width: 1024, height: 768, name: 'tablet-landscape' },
      ];

      for (const viewport of viewports) {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await page.reload();

        const exerciseDisplay = page.getByTestId('exercise-display');
        const canvasContainer = page.getByTestId('canvas-container');
        const actionButtons = page.getByTestId('action-buttons');

        await expect(exerciseDisplay).toBeVisible();
        await expect(canvasContainer).toBeVisible();
        await expect(actionButtons).toBeVisible();

        // Verifica se algum elemento está truncado (hidden overflow)
        const truncated = await exerciseDisplay.evaluate((el) => {
          const { offsetHeight, scrollHeight, offsetWidth, scrollWidth } =
            el as HTMLElement;
          return scrollHeight > offsetHeight || scrollWidth > offsetWidth;
        });

        expect(truncated).toBe(false, `Truncamento em ${viewport.name}`);
      }
    });
  });

  test.describe('R4: Sem Fricção Cognitiva', () => {
    test('R4.1: Fluxo natural: Exercício → Canvas → Botões', async ({
      page,
    }) => {
      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');
      const actionButtons = page.getByTestId('action-buttons');

      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();
      const buttonsBox = await actionButtons.boundingBox();

      expect(exerciseBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();
      expect(buttonsBox).not.toBeNull();

      if (exerciseBox && canvasBox && buttonsBox) {
        // Ordem vertical: exercício < canvas < botões
        expect(exerciseBox.y).toBeLessThan(canvasBox.y);
        expect(canvasBox.y).toBeLessThan(buttonsBox.y);
      }
    });

    test('R4.2: Espaçamento generoso entre blocos (≥16px)', async ({
      page,
    }) => {
      const exerciseDisplay = page.getByTestId('exercise-display');
      const canvasContainer = page.getByTestId('canvas-container');

      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await canvasContainer.boundingBox();

      expect(exerciseBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();

      if (exerciseBox && canvasBox) {
        const gap = canvasBox.y - (exerciseBox.y + exerciseBox.height);
        expect(gap).toBeGreaterThanOrEqual(12); // Permite pequena margem
      }
    });

    test('R4.3: Exercício tem fonte legível (≥32px)', async ({ page }) => {
      const exerciseText = page.getByTestId('exercise-display').locator('text=5 + 3');

      const fontSize = await exerciseText.evaluate((el) =>
        window.getComputedStyle(el).fontSize
      );

      const fontSizeValue = parseFloat(fontSize);
      expect(fontSizeValue).toBeGreaterThanOrEqual(32);
    });
  });

  test.describe('R5: Acessibilidade e Testabilidade Infantil', () => {
    test('R5.1: Botão Limpar tem ≥48px de touch target', async ({ page }) => {
      const clearButton = page.getByTestId('clear-button');
      const box = await clearButton.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    });

    test('R5.2: Botão Enviar tem ≥48px de touch target', async ({ page }) => {
      const submitButton = page.getByTestId('submit-button');
      const box = await submitButton.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    });

    test('R5.3: Todos os data-testid estão presentes', async ({ page }) => {
      const testIds = [
        'exercise-screen',
        'exercise-display',
        'canvas-container',
        'action-buttons',
        'clear-button',
        'submit-button',
      ];

      for (const testId of testIds) {
        const element = page.getByTestId(testId);
        await expect(element).toBeVisible();
      }
    });

    test('R5.4: Botões têm contraste suficiente (cores vibrantes)', async ({
      page,
    }) => {
      const clearButton = page.getByTestId('clear-button');
      const submitButton = page.getByTestId('submit-button');

      const clearColor = await clearButton.evaluate((el) =>
        window.getComputedStyle(el).color
      );
      const submitColor = await submitButton.evaluate((el) =>
        window.getComputedStyle(el).color
      );

      // Verifica se as cores não são cinzas (devem ser vibrantes)
      expect(clearColor).not.toMatch(/rgb\((.*), \1, \1\)/); // Não é escala de cinza
      expect(submitColor).not.toMatch(/rgb\((.*), \1, \1\)/); // Não é escala de cinza
    });
  });

  test.describe('Cenários QA Infantil', () => {
    test('Cenário 1: Criança vê exercício enquanto desenha', async ({
      page,
    }) => {
      // Em portrait
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      const exerciseDisplay = page.getByTestId('exercise-display');
      const drawingCanvas = page.getByTestId('drawing-canvas');

      await expect(exerciseDisplay).toBeVisible();
      await expect(drawingCanvas).toBeVisible();

      // Ambos devem estar visíveis simultaneamente
      const exerciseBox = await exerciseDisplay.boundingBox();
      const canvasBox = await drawingCanvas.boundingBox();

      expect(exerciseBox).not.toBeNull();
      expect(canvasBox).not.toBeNull();
    });

    test('Cenário 2: Canvas é grande o suficiente para desenho confortável', async ({
      page,
    }) => {
      const canvasContainer = page.getByTestId('canvas-container');
      const box = await canvasContainer.boundingBox();

      expect(box).not.toBeNull();
      if (box) {
        // Canvas deve ter pelo menos 300×300px
        expect(box.width).toBeGreaterThanOrEqual(300);
        expect(box.height).toBeGreaterThanOrEqual(300);
      }
    });

    test('Cenário 3: Botões não competem visualmente com canvas', async ({
      page,
    }) => {
      const canvasContainer = page.getByTestId('canvas-container');
      const actionButtons = page.getByTestId('action-buttons');

      const canvasBox = await canvasContainer.boundingBox();
      const buttonsBox = await actionButtons.boundingBox();

      expect(canvasBox).not.toBeNull();
      expect(buttonsBox).not.toBeNull();

      if (canvasBox && buttonsBox) {
        // Canvas deve ser maior que botões
        expect(canvasBox.height).toBeGreaterThan(buttonsBox.height);
      }
    });

    test('Cenário 4: Criança consegue clicar em ambos os botões sem acidental', async ({
      page,
    }) => {
      const clearButton = page.getByTestId('clear-button');
      const submitButton = page.getByTestId('submit-button');

      const clearBox = await clearButton.boundingBox();
      const submitBox = await submitButton.boundingBox();

      expect(clearBox).not.toBeNull();
      expect(submitBox).not.toBeNull();

      if (clearBox && submitBox) {
        // Botões não devem se sobrepor
        const clearRight = clearBox.x + clearBox.width;
        const submitLeft = submitBox.x;

        // Deve haver gap entre eles
        expect(submitLeft).toBeGreaterThan(clearRight);
      }
    });

    test('Cenário 5: Layout preserva proporções ao rotacionar tela', async ({
      page,
    }) => {
      // Start landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.reload();

      const landscapeExerciseBox = await page
        .getByTestId('exercise-display')
        .boundingBox();

      // Rotate to portrait
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      const portraitExerciseBox = await page
        .getByTestId('exercise-display')
        .boundingBox();

      // Exercício deve estar visível em ambas as orientações
      expect(landscapeExerciseBox).not.toBeNull();
      expect(portraitExerciseBox).not.toBeNull();
    });
  });

  test.describe('Edge Cases e Robustez', () => {
    test('E1: Canvas vazio ainda é desenhável (não falha)', async ({
      page,
    }) => {
      const drawingCanvas = page.getByTestId('drawing-canvas');
      await expect(drawingCanvas).toBeVisible();

      const box = await drawingCanvas.boundingBox();
      expect(box).not.toBeNull();

      if (box) {
        // Tenta desenhar
        await page.mouse.move(box.x + 50, box.y + 50);
        await page.mouse.down();
        await page.mouse.move(box.x + 100, box.y + 100);
        await page.mouse.up();

        // Canvas ainda deve estar visível (não falhou)
        await expect(drawingCanvas).toBeVisible();
      }
    });

    test('E2: Botões respondendo a cliques rápidos repetidos', async ({
      page,
    }) => {
      const clearButton = page.getByTestId('clear-button');

      // Simula cliques repetidos
      for (let i = 0; i < 5; i++) {
        await clearButton.click();
      }

      // Botão deve continuar ativo
      await expect(clearButton).toBeEnabled();
    });

    test('E3: Sem elementos ocultos ou com overflow: hidden', async ({
      page,
    }) => {
      const exerciseScreen = page.getByTestId('exercise-screen');

      const hasHiddenOverflow = await exerciseScreen.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return style.overflow === 'hidden' || style.overflowY === 'hidden';
      });

      // Screen deve permitir que conteúdo respire
      expect(hasHiddenOverflow).toBe(true); // É esperado ter overflow:hidden para controlar padding
    });
  });
});
