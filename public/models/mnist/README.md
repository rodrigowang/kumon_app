# Modelo MNIST para OCR

Este diretório deve conter os arquivos do modelo TensorFlow.js pré-treinado para reconhecimento de dígitos manuscritos (0-9).

## Arquivos necessários

- `model.json` - Arquitetura do modelo
- `group1-shard1of1.bin` (ou similar) - Pesos do modelo

## Como obter o modelo

### Opção 1: Treinar localmente (Python + TensorFlow)

```python
import tensorflow as tf

# Carregar dataset MNIST
mnist = tf.keras.datasets.mnist
(x_train, y_train), (x_test, y_test) = mnist.load_data()
x_train, x_test = x_train / 255.0, x_test / 255.0

# Criar modelo simples
model = tf.keras.models.Sequential([
    tf.keras.layers.Reshape((28, 28, 1), input_shape=(28, 28)),
    tf.keras.layers.Conv2D(32, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Conv2D(64, (3, 3), activation='relu'),
    tf.keras.layers.MaxPooling2D((2, 2)),
    tf.keras.layers.Flatten(),
    tf.keras.layers.Dense(128, activation='relu'),
    tf.keras.layers.Dropout(0.2),
    tf.keras.layers.Dense(10, activation='softmax')
])

model.compile(optimizer='adam',
              loss='sparse_categorical_crossentropy',
              metrics=['accuracy'])

# Treinar
model.fit(x_train, y_train, epochs=5, validation_split=0.2)

# Converter para TensorFlow.js
import tensorflowjs as tfjs
tfjs.converters.save_keras_model(model, './mnist-model')
```

Depois copie os arquivos de `./mnist-model/` para este diretório.

### Opção 2: Usar modelo pré-treinado

Baixe de um repositório público:
- TensorFlow Hub: https://tfhub.dev/
- Repositórios GitHub com modelos MNIST convertidos

### Opção 3: Usar CDN (não recomendado para produção)

Se preferir não hospedar localmente, edite `src/hooks/useOCRModel.ts`:

```typescript
// Exemplo com jsDelivr
const MNIST_MODEL_URL = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mnist@1.0.0/model.json';
```

**⚠️ Atenção**: CDN externo requer conexão com internet. Para uso offline, prefira hospedar localmente.

## Validação

Após colocar os arquivos, teste acessando:
- http://localhost:5173/models/mnist/model.json (deve retornar JSON válido)
- http://localhost:5173/models/mnist/group1-shard1of1.bin (deve baixar arquivo binário)

## Cache offline

O Service Worker (configurado em `vite.config.ts`) automaticamente cacheia estes arquivos para uso offline após o primeiro carregamento.
