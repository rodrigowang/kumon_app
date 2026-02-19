# OCR Feedback Overlays — Guia de Uso

## 📋 Visão Geral

Sistema de feedback visual para OCR baseado em níveis de confiança, seguindo princípios pedagógicos do Método Kumon.

## 🎯 Princípios Pedagógicos

### 1. Feedback Diferenciado por Confiança
- **≥80%**: Silencioso → prossegue direto para validação matemática
- **50-79%**: Confirmação → criança valida o dígito detectado
- **<50%**: Reescrita → criança tenta novamente

### 2. Tom Emocional Correto
- ✅ **Confirmação**: Parceria ("Vamos checar juntos?"), não erro
- ✅ **Reescrita**: Encorajamento ("Vamos tentar de novo?"), não punição
- ❌ **Nunca**: Culpabilização, mensagens de erro agressivas

## 📦 Componentes

### 1. `OCRConfirmationOverlay` (50-79% confiança)
```tsx
import { OCRConfirmationOverlay } from '@/components/ui';

<OCRConfirmationOverlay
  digit={7}
  onConfirm={() => console.log('Confirmado!')}
  onReject={() => console.log('Rejeitado!')}
  playSound={(type) => console.log(`Som: ${type}`)}
/>
```

**Características**:
- Exibe dígito detectado em fonte grande (96px)
- 2 botões: ✓ (verde, confirmar) e ✗ (laranja, rejeitar)
- Overlay semi-transparente, não bloqueia completamente o canvas
- Animação fade-in 200ms
- Som de "dúvida" ao aparecer

### 2. `OCRRetryOverlay` (<50% confiança)
```tsx
import { OCRRetryOverlay } from '@/components/ui';

<OCRRetryOverlay
  onRetry={() => console.log('Tentando de novo!')}
  playSound={(type) => console.log(`Som: ${type}`)}
/>
```

**Características**:
- Ícone grande de interrogação (🤔, 128px)
- Mensagem encorajadora
- Botão único "Tentar Novamente" (azul, 80px altura)
- Som "oops" leve ao aparecer

### 3. `OCRFeedbackOverlay` (Wrapper inteligente)
```tsx
import { OCRFeedbackOverlay } from '@/components/ui';
import { useGameStore } from '@/stores/useGameStore';

// No componente pai (ex: ExerciseScreen)
const { setOCRFeedbackState } = useGameStore();

// Renderiza overlay baseado no estado global
<Box style={{ position: 'relative' }}>
  <DrawingCanvas ref={canvasRef} />

  <OCRFeedbackOverlay
    onConfirm={(digit) => {
      // Prossegue para validação matemática
      validateAnswer(digit);
    }}
    onReject={() => {
      // Limpa canvas e aguarda nova escrita
      canvasRef.current?.clear();
    }}
    onRetry={() => {
      // Limpa canvas e aguarda nova escrita
      canvasRef.current?.clear();
    }}
    playSound={playSound}
  />
</Box>
```

## 🔄 Fluxo de Integração com OCR

### 1. Após o OCR processar a imagem:

```tsx
import { useGameStore } from '@/stores/useGameStore';

const { setOCRFeedbackState } = useGameStore();

// Exemplo de callback após OCR
const handleOCRComplete = (result: { digit: number | null, confidence: number }) => {
  const { digit, confidence } = result;

  if (confidence >= 0.8) {
    // Alta confiança: sem overlay, prossegue direto
    setOCRFeedbackState('validating', { digit, confidence });
    validateAnswer(digit);
  } else if (confidence >= 0.5) {
    // Média confiança: overlay de confirmação
    setOCRFeedbackState('confirming', { digit, confidence });
  } else {
    // Baixa confiança: overlay de reescrita
    setOCRFeedbackState('retry', { digit: null, confidence });
  }
};
```

### 2. Estado do Zustand Store

O estado `ocrFeedbackState` controla qual overlay renderizar:

```typescript
type OCRFeedbackState = 'idle' | 'confirming' | 'retry' | 'validating';

// Zustand store
interface GameState {
  ocrFeedbackState: OCRFeedbackState;
  ocrFeedbackData: { digit: number | null; confidence: number } | null;
}

// Actions
setOCRFeedbackState(state: OCRFeedbackState, data?: OCRFeedbackData);
clearOCRFeedback();
```

## 🎨 Design Specs

### Touch Targets
- Botões: ≥64px altura, ≥120px largura
- Área clicável generosa para toques imprecisos

### Tipografia
- Dígito: 96px, bold
- Pergunta: 28px-32px, semi-bold
- Botão: 28px-48px, semi-bold

### Cores
- **Verde** (#4CAF50): Confirmação positiva
- **Laranja** (#FF9800): Rejeição/reconsideração (não vermelho!)
- **Azul** (#2196F3): Ação neutra (tentar novamente)
- **Roxo** (#6C63FF): Background do ícone de dúvida

### Animações
- Fade-in: 200ms ease-in
- Hover: scale(1.05), 200ms
- Active: scale(0.95), 200ms

## 🧪 Testes

### Componente de Teste
```tsx
import { OCRFeedbackTester } from '@/components/dev';

// Em App.tsx ou rota de desenvolvimento
<OCRFeedbackTester />
```

### Cenários de Teste (QA)
- [ ] Criança de 7 anos entende sem ler?
- [ ] Botões são grandes para toques imprecisos?
- [ ] Tom é encorajador, não punitivo?
- [ ] Animações são suaves (não bruscas)?
- [ ] Canvas não fica bloqueado indefinidamente?
- [ ] Sons reforçam o tom emocional correto?

## 📚 Dependências

### Instaladas
- `@mantine/core` (já instalado)
- `zustand` (já instalado)

### A Instalar (opcional)
```bash
npm install @tabler/icons-react
```

**Nota**: Se não instalar `@tabler/icons-react`, use as versões simplificadas:
- `OCRConfirmationOverlay.simple.tsx` (usa emojis ✓ ✗ 🔍)
- `OCRRetryOverlay.simple.tsx` (usa emoji 🤔 🔄)

## 🔗 Referências

- **Spec pedagógica**: `.agents/specs/ocr-feedback-ui.md`
- **Store**: `src/stores/useGameStore.ts`
- **Canvas**: `src/components/canvas/DrawingCanvas.tsx`

## ⚠️ Anti-Patterns (O Que NÃO Fazer)

❌ Exibir porcentagem de confiança (ex: "54% de certeza")
❌ Botão "Cancelar" adicional (já tem ✓ e ✗)
❌ Texto longo explicando ("O sistema não conseguiu reconhecer com 100% de certeza...")
❌ Vermelho em overlay de reescrita (não é erro da criança!)
❌ Bloquear canvas indefinidamente
❌ Overlay genérico de "Carregando..." sem contexto

## 🎯 Próximos Passos

1. ✅ Overlays criados
2. ⏳ Integrar com hook `useOCRModel` (Task 1.5)
3. ⏳ Implementar validação matemática (Task 1.8)
4. ⏳ Adicionar sistema de som com Howler.js
5. ⏳ Testes E2E com Playwright
