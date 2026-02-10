/**
 * Script para gerar arquivos de áudio placeholder usando Web Audio API
 * Roda no Node.js (necessário instalar dependências específicas)
 *
 * Alternativa: Gerar arquivos vazios para testes
 */

import * as fs from 'fs';
import * as path from 'path';

// Gera um buffer WAV silencioso de 1 segundo
function generateSilentWAV(durationSeconds: number = 1): Buffer {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const numChannels = 1;
  const bytesPerSample = 2; // 16-bit

  const dataSize = numSamples * numChannels * bytesPerSample;
  const fileSize = 44 + dataSize;

  const buffer = Buffer.alloc(fileSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileSize - 8, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // chunk size
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * numChannels * bytesPerSample, 28);
  buffer.writeUInt16LE(numChannels * bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34); // bits per sample

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Samples (silence = 0)
  buffer.fill(0, 44);

  return buffer;
}

const soundsDir = path.join(__dirname, '..', 'src', 'assets', 'sounds');
const files = ['correct.mp3', 'wrong.mp3', 'celebration.mp3', 'click.mp3'];

files.forEach((filename) => {
  const wavBuffer = generateSilentWAV(1);
  // Por simplicidade, salvamos como WAV mas com extensão .mp3
  // Em produção, seria necessário converter para MP3 real
  const filepath = path.join(soundsDir, filename.replace('.mp3', '.wav'));
  fs.writeFileSync(filepath, wavBuffer);
  console.log(`✓ Gerado: ${filename.replace('.mp3', '.wav')}`);
});

console.log('\n⚠️ Nota: Arquivos gerados são WAV silenciosos.');
console.log('Para MP3 reais, use ferramentas como ffmpeg ou baixe de fontes gratuitas.');
