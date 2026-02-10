# Estrutura de Projeto e Princípios de Código

## Estrutura de Projeto

```
src/
├── components/       # Componentes React reutilizáveis
│   ├── ui/           # Componentes de UI base (Shadcn/Mantine wrappers)
│   ├── canvas/       # Canvas de desenho e captura
│   └── feedback/     # Animações de acerto/erro/celebração
├── hooks/            # Custom hooks (useOCR, useSound, useProgress)
├── lib/              # Glue code entre bibliotecas
│   ├── ocr/          # Pipeline de OCR (pré-processamento + inferência)
│   └── math/         # Geração de exercícios (wrappers de math.js)
├── stores/           # Estado global (Zustand)
├── types/            # TypeScript types e interfaces
└── assets/           # Sons, imagens, fontes
```

## Princípios

- **TypeScript strict** — `strict: true` no tsconfig, sem `any` implícito
- **Componentes pequenos** — cada componente faz uma coisa. Se ultrapassar ~100 linhas, quebre
- **Hooks para lógica** — lógica de negócio vive em hooks, não em componentes
- **Imports explícitos** — nada de `import *`, sempre named imports
- **Erros tratados** — toda operação assíncrona (OCR, carregamento de modelo) tem try/catch com fallback visual
