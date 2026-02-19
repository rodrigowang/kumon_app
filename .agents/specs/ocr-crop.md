# Spec: OCR - Extração e Bounding Box

## Contexto Pedagógico

Criança de 7 anos desenha números com **variação espacial enorme**: um "5" pode ocupar 10% do canvas ou 80%. Pode estar centralizado, deslocado, inclinado. O modelo de OCR precisa receber **apenas o dígito**, sem ruído de espaço vazio, para maximizar acurácia.

**Objetivo**: Preparar a imagem para reconhecimento, isolando apenas a área relevante do traço.

---

## Requisitos Técnicos (Pedagógicos)

### 1. `extractImageData(canvas: HTMLCanvasElement): ImageData`
- Captura os pixels brutos do canvas de desenho
- **Critério**: Retorna `ImageData` válido com width × height × 4 (RGBA)

### 2. `findBoundingBox(imageData: ImageData): BoundingBox | null`
- Calcula `{ x1, y1, x2, y2 }` delimitando a área com tinta (alpha > threshold)
- **Critério**: Ignora pixels vazios (transparentes). Se canvas vazio, retorna `null`.
- **Threshold sugerido**: Alpha ≥ 50 (ajustar se necessário após testes)
- **Margem de segurança**: Adicionar ~10px de padding ao redor do traço para não cortar bordas finas

### 3. `cropToDigit(canvas: HTMLCanvasElement, box: BoundingBox): HTMLCanvasElement`
- Cria um **novo canvas** contendo apenas a região `[x1, y1, x2, y2]`
- **Critério**: Canvas resultante tem dimensões `(x2-x1) × (y2-y1)`, sem espaço vazio excessivo
- **Preserve aspect ratio**: Não distorcer. Útil para próxima etapa (resize 28×28)

---

## O Que Isso Permite (Pedagógico)

✅ **Maestria real**: Reconhecimento preciso → feedback correto → criança aprende.
✅ **Equidade**: Traço pequeno ou grande, centralizado ou não, todos tratados igualmente.
✅ **Velocidade**: Modelo processa apenas área relevante, não canvas 800×600 inteiro.

---

## Anti-Patterns (NÃO fazer)

❌ **Não ignorar canvas vazio**: Se criança submeter sem desenhar, `findBoundingBox` DEVE retornar `null`. UI tratará isso com feedback gentil ("Desenhe um número primeiro!").
❌ **Não recortar agressivamente demais**: Deixar margem. Modelos OCR precisam de contexto.
❌ **Não assumir fundo branco**: Canvas pode ter transparência. Usar alpha channel, não RGB.

---

## Critérios de Aceitação

1. ✅ `findBoundingBox` retorna `null` para canvas vazio ou totalmente transparente.
2. ✅ `findBoundingBox` retorna coordenadas válidas (`x2 > x1`, `y2 > y1`) para qualquer traço visível.
3. ✅ `cropToDigit` produz canvas menor que o original (exceto se dígito preenche 100%).
4. ✅ Margem de ~10px ao redor do traço (testar visualmente: dígito não deve encostar nas bordas do crop).
5. ✅ Função pura, sem side-effects. Recebe canvas, retorna novo canvas. Original intocado.

---

## QA Deve Testar

- Dígito minúsculo no canto (criança tímida): crop deve isolar corretamente.
- Dígito gigante ocupando 90% do canvas: crop não deve falhar.
- Canvas vazio: retorna `null`, sem crash.
- Traço muito fino (linha de 1px): margem garante que não desaparece.

---

## Próxima Etapa (Não nesta task)

Após crop, resize para 28×28px (entrada do modelo MNIST). Essa task entrega apenas o crop.
