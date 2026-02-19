import { useRef, useCallback } from 'react';
import { DrawingCanvasHandle } from '../components/canvas';

/**
 * Hook para gerenciar estado e operações do DrawingCanvas
 *
 * @example
 * ```tsx
 * const { canvasRef, clear, isEmpty, getImageData } = useDrawingCanvas();
 *
 * return (
 *   <>
 *     <DrawingCanvas ref={canvasRef} />
 *     <button onClick={clear}>Limpar</button>
 *   </>
 * );
 * ```
 */
export function useDrawingCanvas() {
  const canvasRef = useRef<DrawingCanvasHandle>(null);

  const clear = useCallback(() => {
    canvasRef.current?.clear();
  }, []);

  const isEmpty = useCallback((): boolean => {
    return canvasRef.current?.isEmpty() ?? true;
  }, []);

  const getImageData = useCallback((): string | null => {
    return canvasRef.current?.getImageData() ?? null;
  }, []);

  return {
    canvasRef,
    clear,
    isEmpty,
    getImageData,
  };
}
