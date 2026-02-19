/**
 * Tela de Exercício - Fase Abstrata
 *
 * Integração completa:
 * - Gerador de problemas (generateProblem)
 * - Detector de hesitação (HesitationTimer)
 * - OCR real (predictNumber) com fallback mock
 * - Algoritmo de maestria (MasteryTracker)
 * - FeedbackOverlay rico (confetti, streaks, tiers)
 * - Sons (useSound)
 * - Overlays de confirmação/retry OCR
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { Box, Flex, Text, Button, Group, Loader } from '@mantine/core';
import * as tf from '@tensorflow/tfjs';
import DrawingCanvas, { DrawingCanvasHandle } from '../canvas/DrawingCanvas';
import FeedbackOverlay, { FeedbackType } from '../ui/FeedbackOverlay';
import { OCRConfirmationOverlay } from '../ui/OCRConfirmationOverlay.simple';
import { OCRRetryOverlay } from '../ui/OCRRetryOverlay.simple';
import { generateProblem } from '../../lib/math';
import { HesitationTimer } from '../../lib/progression';
import { predictNumber } from '../../utils/ocr/predict';
import { useSound } from '../../hooks';
import { useGameStore } from '../../stores/useGameStore';
import type { Problem, ExerciseResult } from '../../types';

interface AbstractExerciseScreenProps {
  /** Modelo OCR carregado (de useOCRModel) */
  ocrModel?: tf.LayersModel | null;
  /** Callback quando exercício for validado (correto/incorreto) - opcional para compatibilidade */
  onValidated?: (correct: boolean, userAnswer: number, correctAnswer: number) => void;
  /** Simulação de OCR (para desenvolvimento sem modelo) */
  mockOCR?: boolean;
}

type OCRState =
  | { phase: 'idle' }
  | { phase: 'processing' }
  | { phase: 'confirmation'; recognizedNumber: number; confidence: number }
  | { phase: 'retry' };

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

/**
 * Gera mensagem de feedback baseada no tipo
 */
function getFeedbackMessage(type: FeedbackType, correctAnswer: number): { message: string; subMessage?: string; correctAnswerText?: string } {
  switch (type) {
    case 'correct':
      return { message: 'Correto!' };
    case 'correct-after-errors':
      return { message: 'Muito bem!', subMessage: 'Você conseguiu!' };
    case 'streak-5':
      return { message: '5 seguidos!', subMessage: 'Incrível!' };
    case 'streak-10':
      return { message: '10 seguidos!', subMessage: 'Você é demais!' };
    case 'error-gentle':
      return {
        message: 'Quase!',
        correctAnswerText: `A resposta certa é ${correctAnswer}`,
      };
    case 'error-learning':
      return {
        message: 'Você está aprendendo!',
        subMessage: 'Cada tentativa te deixa mais forte',
        correctAnswerText: `A resposta é ${correctAnswer}`,
      };
    case 'error-regress':
      return {
        message: 'Vamos ver de outro jeito!',
        subMessage: 'Vou te ajudar com mais pistas',
        correctAnswerText: `A resposta é ${correctAnswer}`,
      };
  }
}

export default function AbstractExerciseScreen({
  ocrModel,
  onValidated,
  mockOCR = false,
}: AbstractExerciseScreenProps) {
  // Estado global da store
  const currentLevel = useGameStore((state) => state.currentLevel);
  const submitExercise = useGameStore((state) => state.submitExercise);
  const canvasRef = useRef<DrawingCanvasHandle>(null);
  const timerRef = useRef(new HesitationTimer());

  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [previousProblemId, setPreviousProblemId] = useState<string | undefined>(undefined);
  const [hasDrawing, setHasDrawing] = useState(false);

  // OCR state machine
  const [ocrState, setOcrState] = useState<OCRState>({ phase: 'idle' });

  // Feedback state
  const [feedbackVisible, setFeedbackVisible] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('correct');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackSubMessage, setFeedbackSubMessage] = useState<string | undefined>();
  const [feedbackCorrectAnswer, setFeedbackCorrectAnswer] = useState<string | undefined>();

  // Streak tracking
  const [consecutiveCorrect, setConsecutiveCorrect] = useState(0);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [hadErrorsInSession, setHadErrorsInSession] = useState(false);

  // Sons
  const { playCorrect, playWrong, playCelebration } = useSound();

  // Guardar a análise de hesitação para uso após confirmação OCR
  const pendingHesitationRef = useRef<ReturnType<HesitationTimer['stop']> | null>(null);

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
    setFeedbackVisible(false);
    pendingHesitationRef.current = null;
  }, [currentLevel]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // Determinar tipo de feedback
    const fbType = determineFeedbackType(
      correct,
      newConsecutiveCorrect,
      newConsecutiveErrors,
      newHadErrors && correct,
    );

    const fbContent = getFeedbackMessage(fbType, currentProblem.correctAnswer);

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

    // Mostrar feedback
    setFeedbackType(fbType);
    setFeedbackMessage(fbContent.message);
    setFeedbackSubMessage(fbContent.subMessage);
    setFeedbackCorrectAnswer(fbContent.correctAnswerText);
    setFeedbackVisible(true);
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
  }, [currentProblem, consecutiveCorrect, consecutiveErrors, hadErrorsInSession, playCorrect, playWrong, playCelebration, submitExercise, onValidated]);

  /**
   * Avança para o próximo problema (chamado quando feedback fecha)
   */
  const advanceToNext = useCallback(() => {
    if (!currentProblem) return;

    const nextProblem = generateProblem(currentLevel, currentProblem.id);
    setCurrentProblem(nextProblem);
    setPreviousProblemId(nextProblem.id);

    canvasRef.current?.clear();
    setHasDrawing(false);
    setFeedbackVisible(false);
    setOcrState({ phase: 'idle' });
    pendingHesitationRef.current = null;

    timerRef.current.start();
  }, [currentLevel, currentProblem]);

  /**
   * Handler do botão "Enviar"
   */
  const handleSubmit = async () => {
    if (!hasDrawing || ocrState.phase !== 'idle' || !currentProblem) return;

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

    // OCR Real
    if (!ocrModel) {
      console.warn('[AbstractExerciseScreen] Modelo OCR não disponível, usando fallback mock');
      const input = prompt(`OCR indisponível. Qual número? (resposta: ${currentProblem.correctAnswer})`);
      const userAnswer = parseInt(input || '0', 10);
      processResult(userAnswer, 1);
      return;
    }

    const canvasElement = canvasRef.current?.getCanvasElement();
    if (!canvasElement) {
      console.error('[AbstractExerciseScreen] Canvas element não disponível');
      setOcrState({ phase: 'idle' });
      return;
    }

    try {
      const result = await predictNumber(canvasElement, ocrModel);

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
      console.error('[OCR] Erro na predição:', err);
      setOcrState({ phase: 'retry' });
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
    canvasRef.current?.clear();
    setHasDrawing(false);
    setOcrState({ phase: 'idle' });
    timerRef.current.start();
    pendingHesitationRef.current = null;
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
      }}
    >
      {/* FeedbackOverlay rico */}
      <FeedbackOverlay
        type={feedbackType}
        visible={feedbackVisible}
        message={feedbackMessage}
        subMessage={feedbackSubMessage}
        correctAnswer={feedbackCorrectAnswer}
        duration={feedbackType.startsWith('streak') ? 3000 : 2000}
        onClose={advanceToNext}
      />

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
          <OCRRetryOverlay onRetry={handleOCRRetry} />
        </Box>
      )}

      {/* Layout Principal */}
      <Flex
        direction={{ base: 'column', md: 'row' }}
        gap="xl"
        h="100%"
        w="100%"
      >
        {/* Painel do Exercício */}
        <Box
          data-testid="exercise-display"
          w={{ base: '100%', md: '40%' }}
          h={{ base: 'auto', md: '100%' }}
          display="flex"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            background: '#FFFFFF',
            border: '4px solid #4A90E2',
            borderRadius: '16px',
            padding: '32px',
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
          </Text>
        </Box>

        {/* Área do Canvas + Botões */}
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
          <Box style={{ width: '100%', maxWidth: '400px' }}>
            <DrawingCanvas
              ref={canvasRef}
              width="100%"
              height={200}
              onDrawingChange={handleDrawingChange}
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
        </Box>
      </Flex>
    </Box>
  );
}
