# Fluxo de Maestria - Diagrama

## 📊 Visão Geral da Progressão

```
BASELINE                         INTERMEDIÁRIO                    MAESTRIA COMPLETA
┌─────────────┐                 ┌─────────────┐                 ┌─────────────┐
│   Nível 1   │  5 acertos     │   Nível 2   │  5 acertos     │   Nível 3   │  5 acertos     │   Nível 4   │
│ maxResult=5 │  rápidos em    │ maxResult=10│  rápidos em    │ maxResult=15│  rápidos em    │ maxResult=20│
│             │  abstract ──►  │             │  abstract ──►  │             │  abstract ──►  │             │
└─────────────┘                 └─────────────┘                 └─────────────┘                 └─────────────┘
      │                                │                                │                                │
      │ 3 erros                       │ 3 erros                       │ 3 erros                       │ 3 erros
      │ em concrete                   │ em concrete                   │ em concrete                   │ em concrete
      ▼                                ▼                                ▼                                ▼
  (baseline)                      (regress)                        (regress)                        (regress)
```

## 🔄 Progressão CPA (Dentro de Cada Nível)

```
┌──────────────────────────────────────────────────────────────┐
│                     MICRO-NÍVEL (ex: maxResult=10)            │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  CONCRETE                PICTORIAL               ABSTRACT     │
│  ┌─────────┐            ┌─────────┐            ┌─────────┐  │
│  │  Objetos│ 5 acertos │ Desenhos│ 5 acertos │ Números │  │
│  │ visuais │────────────►│ ícones │────────────►│  puros │  │
│  └─────────┘            └─────────┘            └─────────┘  │
│       ▲                      │                       │       │
│       │                      │ 3 erros               │       │
│       │                      └───────────────────────┘       │
│       │                                                       │
│       └──────────────────────────────────────────────────────┘
│                          3 erros                               │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

## ⚙️ Árvore de Decisão

```
                         ┌──────────────┐
                         │  Analisar    │
                         │  Últimos 10  │
                         │  Resultados  │
                         └──────┬───────┘
                                │
                ┌───────────────┴───────────────┐
                │                               │
         ┌──────▼──────┐                ┌──────▼──────┐
         │  REGRESSÕES │                │   AVANÇOS   │
         │  (urgente!) │                │  (celebrar!)│
         └──────┬──────┘                └──────┬──────┘
                │                               │
    ┌───────────┼───────────┐       ┌──────────┼──────────┐
    │           │           │       │          │          │
┌───▼───┐   ┌──▼──┐    ┌──▼──┐ ┌──▼──┐   ┌──▼──┐   ┌──▼──┐
│10 erros│   │3 erros  │3 erros│5 fast│   │5 acertos│5 slow│
│consec. │   │consec.  │em     │em    │   │consec. │consec│
│        │   │         │concr. │abstr.│   │        │      │
└───┬───┘   └──┬──┘    └──┬──┘ └──┬──┘   └──┬──┘   └──┬──┘
    │          │           │       │         │         │
    ▼          ▼           ▼       ▼         ▼         ▼
baseline   regress     regress  advance  advance   maintain
           CPA phase   micro    micro    CPA phase
```

## 📈 Exemplo de Jornada da Criança

```
DIA 1-3: Nível 1 (maxResult=5)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Concrete    ✓✓✓✓✓ (5 acertos)
            ────────────────► AVANÇA
Pictorial   ✓✓✓✓✓ (5 acertos)
            ────────────────► AVANÇA
Abstract    ✓✓✓✓✓ (5 acertos rápidos <5s)
            ────────────────► AVANÇA MICRO-NÍVEL

DIA 4-6: Nível 2 (maxResult=10)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Concrete    ✓✓✓✓✓
            ────────────────► AVANÇA
Pictorial   ✓✗✗✗ (1 acerto, 3 erros)
            ◄──────────────── REGRIDE CPA
Concrete    ✓✓✓✓✓
            ────────────────► AVANÇA (segunda tentativa)
Pictorial   ✓✓✓✓✓ (5 acertos lentos 5-15s)
            ────────────────► AVANÇA
Abstract    ✓✓✓✓✓ (5 lentos)
            ────────────────► MANTÉM (precisa maestria)
            ✓✓✓✓✓ (5 rápidos <5s)
            ────────────────► AVANÇA MICRO-NÍVEL

DIA 7: Maestria Completa (maxResult=20, abstract)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abstract    ✓✓✓✓✓ (5 rápidos)
            ────────────────► PODE AVANÇAR OPERAÇÃO! 🎉
                              (adição → subtração)
```

## 🚨 Cenário de Regressão Severa

```
Criança em Nível 3 (maxResult=15, abstract)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Abstract    ✗✗✗ (3 erros)
            ◄────────────── REGRIDE CPA
Pictorial   ✗✗✗ (3 erros)
            ◄────────────── REGRIDE CPA
Concrete    ✗✗✗✗ (4 erros, total 10 erros)
            ◄────────────── REGRIDE AO BASELINE!
                            Volta para Nível 1 (maxResult=5, concrete)
                            + Feedback especial de encorajamento
```

## 🎯 Regras em Pseudocódigo

```typescript
function decidirProgressao(results: ExerciseResult[]): Decision {
  const streak = calcularStreaks(results);

  // PRIORIDADE 1: Regressões urgentes
  if (streak.incorrect >= 10) {
    return REGRESS_TO_BASELINE; // Mais urgente
  }

  if (streak.incorrect >= 3) {
    if (currentPhase !== 'concrete') {
      return REGRESS_CPA_PHASE; // abstract→pictorial ou pictorial→concrete
    } else {
      return REGRESS_MICROLEVEL; // Já em concrete, desce nível
    }
  }

  // PRIORIDADE 2: Avanços
  if (streak.fast >= 5 && currentPhase === 'abstract') {
    return ADVANCE_MICROLEVEL; // Maestria alcançada!
  }

  if (streak.correct >= 5) {
    if (currentPhase !== 'abstract') {
      return ADVANCE_CPA_PHASE; // concrete→pictorial ou pictorial→abstract
    }
  }

  if (streak.slow >= 5) {
    return MAINTAIN; // Precisa mais prática
  }

  // PADRÃO
  return MAINTAIN;
}
```

## 📚 Referências

- **Método Kumon**: Maestria = 5 acertos consecutivos com velocidade
- **Modelo CPA**: Jerome Bruner (1960s) - Representações do concreto ao abstrato
- **Small Steps**: Incrementos pequenos e frequentes (5→10→15→20)
- **Prevenção de Frustração**: Regressão após 3 erros (não esperar acumular)
