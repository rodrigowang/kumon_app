# Sons para o App

Este diretório deve conter 4 arquivos MP3 curtos (≤1s cada):

## Arquivos Necessários

1. **correct.mp3** - Som de acerto (nota alegre, tipo "ding!")
2. **wrong.mp3** - Som de erro (gentil, tipo "buzz" suave)
3. **celebration.mp3** - Som de celebração (fanfarra curta)
4. **click.mp3** - Som de clique/tap (feedback tátil)

## Fontes Recomendadas (Grátis e Livres)

- **Freesound.org** (licença CC0/CC-BY)
- **Zapsplat.com** (licença gratuita para uso)
- **Mixkit.co/free-sound-effects/** (100% grátis)

## Critérios de Qualidade

- Duração: 200ms-800ms
- Formato: MP3 (melhor compatibilidade browser)
- Taxa de bits: 128kbps (equilíbrio qualidade/tamanho)
- Volume: normalizado (não muito alto/baixo)
- Tom: infantil, alegre, não assustador

## Placeholder Atual

Enquanto os arquivos reais não estiverem disponíveis, o hook `useSound()` funciona em modo silencioso (volume 0 é tratado como válido).
