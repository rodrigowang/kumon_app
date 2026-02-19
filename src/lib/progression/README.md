# Sistema de Progressão - Detector de Hesitação

## 📊 Visão Geral

O Detector de Hesitação monitora o tempo de resposta da criança e detecta quando ela está travada, baseado em:

- **Método Kumon**: Maestria = resposta automática (<5s)
- **Psicologia Cognitiva**: Working memory infantil (7-15s)
- **UX Infantil**: Frustração após >10s sem progresso

## 🎯 Classificações

| Velocidade | Tempo | Significado | Ação |
|------------|-------|-------------|------|
| `fast` | <5s | Criança domina o conceito | ✅ Pode avançar de nível |
| `slow` | 5-15s | Pensando, mas progredindo | ⏸️ Manter nível atual |
| `hesitant` | >15s | Travada ou conceito difícil | 🆘 Recuar nível ou dar dica |

## 📦 Uso Básico

```typescript
import { HesitationTimer } from '@/lib/progression';

const timer = new HesitationTimer();

// 1. Quando exercício é exibido
timer.start();

// 2. Quando criança desenha
timer.recordInteraction();

// 3. Quando criança aperta "Enviar"
const analysis = timer.stop();

console.log(analysis.speed); // 'fast' | 'slow' | 'hesitant'
console.log(analysis.timeMs); // 3500
console.log(analysis.shouldShowHint); // false
```

## 🔧 Integração com React

### Hook Customizado

```typescript
// hooks/useHesitationTimer.ts
import { useRef, useEffect } from 'react';
import { HesitationTimer } from '@/lib/progression';
import type { HesitationAnalysis } from '@/types';

export function useHesitationTimer(isActive: boolean) {
  const timerRef = useRef(new HesitationTimer());

  useEffect(() => {
    if (isActive) {
      timerRef.current.start();
    } else {
      timerRef.current.reset();
    }
  }, [isActive]);

  const recordInteraction = () => {
    timerRef.current.recordInteraction();
  };

  const stop = (): HesitationAnalysis => {
    return timerRef.current.stop();
  };

  const checkIfHesitant = (): boolean => {
    return timerRef.current.checkIfHesitant();
  };

  return {
    recordInteraction,
    stop,
    checkIfHesitant,
  };
}
```

### Uso no Componente

```typescript
function ExerciseScreen() {
  const [showHint, setShowHint] = useState(false);
  const { recordInteraction, stop, checkIfHesitant } = useHesitationTimer(true);

  // Verificar hesitação a cada 2 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      if (checkIfHesitant()) {
        setShowHint(true);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [checkIfHesitant]);

  const handleCanvasDraw = () => {
    recordInteraction();
  };

  const handleSubmit = () => {
    const analysis = stop();

    // Salvar para analytics
    logAnalytics({
      speed: analysis.speed,
      timeMs: analysis.timeMs,
    });

    // Decidir progressão
    if (analysis.speed === 'fast') {
      // Avançar de nível
    } else if (analysis.speed === 'hesitant') {
      // Recuar ou manter
    }
  };

  return (
    <>
      <Canvas onDraw={handleCanvasDraw} />
      <Button onClick={handleSubmit}>Enviar</Button>
      {showHint && <Hint message="Precisa de ajuda?" />}
    </>
  );
}
```

## ⚙️ Configuração Adaptativa

```typescript
import { createHesitationTimer } from '@/lib/progression';

// Para criança com dificuldades
const adaptedTimer = createHesitationTimer({
  fastThresholdMs: 10000,   // 10s para "fast"
  slowThresholdMs: 25000,   // 25s para "slow"
  inactivityHintThresholdMs: 15000, // 15s para dica
});
```

## 📈 Analytics e Progressão

```typescript
interface ChildAnalytics {
  averageTimeMs: number;
  fastPercentage: number;
  slowPercentage: number;
  hesitantPercentage: number;
}

function analyzeProgression(results: HesitationAnalysis[]): ChildAnalytics {
  const total = results.length;
  const avgTime = results.reduce((sum, r) => sum + r.timeMs, 0) / total;

  const fastCount = results.filter(r => r.speed === 'fast').length;
  const slowCount = results.filter(r => r.speed === 'slow').length;
  const hesitantCount = results.filter(r => r.speed === 'hesitant').length;

  return {
    averageTimeMs: avgTime,
    fastPercentage: (fastCount / total) * 100,
    slowPercentage: (slowCount / total) * 100,
    hesitantPercentage: (hesitantCount / total) * 100,
  };
}

// Decisão de avançar de nível:
// - Se >80% respostas "fast" → AVANÇAR
// - Se >30% respostas "hesitant" → RECUAR
```

## 🧪 Testes

```bash
# Testes unitários
npm run test tests/unit/hesitation.spec.ts

# Teste manual
npx tsx src/lib/progression/__manual-test-hesitation.ts
```

## 📚 Referências

- **Kumon Method**: Maestria através de repetição e velocidade
- **Working Memory**: Cowan, N. (2010). The Magical Mystery Four: Working Memory Capacity
- **Child UX**: Nielsen Norman Group - Children's UX Guidelines
