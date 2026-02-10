# Testes Automatizados Sugeridos

Use as seguintes ferramentas:

- **Vitest** — testes unitários para lógica de progressão, limiares de confiança OCR, e algoritmo de maestria
- **Playwright** — testes E2E para fluxos completos (desenhar → enviar → feedback → próximo exercício)
- **Testing Library** — testes de componente para verificar acessibilidade e estados de UI

## Testes Prioritários

```
describe('Canvas de Resposta')
  ✓ não envia ao OCR se canvas está vazio
  ✓ desabilita botão enviar durante processamento
  ✓ exibe confirmação quando confiança OCR está entre 50-79%
  ✓ pede reescrita quando confiança OCR < 50%
  ✓ botão limpar reseta canvas instantaneamente

describe('Motor de Progressão')
  ✓ avança nível após 5 acertos rápidos consecutivos
  ✓ mantém nível após acertos lentos
  ✓ regride após 3 erros consecutivos
  ✓ nunca mistura operações de níveis diferentes
  ✓ repetição disfarçada usa números diferentes

describe('Feedback Emocional')
  ✓ feedback de erro nunca contém palavras negativas
  ✓ celebração após erro+acerto é maior que celebração normal
  ✓ feedback visual funciona sem som
  ✓ 5 erros consecutivos aciona regressão + apoio visual

describe('Resiliência')
  ✓ toques rápidos repetidos não causam ações duplicadas
  ✓ estado persiste após fechar e reabrir
  ✓ rotação de tela preserva desenho no canvas
```

## Exemplos de Bug Report

```
## 🐛 Bug: App aceita canvas vazio como resposta

**Severidade**: Crítica
**Categoria**: Canvas

**Cenário**: Criança apertou "Enviar" sem desenhar nada
**Esperado**: Feedback gentil pedindo para escrever a resposta
**Atual**: OCR processou imagem vazia e retornou "0" como resposta

**Impacto na Criança**: Se a resposta correta for 0, a criança "acerta" sem fazer nada.
Se não for 0, recebe um erro confuso sem ter tentado.
**Sugestão de Fix**: Verificar se canvas tem pixels desenhados antes de enviar ao OCR.
Condição: soma dos pixels não-brancos > limiar mínimo.
```

```
## 🐛 Bug: Botão enviar aceita cliques durante processamento OCR

**Severidade**: Crítica
**Categoria**: Canvas

**Cenário**: Criança apertou "Enviar" 4 vezes rapidamente
**Esperado**: Apenas o primeiro toque é processado
**Atual**: 4 requisições de OCR disparadas, UI fica inconsistente,
feedback aparece 4 vezes seguidas

**Impacto na Criança**: Experiência confusa, múltiplos feedbacks
sobrepostos, possível travamento visual.
**Sugestão de Fix**: Desabilitar botão + mostrar loading state
imediatamente no primeiro toque. Usar debounce/flag de processing.
```
