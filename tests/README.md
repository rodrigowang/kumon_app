# Testes - Kumon Math App

## 📁 Estrutura

```
tests/
├── unit/                           # Testes unitários (Vitest)
│   ├── progression-engine.spec.ts  # Motor de progressão completo
│   ├── generateProblem.spec.ts     # Gerador de problemas
│   ├── hesitation.spec.ts          # Detector de hesitação
│   ├── ocr-*.spec.ts              # OCR (crop, predict)
│   └── __run-tests-manual.ts      # Runner alternativo (sem Vitest)
│
└── e2e/                            # Testes E2E (Playwright)
    └── (aguardando implementação)
```

## 🧪 Executar Testes

### Opção 1: Vitest (Recomendado)

```bash
# Todos os testes unitários
npm run test

# Arquivo específico
npm run test tests/unit/progression-engine.spec.ts

# Watch mode (re-roda ao salvar)
npm run test -- --watch

# Com coverage
npm run test -- --coverage
```

### Opção 2: Test Runner Manual (Sem Vitest)

Útil quando há problemas de permissão no npm ou para rodar em CI/CD minimal:

```bash
npx tsx tests/unit/__run-tests-manual.ts
```

### Opção 3: Testes E2E

```bash
# Testes E2E com Playwright
npm run test:e2e

# Todos (unitários + E2E)
npm run test:all
```

## ✅ Status Atual

| Suite | Arquivo | Testes | Status |
|-------|---------|--------|--------|
| Motor de Progressão | `progression-engine.spec.ts` | 17 | ✅ 100% |
| Gerador de Problemas | `generateProblem.spec.ts` | 30+ | ✅ 100% |
| Detector de Hesitação | `hesitation.spec.ts` | 40+ | ⏳ Aguarda Vitest |
| OCR Crop | `ocr-crop.spec.ts` | 10+ | ⏳ Aguarda Vitest |
| OCR Predict | `ocr-predict.spec.ts` | 8+ | ⏳ Aguarda Vitest |

**Total**: ~105 testes criados, 17 rodando (aguardando instalação do Vitest)

## 📊 Cobertura

### Motor de Progressão ✅

- [x] Gerador nunca repete consecutivo
- [x] Resultados dentro do range (todos os níveis)
- [x] Subtração nunca negativa
- [x] Cálculos sempre corretos
- [x] 5 acertos rápidos → avança
- [x] 3 erros → regride
- [x] 10 erros → baseline
- [x] Transição CPA completa
- [x] Bloqueio de operação (adição → subtração)

## 🎯 Próximos Testes

- [ ] Testes de performance (1000 problemas em <100ms)
- [ ] Edge cases (buffer vazio, nível inválido)
- [ ] Configuração customizada de thresholds
- [ ] Testes E2E (fluxo completo de exercício)
- [ ] Testes de integração (OCR + Maestria + UI)

## 🔧 Configuração

### vitest.config.ts

```typescript
{
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}
```

### Convenções

- Arquivos de teste: `*.spec.ts` ou `*.test.ts`
- Usar `describe()` para agrupar testes relacionados
- Usar `it()` ou `test()` para casos individuais
- Nomes descritivos: "deve fazer X quando Y"
- Arrange-Act-Assert (AAA pattern)

## 📚 Referências

- [Vitest](https://vitest.dev/)
- [Playwright](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
