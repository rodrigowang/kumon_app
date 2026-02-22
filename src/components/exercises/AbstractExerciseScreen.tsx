/**
 * Tela de Exercício - Fase Abstrata
 *
 * Integração completa:
 * - Gerador de problemas (generateProblem)
 * - Detector de hesitação (HesitationTimer)
 * - OCR real (predictNumber) com fallback teclado e timeout 5s
 * - Algoritmo de maestria (MasteryTracker)
 * - Sons (useSound): acerto toca som e avança, erro mostra correção inline
 * - Overlays de confirmação/retry OCR com fallback teclado
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Flex, Text, Button, Group, Loader } from '@mantine/core';
import * as tf from '@tensorflow/tfjs';
import DrawingCanvas, { DrawingCanvasHandle } from '../canvas/DrawingCanvas';
import type { FeedbackType } from '../ui/FeedbackOverlay';
import { OCRConfirmationOverlay } from '../ui/OCRConfirmationOverlay.simple';
import { OCRRetryOverlay } from '../ui/OCRRetryOverlay.simple';
import { NumericKeypadOverlay } from '../ui/NumericKeypadOverlay';
import { LevelBadge } from '../ui/LevelBadge';
import { LevelChangeNotification } from '../ui/LevelChangeNotification';
import { generateProblem } from '../../lib/math';
import { HesitationTimer } from '../../lib/progression';
import { predictNumber } from '../../utils/ocr/predict';
import { useSound } from '../../hooks';
import { useGameStore, SESSION_SIZE } from '../../stores/useGameStore';
import type { Problem, ExerciseResult, MasteryLevel } from '../../types';

interface AbstractExerciseScreenProps {
  /** Modelo OCR carregado (de useOCRModel) */
  ocrModel?: tf.LayersModel | null;
  /** Callback quando exercício for validado (correto/incorreto) - opcional para compatibilidade */
  onValidated?: (correct: boolean, userAnswer: number, correctAnswer: number) => void;
  /** Simulação de OCR (para desenvolvimento sem modelo) */
  mockOCR?: boolean;
  /** Callback quando a sessão de 10 exercícios terminar */
  onSessionComplete?: () => void;
}

type OCRState =
  | { phase: 'idle' }
  | { phase: 'processing' }
  | { phase: 'confirmation'; recognizedNumber: number; confidence: number }
  | { phase: 'retry' }
  | { phase: 'keypad' };

/**
 * Determina o tipo de feedback baseado em streak e erros consecutivos
 */
function determineFeedbackType(
  correct: boolean,
  consecutiveCorrect: number,
  consecutiveErrors: number,
  hadPreviousErrors: boolean,
): FeedbackType {
  if (correct) {
    if (consecutiveCorrect >= 10) return 'streak-10';
    if (consecutiveCorrect >= 5) return 'streak-5';
    if (hadPreviousErrors) return 'correct-after-errors';
    return 'correct';
  }

  if (consecutiveErrors >= 5) return 'error-regress';
  if (consecutiveErrors >= 3) return 'error-learning';
  return 'error-gentle';
}


export default function AbstractExerciseScreen({
  ocrModel,
  onValidated,
  mockOCR = false,
  onSessionComplete,
}: AbstractExerciseScreenProps) {
  // Estado global da store
  const currentLevel = useGameStore((state) => state.currentLevel);
  const submitExercise = useGameStore((state) => state.submitExercise);
  const sessionRound = useGameStore((state) => state.sessionRound);
  const isSessionComplete = useGameStore((state) => state.isSessionComplete);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const timerRef = useRef(new HesitationTimer());

  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [previousProblemId, setPreviousProblemId] = useState<string | undefined>(undefined);
  const [hasDrawing, setHasDrawing] = useState(false);

  // OCR state machine
  const [ocrState, setOcrState] = useState<OCRState>({ phase: 'idle' });
  // Contador de retries OCR consecutivos (por exercício)
  const [ocrRetryCount, setOcrRetryCount] = useState(0);

  // Correção inline (mostra resposta correta quando erra)
  const [showingCorrection, setShowingCorrection] = useState<{
    correctAnswer: number;
    userAnswer: number;
  } | null>(null);

  // Streak tracking
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [hadErrorsInSession, setHadErrorsInSession] = useState(false);

  // Sons
  const { playCorrect, playWrong, playCelebration } = useSound();

  // Atalhos de teclado globais na tela de exercício
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar quando um overlay está aberto
      if (ocrState.phase !== 'idle') return;
      if (showingCorrection) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleContinueAfterError();
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' && hasDrawing) {
        e.preventDefault();
        handleSubmit();
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        handleOpenKeypad();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ocrState.phase, showingCorrection, hasDrawing]);

  // Guardar a análise de hesitação para uso após confirmação OCR
  const pendingHesitationRef = useRef<ReturnType<HesitationTimer['stop']> | null>(null);

  // Notificação de mudança de nível
  const [levelChangeNotification, setLevelChangeNotification] = useState<{
    oldLevel: MasteryLevel;
    newLevel: MasteryLevel;
  } | null>(null);
  const previousLevelRef = useRef<MasteryLevel>(currentLevel);

  // Animações de transição
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionType, setTransitionType] = useState<'normal' | 'level-change' | 'session-end'>('normal');
  const levelChangedRef = useRef(false);

  // Gerar novo problema quando nível muda
  useEffect(() => {
    const problem = generateProblem(currentLevel, previousProblemId);
    setCurrentProblem(problem);
    setPreviousProblemId(problem.id);

    // Iniciar timer de hesitação
    timerRef.current.start();

    // Reset estado completo (incluindo canvas visual)
    canvasRef.current?.clear();
    setHasDrawing(false);
    setOcrState({ phase: 'idle' });
    setOcrRetryCount(0);
    setShowingCorrection(null);
    pendingHesitationRef.current = null;
  }, [currentLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Detectar mudança de nível e mostrar notificação
  useEffect(() => {
    const previousLevel = previousLevelRef.current;

    // Comparar nível atual com anterior
    if (
      previousLevel.operation !== currentLevel.operation ||
      previousLevel.maxResult !== currentLevel.maxResult
    ) {
      // Nível mudou - mostrar notificação e marcar para animação especial
      setLevelChangeNotification({
        oldLevel: previousLevel,
        newLevel: currentLevel,
      });
      levelChangedRef.current = true;
    }

    // Atualizar referência
    previousLevelRef.current = currentLevel;
  }, [currentLevel]);

  const handleDrawingChange = useCallback((hasContent: boolean) => {
    setHasDrawing(hasContent);
    if (hasContent) {
      timerRef.current.recordInteraction();
    }
  }, []);

  const handleClear = () => {
    canvasRef.current?.clear();
    setHasDrawing(false);
    timerRef.current.recordInteraction();
  };

  /**
   * Avança para o próximo problema
   */
  const advanceToNext = useCallback(() => {
    if (!currentProblem) return;

    // Determinar tipo de transição
    const sessionComplete = isSessionComplete();
    const levelChanged = levelChangedRef.current;

    const type: 'normal' | 'level-change' | 'session-end' = sessionComplete
      ? 'session-end'
      : levelChanged
      ? 'level-change'
      : 'normal';

    setTransitionType(type);

    // Duração da transição (ms)
    const duration = type === 'level-change' ? 600 : type === 'session-end' ? 800 : 300;

    // Fase 1: Fade out
    setIsTransitioning(true);

    // Fase 2: Após fade out, atualizar conteúdo
    setTimeout(() => {
      if (sessionComplete) {
        // Fim de sessão - callback para App.tsx
        onSessionComplete?.();
      } else {
        // Próximo exercício
        const nextProblem = generateProblem(currentLevel, currentProblem.id);
        setCurrentProblem(nextProblem);
        setPreviousProblemId(nextProblem.id);

        canvasRef.current?.clear();
        setHasDrawing(false);
        setShowingCorrection(null);
        setOcrState({ phase: 'idle' });
        setOcrRetryCount(0);
        pendingHesitationRef.current = null;

        timerRef.current.start();

        // Reset flag de mudança de nível
        levelChangedRef.current = false;

        // Fase 3: Fade in
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }
    }, duration);
  }, [currentLevel, currentProblem, isSessionComplete, onSessionComplete]);

  /**
   * Processa o resultado final (chamada após OCR aceito ou confirmado)
   */
  const processResult = useCallback((userAnswer: number, attempts: number) => {
    if (!currentProblem) return;

    const hesitationAnalysis = pendingHesitationRef.current;
    if (!hesitationAnalysis) return;

    const correct = userAnswer === currentProblem.correctAnswer;

    // Atualizar streaks
    let newConsecutiveCorrect = consecutiveCorrect;
    let newConsecutiveErrors = consecutiveErrors;
    let newHadErrors = hadErrorsInSession;

    if (correct) {
      newConsecutiveCorrect = consecutiveCorrect + 1;
      newConsecutiveErrors = 0;
    } else {
      newConsecutiveCorrect = 0;
      newConsecutiveErrors = consecutiveErrors + 1;
      newHadErrors = true;
    }

    setConsecutiveCorrect(newConsecutiveCorrect);
    setConsecutiveErrors(newConsecutiveErrors);
    setHadErrorsInSession(newHadErrors);

    // Determinar tipo de feedback (para escolher o som)
    const fbType = determineFeedbackType(
      correct,
      newConsecutiveCorrect,
      newConsecutiveErrors,
      newHadErrors && correct,
    );

    // Tocar som
    if (correct) {
      if (fbType === 'streak-5' || fbType === 'streak-10') {
        playCelebration();
      } else {
        playCorrect();
      }
    } else {
      playWrong();
    }

    setOcrState({ phase: 'idle' });

    // Criar resultado do exercício
    const exerciseResult: ExerciseResult = {
      correct,
      speed: hesitationAnalysis.speed,
      timeMs: hesitationAnalysis.timeMs,
      attempts,
      timestamp: Date.now(),
    };

    // Submeter para a store (progressão automática)
    submitExercise(exerciseResult);

    // Callback opcional para compatibilidade
    onValidated?.(correct, userAnswer, currentProblem.correctAnswer);

    if (correct) {
      // Acertou: avançar automaticamente (só som, sem overlay)
      advanceToNext();
    } else {
      // Errou: mostrar resposta correta inline, esperar clique em "Continuar"
      setShowingCorrection({
        correctAnswer: currentProblem.correctAnswer,
        userAnswer,
      });
    }
  }, [currentProblem, consecutiveCorrect, consecutiveErrors, hadErrorsInSession, playCorrect, playWrong, playCelebration, submitExercise, onValidated, advanceToNext]);

  /**
   * Handler: clique em "Continuar" após ver a correção do erro
   */
  const handleContinueAfterError = useCallback(() => {
    setShowingCorrection(null);
    advanceToNext();
  }, [advanceToNext]);

  /**
   * Handler do botão "Enviar"
   */
  const handleSubmit = async () => {
    if (!hasDrawing || ocrState.phase !== 'idle' || !currentProblem || showingCorrection) return;

    // Parar timer e guardar resultado
    const hesitationAnalysis = timerRef.current.stop();
    pendingHesitationRef.current = hesitationAnalysis;

    setOcrState({ phase: 'processing' });

    if (mockOCR) {
      // Mock: prompt para dev
      const input = prompt(`Você desenhou qual número? (resposta correta: ${currentProblem.correctAnswer})`);
      const userAnswer = parseInt(input || '0', 10);
      processResult(userAnswer, 1);
      return;
    }

    // OCR Real — modelo não disponível: fallback para teclado
    if (!ocrModel) {
      console.warn('[AbstractExerciseScreen] Modelo OCR não disponível, usando teclado');
      setOcrState({ phase: 'keypad' });
      return;
    }

    const canvasElement = canvasRef.current?.getCanvasElement();
    if (!canvasElement) {
      console.error('[AbstractExerciseScreen] Canvas element não disponível');
      setOcrState({ phase: 'idle' });
      return;
    }

    try {
      // OCR com timeout de 5 segundos
      const OCR_TIMEOUT_MS = 5000;
      const result = await Promise.race([
        predictNumber(canvasElement, ocrModel),
        new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), OCR_TIMEOUT_MS)),
      ]);

      if (result === 'timeout') {
        // Timeout: fallback para teclado
        console.warn('[OCR] Timeout após 5s, oferecendo teclado');
        setOcrState({ phase: 'keypad' });
        return;
      }

      if (!result) {
        // Canvas vazio ou sem dígitos detectados
        setOcrState({ phase: 'retry' });
        return;
      }

      console.log('[OCR] Resultado:', result);

      if (result.status === 'accepted') {
        // Alta confiança - aceitar direto
        processResult(result.number, 1);
      } else if (result.status === 'confirmation') {
        // Média confiança - pedir confirmação
        setOcrState({
          phase: 'confirmation',
          recognizedNumber: result.number,
          confidence: result.confidence,
        });
      } else {
        // Baixa confiança - pedir para reescrever
        setOcrState({ phase: 'retry' });
      }
    } catch (err) {
      // Erro inesperado: fallback para teclado
      console.error('[OCR] Erro na predição:', err);
      setOcrState({ phase: 'keypad' });
    }
  };

  /**
   * Handler de confirmação OCR (usuário confirma que o número está correto)
   */
  const handleOCRConfirm = () => {
    if (ocrState.phase !== 'confirmation') return;
    processResult(ocrState.recognizedNumber, 1);
  };

  /**
   * Handler de rejeição OCR (usuário diz que o número está errado)
   */
  const handleOCRReject = () => {
    // Limpar canvas e deixar tentar novamente
    setOcrRetryCount((c) => c + 1);
    canvasRef.current?.clear();
    setHasDrawing(false);
    setOcrState({ phase: 'idle' });
    timerRef.current.start();
    pendingHesitationRef.current = null;
  };

  /**
   * Handler de retry OCR (confiança muito baixa)
   */
  const handleOCRRetry = () => {
    setOcrRetryCount((c) => c + 1);
    canvasRef.current?.clear();
    setHasDrawing(false);
    setOcrState({ phase: 'idle' });
    timerRef.current.start();
    pendingHesitationRef.current = null;
  };

  /**
   * Handler: abrir teclado numérico (fallback OCR)
   */
  const handleOpenKeypad = () => {
    setOcrState({ phase: 'keypad' });
  };

  /**
   * Handler: submissão via teclado numérico
   */
  const handleKeypadSubmit = (userAnswer: number) => {
    if (!currentProblem) return;

    // Se não temos hesitation analysis, criar uma com speed 'slow' (digitou manualmente)
    if (!pendingHesitationRef.current) {
      pendingHesitationRef.current = {
        speed: 'slow' as const,
        timeMs: 10000,
        shouldShowHint: false,
        inactivityMs: 0,
      };
    }

    processResult(userAnswer, ocrRetryCount + 1);
    setOcrRetryCount(0);
  };

  /**
   * Handler: cancelar teclado numérico (voltar para desenho)
   */
  const handleKeypadClose = () => {
    canvasRef.current?.clear();
    setHasDrawing(false);
    setOcrState({ phase: 'idle' });
    timerRef.current.start();
  };

  if (!currentProblem) {
    return (
      <Box
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader size="xl" />
      </Box>
    );
  }

  const operatorSymbol = currentProblem.operation === 'addition' ? '+' : '\u2212';
  const isProcessing = ocrState.phase === 'processing';
  // Número de dígitos esperados na resposta (para guias visuais e dicas)
  const expectedDigitCount = currentProblem.correctAnswer.toString().length;

  return (
    <Box
      data-testid="exercise-screen"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#F5F7FA',
        padding: '16px',
        boxSizing: 'border-box',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* CSS de Animações de Transição */}
      <style>
        {`
          /* Fade in/out padrão */
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
          }

          /* Transição de mudança de nível (slide + flash) */
          @keyframes levelChangeOut {
            0% {
              opacity: 1;
              transform: translateX(0);
            }
            100% {
              opacity: 0;
              transform: translateX(-50px);
            }
          }

          @keyframes levelChangeIn {
            0% {
              opacity: 0;
              transform: translateX(50px) scale(1.05);
              filter: brightness(1.3);
            }
            50% {
              filter: brightness(1.3);
            }
            100% {
              opacity: 1;
              transform: translateX(0) scale(1);
              filter: brightness(1);
            }
          }

          /* Transição de fim de sessão (virar página) */
          @keyframes sessionEndOut {
            0% {
              opacity: 1;
              transform: perspective(1000px) rotateY(0deg);
            }
            100% {
              opacity: 0;
              transform: perspective(1000px) rotateY(-20deg);
            }
          }

          .transition-normal-out {
            animation: fadeOut 0.3s ease-out forwards;
          }

          .transition-normal-in {
            animation: fadeIn 0.3s ease-in forwards;
          }

          .transition-level-change-out {
            animation: levelChangeOut 0.6s ease-out forwards;
          }

          .transition-level-change-in {
            animation: levelChangeIn 0.6s ease-out forwards;
          }

          .transition-session-end-out {
            animation: sessionEndOut 0.8s ease-out forwards;
          }
        `}
      </style>

      {/* OCR Confirmation Overlay */}
      {ocrState.phase === 'confirmation' && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 900,
          }}
        >
          <OCRConfirmationOverlay
            digit={ocrState.recognizedNumber}
            onConfirm={handleOCRConfirm}
            onReject={handleOCRReject}
          />
        </Box>
      )}

      {/* OCR Retry Overlay */}
      {ocrState.phase === 'retry' && (
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 900,
          }}
        >
          <OCRRetryOverlay
            onRetry={handleOCRRetry}
            retryCount={ocrRetryCount}
            onUseKeypad={handleOpenKeypad}
            expectedDigits={expectedDigitCount}
          />
        </Box>
      )}

      {/* Numeric Keypad Overlay (fallback OCR) */}
      {ocrState.phase === 'keypad' && (
        <NumericKeypadOverlay
          onSubmit={handleKeypadSubmit}
          onClose={handleKeypadClose}
        />
      )}

      {/* Notificação de Mudança de Nível */}
      {levelChangeNotification && (
        <LevelChangeNotification
          oldLevel={levelChangeNotification.oldLevel}
          newLevel={levelChangeNotification.newLevel}
          onClose={() => setLevelChangeNotification(null)}
        />
      )}

      {/* Header: Badge de Nível + Indicador de Progresso */}
      <Box
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '8px',
          gap: '16px',
        }}
      >
        {/* Badge de Nível (sempre visível) */}
        <LevelBadge level={currentLevel} />

        {/* Indicador de Progresso da Sessão */}
        {sessionRound.isActive && (
        <Box
          data-testid="session-progress"
          role="status"
          aria-label={`Exercício ${sessionRound.exerciseIndex + 1} de ${SESSION_SIZE}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '8px',
          }}
        >
          {/* Bolinhas de progresso */}
          <Flex gap={6} align="center">
            {Array.from({ length: SESSION_SIZE }, (_, i) => (
              <Box
                key={i}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background:
                    i < sessionRound.exerciseIndex
                      ? '#4CAF50' // completado
                      : i === sessionRound.exerciseIndex
                      ? '#4A90E2' // atual
                      : '#E0E0E0', // pendente
                  border: i === sessionRound.exerciseIndex ? '3px solid #2C6FBF' : 'none',
                  transition: 'background 0.3s, border 0.3s',
                }}
              />
            ))}
          </Flex>
          <Text size="18px" fw={600} c="#4A90E2" style={{ marginLeft: '8px' }}>
            {sessionRound.exerciseIndex + 1} de {SESSION_SIZE}
          </Text>
        </Box>
        )}
      </Box>

      {/* Layout Principal */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="xl"
        h="100%"
        w="100%"
        className={
          isTransitioning
            ? `transition-${transitionType}-out`
            : `transition-${transitionType}-in`
        }
        style={{ flex: '1 1 auto' }}
      >
        {/* Painel do Exercício */}
        <Box
          data-testid="exercise-display"
          w={{ base: '100%', md: '40%' }}
          h={{ base: 'auto', md: '100%' }}
          display="flex"
          aria-live="polite"
          aria-label={`Exercício: ${currentProblem.operandA} ${currentProblem.operation === 'addition' ? 'mais' : 'menos'} ${currentProblem.operandB}`}
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            background: '#FFFFFF',
            border: showingCorrection ? '4px solid #E53935' : '4px solid #4A90E2',
            borderRadius: '16px',
            padding: '32px',
            transition: 'border-color 0.3s',
          }}
        >
          <Text
            data-testid="exercise-prompt"
            size="64px"
            fw={700}
            style={{
              textAlign: 'center',
              lineHeight: 1.3,
              userSelect: 'none',
            }}
          >
            <Text component="span" c="#2C3E50">
              {currentProblem.operandA}
            </Text>
            <Text
              component="span"
              c={currentProblem.operation === 'addition' ? '#4CAF50' : '#FF9800'}
              style={{ margin: '0 16px' }}
            >
              {operatorSymbol}
            </Text>
            <Text component="span" c="#2C3E50">
              {currentProblem.operandB}
            </Text>
            <Text
              component="span"
              c="#4A90E2"
              style={{ margin: '0 16px' }}
            >
              =
            </Text>
            {showingCorrection ? (
              <Text
                component="span"
                c="#4CAF50"
                fw={800}
                style={{
                  borderBottom: '4px solid #4CAF50',
                  minWidth: '80px',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
              >
                {showingCorrection.correctAnswer}
              </Text>
            ) : (
              <Text
                component="span"
                c="#BDBDBD"
                style={{
                  borderBottom: '4px solid #4A90E2',
                  minWidth: '80px',
                  display: 'inline-block',
                  textAlign: 'center',
                }}
              >
                ?
              </Text>
            )}
          </Text>
          {showingCorrection && (
            <Text
              size="24px"
              c="#E53935"
              fw={500}
              style={{ marginTop: '16px', textAlign: 'center' }}
            >
              Sua resposta: {showingCorrection.userAnswer}
            </Text>
          )}
        </Box>

        {/* Área do Canvas + Botões (ou "Continuar" quando mostrando correção) */}
        <Box
          data-testid="canvas-container"
          style={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
          }}
        >
          {showingCorrection ? (
            /* Correção: botão "Continuar" grande e amigável */
            <Button
              data-testid="continue-button"
              onClick={handleContinueAfterError}
              size="xl"
              variant="filled"
              color="blue"
              style={{
                minHeight: '80px',
                fontSize: '28px',
                fontWeight: 700,
                minWidth: '250px',
                borderRadius: '16px',
              }}
            >
              Continuar
            </Button>
          ) : (
            /* Normal: Canvas + botões Limpar/Enviar */
            <>
              <Box style={{ width: '100%', maxWidth: '400px' }}>
                <DrawingCanvas
                  ref={canvasRef}
                  width="100%"
                  height={200}
                  onDrawingChange={handleDrawingChange}
                  expectedDigits={expectedDigitCount}
                />
              </Box>

              <Group
                data-testid="action-buttons"
                gap="md"
                grow
                style={{ maxWidth: '400px', width: '100%' }}
              >
                <Button
                  data-testid="clear-button"
                  onClick={handleClear}
                  size="xl"
                  variant="outline"
                  color="red"
                  disabled={isProcessing}
                  style={{
                    minHeight: '64px',
                    fontSize: '24px',
                    fontWeight: 600,
                  }}
                >
                  Limpar
                </Button>

                <Button
                  data-testid="submit-button"
                  onClick={handleSubmit}
                  size="xl"
                  variant="filled"
                  color="green"
                  disabled={!hasDrawing || isProcessing}
                  style={{
                    minHeight: '64px',
                    fontSize: '24px',
                    fontWeight: 600,
                    backgroundColor: !hasDrawing
                      ? '#CCCCCC'
                      : isProcessing
                      ? 'rgba(76, 175, 80, 0.7)'
                      : '#4CAF50',
                    cursor: !hasDrawing || isProcessing ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isProcessing ? (
                    <Flex direction="column" align="center" gap="xs">
                      <Loader size="sm" color="white" />
                      <Text size="sm" c="white" fw={500}>
                        Analisando...
                      </Text>
                    </Flex>
                  ) : (
                    'Enviar'
                  )}
                </Button>
              </Group>
            </>
          )}
        </Box>
      </Flex>
    </Box>
  );
}
