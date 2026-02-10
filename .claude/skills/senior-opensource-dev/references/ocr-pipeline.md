# Pipeline de OCR com TensorFlow.js + MNIST

Esta é a integração mais delicada do projeto. Siga este fluxo rigorosamente.

## Arquitetura do Pipeline

```
[Canvas de Desenho] → [Botão Enviar] → [Pré-processamento] → [Inferência MNIST] → [Resultado]
```

O reconhecimento só acontece quando a criança aperta o botão de enviar — nunca em tempo real.

## Pré-processamento (crítico para acurácia)

1. **Captura**: Extraia o conteúdo do canvas como ImageData
2. **Bounding box**: Encontre os limites do traço desenhado (crop do espaço vazio)
3. **Centralização**: Centralize o dígito no frame (MNIST espera dígitos centralizados)
4. **Redimensionamento**: Escale para 28×28 pixels usando interpolação bilinear
5. **Normalização**: Converta para escala de cinza, inverta (fundo preto, traço branco), normalize [0,1]
6. **Tensor**: Converta para tensor `[1, 28, 28, 1]` para alimentar o modelo

Para estas operações de imagem, use as utilidades nativas do TensorFlow.js (`tf.image.resizeBilinear`, `tf.browser.fromPixels`) ao invés de escrever manipulação de pixel manual.

## Modelo

- Carregue um modelo MNIST pré-treinado no formato TensorFlow.js (layers model) a partir de CDN pública ou inclua os arquivos de peso no projeto
- Use `tf.loadLayersModel()` para carregar
- A inferência retorna um array de 10 probabilidades (dígitos 0-9) — pegue o `argMax`

## Múltiplos Dígitos

Para respostas com mais de um dígito (ex: "42", "128"):

- Implemente **segmentação por bounding box**: detecte clusters de pixels separados horizontalmente
- Aplique o pipeline de pré-processamento e inferência para cada dígito isolado
- Concatene os resultados na ordem esquerda → direita

## Fallback

Sempre ofereça um fallback com input numérico (teclado) caso o OCR falhe repetidamente. A experiência da criança não pode travar por causa de reconhecimento incorreto.
