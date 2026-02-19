import { useRef, useEffect, forwardRef, useImperativeHandle, useState, useCallback } from 'react';
import { Box, Text } from '@mantine/core';
import { getStroke } from 'perfect-freehand';

export interface DrawingCanvasHandle {
  clear: () => void;
  isEmpty: () => boolean;
  getImageData: () => string | null;
  getCanvasElement: () => HTMLCanvasElement | null;
}

interface DrawingCanvasProps {
  width?: number | string;
  height?: number | string;
  onDrawStart?: () => void;
  onDrawEnd?: () => void;
  onDrawingChange?: (hasContent: boolean) => void;
}

interface Point {
  x: number;
  y: number;
  pressure?: number;
}

type Stroke = Point[];

const DrawingCanvas = forwardRef<DrawingCanvasHandle, DrawingCanvasProps>(
  ({ width = '100%', height = 300, onDrawStart, onDrawEnd, onDrawingChange }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const [strokes, setStrokes] = useState<Stroke[]>([]);
    const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);

    // Renderiza um stroke usando perfect-freehand
    const renderStroke = useCallback((ctx: CanvasRenderingContext2D, points: Point[]) => {
      if (points.length < 2) return;

      const stroke = getStroke(points, {
        size: 8, // Espessura mínima 8px
        thinning: 0.5,
        smoothing: 0.5,
        streamline: 0.5,
        easing: (t) => t,
        start: {
          taper: 0,
          cap: true,
        },
        end: {
          taper: 0,
          cap: true,
        },
      });

      ctx.fillStyle = '#000000'; // Cor preta fixa
      ctx.beginPath();

      if (stroke.length > 0) {
        ctx.moveTo(stroke[0][0], stroke[0][1]);
        for (let i = 1; i < stroke.length; i++) {
          ctx.lineTo(stroke[i][0], stroke[i][1]);
        }
        ctx.closePath();
        ctx.fill();
      }
    }, []);

    // Expõe métodos via ref
    useImperativeHandle(ref, () => ({
      clear: () => {
        setStrokes([]);
        setCurrentStroke([]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const dpr = window.devicePixelRatio || 1;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.scale(dpr, dpr);
          }
        }
        onDrawingChange?.(false);
      },
      isEmpty: () => {
        return strokes.length === 0 && currentStroke.length === 0;
      },
      getImageData: () => {
        if (strokes.length === 0) {
          return null;
        }
        return canvasRef.current?.toDataURL('image/png') ?? null;
      },
      getCanvasElement: () => {
        return canvasRef.current;
      },
    }));

    // Ajusta o canvas ao tamanho do container, escalando por devicePixelRatio
    useEffect(() => {
      const handleResize = () => {
        if (canvasRef.current && containerRef.current) {
          const canvas = canvasRef.current;
          const container = containerRef.current;
          const rect = container.getBoundingClientRect();
          const dpr = window.devicePixelRatio || 1;

          // Salva strokes antes de redimensionar
          const savedStrokes = [...strokes];

          // Resolução interna = CSS pixels × DPR (para crisp rendering)
          const cssWidth = rect.width;
          const cssHeight = typeof height === 'number' ? height : rect.height;
          canvas.width = cssWidth * dpr;
          canvas.height = cssHeight * dpr;

          // CSS mantém o tamanho visual (o canvas não "cresce" na tela)
          canvas.style.width = `${cssWidth}px`;
          canvas.style.height = `${cssHeight}px`;

          // Escala o contexto para que coordenadas CSS mapeiem 1:1
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(dpr, dpr);
            ctx.clearRect(0, 0, cssWidth, cssHeight);
            savedStrokes.forEach((stroke) => renderStroke(ctx, stroke));
          }
        }
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [height, strokes, renderStroke]);

    // Redesenha todos os strokes quando currentStroke muda
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;

      // Reset transform, limpa, reaplica scale
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.scale(dpr, dpr);

      // Desenha todos os strokes finalizados
      strokes.forEach((stroke) => renderStroke(ctx, stroke));

      // Desenha o stroke atual (em progresso)
      if (currentStroke.length > 0) {
        renderStroke(ctx, currentStroke);
      }
    }, [strokes, currentStroke, renderStroke]);

    // Handlers de desenho
    const getPointerPosition = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0, pressure: 0.5 };

      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        pressure: e.pressure || 0.5,
      };
    };

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      setIsDrawing(true);
      const point = getPointerPosition(e);
      setCurrentStroke([point]);
      onDrawStart?.();
    };

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      e.preventDefault();
      const point = getPointerPosition(e);
      setCurrentStroke((prev) => [...prev, point]);
    };

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      e.preventDefault();
      setIsDrawing(false);

      if (currentStroke.length > 0) {
        const finalStroke = [...currentStroke, getPointerPosition(e)];
        setStrokes((prev) => [...prev, finalStroke]);
        setCurrentStroke([]);
        onDrawEnd?.();
        onDrawingChange?.(true);
      }
    };

    const handlePointerLeave = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawing) return;
      handlePointerUp(e);
    };

    return (
      <Box
        ref={containerRef}
        data-testid="drawing-canvas-container"
        style={{
          width,
          height,
          border: '3px solid #4A90E2',
          borderRadius: '12px',
          position: 'relative',
          background: '#FFFFFF',
          touchAction: 'none', // Previne scroll ao desenhar
          overflow: 'hidden',
        }}
      >
        {/* Label "Escreva aqui" */}
        {strokes.length === 0 && currentStroke.length === 0 && (
          <Box
            style={{
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            <Text
              size="xl"
              c="gray.4"
              fw={500}
              style={{
                userSelect: 'none',
                opacity: 0.5,
              }}
            >
              ✏️ Escreva aqui
            </Text>
          </Box>
        )}

        {/* Canvas de desenho */}
        <canvas
          ref={canvasRef}
          data-testid="drawing-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            borderRadius: '12px',
            cursor: 'crosshair',
          }}
        />
      </Box>
    );
  }
);

DrawingCanvas.displayName = 'DrawingCanvas';

export default DrawingCanvas;
