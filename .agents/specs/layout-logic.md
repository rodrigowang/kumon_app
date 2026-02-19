# Spec: Layout Tela de Exercício - Componentes e Estado

## 1. Requisitos Pedagógicos

### 1.1 Clareza Visual (CPA - Concrete)
- A **conta** (ex: `3 + 4 = ?`) deve ser o elemento mais proeminente da tela
- Tamanho mínimo: **32px** (fonte grande o suficiente para leitura confortável)
- Posicionamento: topo da tela, centralizado, com espaçamento generoso
- Contraste alto (preto sobre branco ou vice-versa)

### 1.2 Canvas de Desenho (CPA - Concrete → Pictorial)
- Área de desenho deve ocupar pelo menos 60% da altura visível
- Traços visíveis e grossos (≥ 3px) para dar feedback imediato
- Cor do traço: azul ou preto (evitar cores que se confundem com feedback)
- Background branco ou levemente amarelado (papel)

### 1.3 Botões de Ação (Maestria e Autonomia)

#### Botão **Limpar**
- Touch target: **≥ 48px**
- Ícono: borracha ou X (símbolo universal)
- Posicionamento: lateral ou abaixo do canvas, mas sempre visível
- Cor: neutro (cinza claro), sem chamar atenção excessiva
- Estado: sempre habilitado (permitir limpar mesmo canvas vazio)

**Porquê**: Crianças precisam de controle total. Errar e recomeçar é parte da maestria.

#### Botão **Enviar**
- Touch target: **≥ 64px** (maior que Limpar — ação primária)
- Ícone: ✓ (check) + label "Enviar" (opcional, mas recomendado)
- Posicionamento: abaixo do canvas, centralizado, destaque visual
- Cor: verde quando ativo, cinza quando desabilitado

**Lógica de Estados**:

| Estado | Condição | Aparência | Comportamento |
|--------|----------|-----------|---------------|
| **Desabilitado** | Canvas vazio (nenhum traço detectado) | Cinza, sem hover | Não responde a toque |
| **Pronto** | Traço detectado no canvas | Verde vibrante, com hover/press | Aciona pipeline OCR |
| **Processando** | Pipeline OCR rodando | Loading spinner, texto "Analisando..." | Não responde a toque |

**Porquê**:
- Canvas vazio → botão desabilitado evita frustração ("tentei enviar mas nada aconteceu")
- Estado "Processando" dá feedback imediato: "estou trabalhando na sua resposta"
- Verde vibrante = convite visual ("agora você pode enviar!")

### 1.4 Feedback de Transição (CPA - Abstract → Feedback)
- Transição de "Desabilitado" → "Pronto" deve ser **instantânea e visível**
- Sugestão: animação sutil (fade-in da cor verde, ou brilho leve)
- Transição "Pronto" → "Processando": loading spinner suave (não hipnótico)
- Duração esperada de processamento: ≤ 2 segundos (se ultrapassar, adicionar mensagem "quase lá...")

**Porquê**: Crianças de 7 anos têm atenção limitada. Feedback visual contínuo mantém engajamento.

---

## 2. Critérios de Aceitação

### CA1: Display da Conta
- [ ] Conta renderizada em fonte ≥ 32px
- [ ] Centralizada no topo, com margin-bottom ≥ 24px
- [ ] Contraste WCAG AA (4.5:1 mínimo)

### CA2: Canvas de Desenho
- [ ] Integração com `<DrawingCanvas />` (componente da Task 1.3)
- [ ] Área visível ocupa ≥ 60% da altura da tela
- [ ] Traços renderizados com largura ≥ 3px
- [ ] Background branco ou #FFFEF0 (papel)

### CA3: Botão Limpar
- [ ] Touch target ≥ 48px × 48px
- [ ] Ícone de borracha ou X
- [ ] Sempre habilitado
- [ ] Aciona `canvasRef.current.clear()` (via ref exposta pelo DrawingCanvas)

### CA4: Botão Enviar - Estados
- [ ] Touch target ≥ 64px × 64px
- [ ] **Desabilitado** quando canvas vazio:
  - Cor cinza (#CCCCCC)
  - Cursor: not-allowed
  - `disabled={true}`
- [ ] **Pronto** quando traço detectado:
  - Cor verde (#4CAF50 ou similar)
  - Cursor: pointer
  - Animação sutil ao ativar (fade-in 200ms)
- [ ] **Processando** quando OCR rodando:
  - Loading spinner (chakra-ui `<Spinner />` ou similar)
  - Texto "Analisando..." abaixo do spinner
  - `disabled={true}`
  - Cor verde mantida, mas com opacity 0.7

### CA5: Lógica de Detecção de Traço
- [ ] Canvas vazio = nenhum evento de desenho registrado
- [ ] Traço detectado = pelo menos 1 stroke no canvas
- [ ] Estado persiste até ação Limpar ou novo exercício

### CA6: Data-testid
- [ ] `data-testid="exercise-screen"` no container principal
- [ ] `data-testid="exercise-prompt"` no display da conta
- [ ] `data-testid="drawing-canvas"` no canvas
- [ ] `data-testid="clear-button"` no botão Limpar
- [ ] `data-testid="submit-button"` no botão Enviar

---

## 3. O Que NÃO Fazer

### 🚫 Anti-pattern 1: Botão Enviar sempre habilitado
- **Problema**: Criança envia canvas vazio → erro confuso → frustração
- **Solução**: Desabilitar botão até traço detectado

### 🚫 Anti-pattern 2: Sem feedback durante processamento
- **Problema**: Criança toca "Enviar" → nada acontece visivelmente → toca 10x seguidas
- **Solução**: Estado "Processando" com spinner + texto

### 🚫 Anti-pattern 3: Botão Limpar desabilitado quando canvas vazio
- **Problema**: Criança não entende por que "sumiu" o botão
- **Solução**: Sempre habilitado (limpar canvas vazio é operação válida e inofensiva)

### 🚫 Anti-pattern 4: Conta muito pequena ou mal posicionada
- **Problema**: Criança não vê claramente o que deve resolver
- **Solução**: Fonte grande (≥ 32px), topo centralizado, espaçamento generoso

### 🚫 Anti-pattern 5: Traços muito finos (≤ 2px)
- **Problema**: Feedback visual fraco, criança não vê o que escreveu
- **Solução**: Traços ≥ 3px (idealmente 4-5px)

---

## 4. Referências Técnicas

- **Task 1.3**: DrawingCanvas implementado (API de ref com método `.clear()`)
- **Task 1.5**: Pipeline OCR (hook `useOCRModel` e função `cropAndPredict`)
- **Store**: `useGameStore` gerencia estado do exercício atual e score

### Integração com Store
```typescript
// Pseudocódigo
const currentExercise = useGameStore(state => state.currentExercise);
const [isProcessing, setIsProcessing] = useState(false);

const handleSubmit = async () => {
  setIsProcessing(true);
  const result = await cropAndPredict(canvasElement);
  // ... validação e feedback
  setIsProcessing(false);
};
```

---

## 5. Validação Pedagógica

### Alinhamento Kumon
- ✅ **Autonomia**: Criança controla quando limpar e quando enviar
- ✅ **Maestria**: Feedback imediato (botão muda de cor quando pronto)
- ✅ **Baixo atrito**: Estados claros evitam confusão e re-tentativas desnecessárias

### Alinhamento CPA
- **Concrete**: Conta grande e clara (números concretos)
- **Pictorial**: Canvas como representação visual da resposta
- **Abstract**: Lógica de estados prepara transição para feedback correto/incorrectodo (Task 1.7)

---

**Fim da spec. Próximo passo**: Dev implementa. QA testa cenários edge (canvas vazio, traço + limpar + novo traço, toques repetidos no botão desabilitado).
