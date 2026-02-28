# Dev Output — Sprint 7.3/7.4/7.5: Seleção de Nível Completa

**Data**: 2026-02-28
**Task**: Adaptar consumidores para GameMode + tela de seleção na PetHub + coinCalculator
**Status**: ✅ Concluído — 0 erros TypeScript, build limpo

## Arquivos Modificados

### `src/utils/levelFormat.ts`
- `formatLevelName()`: trata `operation === 'mixed'` → "Soma e Subtração até X"

### `src/components/screens/SessionSummaryScreen.tsx`
- Ternário de operation name: trata 'mixed' → "Soma e Subtração"

### `src/components/ui/LevelBadge.tsx`
- Cor do badge: 'mixed' → violeta (verde = adição, laranja = subtração)

### `src/components/screens/PetHub.tsx` (REESCRITA)
- Removidos banners de subtração/multi-dígitos (obsoletos — criança escolhe direto)
- Removidos `subtractionBannerSeen` / `multiDigitBannerSeen` e imports relacionados
- Removido badge de nível no status bar (substituído pela seleção)
- **Novo: Seletor de operação** — 2 toggle buttons: `+` (adição) e `+ −` (mixed)
- **Novo: Seletor de dificuldade** — 3 toggle buttons: `1–9`, `10–99`, `100–999`
- **Novo: Exemplo dinâmico** — "Ex: 45 + 8 = ?" atualiza em tempo real
- **Novo: Badge de moedas** — "🪙 5c por acerto" (muda com dificuldade)
- `onPlay` agora recebe `(mode: GameMode)` e chama `setSelectedMode` antes
- Touch targets ≥ 56px nos toggles, cores vibrantes, feedback visual de seleção
- Estado inicializa com `selectedMode` da store (última escolha persistida)

### `src/App.tsx`
- Import de `GameMode`
- `handlePlay(mode: GameMode)` → chama `startSession(mode)`
- `handlePlayAgain()` → chama `startSession()` (usa último modo)

### `src/lib/coinCalculator.ts`
- Agora importa `DIFFICULTY_COINS` e `DifficultyLevel`
- Nova `maxResultToDifficulty()`: mapeia maxResult → DifficultyLevel
- `getCoinsPerCorrect()` usa `DIFFICULTY_COINS[diff]` em vez de faixas hardcoded
- Novos valores: 1 dígito = 2c, 2 dígitos = 5c, 3 dígitos = 10c

## Sprint 7 Completa

Todo o fluxo funciona:
1. PetHub → criança escolhe operação + dificuldade
2. Clica "Começar!" → `startSession(mode)` salva e inicia
3. Exercícios gerados conforme modo (mixed = 50/50 soma/subtração)
4. Resumo mostra moedas corretas por dificuldade
5. "Jogar de novo" usa último modo
6. Modo persistido no localStorage
