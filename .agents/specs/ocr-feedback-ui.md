# SPEC: Feedback OCR - Overlays (1.7.1)

## Princípios Pedagógicos

### 1. Feedback Imediato e Diferenciado
- Criança de 7 anos precisa de feedback **instantâneo** após escrever
- O tipo de feedback depende da **confiança do OCR**, não do acerto/erro matemático
- Confiança alta (≥80%): sistema confia, prossegue silenciosamente → criança mantém fluxo
- Confiança média (50-79%): sistema em dúvida, pede confirmação → criança valida e aprende
- Confiança baixa (<50%): sistema não entendeu, pede reescrita → criança pratica escrita

### 2. Autonomia Gradual (Kumon)
- A criança é ativa no processo: ela **confirma** ou **corrige** o que o sistema leu
- Overlay de confirmação não é "erro", é **parceria**: "Vamos checar juntos?"
- Mensagem de reescrita não é punição, é **convite para melhorar**: "Vamos tentar de novo?"

### 3. Redução de Carga Cognitiva
- Confirmação: apenas 2 botões grandes (✓ e ✗), zero leitura necessária
- Reescrita: instrução visual + textual, mas ícone predominante

---

## Critérios de Aceitação

### Fluxo Geral
```
OCR → confiança?
  ≥80%  → [silencioso] → validação matemática
  50-79% → Overlay Confirmação → [criança decide] → validação matemática
  <50%   → Overlay Reescrita → [limpa canvas] → criança escreve de novo
```

### 1. Overlay de Confirmação (50-79%)
**DEVE:**
- Exibir o dígito detectado em **fonte grande (≥72px)** centralizado
- Pergunta: "Você escreveu [X]?" com ícone de lupa/dúvida
- 2 botões side-by-side:
  - ✓ (Sim): verde, ≥64px, `data-testid="confirm-yes"`
  - ✗ (Não): amarelo/laranja, ≥64px, `data-testid="confirm-no"`
- Ao clicar ✓: prossegue para validação matemática com o valor X
- Ao clicar ✗: limpa canvas e volta para estado de "aguardando escrita"
- Overlay semi-transparente sobre o canvas (não ocultar completamente)
- Animação suave de entrada (fade-in 200ms)
- Som de "dúvida" (neutro, não negativo) ao aparecer

**NÃO DEVE:**
- Usar texto longo ("Tem certeza que você quis escrever...")
- Ter botão "Cancelar" adicional (apenas ✓ e ✗)
- Bloquear o canvas permanentemente (criança pode precisar ver o que escreveu)
- Usar vermelho (isso sinaliza erro, mas não é erro ainda)

### 2. Overlay de Reescrita (<50%)
**DEVE:**
- Ícone grande de "?" ou "🤔" (≥128px) centralizado
- Texto encorajador: "Não consegui entender. Vamos tentar de novo?"
- Botão único "Tentar Novamente": azul, ≥64px, `data-testid="retry-button"`
- Ao clicar: limpa canvas automaticamente e remove overlay
- Som encorajador (tipo "oops" leve, não negativo)
- Animação suave de entrada

**NÃO DEVE:**
- Dizer "Você errou" ou "Tente escrever melhor" (culpabilizar)
- Ter múltiplos botões (só um: tentar de novo)
- Exibir o dígito "errado" que o OCR tentou reconhecer (gera confusão)
- Bloquear interação por mais de 2 segundos

### 3. Fluxo Silencioso (≥80%)
**DEVE:**
- Nenhum overlay visual relacionado ao OCR
- Transição direta para validação matemática (Task 1.8)
- Animação suave de "limpar canvas" (opcional, se for para próximo exercício)

**NÃO DEVE:**
- Exibir "Ótimo!" ou "Entendi!" (é redundante e atrasa o fluxo)
- Fazer som desnecessário (apenas som de acerto/erro matemático depois)

---

## Validação QA (Checklist)

- [ ] Criança de 7 anos consegue entender os overlays **sem ler nada**?
- [ ] Botões são grandes o suficiente para toques imprecisos?
- [ ] Overlay de confirmação é percebido como "ajuda", não como "erro"?
- [ ] Overlay de reescrita é encorajador, não punitivo?
- [ ] Sons reforçam o tom emocional correto (dúvida ≠ erro)?
- [ ] Transições são suaves (sem jumps ou blinks)?
- [ ] Canvas não fica bloqueado indefinidamente?
- [ ] Fluxo ≥80% não adiciona fricção desnecessária?

---

## Anti-Patterns (O Que NÃO Fazer)

❌ **Overlay genérico de "Carregando..."** após escrita
  → Criança não entende o que está acontecendo

❌ **Texto longo explicando que "o sistema não conseguiu reconhecer com 100% de certeza..."**
  → Criança de 7 anos não lê, só fica frustrada

❌ **Botão "Cancelar" ou "Voltar" no overlay de confirmação**
  → Cria decisão desnecessária (já tem ✓ e ✗)

❌ **Exibir porcentagem de confiança do OCR (ex: "54% de certeza")**
  → Informação técnica irrelevante para a criança

❌ **Overlay de erro vermelho estilo "❌ ERRO!" para confiança <50%**
  → Não é erro da criança, é limitação do OCR. Tom deve ser neutro/encorajador.

❌ **Bloquear canvas durante overlay**
  → Criança pode querer ver o que escreveu para decidir

---

## Referências Técnicas

- Task 1.5 (OCR Hook) retorna `{ digit: number | null, confidence: number }`
- Task 1.8 (Validação Matemática) recebe o dígito confirmado
- Componente `DrawingCanvas` (Task 1.3) tem método `clear()`
- Store Zustand deve armazenar estado do overlay atual: `ocrFeedbackState: 'idle' | 'confirming' | 'retry' | 'validating'`

---

**Assinado**: EdTech Specialist
**Data**: 2026-02-11
**Próximo passo**: Dev implementa overlays → QA testa cenários de confiança variados
