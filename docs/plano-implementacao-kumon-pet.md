# Plano de Implementação — MVP Kumon + Bichinho Virtual

## Contexto

Este documento consolida a especificação de produto e as decisões técnicas tomadas para o MVP. O objetivo é integrar o motor de reconhecimento de contas (CNN/OCR) já existente com uma mecânica de retenção baseada em um bichinho virtual (estilo Tamagotchi), usando um loop diário de estudo como gatilho de cuidado com o pet.

---

## Stack Definida

| Tecnologia | Papel |
|---|---|
| **React + Vite** | Framework principal (já em uso) |
| **PixiJS** | Renderização e animação do bichinho |
| **localStorage** | Persistência de estado no cliente |
| **Assets (itch.io)** | Sprites 2D gratuitos (licença CC0) — buscar por "virtual pet sprite" ou "tamagotchi sprite free" |

> **Decisão de produto:** sem backend de estado, sem autenticação, sem sincronização entre devices neste MVP. O estado vive inteiramente no cliente.

---

## O que está FORA deste MVP

- Anti-trapaça via Page Visibility API
- Quarto isométrico e sistema de decoração
- Sincronização entre devices / autenticação
- Múltiplos pets ou sistema de evolução
- Mapa de progressão visual

---

## Estrutura de Dados (localStorage)

Salvar um único objeto JSON sob a chave `kumon_pet_state`:

```json
{
  "coins": 0,
  "last_fed_at": 1700000000000,
  "inventory": {
    "water": 0,
    "food": 0,
    "medicine": 0
  },
  "streak": {
    "current": 0,
    "last_lesson_date": "2024-01-01"
  },
  "trophy_7days": false,
  "emergency_rescue_active": false
}
```

> **Regra crítica:** nunca salvar o status do pet (`"happy"`, `"sick"` etc.) diretamente. O status é sempre **derivado em runtime** a partir de `Date.now() - last_fed_at`. Isso evita inconsistências entre sessões.

### Regras de derivação de estado

| Tempo desde `last_fed_at` | Status | Visual |
|---|---|---|
| 0 a 24h | `happy` | Animação ociosa alegre |
| 24h a 48h | `hungry` | Estático/triste, balão de comida |
| Mais de 48h | `sick` | Deitado, loop lento |

---

## Estrutura de Pastas

```
src/
  hooks/
    usePetState.js
  lib/
    petActions.js
    streakUtils.js
    coinCalculator.js
  components/
    PetCanvas.jsx
    PetHub.jsx
    ShopPanel.jsx
    InventoryBar.jsx
    LessonSession.jsx
    LessonResult.jsx
  assets/
    sprites/
      pet_happy.png
      pet_hungry.png
      pet_sick.png
      pet_eating.png
      item_food.png
      item_water.png
      item_medicine.png
    sounds/
      correct.mp3
      wrong.mp3
```

---

## Módulos a Implementar

### 1. `usePetState` — Hook Central

Lê o localStorage e deriva o estado atual do pet. Não faz mutações.

**Retorno:**

```js
{
  status: 'happy' | 'hungry' | 'sick',
  coins: number,
  inventory: { water: number, food: number, medicine: number },
  streak: { current: number, last_lesson_date: string },
  hasTrophy: boolean
}
```

---

### 2. `petActions.js` — Funções de Mutação

Todas as funções leem e escrevem no localStorage. Sem side effects além disso.

#### `feedPet(type: 'water' | 'food' | 'medicine')`
- Recusa se `status === 'happy'`
- Consome 1 unidade do item no inventário
- Atualiza `last_fed_at = Date.now()`
- `medicine` cura qualquer estado, inclusive `sick`, e zera fome e sede

#### `buyItem(type: 'water' | 'food' | 'medicine')`
- Valida se `coins >= preço do item`
- Debita moedas
- Incrementa `inventory[type]`

Tabela de preços:

| Item | Preço | Efeito |
|---|---|---|
| Água | 4 moedas | Retorna para `happy` (somente se `hungry`) |
| Comida | 6 moedas | Retorna para `happy` (somente se `hungry`) |
| Remédio | 20 moedas | Retorna para `happy` de qualquer estado |

#### `completedLesson(coinsEarned: number)`
- Credita moedas
- Atualiza streak (ver seção de Streak)
- Verifica e aplica emergency rescue se necessário
- Verifica e desbloqueia troféu de 7 dias

---

### 3. Motor de Lição

#### `LessonSession.jsx`

Orquestra a sessão completa de 10 contas.

**Responsabilidades:**
- Apresentar 1 conta por vez
- Iniciar cronômetro individual com `performance.now()` no mount de cada conta
- Parar cronômetro no exato clique em "Enviar"
- Salvar tempo individual de cada resposta (para métricas futuras de lentidão)
- Chamar o motor OCR existente com a resposta do usuário
- Emitir `correct.mp3` ou `wrong.mp3` sem bibliotecas externas (usar `new Audio()`)
- **Sem pop-ups ou animações entre contas** — feedback apenas sonoro
- Acumular resultados em estado local React (não persiste no localStorage ainda)
- Após a 10ª conta, navegar para `LessonResult`

#### `LessonResult.jsx`

Tela de encerramento da sessão.

**Responsabilidades:**
- Exibir: acertos, tempo total, bônus alcançados, moedas ganhas
- Calcular e aplicar multiplicador de velocidade
- Chamar `completedLesson(coinsEarned)` **uma única vez** ao montar (`useEffect` com deps vazias)
- Botão "Voltar para o Quarto"

---

### 4. `coinCalculator.js` — Cálculo de Moedas

#### Ganho base por acerto

| Dificuldade | Critério | Moedas |
|---|---|---|
| Fácil | 1 dígito | 1 moeda |
| Média | 1 dígito + 2 dígitos | 3 moedas |
| Difícil | 1 dígito + 3 ou 4 dígitos | 5 moedas |

#### Multiplicador de velocidade

Se o usuário acertar **7 ou mais contas** (das 10) abaixo do **Tempo Alvo** individual de cada conta → total de moedas **×2**.

O `Tempo Alvo` deve ser uma variável configurável por nível/dificuldade definida junto ao motor de contas existente.

---

### 5. `PetCanvas.jsx` — Bichinho (PixiJS)

Componente React que monta um `<canvas>` e inicializa o PixiJS internamente.

**Props:** `status: 'happy' | 'hungry' | 'sick' | 'eating'`

**Internamente:**
- Carrega spritesheet do bichinho
- Mapeia cada status para uma `AnimatedSprite` com seus frames
- Ao receber novo `status` via prop, troca a animação ativa
- Animação `eating` é curta e volta automaticamente para `happy` ao finalizar

**Sprites necessários:**

| Estado | Tipo | Frames sugeridos |
|---|---|---|
| `happy` | Loop contínuo | 4–8 frames |
| `hungry` | Estático ou loop lento | 2–4 frames |
| `sick` | Loop lento, deitado | 4–6 frames |
| `eating` | Animação curta, não loop | 4–6 frames |

**Sprites de itens** (comida, água, remédio) — PNGs estáticos renderizados em HTML puro. Não precisam de PixiJS.

---

### 6. `PetHub.jsx` — Tela Principal

Composição:

```
<PetCanvas status={petState.status} />
<PetStatusBar coins={coins} streak={streak} hasTrophy={hasTrophy} />
<InventoryBar inventory={inventory} onUse={feedPet} petStatus={status} />
<ShopPanel onBuy={buyItem} coins={coins} />
<StartLessonButton />
```

**Regras de UI:**
- Botões de usar item do inventário **desabilitados** se `status === 'happy'`
- Loja sempre acessível
- Se `status === 'sick'` e `coins < 20` → exibir aviso: "Seu pet está doente e você não tem moedas suficientes para o remédio. Complete uma lição e ele será curado!"

---

### 7. Sistema de Streak (`streakUtils.js`)

Executado dentro de `completedLesson()`:

```js
const today = new Date().toDateString()
const last = streak.last_lesson_date

// Não altera streak se já completou uma lição hoje
if (last === today) return

const yesterday = new Date(Date.now() - 86400000).toDateString()
streak.current = (last === yesterday) ? streak.current + 1 : 1
streak.last_lesson_date = today

if (streak.current >= 7 && !trophy_7days) {
  trophy_7days = true
  // Sinalizar para o Hub exibir o troféu
}
```

O troféu de 7 dias é um asset fixo exibido no hub. Sem lógica adicional neste MVP.

---

### 8. Sistema de Resgate de Emergência

Verificado dentro de `completedLesson()`, **antes** de creditar as moedas:

```
SE pet.status === 'sick' E coins < 20:
  → Injetar 1 remédio automaticamente no inventário
  → Aplicar feedPet('medicine')
  → Exibir mensagem na LessonResult: "Seu pet foi curado com um kit de emergência!"
```

> Isso garante que nenhuma criança fique presa sem poder curar o pet por falta de moedas.

---

## Ordem de Implementação Recomendada

1. **localStorage + `usePetState` + `petActions`**
   Base de tudo. Testar as funções diretamente no console do browser antes de tocar em UI.

2. **`PetCanvas` com PixiJS**
   Colocar o bichinho na tela com as 3 animações principais funcionando. Validar troca de estado via props.

3. **`PetHub`**
   Montar o hub completo: loja, inventário e interação com o pet funcionando end-to-end.

4. **Motor de lição (`LessonSession` + `LessonResult`)**
   Integrar com o OCR existente, cronômetro, sons e cálculo de moedas.

5. **Fechar o loop econômico**
   Garantir que moedas ganhas na lição chegam corretamente ao inventário e que a loja funciona.

6. **Streak + troféu**
   Última peça. Só depois que o loop principal estiver estável.

---

## Notas Finais para o Dev

- **Não persista o status do pet** — sempre derive de `last_fed_at`.
- **`completedLesson()` deve ser idempotente por sessão** — chamar uma vez só, no mount de `LessonResult`.
- **Sons sem biblioteca** — `new Audio('correct.mp3').play()` é suficiente.
- **PixiJS só para o bichinho** — o resto da UI é React/HTML normal.
- A variável **Tempo Alvo** por conta precisa ser definida junto ao motor de contas existente antes de implementar o multiplicador de velocidade.
