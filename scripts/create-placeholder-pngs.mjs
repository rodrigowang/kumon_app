#!/usr/bin/env node
/**
 * Cria PNGs placeholder de 1x1 pixel para validar PWA
 * Estes são apenas placeholders temporários até que ícones reais sejam criados
 */

import { writeFileSync } from 'fs';

// PNG 1x1 verde (#4CAF50) em base64
const greenPixelBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEBgIApD5fRAAAAABJRU5ErkJggg==';
const greenPixel = Buffer.from(greenPixelBase64, 'base64');

const icons = [
  'public/pwa-192x192.png',
  'public/pwa-512x512.png',
  'public/apple-touch-icon.png',
  'public/favicon.ico'
];

console.log('🎨 Criando PNGs placeholder (1x1 pixel verde)...\n');

icons.forEach(path => {
  writeFileSync(path, greenPixel);
  console.log(`   ✓ ${path}`);
});

console.log('\n✅ Placeholders criados!');
console.log('   ⚠️  Substitua por ícones reais antes de production.');
