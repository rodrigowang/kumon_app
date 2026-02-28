# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: Loop completo de estudo diário: criança faz contas → ganha moedas → cuida do bichinho virtual → quer voltar amanhã.

**Estado atual (2026-02-28)**: ✅ **Sprints 1–5 COMPLETAS**. App funcional com PetHub, sessões de 10 exercícios, OCR com TTA + CCL + preprocessing melhorado + quantização float16, subtração, PWA offline, fallback teclado e loop completo do pet virtual. **0 erros TypeScript, build limpo**. Próximo: Sprint 6 (OCR inteligente — context-aware + confusion pairs + rejeição rabisco).

---

## Sprint 1 — Loop Principal Funcional ✅ COMPLETA

> Criança abre o app → faz contas → acerta → dificuldade sobe → erra → desce. Sessão de 10 exercícios com resumo.

---

## Sprint 2 — Bichinho Virtual (MVP) ← PRÓXIMA

> Criança faz contas → ganha moedas → compra comida/água → cuida do bichinho → volta amanhã para não deixá-lo doente.

**Filosofia de implementação:**
- Tudo **aditivo** — zero refatoração do core existente
- `ExerciseResult.timeMs` e `sessionStats.fastCount` já existem: multiplicador x2 de velocidade é trivial
- Pet state fica em `usePetStore` separado (Zustand), **não** mistura com `useGameStore`
- **Sem PixiJS** no MVP — CSS keyframes + GIFs/PNGs do itch.io são suficientes
- Status do pet nunca é salvo diretamente; sempre derivado de `Date.now() - lastFedAt`

---

### 2.1 — Base de Dados do Pet (fundação pura, zero UI)

**Criar:**
- `src/stores/usePetStore.ts` — Zustand com persist
- `src/lib/petActions.ts` — funções de mutação
- `src/lib/coinCalculator.ts` — cálculo de moedas
- `src/lib/streakUtils.ts` — lógica de streak diário

**Estado salvo no localStorage** (chave `kumon-pet-storage`):
```json
{
  "coins": 0,
  "lastFedAt": 1700000000000,
  "inventory": { "water": 0, "food": 0, "medicine": 0 },
  "streak": { "current": 0, "lastLessonDate": "" },
  "hasTrophy7Days": false
}
```

**Status derivado em runtime** (nunca persiste):
| `Date.now() - lastFedAt` | Status   | Visual       |
|--------------------------|----------|--------------|
| 0 a 24h                  | `happy`  | Animação idle |
| 24h a 48h                | `hungry` | Estático/triste |
| Mais de 48h              | `sick`   | Deitado/triste |

**`petActions.ts`:**
- `feedPet(type)` — recusa se status `happy`; consume 1 unidade do inventário; atualiza `lastFedAt`
- `buyItem(type)` — valida moedas; debita; incrementa inventário

Tabela de preços:
| Item     | Preço | Efeito                         |
|----------|-------|--------------------------------|
| Água     | 4c    | Restaura para `happy` (somente se `hungry`) |
| Comida   | 6c    | Restaura para `happy` (somente se `hungry`) |
| Remédio  | 20c   | Restaura para `happy` (qualquer estado)     |

**`coinCalculator.ts`:** baseado em `MasteryLevel.maxResult`:
| Dificuldade  | `maxResult`  | Moedas/acerto |
|--------------|--------------|---------------|
| Fácil        | ≤ 10         | 1c            |
| Média        | 11 a 20      | 3c            |
| Difícil      | > 20         | 5c            |

Multiplicador x2: se `sessionStats.fastCount >= 7` na sessão → total × 2 (já temos esse dado no `useGameStore`).

**`completedLesson(coinsEarned, sessionStats)`** dentro de `petActions.ts`:
1. Credita moedas
2. Atualiza streak (via `streakUtils.ts`)
3. Emergency rescue: se `status === 'sick'` E `coins < 20` → injeta 1 remédio + aplica `feedPet('medicine')`
4. Desbloqueia troféu se `streak.current >= 7`

**`streakUtils.ts`:**
```ts
// Não altera se já completou uma lição hoje
if (lastLessonDate === today) return
streak.current = (lastLessonDate === yesterday) ? streak.current + 1 : 1
streak.lastLessonDate = today
```

> **Critério de done:** funções testáveis no console do browser antes de qualquer UI.

---

### 2.2 — Economia Integrada no Fluxo de Exercícios

**Modificar:**
- `src/stores/useGameStore.ts` — `endSession()` retorna também `coinsEarned` e `speedBonus: boolean`
- `src/components/screens/SessionSummaryScreen.tsx` — exibir moedas ganhas + "x2 Rápido!" se bônus
- `src/App.tsx` — após `endSession()`, chamar `completedLesson()` do pet store

**Detalhes:**
- `endSession()` calcula moedas: soma moedas base por acerto (via `currentLevel`) + aplica x2 se `fastCount >= 7`
- `SessionSummary` ganha campos opcionais: `coinsEarned: number`, `speedBonus: boolean`
- `SessionSummaryScreen` mostra seção nova: "🪙 +12 moedas" (ou "🪙 +24 moedas ⚡ Rápido!")
- Botão "Voltar para o Quarto" (em vez de "Voltar")

**Nenhuma mudança em `AbstractExerciseScreen`** — dados de `timeMs` e `speed` já chegam via `ExerciseResult`.

> **Critério de done:** completar uma sessão e ver moedas acreditadas no localStorage.

---

### 2.3 — Pet Visual (Sprites Simples, Sem PixiJS)

**Criar:**
- `src/components/ui/PetDisplay.tsx` — componente React puro com `<img>` + CSS

**Assets:** buscar sprites gratuitos em:
- [itch.io](https://itch.io/game-assets/free/tag-tamagotchi) — buscar "tamagotchi sprite free" ou "virtual pet sprite CC0"
- [OpenGameArt.org](https://opengameart.org) — tag "pet", licença CC0
- Formato ideal: PNG spritesheet OU GIFs separados por estado

**Props do componente:**
```tsx
<PetDisplay status="happy" | "hungry" | "sick" | "eating" />
```

**Implementação sem PixiJS:**
- Se GIFs: `<img src={sprites[status]} />` — simples e funciona
- Se PNG spritesheet: CSS `background-position` + `@keyframes steps()`
- Animação `eating` curta (1–2s) → volta para `happy` automaticamente via `setTimeout`

**Sprites necessários (mínimo viável):**
| Estado    | Tipo         | Alternativa de fallback |
|-----------|--------------|------------------------|
| `happy`   | GIF animado  | PNG estático + CSS bounce |
| `hungry`  | PNG estático | Emoji grande 😢          |
| `sick`    | PNG estático | Emoji grande 🤒          |
| `eating`  | GIF curto    | PNG estático             |

> **Critério de done:** bichinho visível na tela mudando de visual conforme status derivado.

---

### 2.4 — PetHub — Nova Tela Principal

**Criar:**
- `src/components/screens/PetHub.tsx` — substitui HomeScreen na navegação

**Modificar:**
- `src/App.tsx` — view `'home'` → renderiza `PetHub` (não `HomeScreen`)
- `src/components/screens/index.ts` — exportar `PetHub`

**Layout do PetHub:**
```
┌─────────────────────────────┐
│  🔥 Streak: 3 dias   🪙 24  │  ← status bar (topo, compacto)
├─────────────────────────────┤
│                             │
│        [PetDisplay]         │  ← bichinho centralizado
│       😊 Feliz!             │  ← status em texto
│                             │
├─────────────────────────────┤
│ [💧 Usar] [🍎 Usar] [💊 Usar] │  ← inventário (desabilitado se happy)
│  0 água    0 comida  0 rem. │
├─────────────────────────────┤
│ LOJA: [💧 4c] [🍎 6c] [💊 20c] │  ← loja compacta
├─────────────────────────────┤
│   🎮 COMEÇAR LIÇÃO (80px)   │  ← botão principal
├─────────────────────────────┤
│ [🗺️ Progresso]  [dev] [reset]│  ← links discretos
└─────────────────────────────┘
```

**Regras de UI (criança de 7 anos):**
- Botões "Usar" → desabilitados (cinza) se `status === 'happy'`
- Botões "Comprar" → desabilitados se `coins < preço`
- Se `status === 'sick'` e `coins < 20` → aviso: "Seu bichinho está doente! Complete uma lição e ele será curado! 🏥"
- Touch targets ≥ 48px em todos os botões de loja/inventário
- Saldo de moedas sempre visível no topo

> **Critério de done:** loop completo funcional — pet hub → começar lição → sessão → resumo com moedas → voltar para hub → comprar item → usar item → pet fica feliz.

---

### 2.5 — Streak, Troféu e Emergency Rescue

**Criar:**
- `src/components/ui/StreakDisplay.tsx` — "🔥 N dias seguidos" (compacto, no PetHub)
- `src/components/ui/TrophyDisplay.tsx` — troféu de 7 dias (aparece no PetHub após conquista)

**Regras de streak:**
- Completar ≥ 1 lição por dia mantém streak
- Streak quebra se pular 1 dia
- Ao atingir 7 dias: `hasTrophy7Days = true` → exibir troféu visual permanente no PetHub
- Celebração simples: mensagem "🏆 7 dias seguidos! Incrível!"

**Emergency rescue** (já especificado em 2.1 mas com confirmação visual):
- Condição: `status === 'sick'` E `coins < 20`
- Após completar lição: remédio automático + mensagem no `SessionSummaryScreen`:
  > "Seu bichinho foi curado com um kit de emergência! 💊"

> **Critério de done:** streak visível; troféu aparece após 7 dias; kit emergência curou o pet na tela de resumo.

---

## Sprint 3 — Robustez e Edge Cases ✅ COMPLETA

> Fallback teclado, PWA/Offline, erros graceful.

---

## Sprint 4 — Polimento

### 4.1 — Subtração integrada no fluxo ✅ COMPLETA
- `mastery.ts` → `advanceMicrolevel()` avança para subtração quando adição está no topo (maxResult=20, abstract)
- `useGameStore.ts` → `subtractionBannerSeen` + `dismissSubtractionBanner()`
- `PetHub.tsx` → banner "Agora vamos subtrair!" com botão "Entendi!" (aparece 1x ao desbloquear)
- Moedas: sem alteração — já funcionam por `maxResult`

### 4.2 — Testes automatizados
- Vitest nos pet stores (derivação de status, feedPet, buyItem, streak)
- Vitest nos game stores (submissão, progressão, persistência)
- Playwright E2E: HomeHub → Lição → Resumo com moedas → Voltar → Pet feliz

### 4.3 — Acessibilidade ✅ COMPLETA
- ARIA labels nos botões de loja e inventário ✅
- Contraste WCAG AA: `c="dimmed"` → `c="gray.7"` nos labels de seção ✅
- Navegação por teclado completa: overlays com FocusTrap + atalhos físicos ✅
- `aria-modal="true"` + `data-autofocus` em todos os dialogs ✅
- `aria-live="polite"` no status do pet e display do teclado ✅
- Foco visual no canvas de desenho ✅

---

## Sprint 5 — OCR: Precisão e Robustez ← PRÓXIMA

> O OCR é a parte mais frágil do app. Dígitos isolados erram frequentemente, multi-dígitos são piores ainda, e "10" é confundido com "0". Esta sprint foca em melhorias incrementais de alto impacto.

---

### Diagnóstico

**Problemas confirmados:**
1. **Modelo MNIST** treinado com dígitos perfeitos, centralizados — escrita infantil em touch é muito diferente
2. **Segmentação por projeção horizontal** — "1" é fino demais, gap de 8px não separa "1" de "0"
3. **Preprocessing** usa canal alpha (frágil), centering por bounding box (deveria ser centro de massa)
4. **Confiança** — threshold de 80% gera muitos retries frustrantes com modelo fraco

---

### 5.1 — Fix Preprocessing (Quick Wins)

**Problema:** o pipeline atual pega o canal alpha e faz centering pelo bounding box. MNIST espera dígito branco em fundo preto, centrado pelo centro de massa.

**Arquivo:** `src/utils/ocr/tensorOps.ts`

**Mudanças:**

1. **Inverter cores** — canvas tem traço preto em fundo branco/transparente. MNIST quer branco-em-preto.
   ```ts
   // Atual: usa alpha direto (0=fundo, 255=traço) ← ok se alpha
   // Problema: se canvas tem fundo branco opaco, alpha é 255 em tudo
   // Fix: usar luminância (R+G+B)/3, inverter: (255 - lum) / 255
   ```

2. **Centro de massa** em vez de centro geométrico do bounding box
   ```ts
   // Calcular centroid (média ponderada de posições por intensidade)
   // Posicionar centroid no centro do grid 28x28
   // Isso é como o MNIST original foi preprocessado
   ```

3. **Binarização com threshold** — pixels intermediários (antialiasing) geram ruído
   ```ts
   // Aplicar threshold: pixel > 0.3 ? 1.0 : 0.0
   // Remove artefatos de antialiasing que confundem o modelo
   ```

4. **Stroke width normalization** — traços grossos de dedo vs finos de stylus
   ```ts
   // Erosion/dilation morfológica para normalizar espessura
   // Alvo: ~2-3px no espaço 28x28 (como MNIST)
   ```

**Impacto esperado:** +15-25% de precisão em dígitos isolados.

> **Critério de done:** mesmos dígitos escritos que antes erravam agora são reconhecidos. Testar com 0-9 escritos à mão 5x cada.

---

### 5.2 — Reescrever Segmentação Multi-Dígitos

**Problema:** projeção horizontal falha com "1" fino, dígitos encostados, e gaps internos (ex: "8").

**Arquivo:** `src/utils/ocr/segment.ts`

**Mudanças:**

1. **Connected Component Labeling (CCL)** em vez de projeção horizontal
   ```ts
   // Binarizar a imagem
   // Flood-fill para encontrar componentes conectados
   // Cada componente = candidato a dígito
   // Ordenar por posição X (esquerda→direita)
   ```

2. **Merge de componentes próximos** — "=" em "8" ou ":" em divisão
   ```ts
   // Se gap horizontal entre 2 componentes < 15% da largura média → merge
   // Isso junta partes de dígitos que se quebraram
   ```

3. **Split de componentes largos** — "10" grudado vira 1 componente
   ```ts
   // Se largura > 1.8x da mediana → tentar split vertical
   // Encontrar o "vale" de mínima densidade vertical
   // Se vale < 20% da densidade máxima → split
   ```

4. **Tratamento especial para "1"**
   ```ts
   // "1" é estreito (~5-10px) e alto
   // Se aspect ratio (altura/largura) > 3.0 → provavelmente é "1"
   // Não filtrar como ruído (minDigitWidth atual = 5px pode cortar "1")
   ```

5. **Fallback inteligente** — se CCL encontra 0 componentes, tentar projeção horizontal como fallback

**Impacto esperado:** "10" passa a ser reconhecido corretamente na maioria dos casos.

> **Critério de done:** escrever "10", "12", "21", "100" — todos reconhecidos corretamente 4/5 vezes.

---

### 5.3 — Modelo OCR Melhorado (plano: A + B + C)

**Problema:** modelo MNIST atual tem arquitetura básica (2 conv layers, treinado em 12 epochs com dados limpos). Não generaliza para escrita infantil.

**Decisão:** implementar A (quantizar) + B (TTA) + C (modelo EMNIST). Não temos dados próprios para treinar — usamos datasets públicos e modelos prontos.

---

#### Modelo atual (baseline)

| Propriedade | Valor |
|-------------|-------|
| Origem | Keras 2.2.4 (2018), exemplo padrão SciSharp/Keras.NET |
| Arquitetura | Conv2D(32) → Conv2D(64) → MaxPool → Dense(128) → Dense(10) |
| Dataset de treino | MNIST puro (60k amostras, dígitos limpos centralizados) |
| Sem BatchNorm, sem data augmentation | ✗ |
| Precisão MNIST test set | ~99.1% |
| Precisão escrita infantil touch (estimada) | ~70-80% |
| Tamanho | **4.6 MB** (float32, gargalo: Dense [9216, 128] = 4.5MB) |

#### Resultado esperado após A+B+C

| Propriedade | Valor |
|-------------|-------|
| Precisão touch (estimada) | **~83-90%** (+13-18%) |
| Tamanho | **~2.5 MB** (46% menor) |
| Latência | ~60ms/dígito (vs ~15ms hoje — imperceptível) |
| Dados próprios necessários | **Nenhum** |

---

#### 5.3.1 — Test-Time Augmentation (TTA) em TypeScript ← PRIMEIRO

**O que é:** para cada dígito segmentado, gerar 4 variações geométricas, predizer todas, fazer média das probabilidades softmax. A predição final é mais robusta porque compensa variações de ângulo e tamanho na escrita.

**Por que primeiro:** puro TypeScript, sem dependência de Python. Funciona com qualquer modelo (atual ou novo). Se C falhar (modelo incompatível), B já melhora o que tem.

**Criar:** `src/utils/ocr/tta.ts`

```ts
// Variações geradas por dígito:
//   1. Original (sem mudança)
//   2. Rotação -5° (criança escreveu levemente torto para a esquerda)
//   3. Rotação +5° (levemente torto para a direita)
//   4. Scale 0.9x (dígito um pouco menor, mais centralizado)
//
// Para cada variação:
//   - Aplicar transformação com tf.image.transform()
//   - model.predict() → softmax [1, 10]
//
// Resultado: média das 4 softmax → argMax → dígito + confiança
//
// IMPORTANTE: NÃO fazer flip horizontal/vertical (6 vira 9!)
```

**Modificar:** `src/utils/ocr/predict.ts`

```ts
// Antes:  model.predict(tensor) → dígito
// Depois: predictWithTTA(model, tensor) → dígito (usa média de 4 variações)
//
// Flag para desabilitar TTA em debug/testes:
//   predictDigit(model, tensor, { useTTA: true })
```

**Detalhes de implementação:**

1. `rotateImage(tensor4D, degrees)` — usa `tf.image.transform()` com matriz de rotação 2D
2. `scaleImage(tensor4D, factor)` — usa `tf.image.transform()` com matriz de escala
3. `predictWithTTA(model, tensor4D)` — gera variações, prediz, média, retorna `DigitPrediction`
4. Todas as variações dentro de `tf.tidy()` para evitar memory leaks
5. Se TTA desabilitado, comportamento idêntico ao atual (sem overhead)

**Impacto:** +3-5% precisão touch. Latência ~60ms/dígito (4x predict). Zero mudança no modelo.

> **Critério de done:** `predictWithTTA` funciona. Dígitos ambíguos (1 vs 7, 6 vs 0) melhoram taxa de acerto. Build sem erros TS.

---

#### 5.3.2 — Modelo EMNIST (substituir modelo) ← SEGUNDO

**O que é:** baixar modelo CNN pré-treinado em EMNIST-Digits (280k amostras, 4.7x mais que MNIST, escrita mais variada). Converter de `.h5` para TFJS. Drop-in replacement.

**Fonte:** [j05t/emnist](https://github.com/j05t/emnist) — 99.84% no EMNIST-Digits test set.

**Por que EMNIST > MNIST:** MNIST tem dígitos limpos de adultos com caneta em papel. EMNIST tem 280k amostras com mais variação natural. Nenhum dos dois tem escrita infantil em touch, mas EMNIST generaliza melhor.

**Passo a passo:**

1. **Verificar compatibilidade** — clonar repo, inspecionar o `.h5`:
   ```bash
   git clone https://github.com/j05t/emnist.git /tmp/emnist
   # Verificar: input shape é [28, 28, 1]? Output é [10]? Formato Keras compatível?
   ```

2. **Converter para TFJS** (1 comando):
   ```bash
   pip install tensorflowjs tensorflow
   tensorflowjs_converter \
     --input_format keras \
     --output_format tfjs_layers_model \
     --quantize_float16 \
     /tmp/emnist/export_json_h5/model.h5 \
     public/models/mnist/
   ```
   Nota: `--quantize_float16` já faz a quantização (passo A) junto. Dois em um.

3. **Validar** — carregar o app, testar 0-9 escritos à mão.

4. **Fallback** — se o modelo EMNIST for incompatível (input shape diferente, erro na conversão, precisão pior na prática):
   - Manter o modelo atual
   - Quantizar o modelo atual com float16 (passo A isolado):
     ```bash
     tensorflowjs_converter \
       --input_format tfjs_layers_model \
       --output_format tfjs_layers_model \
       --quantize_float16 \
       public/models/mnist/model.json \
       /tmp/mnist-q16/
     # Se OK, mover de volta para public/models/mnist/
     ```

**Mudança de código:** nenhuma se input shape = [28, 28, 1] (esperado). Se diferente, ajustar `prepareForModel()` em `tensorOps.ts`.

**Impacto:** +10-15% precisão touch. Tamanho ~2.5MB (com quantização float16 embutida).

> **Critério de done:** modelo EMNIST carregando no app. Dígitos 0-9 escritos à mão 5x cada, taxa de acerto visivelmente melhor que o modelo antigo.

---

#### 5.3.3 — Calibrar thresholds de confiança ← TERCEIRO

**O que é:** ajustar os thresholds de aceitação/confirmação/retry ao novo modelo + TTA. O modelo EMNIST pode ter distribuição de confiança diferente do MNIST.

**Arquivo:** `src/utils/ocr/predict.ts` (onde estão os thresholds)

**Passo a passo:**

1. Testar 0-9 (5x cada) com o novo modelo + TTA
2. Anotar a confiança média por dígito
3. Ajustar thresholds:

| Faixa | Ação | Atual | Novo (estimar após teste) |
|-------|------|-------|--------------------------|
| Alta confiança | Auto-aceitar | ≥ 80% | ≥ 70% (se modelo mais calibrado) |
| Média confiança | Pedir confirmação | 50-79% | 40-69% |
| Baixa confiança | Pedir redesenho | < 50% | < 40% |

4. Se a confiança média do novo modelo for mais alta, pode relaxar thresholds → menos "redesenhe" → menos frustração.

**Impacto:** reduz retries frustantes sem aumentar erros silenciosos.

> **Critério de done:** thresholds recalibrados. Criança não é forçada a redesenhar quando o modelo já acertou.

---

#### Opções descartadas (referência)

| Opção | Por que não agora |
|-------|-------------------|
| **D) Treinar custom** | Não temos dados de escrita infantil. EMNIST público é suficiente por agora. Reconsiderar se C não for satisfatório. |
| **E) CRNN+CTC** | Overengineering. CCL (5.2) + modelo melhor (C) + TTA (B) devem resolver. Reconsiderar para v2. |
| **Fine-tune com dados da criança** | Precisaria de feature de coleta de dados + semanas de uso real. Anotar no backlog como Sprint futura. |

---

### 5.4 — UX: Guias Visuais e Feedback de OCR

**Problema:** criança não sabe onde/como escrever para o OCR funcionar melhor. Sem feedback do que o OCR "viu".

**Arquivos:** `DrawingCanvas.tsx`, `AbstractExerciseScreen.tsx`

**Mudanças:**

1. **Guias visuais no canvas** — linhas pontilhadas separando áreas de dígitos
   ```tsx
   // Se resposta esperada tem N dígitos, mostrar N "caixas" pontilhadas
   // Ex: resposta "12" → 2 caixas lado a lado
   // Apenas guia visual, não obriga — segmentação ainda funciona livre
   ```

2. **Preview do OCR** — mostrar o que o modelo "viu" antes de submeter
   ```tsx
   // Após segmentação, mostrar thumbnails 28x28 dos dígitos detectados
   // Criança vê: "Eu vi: [1] [2]" com as imagens processadas
   // Se errado, pode redesenhar antes de confirmar
   ```

3. **Dica de espaçamento** — quando segmentação falha
   ```tsx
   // Se OCR retorna 1 dígito mas resposta esperada tem 2+:
   //   "Tente escrever os números mais separados!"
   ```

**Impacto esperado:** menos frustração, criança aprende a escrever de forma que o OCR entende.

> **Critério de done:** canvas tem guias para multi-dígito. Dica aparece quando segmentação falha.

---

### Ordem de Implementação (Sprint 5)

```
5.1 Fix Preprocessing (quick wins)           ✅ COMPLETA
5.2 Reescrever Segmentação (CCL)             ✅ COMPLETA
5.3.1 TTA em TypeScript                      ✅ COMPLETA
5.3.2 Modelo EMNIST + quantização            ✅ COMPLETA (quantização float16 aplicada, 4.6MB→2.3MB)
5.3.3 Calibrar thresholds de confiança       ← pendente (precisa testes manuais)
5.4 UX: Guias e Feedback                     ✅ COMPLETA (guias pontilhadas + dica espaçamento)
```

**Nota:** 5.3.1 é independente de 5.3.2 — TTA funciona com qualquer modelo. Se 5.3.2 falhar (modelo incompatível), 5.3.1 sozinho já melhora.

---

## Sprint 6 — OCR Inteligente (Context-Aware + Heurísticas)

> O modelo MNIST com TTA e preprocessing já está bom para dígitos isolados. Agora o ganho vem de usar **inteligência no código** — o app sabe a resposta certa e pode usar isso para desempatar, e confusões previsíveis podem ser tratadas com heurísticas.

---

### 6.1 — Context-Aware Prediction (top-K + resposta esperada) ✅ COMPLETA

**Problema:** O app sabe a resposta correta, mas o OCR ignora esse contexto. Se o modelo dá 60% para "7" e 30% para "1", e a resposta correta é "1", o app rejeita — quando deveria pedir confirmação.

**Arquivo:** `src/utils/ocr/predict.ts`

**Regras (sem "colar"):**
1. Se top-1 **é** a resposta correta e confiança ≥ 80% → `accepted` (sem mudança)
2. Se top-1 **não é** a resposta correta, mas a resposta correta está no **top-3** → baixar threshold de confirmação:
   - Confiança da resposta correta ≥ 20% → `confirmation` (em vez de `retry`)
   - Mostrar a resposta correta no overlay de confirmação (não o top-1 errado)
3. Se top-1 **é** a resposta correta mas confiança está entre 50-79% → `confirmation` (sem mudança)
4. **Nunca** auto-aceitar resposta errada. O context-aware só **relaxa** o retry, não aceita automaticamente.

**Implementação:**
```ts
// Em predictNumber(), após obter predictions:
// 1. Montar número a partir de top-1 de cada dígito
// 2. Se número != expectedAnswer:
//    2a. Para cada posição de dígito, verificar se expectedAnswer[i] está no top-3
//    2b. Se sim, calcular confiança alternativa usando probabilidades do expectedAnswer
//    2c. Se confiança alternativa >= 20%, retornar status='confirmation' com o expectedAnswer
// 3. Se número == expectedAnswer: lógica normal de thresholds

interface PredictNumberOptions {
  expectedAnswer?: number;  // novo campo opcional
  useTTA?: boolean;
}
```

**Importante:** `expectedAnswer` é **opcional**. Se não fornecido, comportamento idêntico ao atual. Isso mantém a função pura para testes.

**Impacto:** Reduz retries frustrantes em ~30-40% dos casos onde o modelo quase acertou.

> **Critério de done:** Escrever "7" quando resposta é "1" → overlay pergunta "Você escreveu 1?" em vez de "Não entendi, redesenhe". Build sem erros TS.

---

### 6.2 — Confusion-Pair Heuristics ✅ COMPLETA

**Problema:** Crianças confundem sistematicamente certos dígitos. O modelo também. Podemos usar heurísticas geométricas para desempatar.

**Criar:** `src/utils/ocr/confusionPairs.ts`

**Pares de confusão previsíveis:**
| Par | Heurística de desempate |
|-----|------------------------|
| 1↔7 | "7" tem traço horizontal no topo. Analisar densidade de pixels na faixa superior (top 30%) |
| 6↔0 | "6" tem extensão abaixo da metade. Analisar se há pixels na metade inferior-esquerda fora do "corpo" circular |
| 4↔9 | "4" tem abertura no topo-direito. Analisar quadrante superior-direito |
| 5↔3 | "5" tem traço horizontal no topo. Similar a 1↔7 |

**Implementação:**
```ts
interface ConfusionResolution {
  originalDigit: number;
  alternativeDigit: number;
  confidence: number;  // confiança ajustada
}

// Para cada dígito predito:
// 1. Verificar se top-1 e top-2 formam um par de confusão conhecido
// 2. Se sim, E a diferença de confiança é < 15%, aplicar heurística geométrica
// 3. Heurística retorna qual dos dois é mais provável
// 4. Ajustar confidence com base na heurística

function resolveConfusion(
  tensor: tf.Tensor4D,
  topPredictions: DigitPrediction[],
): ConfusionResolution | null;
```

**Integração:** Chamar `resolveConfusion()` após `predictWithTTA()` em `predict.ts`, antes de montar o número final.

**Impacto:** +5-10% em dígitos que caem nos pares de confusão.

> **Critério de done:** "1" escrito com traço horizontal no topo → reconhecido como "7" (não "1"). "6" com rabo → não confundido com "0". Build sem erros TS.

---

### 6.3 — Rejeição de Rabisco/Canvas Vazio ✅ COMPLETA

**Problema:** Criança pode submeter canvas vazio, rabisco aleatório, ou preenchimento total. O OCR gasta processamento e retorna lixo.

**Criar:** `src/utils/ocr/canvasValidation.ts`

**Regras de validação (antes de rodar OCR):**
```ts
interface CanvasValidationResult {
  valid: boolean;
  reason?: 'empty' | 'too_sparse' | 'too_dense' | 'too_small';
  message?: string;  // mensagem amigável para a criança
}

function validateCanvas(canvas: HTMLCanvasElement): CanvasValidationResult;
```

| Condição | Threshold | Mensagem |
|----------|-----------|----------|
| Canvas vazio | < 0.5% pixels preenchidos | "Escreva um número! ✏️" |
| Muito pouco | 0.5% - 1.5% pixels | "Escreva um pouco maior! 📏" |
| Rabisco/preenchimento | > 40% pixels preenchidos | "Ops! Tente escrever só o número 🔢" |
| Traço muito pequeno | Bounding box < 15% do canvas | "Escreva um pouco maior! 📏" |

**Integração:** Chamar `validateCanvas()` no handler de submit (antes de `predictNumber()`). Se inválido, mostrar mensagem com som "doubt" e não processar OCR.

**Impacto:** Evita processamento desnecessário + feedback instantâneo + menos frustração.

> **Critério de done:** Submit com canvas vazio → mensagem amigável sem chamar OCR. Rabisco cobrindo tudo → mensagem amigável. Build sem erros TS.

---

### Ordem de Implementação (Sprint 6 OCR)

```
6.1 Context-Aware Prediction    ✅ COMPLETA
6.2 Confusion-Pair Heuristics   ✅ COMPLETA
6.3 Rejeição Rabisco/Vazio      ✅ COMPLETA
```

**Após completar:** Avaliar resultados práticos antes de decidir próximos passos (skeletonization, adaptive binarization, ensemble, coleta de dados).

---

## Sprint 7 — Seleção de Nível pela Criança

> A progressão automática é lenta demais e subtração quase nunca aparece. A criança deve poder escolher diretamente o que quer praticar: operação e dificuldade. Isso dá autonomia e elimina frustração.

---

### Problema atual

1. **Progressão muito lenta**: precisa de 5 acertos rápidos consecutivos para subir de microlevel. A criança fica presa em somas fáceis (maxResult=5) por muitas sessões.
2. **Subtração rara**: só aparece após completar TODA a progressão de adição até maxResult=20 no nível abstract. Na prática, quase nunca chega.
3. **Sem escolha**: a criança não tem controle sobre o que pratica. Se ela já sabe somar até 10, não pode pular.
4. **Multi-dígitos inacessíveis**: exercícios com resultado > 20 (ex: 45+8) nunca são alcançados na progressão atual.

### Solução: Tela de Seleção de Nível

Substituir a progressão automática por **seleção direta na PetHub**. A criança escolhe 2 coisas:

**1. Operação:**
| Opção | Label visual | O que gera |
|-------|-------------|------------|
| Soma | `+` | Só adição |
| Soma e Subtração | `+ -` | Mix aleatório de adição e subtração |

**2. Dificuldade (por número de dígitos no resultado):**
| Opção | Label visual | maxResult | Exemplos |
|-------|-------------|-----------|----------|
| 1 dígito | `1-9` | 9 | 3+5, 8-2 |
| 2 dígitos | `10-99` | 99 | 45+8, 73-6 |
| 3 dígitos | `100-999` | 999 | 247+5, 503-8 |

Total: **6 combinações possíveis** (2 operações × 3 dificuldades).

**Moedas por dificuldade:**
| Dificuldade | Moedas/acerto |
|-------------|---------------|
| 1 dígito | 2c |
| 2 dígitos | 5c |
| 3 dígitos | 10c |

Multiplicador x2 de velocidade continua (fastCount >= 7 na sessão).

---

### 7.1 — Novo tipo `GameMode` e refatoração de `MasteryLevel`

**Criar:** `src/types/gameMode.ts`

```ts
/** Operações disponíveis */
type OperationMode = 'addition' | 'mixed';

/** Dificuldade por dígitos no resultado */
type DifficultyLevel = '1digit' | '2digit' | '3digit';

/** Configuração escolhida pela criança */
interface GameMode {
  operation: OperationMode;
  difficulty: DifficultyLevel;
}

/** Mapear difficulty → maxResult para generateProblem */
const DIFFICULTY_MAX_RESULT: Record<DifficultyLevel, number> = {
  '1digit': 9,
  '2digit': 99,
  '3digit': 999,
};

/** Mapear difficulty → moedas por acerto */
const DIFFICULTY_COINS: Record<DifficultyLevel, number> = {
  '1digit': 2,
  '2digit': 5,
  '3digit': 10,
};
```

**Modificar:** `src/types/mastery.ts`
- `MasteryLevel` perde `cpaPhase` (não usado mais na prática — tudo é 'abstract').
- `MasteryLevel` continua com `operation` e `maxResult` para compatibilidade com `generateProblem`.
- A progressão automática (`advanceMicrolevel`, `MICROLEVEL_PROGRESSION`) é removida ou desativada.

> **Critério de done:** tipos definidos, build sem erros.

---

### 7.2 — Adaptar `generateProblem` para novos ranges

**Modificar:** `src/lib/math/generateProblem.ts`

Atualmente `getAdditionConfig(maxResult)` suporta até maxResult=20. Precisamos expandir:

```
maxResult <= 9:   operandA 1–8,   operandB 1–(9-operandA)     (resultado 2-9)
maxResult <= 99:  operandA 10–89, operandB 1–9                (resultado 11-98)
maxResult <= 999: operandA 100–989, operandB 1–9              (resultado 101-998)
```

Para subtração:
```
maxResult <= 9:   minuend 2–9,    subtrahend 1–(minuend-1)    (resultado >= 1)
maxResult <= 99:  minuend 11–99,  subtrahend 1–9              (resultado >= 2)
maxResult <= 999: minuend 101–999, subtrahend 1–9             (resultado >= 92)
```

Para `mixed` mode: 50% chance de adição, 50% subtração (random por exercício).

> **Critério de done:** `generateProblem({ operation: 'addition', maxResult: 99 })` gera "45+8" corretamente. `mixed` alterna entre soma e subtração.

---

### 7.3 — Adaptar `useGameStore` para GameMode

**Modificar:** `src/stores/useGameStore.ts`

- Novo campo: `selectedMode: GameMode | null` (null = nenhum selecionado)
- `startSession(mode: GameMode)` → salva mode, gera `MasteryLevel` equivalente
- Para `mixed`: a cada exercício, sorteia `operation = Math.random() < 0.5 ? 'addition' : 'subtraction'`
- Remover/simplificar `MasteryTracker` — não precisa mais de progressão automática
- `submitExercise()` continua funcionando igual (correto/incorreto, tempo, moedas)
- Persistir `selectedMode` no localStorage (última escolha da criança)

**Moedas:** usar `DIFFICULTY_COINS[mode.difficulty]` em vez do cálculo antigo por `maxResult`.

> **Critério de done:** `startSession({ operation: 'mixed', difficulty: '2digit' })` inicia sessão com mix de soma/subtração até 99.

---

### 7.4 — Tela de Seleção de Nível na PetHub

**Modificar:** `src/components/screens/PetHub.tsx`

Substituir o botão único "Começar Lição" por seletor de nível + botão play.

**Layout:**
```
┌─────────────────────────────┐
│  🔥 Streak: 3 dias   🪙 24  │
├─────────────────────────────┤
│        [PetDisplay]         │
│       😊 Feliz!             │
├─────────────────────────────┤
│ [💧 Usar] [🍎 Usar] [💊 Usar] │
│ LOJA: [💧 4c] [🍎 6c] [💊 20c] │
├─────────────────────────────┤
│  O que vamos praticar?      │
│                             │
│  [  +  ]  [ + − ]          │  ← 2 botões toggle (um ativo)
│                             │
│  [ 1-9 ] [ 10-99 ] [100-999] │  ← 3 botões toggle (um ativo)
│                             │
│  🎮 COMEÇAR! (80px)         │  ← botão principal
├─────────────────────────────┤
│ [🗺️ Progresso]  [dev]       │
└─────────────────────────────┘
```

**Regras de UI:**
- Botões de toggle: fundo colorido quando selecionado, cinza quando não
- Seleção padrão: última escolha da criança (persistida) ou `{ operation: 'addition', difficulty: '1digit' }`
- Touch targets ≥ 48px em todos os botões
- Labels grandes sem dependência de leitura:
  - Operação: `+` e `+ −` (símbolos puros, sem texto)
  - Dificuldade: `1-9`, `10-99`, `100-999` (números puros)
- Ao mudar seleção, mostrar exemplo animado: "Ex: 45 + 8 = ?" (atualiza em tempo real)
- Moedas por acerto visíveis: "🪙 5c por acerto" (muda com dificuldade)

**Props de `onPlay`:**
```ts
// Antes:
onPlay: () => void;

// Depois:
onPlay: (mode: GameMode) => void;
```

> **Critério de done:** criança escolhe "+" e "10-99", vê exemplo "45+8=?", clica Começar, sessão gera exercícios de 2 dígitos soma. Build sem erros TS.

---

### 7.5 — Adaptar coinCalculator e fluxo de sessão

**Modificar:** `src/lib/coinCalculator.ts`
- Usar `DIFFICULTY_COINS` em vez da tabela antiga por maxResult.

**Modificar:** `src/App.tsx`
- `handlePlay(mode: GameMode)` → chama `startSession(mode)`

**Verificar:** `SessionSummaryScreen` — nenhuma mudança necessária (já recebe moedas calculadas).

> **Critério de done:** moedas corretas por dificuldade. Loop completo: PetHub → selecionar → jogar → resumo → voltar.

---

### Ordem de Implementação (Sprint 7)

```
7.1 Tipos GameMode + refatoração MasteryLevel      ✅ COMPLETA
7.2 Expandir generateProblem para novos ranges      ✅ COMPLETA
7.3 Adaptar consumidores para GameMode               ✅ COMPLETA
7.4 Tela de seleção na PetHub                        ✅ COMPLETA
7.5 coinCalculator + fluxo de sessão                 ✅ COMPLETA
```

**O que NÃO muda:**
- OCR pipeline (já suporta multi-dígitos)
- DrawingCanvas (guias visuais já funcionam com `expectedDigits`)
- Pet store (moedas, streak, inventário)
- SessionSummaryScreen (já é genérica)

**O que é removido/simplificado:**
- `MasteryTracker` — sem progressão automática
- `MICROLEVEL_PROGRESSION` — substituída por `DIFFICULTY_MAX_RESULT`
- `advanceMicrolevel()` / `regressMicrolevel()` — não precisa mais
- `cpaPhase` em `MasteryLevel` — tudo é abstract
- Banners de desbloqueio (subtração, etc.) — criança já escolhe direto

---

## Backlog (fora do escopo atual)

- **Estado de Sede**: água e comida independentes — funciona bem como está, adiado
- **Progressão automática**: pode voltar como feature opcional (modo "Kumon" vs "Livre")

- **PixiJS** — CSS + GIF resolve sem adicionar 4MB ao bundle
- **Quarto isométrico** — pixel art fancy fica para v2
- **Sincronização entre devices** — localStorage only por enquanto
- **Múltiplos pets / evolução** — v2
- **Anti-trapaça (Page Visibility API)** — MVP confia na criança
- **ProgressDashboard** — os arquivos já existem mas ficam em standby; PetHub é a nova tela de progresso visual

---

## Ordem de Implementação Geral

```
Sprint 1 (loop principal):              ✅ COMPLETA
Sprint 2 (bichinho virtual):            ✅ COMPLETA
Sprint 3 (robustez):                    ✅ COMPLETA
Sprint 4 (polimento):                   ✅ COMPLETA
Sprint 5 (OCR precisão):                ✅ COMPLETA
Sprint 6 (OCR inteligente):             ✅ COMPLETA
Sprint 7 (seleção de nível):            ✅ COMPLETA
```

---

**Última atualização**: 2026-02-28 (Sprint 7 planejada: seleção de nível pela criança)
