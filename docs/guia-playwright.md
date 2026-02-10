# Integração Playwright — Guia Prático

## Setup

### 1. Instalar

```bash
npm install -D @playwright/test
npx playwright install chromium
```

Só Chromium basta. Não precisa de Firefox e WebKit para o MVP — seu filho vai usar um tablet com Chrome.

### 2. Configurar

Criar `playwright.config.ts` na raiz:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:5173',
    // Simula tablet (viewport do iPad)
    viewport: { width: 1024, height: 768 },
    // Touch habilitado (simula dedo)
    hasTouch: true,
    screenshot: 'only-on-failure',
  },
  // Sobe o dev server automaticamente antes dos testes
  webServer: {
    command: 'npm run dev',
    port: 5173,
    reuseExistingServer: true,
  },
});
```

### 3. Estrutura de Testes

```
tests/
├── e2e/                          ← Playwright (interação real no browser)
│   ├── canvas.spec.ts
│   ├── progression.spec.ts
│   ├── feedback.spec.ts
│   ├── persistence.spec.ts
│   └── responsiveness.spec.ts
└── unit/                         ← Vitest (lógica pura, sem browser)
    ├── mastery.test.ts
    ├── generateProblem.test.ts
    └── hesitation.test.ts
```

Regra simples:
- **Vitest** = funções puras (motor de maestria, gerador, hesitação)
- **Playwright** = tudo que precisa de browser (canvas, botões, animações, persistência)

### 4. Scripts no package.json

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:all": "vitest run && playwright test"
  }
}
```

---

## Testes E2E Recomendados

### canvas.spec.ts — O coração

```typescript
import { test, expect } from '@playwright/test';

test.describe('Canvas de Resposta', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navegar até tela de exercício (clicar botão jogar)
    await page.getByRole('button', { name: /jogar|play/i }).click();
    // Aguardar modelo OCR carregar
    await page.waitForSelector('[data-testid="exercise-screen"]');
  });

  test('bloqueia envio com canvas vazio', async ({ page }) => {
    const submitBtn = page.getByTestId('submit-button');
    // Botão deve estar desabilitado sem desenho
    await expect(submitBtn).toBeDisabled();
  });

  test('habilita envio após desenhar', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas');
    const submitBtn = page.getByTestId('submit-button');

    // Simular desenho (arrastar dedo no canvas)
    await canvas.dispatchEvent('pointerdown', { x: 100, y: 100 });
    await canvas.dispatchEvent('pointermove', { x: 150, y: 150 });
    await canvas.dispatchEvent('pointerup', { x: 150, y: 150 });

    await expect(submitBtn).toBeEnabled();
  });

  test('desabilita botão durante processamento OCR', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas');
    const submitBtn = page.getByTestId('submit-button');

    // Desenhar algo
    await canvas.dispatchEvent('pointerdown', { x: 100, y: 100 });
    await canvas.dispatchEvent('pointermove', { x: 150, y: 150 });
    await canvas.dispatchEvent('pointerup', { x: 150, y: 150 });

    // Clicar enviar
    await submitBtn.click();

    // Durante processamento, botão deve estar desabilitado
    await expect(submitBtn).toBeDisabled();
  });

  test('botão limpar reseta canvas', async ({ page }) => {
    const canvas = page.getByTestId('drawing-canvas');
    const clearBtn = page.getByTestId('clear-button');
    const submitBtn = page.getByTestId('submit-button');

    // Desenhar
    await canvas.dispatchEvent('pointerdown', { x: 100, y: 100 });
    await canvas.dispatchEvent('pointermove', { x: 150, y: 150 });
    await canvas.dispatchEvent('pointerup', { x: 150, y: 150 });

    // Limpar
    await clearBtn.click();

    // Botão enviar volta a desabilitado
    await expect(submitBtn).toBeDisabled();
  });

});
```

### feedback.spec.ts — Segurança emocional

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feedback Emocional', () => {

  test('feedback de erro nunca contém palavras negativas', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /jogar|play/i }).click();
    await page.waitForSelector('[data-testid="exercise-screen"]');

    // Palavras proibidas na UI
    const forbidden = ['errado', 'incorreto', 'falhou', 'erro', 'wrong', 'fail', 'incorrect'];

    // Forçar um erro: desenhar resposta errada
    // (depende da implementação — pode precisar de mock do OCR)
    // ...submeter resposta errada...

    // Verificar que o feedback não contém palavras proibidas
    const feedbackText = await page.getByTestId('feedback-overlay').textContent();
    for (const word of forbidden) {
      expect(feedbackText?.toLowerCase()).not.toContain(word);
    }
  });

  test('sem texto técnico visível na UI', async ({ page }) => {
    await page.goto('/');

    const technicalTerms = ['error', 'null', 'undefined', 'timeout',
                            'exception', 'NaN', 'stack trace'];

    const bodyText = await page.locator('body').textContent();
    for (const term of technicalTerms) {
      expect(bodyText?.toLowerCase()).not.toContain(term.toLowerCase());
    }
  });

});
```

### progression.spec.ts — Motor Kumon no browser

```typescript
import { test, expect } from '@playwright/test';

test.describe('Progressão', () => {

  test('exibe exercícios do nível correto após avanço', async ({ page }) => {
    // Este teste é complexo porque precisa simular múltiplos acertos
    // Alternativa: expor estado do Zustand via window para debug

    await page.goto('/');

    // Injetar acesso ao estado (só em dev/test)
    const level = await page.evaluate(() => {
      // @ts-ignore — exposto pelo store em modo dev
      return window.__gameStore?.getState().currentLevel;
    });

    expect(level).toBeDefined();
  });

});
```

### persistence.spec.ts — Dados sobrevivem

```typescript
import { test, expect } from '@playwright/test';

test.describe('Persistência', () => {

  test('progresso sobrevive a recarregar página', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /jogar|play/i }).click();
    await page.waitForSelector('[data-testid="exercise-screen"]');

    // Completar pelo menos 1 exercício (simular acerto)
    // ... interagir com canvas, submeter ...

    // Capturar estado atual
    const scoreBefore = await page.getByTestId('score-display').textContent();

    // Recarregar
    await page.reload();
    await page.goto('/');

    // Verificar que estado foi preservado
    const scoreAfter = await page.getByTestId('score-display').textContent();
    expect(scoreAfter).toBe(scoreBefore);
  });

});
```

### responsiveness.spec.ts — Funciona em todo tamanho

```typescript
import { test, expect } from '@playwright/test';

test.describe('Responsividade', () => {

  test('layout funciona em tablet landscape', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.getByRole('button', { name: /jogar|play/i }).click();

    const canvas = page.getByTestId('drawing-canvas');
    await expect(canvas).toBeVisible();

    const submitBtn = page.getByTestId('submit-button');
    await expect(submitBtn).toBeVisible();

    // Verificar que não há overlap
    const canvasBox = await canvas.boundingBox();
    const submitBox = await submitBtn.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(submitBox).not.toBeNull();

    // Canvas e botão não se sobrepõem
    const overlaps = !(
      canvasBox!.x + canvasBox!.width < submitBox!.x ||
      submitBox!.x + submitBox!.width < canvasBox!.x ||
      canvasBox!.y + canvasBox!.height < submitBox!.y ||
      submitBox!.y + submitBox!.height < canvasBox!.y
    );
    // Podem estar lado a lado ou em cima/baixo, mas não sobrepostos
    // (relaxar se layout prevê sobreposição intencional)
  });

  test('layout funciona em celular portrait', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.getByRole('button', { name: /jogar|play/i }).click();

    const canvas = page.getByTestId('drawing-canvas');
    await expect(canvas).toBeVisible();

    // Canvas deve ocupar pelo menos 60% da viewport
    const box = await canvas.boundingBox();
    expect(box!.width).toBeGreaterThan(375 * 0.6);
  });

  test('touch targets têm tamanho mínimo 48px', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /jogar|play/i }).click();
    await page.waitForSelector('[data-testid="exercise-screen"]');

    // Verificar todos os botões
    const buttons = page.locator('button');
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        expect(box.width, `Botão ${i} largura < 48px`).toBeGreaterThanOrEqual(48);
        expect(box.height, `Botão ${i} altura < 48px`).toBeGreaterThanOrEqual(48);
      }
    }
  });

});
```

---

## Integração com o Fluxo Multi-Agent

### data-testid: o contrato entre Dev e QA

Para os testes funcionarem, Dev e QA precisam concordar nos seletores.
Adicione esta regra no prompt do Dev (scripts/prompt-dev.md):

```markdown
## Regra de Testabilidade
Todo componente interativo DEVE ter um atributo `data-testid`.
Convenção:
- drawing-canvas
- submit-button
- clear-button
- feedback-overlay
- exercise-screen
- score-display
- home-screen
- play-button
```

### Quando rodar os testes

No orchestrate.sh, o agente QA pode rodar os testes como parte da validação.
Mas não rode E2E em toda task — é lento. Use esta regra:

- **Tasks de lógica pura** (motor, gerador): QA roda `npm run test` (Vitest)
- **Tasks de UI/integração**: QA roda `npm run test:e2e` (Playwright)
- **QA Final (Sprint 5)**: QA roda `npm run test:all`

Para isso, ajuste o prompt-qa.md para incluir:

```markdown
## Testes Automatizados
- Se a task envolve lógica sem UI: rode `npm run test`
- Se a task envolve componentes/telas: rode `npm run test:e2e`
- Se é QA final: rode `npm run test:all`
- Inclua output dos testes no relatório
```

### Mock do OCR para testes

O OCR real (TensorFlow.js + MNIST) é lento e imprevisível em testes.
Crie um mock para os testes E2E:

```typescript
// tests/e2e/helpers/mock-ocr.ts
// Injeta via page.addInitScript() antes de cada teste

export const mockOCR = (desiredResult: number, confidence: number = 0.95) => `
  window.__mockOCR = {
    predictNumber: async () => ({
      value: ${desiredResult},
      confidence: ${confidence}
    })
  };
`;
```

Uso no teste:

```typescript
test('acerto mostra confete', async ({ page }) => {
  // Mock OCR para sempre retornar a resposta correta
  await page.addInitScript(mockOCR(5, 0.95));
  await page.goto('/');
  // ...completar exercício...
  await expect(page.getByTestId('feedback-overlay')).toContainText(/muito bem|parabéns/i);
});
```

Para isso funcionar, o código do app precisa checar `window.__mockOCR`
antes de chamar o OCR real:

```typescript
// lib/ocr/predict.ts
export async function predictNumber(canvas, model) {
  // Em testes, usar mock
  if (import.meta.env.DEV && (window as any).__mockOCR) {
    return (window as any).__mockOCR.predictNumber();
  }
  // Produção: pipeline real
  // ...
}
```

---

## Resumo: O que muda no projeto

### Novos arquivos

```
kumon-app/
├── playwright.config.ts           ← NOVO
├── tests/
│   ├── e2e/                       ← NOVO
│   │   ├── canvas.spec.ts
│   │   ├── feedback.spec.ts
│   │   ├── progression.spec.ts
│   │   ├── persistence.spec.ts
│   │   └── responsiveness.spec.ts
│   └── unit/                      ← NOVO (Vitest já estava previsto)
│       ├── mastery.test.ts
│       └── generateProblem.test.ts
└── package.json                   ← scripts adicionados
```

### Ajustes em arquivos existentes

- `scripts/prompt-dev.md` → adicionar regra de `data-testid`
- `scripts/prompt-qa.md` → adicionar regra de quando rodar cada tipo de teste
- `lib/ocr/predict.ts` → suporte a mock para testes

### Quando criar os testes

Não escreva todos de uma vez. Cada sprint adiciona seus testes:

| Sprint | Testes |
|--------|--------|
| Sprint 1 | canvas.spec.ts (básico) |
| Sprint 2 | unit/mastery.test.ts, unit/generateProblem.test.ts |
| Sprint 3 | feedback.spec.ts, progression.spec.ts |
| Sprint 4 | persistence.spec.ts |
| Sprint 5 | responsiveness.spec.ts + rodar tudo |
