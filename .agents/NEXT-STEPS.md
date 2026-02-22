# Próximos Passos — Sprint de Funcionalidade

**Objetivo**: Loop completo de estudo diário: criança faz contas → ganha moedas → cuida do bichinho virtual → quer voltar amanhã.

**Estado atual (2026-02-20)**: ✅ **Sprints 1–3 + Sprint 2 (Bichinho Virtual) COMPLETAS**. App funcional com PetHub (tela principal), sessões de 10 exercícios, resumo com moedas, estrelas, progressão automática, OCR, PWA offline, fallback teclado e loop completo do pet virtual. Audit de bugs concluído: **0 erros TypeScript, build limpo**. `ProgressDashboard.tsx`, `LevelBadge.tsx`, `LevelChangeNotification.tsx` e `levelFormat.ts` existem como arquivos não commitados e ficam em standby (substituídos pelo PetHub como tela de progresso visual).

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
5.3.1 TTA em TypeScript                      ← PRÓXIMO (~1h, puro TS, sem Python)
5.3.2 Modelo EMNIST + quantização            ← DEPOIS (30min, precisa Python p/ conversão)
5.3.3 Calibrar thresholds de confiança       ← DEPOIS (30min, testar + ajustar)
5.4 UX: Guias e Feedback                     ← POR ÚLTIMO (React/UI)
```

**Nota:** 5.3.1 é independente de 5.3.2 — TTA funciona com qualquer modelo. Se 5.3.2 falhar (modelo incompatível), 5.3.1 sozinho já melhora.

---

## Sprint 6 — Progressão Multi-Dígitos + Mecânicas do Pet (antigo Sprint 5)

> Dois objetivos paralelos: ampliar o alcance matemático para operações com 2 e 3 dígitos, e tornar o cuidado do pet mais rico com o estado de sede independente da fome.

---

### 5.1 — Progressão Multi-Dígitos (2+1 e 3+1 dígitos)

**Motivação:** hoje soma e subtração evoluem apenas dentro de resultados até 20 (1 dígito + 1 dígito). Queremos continuar a progressão natural para operações com dezenas e centenas.

**Auditoria OCR concluída:** o pipeline já suporta 3 dígitos sem nenhuma mudança. `segmentDigits`, `predictDigits` e `predictionsToNumber` são agnósticos à quantidade de dígitos.

**Nova tabela de níveis:**

| Nível | maxResult | Tipo de operação | Exemplo | Moedas/acerto |
|-------|-----------|-----------------|---------|---------------|
| 1 | 5 | 1+1 dígitos | 2+3 | 1c |
| 2 | 10 | 1+1 dígitos | 7+3 | 1c |
| 3 | 15 | 1+1 dígitos | 8+7 | 3c |
| 4 | 20 | 1+1 dígitos | 9+9 | 3c |
| 5 | 99 | 2+1 dígitos | 45+8 | 8c |
| 6 | 999 | 3+1 dígitos | 247+5 | 15c |

Mesma lógica para subtração (ex: 73-6, 452-8).

**Passo a passo de implementação:**

**Passo 1 — `src/types/mastery.ts`**
- Estender `MICROLEVEL_PROGRESSION`:
  ```ts
  addition:    [5, 10, 15, 20, 99, 999]
  subtraction: [5, 10, 15, 20, 99, 999]
  ```
- Nenhuma outra mudança neste arquivo.

**Passo 2 — `src/lib/math/generateProblem.ts`**
- Adicionar 2 novos blocos em `getAdditionConfig()`:
  ```
  maxResult <= 99:  operandA 10–89, operandB 1–9  (2+1 dígitos)
  maxResult <= 999: operandA 100–989, operandB 1–9 (3+1 dígitos)
  ```
- Adicionar 2 novos blocos em `getSubtractionConfig()`:
  ```
  maxResult <= 99:  minuend 11–99, subtrahend 1–9  (resultado ≥ 1)
  maxResult <= 999: minuend 101–999, subtrahend 1–9 (resultado ≥ 1)
  ```
- Garantir que `isValidResult` e `isValidOperands` continuam funcionando (sem negativos).

**Passo 3 — `src/lib/coinCalculator.ts`**
- Atualizar `getCoinsPerCorrect()`:
  ```ts
  maxResult <= 10  → 1c
  maxResult <= 20  → 3c
  maxResult <= 99  → 8c   ← novo
  maxResult <= 999 → 15c  ← novo
  ```

**Passo 4 — Verificar banner de desbloqueio (`PetHub.tsx`)**
- Hoje existe banner "Agora vamos subtrair!" para transição adição→subtração.
- Avaliar se vale adicionar banner "Números maiores!" ao desbloquear nível 5 (maxResult=99).
- Decisão: sim, mesma mecânica do `subtractionBannerSeen`.

**Passo 5 — Testes unitários**
- Atualizar testes de `generateProblem` para cobrir os novos níveis.
- Atualizar testes de `coinCalculator` para cobrir `maxResult=99` e `maxResult=999`.
- Testar que `advanceMicrolevel()` progride corretamente de 20→99→999.

**Arquivos modificados:**
- `src/types/mastery.ts`
- `src/lib/math/generateProblem.ts`
- `src/lib/coinCalculator.ts`
- `src/components/screens/PetHub.tsx` (banner opcional)
- `tests/unit/coinCalculator.spec.ts`
- `tests/unit/generateProblem.spec.ts` (se existir)

> **Critério de done:** criança que completa soma/subtração nível 4 (maxResult=20, abstract) avança para exercícios tipo "45+8". Moedas sobem de 3c para 8c. Build sem erros TypeScript.

---

### 5.2 — Estado de Sede (separado da Fome)

**Motivação:** água e comida hoje são intercambiáveis para `hungry`. Com sede como estado independente, cada item tem propósito único — mais engajamento e razão para comprar ambos.

**Nota sobre timing:** pet começa com fome (`lastFedAt: 0`) mas com sede defasada (`lastWateredAt: Date.now() - 6 * 3600 * 1000`) para que os estados não apareçam sempre simultaneamente.

**Novos estados derivados em runtime:**
| Estado | Condição |
|--------|----------|
| `happy` | alimentado E hidratado (ambos < 12h) |
| `hungry` | fome (12–24h sem comer), mas hidratado |
| `thirsty` | sede (12–24h sem beber), mas alimentado |
| `hungry_and_thirsty` | fome E sede simultaneamente |
| `sick` | qualquer um dos dois > 24h sem atenção |

**Regras de item:**
| Item | Cura |
|------|------|
| 💧 Água | `thirsty` e `hungry_and_thirsty` (atualiza `lastWateredAt`) |
| 🍎 Comida | `hungry` e `hungry_and_thirsty` (atualiza `lastFedAt`) |
| 💊 Remédio | `sick` (restaura ambos `lastFedAt` e `lastWateredAt`) |

**Passo a passo de implementação:**

**Passo 1 — `src/lib/petActions.ts`**
- Adicionar `PetStatus`: `'thirsty' | 'hungry_and_thirsty'` aos tipos existentes.
- Alterar assinatura de `derivePetStatus(lastFedAt, lastWateredAt)`.
- Lógica:
  ```ts
  const hungry = elapsed(lastFedAt) > 12h
  const thirsty = elapsed(lastWateredAt) > 12h
  const fedSick = elapsed(lastFedAt) > 24h
  const waterSick = elapsed(lastWateredAt) > 24h
  if (fedSick || waterSick) return 'sick'
  if (hungry && thirsty) return 'hungry_and_thirsty'
  if (hungry) return 'hungry'
  if (thirsty) return 'thirsty'
  return 'happy'
  ```
- Atualizar `canFeedPet()`: água só funciona se status inclui sede; comida só se inclui fome.
- Atualizar `getPetStatusLabel()` com os novos estados.

**Passo 2 — `src/stores/usePetStore.ts`**
- Adicionar campo `lastWateredAt: number` ao estado.
- Estado inicial: `lastWateredAt: Date.now() - 6 * 3600 * 1000` (defasado 6h).
- Atualizar `feedPet('water')` → atualiza `lastWateredAt`.
- Atualizar `feedPet('food')` → atualiza `lastFedAt` (sem mudança, já faz isso).
- Atualizar `feedPet('medicine')` → atualiza ambos.
- Atualizar `completedLesson()` → emergency rescue verifica `lastWateredAt` também.
- Atualizar `getPetStatus()` → passa ambos os timestamps.
- Adicionar `lastWateredAt` ao `partialize` (persistir).

**Passo 3 — `src/components/screens/PetHub.tsx`**
- Botão "Usar Água" habilitado se status é `thirsty` ou `hungry_and_thirsty`.
- Botão "Usar Comida" habilitado se status é `hungry` ou `hungry_and_thirsty`.
- Label de status exibe os novos estados.

**Passo 4 — `src/components/ui/PetDisplay.tsx`**
- Sprite `hungry_and_thirsty` → reusar sprite `hungry` (ou criar variação CSS).

**Passo 5 — Testes unitários**
- Atualizar testes de `petActions` para cobrir os 5 estados.
- Testar `canFeedPet` para todas as combinações (água em `thirsty`, `hungry`, `sick`, `happy`).

**Arquivos modificados:**
- `src/lib/petActions.ts`
- `src/stores/usePetStore.ts`
- `src/components/screens/PetHub.tsx`
- `src/components/ui/PetDisplay.tsx`
- `tests/unit/petActions.spec.ts`

> **Critério de done:** água só resolve sede, comida só resolve fome. Remédio cura os dois. Pet começa com fome (imediato) e fica com sede ~6h depois. Build sem erros TypeScript.

---

## Fora do Escopo deste MVP (não implementar agora)

- **PixiJS** — CSS + GIF resolve sem adicionar 4MB ao bundle
- **Quarto isométrico** — pixel art fancy fica para v2
- **Sincronização entre devices** — localStorage only por enquanto
- **Múltiplos pets / evolução** — v2
- **Anti-trapaça (Page Visibility API)** — MVP confia na criança
- **ProgressDashboard** — os arquivos já existem mas ficam em standby; PetHub é a nova tela de progresso visual

---

## Ordem de Implementação Recomendada

```
Sprint 2 (bichinho virtual):            ✅ COMPLETA
  2.1 usePetStore + petActions + utils  ✅
  2.2 Economia integrada no fluxo       ✅
  2.3 PetDisplay (visual do bichinho)   ✅
  2.4 PetHub (nova tela principal)      ✅
  2.5 Streak + troféu + rescue          ✅

Audit de Bugs:                          ✅ COMPLETO
  Bugs runtime (4 críticos)             ✅
  Erros TypeScript (16 → 0)            ✅
  Build limpo (npx vite build)          ✅

Sprint 4 (polimento):
  4.1 Subtração no fluxo                ✅
  4.2 Testes automatizados              ✅
  4.3 Acessibilidade                    ✅
```

---

## Princípio Guia

> A cada etapa o app deve estar **usável**. Depois da Sprint 2.2, uma criança já ganha moedas de verdade. Depois da 2.4, o loop completo de pet funciona. Assets provisórios são aceitáveis — substituir depois.

---

**Última atualização**: 2026-02-21 (Sprint 5 especificada: multi-dígitos 5.1 + sede 5.2)
