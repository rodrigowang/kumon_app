# Guia de Sprites e Animações do Pet

## Onde ficam as figuras

```
src/assets/sprites/
├── pet_happy.gif          ← Pet feliz (estado padrão)
├── pet_hungry.gif         ← Pet com fome / sede / fome+sede
├── pet_eating.gif         ← Pet comendo/bebendo (temporário, 1.2s)
└── pet_sick.gif           ← Pet doente
```

---

## Especificações técnicas das figuras

| Propriedade | Valor obrigatório |
|-------------|-------------------|
| **Formato** | GIF animado (.gif) |
| **Dimensões** | 200 × 200 pixels |
| **Fundo** | Transparente (recomendado) |
| **Framerate** | Livre — o browser controla a velocidade |
| **Loop** | Loop infinito (exceto `pet_eating.gif`, ver abaixo) |

> **Por que GIF?** O browser reproduz GIFs nativamente, sem código extra. A animação começa automaticamente quando a imagem aparece na tela.

---

## Estados do pet e qual GIF é usado

| Estado | GIF usado | Quando acontece |
|--------|-----------|-----------------|
| `happy` | `pet_happy.gif` | Pet alimentado e hidratado nas últimas 12h |
| `hungry` | `pet_hungry.gif` | Sem comida há 12–24h (mas tem água) |
| `thirsty` | `pet_hungry.gif` | Sem água há 12–24h (mas tem comida) |
| `hungry_and_thirsty` | `pet_hungry.gif` | Sem comida E sem água há 12–24h |
| `sick` | `pet_sick.gif` | Sem comida OU sem água há mais de 24h |
| `eating` | `pet_eating.gif` | Temporário: 1.2 segundos após alimentar/hidratar |

> **Nota:** Os estados `hungry`, `thirsty` e `hungry_and_thirsty` usam o mesmo GIF. A distinção visual vem da cor da borda e do fundo do quadro (configurado em código).

---

## Como trocar uma figura existente

1. Prepare o novo GIF (200×200px, loop infinito)
2. Renomeie com o **mesmo nome** do arquivo original:
   - `pet_happy.gif`, `pet_hungry.gif`, `pet_eating.gif` ou `pet_sick.gif`
3. Substitua o arquivo em `src/assets/sprites/`
4. Rode `npx vite build` para verificar que não quebrou nada

Nenhuma alteração de código é necessária — o nome do arquivo é o contrato.

---

## Como criar uma nova animação (novo estado)

Exemplo: adicionar um estado `sleeping` para quando o pet está dormindo.

### Passo 1 — Criar o GIF

- Dimensões: 200×200px
- Loop infinito
- Salvar como `pet_sleeping.gif` em `src/assets/sprites/`

### Passo 2 — Importar o GIF em `PetDisplay.tsx`

```typescript
// src/components/ui/PetDisplay.tsx
import petSleepingGif from '../../assets/sprites/pet_sleeping.gif'
```

### Passo 3 — Adicionar o novo estado ao tipo

```typescript
// src/lib/petActions.ts
export type PetStatus = 'happy' | 'hungry' | 'thirsty' | 'hungry_and_thirsty' | 'sick' | 'sleeping'
```

Se for um estado temporário (como `eating`), adicione ao tipo display:

```typescript
// src/components/ui/PetDisplay.tsx
export type PetDisplayStatus = PetStatus | 'eating' | 'sleeping'
```

### Passo 4 — Configurar cores e label em `PetDisplay.tsx`

```typescript
const STATUS_CONFIG: Record<PetDisplayStatus, StatusConfig> = {
  // ... estados existentes ...
  sleeping: {
    gif: petSleepingGif,
    label: 'Dormindo 😴',
    bgColor: '#EDE7F6',      // Roxo claro
    borderColor: '#9C27B0',   // Roxo
  },
}
```

### Passo 5 — Definir quando o estado ocorre

Em `src/lib/petActions.ts`, ajuste a função `derivePetStatus()` para retornar o novo estado na condição desejada.

### Passo 6 — (Opcional) Duração automática para estados temporários

Se o estado deve durar um tempo fixo (como `eating` dura 1.2s), adicione `eatingDuration` ao config:

```typescript
sleeping: {
  gif: petSleepingGif,
  label: 'Dormindo 😴',
  bgColor: '#EDE7F6',
  borderColor: '#9C27B0',
  eatingDuration: 3000,   // 3 segundos, depois volta ao estado real
}
```

---

## Estrutura do código de animação

```
src/components/ui/PetDisplay.tsx   ← Renderiza o GIF + cores + label
src/lib/petActions.ts              ← Lógica: quando cada estado ocorre
src/stores/usePetStore.ts          ← Estado global: lastFedAt, lastWateredAt
src/components/screens/PetHub.tsx  ← Tela principal: orquestra tudo
```

**Como a troca de GIF funciona:**

Quando o estado muda, o componente incrementa uma chave interna (`gifKey`). Isso força o React a desmontar e remontar a tag `<img>`, fazendo o browser reiniciar o GIF do frame 1.

---

## Dicas para criar GIFs

- **Ferramentas gratuitas:** GIMP (Linux), Pixelator, Aseprite, ou online em ezgif.com
- **Tamanho de arquivo:** ideal abaixo de 50 KB por GIF para não travar no tablet
- **Fundo transparente:** deixa o quadro colorido (definido em código) aparecer atrás do pet
- **Velocidade:** comece com 100ms por frame — ajuste ao gosto
- **Loop:** configurar como "loop forever" no exportar
- **`pet_eating.gif`:** não precisa loopar — o código corta a exibição em 1.2s mesmo

---

## Referência rápida de arquivos

| O que quer fazer | Arquivo para editar |
|------------------|---------------------|
| Trocar uma figura | `src/assets/sprites/pet_*.gif` |
| Mudar cor/borda de um estado | `src/components/ui/PetDisplay.tsx` → `STATUS_CONFIG` |
| Mudar duração do "comendo" | `src/components/ui/PetDisplay.tsx` → `eatingDuration` |
| Mudar quando o pet fica doente | `src/lib/petActions.ts` → `derivePetStatus()` |
| Adicionar novo estado | ver seção "Como criar uma nova animação" acima |
