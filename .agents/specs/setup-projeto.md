# SPEC: Setup do Projeto (v0.1)

## Requisitos Pedagógicos para Infraestrutura

Esta é uma task de setup técnico, mas **desde a fundação** o projeto deve estar configurado para atender crianças de 7 anos.

### 1. Configurações de Acessibilidade e UX

**Touch Targets**
- Todo elemento interativo ≥ 48px (tamanho mínimo para coordenação motora infantil)
- Espaçamento entre elementos ≥ 16px (evita toques acidentais)

**Tipografia**
- Fonte base ≥ 24px (legibilidade sem esforço)
- Line-height ≥ 1.5 (reduz fadiga visual)
- Família sans-serif arredondada (Nunito, Poppins, ou similar)

**Cores e Contraste**
- Contraste mínimo 4.5:1 (WCAG AA)
- Evitar vermelho/verde exclusivos para feedback (daltonismo infantil)

### 2. Estrutura de Pastas — Pedagogia Refletida no Código

```
src/
├── components/
│   ├── ui/              ← Botões, inputs touch-friendly
│   ├── exercises/       ← Canvas, verificação, feedback
│   └── progression/     ← Maestria, CPA, níveis
├── lib/
│   ├── ocr/             ← Reconhecimento de dígitos
│   ├── maestria/        ← Algoritmo de avanço/regressão
│   └── analytics/       ← Hesitação, fluência, precisão
├── assets/
│   ├── sounds/          ← Feedback sonoro (vitória, incentivo)
│   └── images/          ← Ícones grandes, objetos CPA fase C
```

**Justificativa**: organização espelha os 5 princípios. Não é "só estrutura" — é pedagogia expressa em arquitetura.

### 3. TypeScript Strict — Segurança Para o Público-Alvo

- `strict: true` no `tsconfig.json`
- Zero `any`: tipo de dado incerto = bug potencial para criança
- Edge cases sempre tipados (canvas vazio, OCR falho, inatividade)

**Justificativa**: criança não pode debugar. App deve ser robusto contra uso imprevisível.

### 4. Convenção de `data-testid` — QA Infantil

Todo elemento interativo DEVE ter `data-testid` descritivo:

```
drawing-canvas
submit-button
clear-button
feedback-overlay
exercise-screen
score-display
home-screen
play-button
```

**Justificativa**: QA testa cenários infantis (rabiscos, toques repetidos, canvas vazio). Sem testid, QA não consegue validar.

### 5. Configuração de Linting — Princípios como Regras

ESLint + Prettier devem forçar:
- Acessibilidade (eslint-plugin-jsx-a11y)
- Boas práticas React (eslint-plugin-react-hooks)
- TypeScript strict (sem regras relaxadas)

**Justificativa**: código acessível é pedagógico. Linter evita anti-patterns antes de virar bug.

## Critérios de Aceitação

### ✅ Aceito se:

1. `tsconfig.json` tem `strict: true` e `noImplicitAny: true`
2. ESLint configurado com `jsx-a11y` + `react-hooks`
3. Estrutura de pastas reflete organização pedagógica (não "genérica React")
4. Existe arquivo `.prettierrc` com regras consistentes
5. README ou docs mencionam público-alvo (7 anos) e princípios de UX

### 🚫 Vetado se:

1. `any` permitido no TypeScript
2. Estrutura de pastas genérica (sem separação maestria/ocr/analytics)
3. Sem convenção de `data-testid` documentada
4. Sem configuração de acessibilidade no linter

### ⚠️ Atenção:

- **Fonte padrão**: se Vite scaffolding usar fonte pequena, já ajuste no CSS global
- **Sem over-engineering**: não instale libs de UI pesadas (MUI/Ant). Componentes custom, touch-friendly.

## O Que NÃO Fazer

❌ **Setup "padrão React"** sem adaptar para público infantil
❌ **Ignorar acessibilidade** porque "é só o começo"
❌ **Estrutura de pastas genérica** (ex: `components/Button.tsx` sem propósito pedagógico claro)
❌ **Linter permissivo** ("depois a gente arruma")

## Próximos Passos (Após Setup)

Depois que Dev entregar o setup, QA deve verificar:
- Build roda sem erros
- Linter não permite `any`
- Estrutura de pastas bate com a spec

EdTech não precisa revisar código de setup, apenas validar que a **fundação permite construir app pedagógico**.

---

**Resumo Executivo**: Setup não é "só técnico". É a fundação que permite construir um app robusto, acessível e pedagogicamente coerente para crianças de 7 anos. Cada configuração aqui evita bugs futuros e garante que o código force boas práticas.
