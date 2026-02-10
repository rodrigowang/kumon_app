#!/bin/bash
# Script para gerar ícones PWA placeholder usando ImageMagick

# Cores do tema Kumon (verde primário)
COLOR="#4CAF50"
TEXT_COLOR="#FFFFFF"

# Gerar ícone 192x192
convert -size 192x192 xc:"$COLOR" \
  -gravity center \
  -pointsize 80 \
  -font "DejaVu-Sans-Bold" \
  -fill "$TEXT_COLOR" \
  -annotate +0+0 "K" \
  public/pwa-192x192.png

# Gerar ícone 512x512
convert -size 512x512 xc:"$COLOR" \
  -gravity center \
  -pointsize 240 \
  -font "DejaVu-Sans-Bold" \
  -fill "$TEXT_COLOR" \
  -annotate +0+0 "K" \
  public/pwa-512x512.png

# Gerar favicon
convert -size 32x32 xc:"$COLOR" \
  -gravity center \
  -pointsize 18 \
  -font "DejaVu-Sans-Bold" \
  -fill "$TEXT_COLOR" \
  -annotate +0+0 "K" \
  public/favicon.ico

# Gerar apple-touch-icon
convert -size 180x180 xc:"$COLOR" \
  -gravity center \
  -pointsize 72 \
  -font "DejaVu-Sans-Bold" \
  -fill "$TEXT_COLOR" \
  -annotate +0+0 "K" \
  public/apple-touch-icon.png

echo "✅ Ícones PWA gerados com sucesso!"
