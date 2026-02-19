/**
 * Hook para carregamento e gerenciamento do modelo OCR (MNIST)
 *
 * Responsabilidades:
 * - Carrega o modelo TensorFlow.js via CDN
 * - Gerencia estados de loading/error
 * - Integra com Service Worker para cache offline
 * - Expõe o modelo para uso em outros componentes
 *
 * Uso:
 * ```tsx
 * const { model, isLoading, error } = useOCRModel();
 *
 * if (isLoading) return <Loading />;
 * if (error) return <Error message={error} />;
 * if (!model) return null;
 *
 * // Usar model.predict(tensor) para inferência
 * ```
 */

import { useState, useEffect } from 'react';
import * as tf from '@tensorflow/tfjs';

interface OCRModelState {
  model: tf.LayersModel | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * URL do modelo MNIST pré-treinado
 *
 * Opções:
 * 1. Hospedar localmente em /public/models/mnist/model.json
 * 2. Usar CDN público (jsDelivr, unpkg, etc)
 * 3. Usar TensorFlow Hub
 *
 * IMPORTANTE: Este path deve corresponder ao configurado em vite.config.ts
 * para o cache do Service Worker (urlPattern: /\/models\/.*\.(bin|json)$/i)
 */
const MNIST_MODEL_URL = '/models/mnist/model.json';

/**
 * Hook que carrega e gerencia o modelo OCR (MNIST)
 *
 * @returns {OCRModelState} Estado do modelo com { model, isLoading, error }
 */
export const useOCRModel = (): OCRModelState => {
  const [state, setState] = useState<OCRModelState>({
    model: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      try {
        // Log para debug do carregamento
        console.log('[useOCRModel] Iniciando carregamento do modelo MNIST...');
        console.log('[useOCRModel] URL:', MNIST_MODEL_URL);

        // TensorFlow.js automaticamente usa cache do navegador
        // O Service Worker (configurado em vite.config.ts) garante
        // que o modelo seja cacheado para uso offline
        const loadedModel = await tf.loadLayersModel(MNIST_MODEL_URL);

        // Validar que o modelo foi carregado corretamente
        if (!loadedModel) {
          throw new Error('Modelo carregado mas retornou null');
        }

        console.log('[useOCRModel] Modelo carregado com sucesso!');
        console.log('[useOCRModel] Input shape:', loadedModel.inputs[0].shape);
        console.log('[useOCRModel] Output shape:', loadedModel.outputs[0].shape);

        // Warmup: fazer uma predição dummy para compilar o modelo
        // Isso melhora a performance da primeira predição real
        const dummyInput = tf.zeros([1, 28, 28, 1]);
        loadedModel.predict(dummyInput);
        dummyInput.dispose();
        console.log('[useOCRModel] Warmup concluído');

        if (isMounted) {
          setState({
            model: loadedModel,
            isLoading: false,
            error: null,
          });
        }
      } catch (err) {
        console.error('[useOCRModel] Erro ao carregar modelo:', err);

        // Mensagens de erro amigáveis
        let errorMessage = 'Erro ao carregar o modelo de reconhecimento';

        if (err instanceof Error) {
          // Casos específicos de erro
          if (err.message.includes('404') || err.message.includes('Not Found')) {
            errorMessage = 'Modelo não encontrado. Verifique se os arquivos estão em /public/models/mnist/';
          } else if (err.message.includes('NetworkError') || err.message.includes('fetch')) {
            errorMessage = 'Erro de rede ao carregar modelo. Verifique sua conexão.';
          } else if (err.message.includes('JSON')) {
            errorMessage = 'Formato do modelo inválido. Verifique os arquivos model.json e *.bin';
          } else {
            errorMessage = `Erro ao carregar modelo: ${err.message}`;
          }
        }

        if (isMounted) {
          setState({
            model: null,
            isLoading: false,
            error: errorMessage,
          });
        }
      }
    };

    loadModel();

    // Cleanup: liberar recursos se o componente for desmontado
    return () => {
      isMounted = false;
      // Nota: NÃO fazemos dispose do modelo aqui porque ele pode
      // ser usado por outros componentes. O modelo será liberado
      // automaticamente quando o app for fechado.
    };
  }, []);

  return state;
};

/**
 * Tipo exportado para facilitar uso em outros componentes
 */
export type { OCRModelState };
