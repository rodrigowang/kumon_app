/**
 * Gera sons sintéticos usando Web Audio API como fallback
 * quando os arquivos MP3 não estão disponíveis.
 *
 * Cada função retorna um Data URL que pode ser usado como src do Howler.
 */

/**
 * Gera um som de acerto (nota ascendente alegre)
 * Frequências: 523Hz (C5) → 659Hz (E5)
 */
export function generateCorrectSound(): string {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 0.3;
  const sampleRate = audioContext.sampleRate;
  const numSamples = duration * sampleRate;

  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 523 + (659 - 523) * (t / duration); // Glide de C5 a E5
    const envelope = Math.exp(-3 * t); // Decay exponencial
    data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
  }

  return bufferToDataURL(buffer);
}

/**
 * Gera um som de erro (buzz suave e curto)
 * Frequência: 200Hz (baixa, não assustadora)
 */
export function generateWrongSound(): string {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 0.2;
  const sampleRate = audioContext.sampleRate;
  const numSamples = duration * sampleRate;

  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-5 * t);
    // Onda quadrada suavizada (harmônicos ímpares)
    data[i] = (
      Math.sin(2 * Math.PI * 200 * t) +
      Math.sin(2 * Math.PI * 600 * t) / 3
    ) * envelope * 0.2;
  }

  return bufferToDataURL(buffer);
}

/**
 * Gera um som de celebração (arpejo ascendente)
 * Sequência: C5 → E5 → G5 → C6
 */
export function generateCelebrationSound(): string {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 0.6;
  const sampleRate = audioContext.sampleRate;
  const numSamples = duration * sampleRate;

  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
  const noteDuration = duration / notes.length;

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIndex = Math.floor(t / noteDuration);
    const freq = notes[Math.min(noteIndex, notes.length - 1)];
    const localT = t - noteIndex * noteDuration;
    const envelope = Math.exp(-5 * localT);
    data[i] = Math.sin(2 * Math.PI * freq * localT) * envelope * 0.3;
  }

  return bufferToDataURL(buffer);
}

/**
 * Gera um som de clique (pop curto)
 * Frequência: 800Hz com ataque/decay rápidos
 */
export function generateClickSound(): string {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const duration = 0.05;
  const sampleRate = audioContext.sampleRate;
  const numSamples = duration * sampleRate;

  const buffer = audioContext.createBuffer(1, numSamples, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const envelope = Math.exp(-50 * t);
    data[i] = Math.sin(2 * Math.PI * 800 * t) * envelope * 0.2;
  }

  return bufferToDataURL(buffer);
}

/**
 * Converte um AudioBuffer em Data URL (WAV)
 * Simplificado: usa apenas o canal mono
 */
function bufferToDataURL(buffer: AudioBuffer): string {
  const channelData = buffer.getChannelData(0);
  const sampleRate = buffer.sampleRate;
  const numSamples = channelData.length;

  // WAV header + data
  const wavBuffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(wavBuffer);

  // RIFF header
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // PCM samples (float32 → int16)
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const sample = Math.max(-1, Math.min(1, channelData[i]));
    view.setInt16(offset, sample * 0x7FFF, true);
    offset += 2;
  }

  // Convert to base64
  const bytes = new Uint8Array(wavBuffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return `data:audio/wav;base64,${base64}`;
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
