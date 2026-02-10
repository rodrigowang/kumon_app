#!/usr/bin/env node
/**
 * Gera ícones PWA placeholder em formato PNG usando SVG base
 * Requer: npm install -D sharp
 * Uso: node scripts/generate-pwa-icons.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// SVG base - verde Kumon (#4CAF50) com letra "K"
const createSVG = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#4CAF50" rx="${size * 0.125}"/>
  <text
    x="${size / 2}"
    y="${size * 0.64}"
    font-family="Arial, sans-serif"
    font-size="${size * 0.55}"
    font-weight="bold"
    fill="#FFFFFF"
    text-anchor="middle">K</text>
</svg>
`;

const publicDir = 'public';

// Criar arquivos SVG temporários e convertê-los manualmente
const icons = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon.ico', size: 32 }
];

console.log('📝 Gerando SVGs base...');

icons.forEach(({ name, size }) => {
  const svgContent = createSVG(size);
  const svgPath = join(publicDir, name.replace(/\.(png|ico)$/, '.svg'));
  writeFileSync(svgPath, svgContent.trim());
  console.log(`   ✓ ${svgPath}`);
});

console.log('\n⚠️  AÇÃO NECESSÁRIA:');
console.log('   Para converter SVG → PNG, você pode usar:');
console.log('   1. Ferramenta online: https://svgtopng.com');
console.log('   2. Instalar imagemagick: sudo apt install imagemagick');
console.log('   3. Ou instalar sharp: npm install -D sharp');
console.log('\n   Por enquanto, os SVGs foram criados como placeholder.');
