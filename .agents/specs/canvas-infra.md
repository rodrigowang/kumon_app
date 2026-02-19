# Spec Pedagógica: Canvas de Desenho - Infra

**Feature**: 1.1.1 — Canvas de Desenho - Infra
**Status**: Aguardando implementação
**Autor**: EdTech Specialist

---

## 1. Objetivo Pedagógico

Criar a fundação técnica para o input principal da criança: **escrita à mão de dígitos matemáticos**.

Este canvas será o **ponto de contato primário** entre a criança e o app. Deve ser:
- **Imediato**: sem delay perceptível entre toque e traço.
- **Previsível**: o traço aparece exatamente onde a criança toca.
- **Confiável**: não perde traços, não congela, não perde estado.

---

## 2. Princípios Pedagógicos

### 2.1 Concrete → Pictorial → Abstract (CPA)

**Concrete**: A criança usa o **dedo** (ou stylus) como ferramenta física.
**Pictorial**: O traço visual no canvas representa o número que ela está pensando.
**Abstract**: O sistema interpretará esse traço como um dígito matemático (via OCR, futuramente).

O canvas é a **ponte entre Concrete e Pictorial**. Se essa ponte for instável, o processo CPA quebra.

### 2.2 Maestria através de Repetição

A criança escreverá **centenas de números** neste canvas. Cada interação deve:
- Ser suave e responsiva.
- Não frustrar com bugs ou comportamentos imprevisíveis.
- Encorajar a repetição ao ser agradável de usar.

### 2.3 Feedback Imediato

Embora esta task seja apenas infra, o canvas já deve fornecer **feedback visual direto**:
- O traço aparece **instantaneamente** sob o dedo.
- Apertar "Limpar" remove **tudo imediatamente**, sem animações confusas.

---

## 3. Requisitos Técnicos (Pedagógicos)

### 3.1 Área de Desenho

**R1.1**: O canvas deve ocupar **≥ 60% da largura da viewport**.
**Justificativa**: Crianças de 7 anos precisam de espaço generoso para escrever. Números pequenos causam frustração motora.

**R1.2**: O canvas deve ter **altura suficiente para 1 dígito confortável** (sugestão: 200-300px mínimo).
**Justificativa**: A criança deve conseguir escrever um "8" ou "9" sem sair da área.

**R1.3**: O canvas deve ter **borda visual clara** com o texto "Escreva aqui" (ou ícone de lápis).
**Justificativa**: Crianças de 7 anos precisam de **affordance visual explícita**. Não confie em "elas vão descobrir".

### 3.2 Resposta Tátil

**R2.1**: O traço deve aparecer **em tempo real** (< 16ms de latência perceptível).
**Justificativa**: Qualquer delay quebra a ilusão de "desenhar com o dedo" e causa frustração cognitiva.

**R2.2**: O traço deve ser **suave** e não pixelado.
**Justificativa**: Crianças associam "traço feio" com "eu não sei desenhar". Queremos que se sintam **competentes**.

### 3.3 Botão "Limpar"

**R3.1**: O botão deve ter **≥ 48px** de touch target (WCAG 2.5.5).
**R3.2**: O botão deve estar **sempre visível** e próximo ao canvas.
**R3.3**: Apertar "Limpar" deve **apagar tudo instantaneamente**, sem confirmação.
**Justificativa**: Crianças cometem erros frequentemente. O botão de limpar é uma **ferramenta de auto-correção**, não uma punição. Não adicione fricção.

**R3.4**: NÃO adicione animações de "fade out" ao limpar. Seja instantâneo.

---

## 4. Critérios de Aceitação

### Teste 1: Desenho Responsivo
- [ ] Toque no canvas e arraste o dedo.
- [ ] O traço aparece **imediatamente** e **segue o dedo sem delay**.
- [ ] O traço é **suave** (não parece uma escada de pixels).

### Teste 2: Área Confortável
- [ ] Canvas tem **≥ 60% da largura** da viewport (teste em 768px e 1024px).
- [ ] Canvas tem **altura suficiente** para escrever um "8" ou "9" de forma legível.

### Teste 3: Botão Limpar
- [ ] Botão tem **≥ 48px** de área clicável.
- [ ] Apertar "Limpar" remove **todo o conteúdo instantaneamente**.
- [ ] Botão está **visível e acessível** sem scroll.

### Teste 4: Affordance Visual
- [ ] Canvas tem **borda visível** (cor, estilo, etc.).
- [ ] Há um **label ou ícone** indicando "Escreva aqui".

---

## 5. O Que NÃO Fazer (Anti-Patterns)

### 🚫 Não adicionar "Desfazer"
**Por quê**: Para crianças de 7 anos, "Desfazer" vs "Limpar" é **cognitivamente confuso**. Menos é mais. Deixe apenas "Limpar".

### 🚫 Não adicionar confirmação ao limpar
**Por quê**: "Tem certeza?" adiciona fricção desnecessária. A criança pode redesenhar rapidamente. Confie nela.

### 🚫 Não usar canvas HTML puro sem biblioteca
**Por quê**: Canvas puro tem problemas de suavização, responsividade touch, e performance. Use `react-signature-canvas` + `perfect-freehand` conforme especificado.

### 🚫 Não adicionar cores, espessuras, ou ferramentas extra nesta fase
**Por quê**: O foco é **escrever números**, não desenhar. Mantenha a interface minimalista.

---

## 6. Referências Pedagógicas

- **Kumon Method**: Repetição incremental. O canvas deve encorajar uso repetido sem frustração.
- **Montessori**: Ferramentas devem ser "auto-corrigíveis" (botão Limpar = reset imediato).
- **WCAG 2.5.5**: Touch targets ≥ 48px para crianças e usuários com baixa precisão motora.

---

## 7. Próximos Passos (Fora do Escopo desta Task)

- **1.1.2**: Adicionar feedback visual ao tocar (mudança de cor de borda, ou similar).
- **1.1.3**: Integrar OCR para reconhecer o dígito desenhado.
- **1.2.x**: Adicionar feedback sonoro ao desenhar e limpar.

---

**Aprovação**: Esta spec deve ser seguida estritamente. Qualquer desvio requer revisão pedagógica.
