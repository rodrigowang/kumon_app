# PWA Icons - Kumon Math App

## Status Atual

✅ **Ícones placeholder criados** (PNGs de 1x1 pixel verde)
⚠️ **Ícones reais pendentes** (SVGs base disponíveis)

## Arquivos

| Arquivo | Tamanho | Uso |
|---------|---------|-----|
| `pwa-192x192.png` | 192×192 | PWA install prompt (Android) |
| `pwa-512x512.png` | 512×512 | PWA splash screen, maskable icon |
| `apple-touch-icon.png` | 180×180 | iOS home screen icon |
| `favicon.ico` | 32×32 | Browser tab icon |
| `robots.txt` | - | SEO/crawlers (app é PWA, não indexável) |

## Como Gerar Ícones Reais

### Opção 1: ImageMagick (Recomendado)

```bash
sudo apt install imagemagick
./scripts/generate-pwa-icons.sh
```

### Opção 2: Sharp (Node.js)

```bash
npm install -D sharp
# Adicionar código de conversão SVG→PNG em generate-pwa-icons.mjs
```

### Opção 3: Ferramenta Online

1. Abra os arquivos SVG em `public/*.svg`
2. Converta em https://svgtopng.com ou https://realfavicongenerator.net
3. Baixe e substitua os PNGs

### Opção 4: Design Manual

Use Figma, Photoshop ou qualquer editor gráfico:
- **Fundo**: `#4CAF50` (verde Kumon)
- **Letra "K"**: Branca, fonte bold, centralizada
- **Arredondar cantos**: 12.5% do tamanho (ex: 64px para 512×512)

## Validação

Após gerar os ícones reais:

```bash
npm run build
npm run preview
```

Abra http://localhost:4173 e verifique:
- ✅ Ícone aparece no DevTools > Application > Manifest
- ✅ "Add to Home Screen" funciona (mobile)
- ✅ Ícones não estão distorcidos ou pixelados

## Referências

- [PWA Icons Guide](https://web.dev/add-manifest/#icons)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [Apple Touch Icons](https://developer.apple.com/design/human-interface-guidelines/app-icons)
