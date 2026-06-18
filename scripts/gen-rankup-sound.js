// Genera un chime de celebración (arpegio ascendente) como WAV PCM 16-bit mono.
// Uso: node scripts/gen-rankup-sound.js
// Salida: app/assets/sounds/rankup.wav
const fs = require('fs');
const path = require('path');

const SR = 44100; // sample rate
const notes = [
  { f: 523.25, t: 0.00 }, // C5
  { f: 659.25, t: 0.10 }, // E5
  { f: 783.99, t: 0.20 }, // G5
  { f: 1046.5, t: 0.30 }, // C6 (final, sostenida)
];
const noteDur = 0.45; // cada nota suena 450ms con decay
const total = 0.30 + noteDur + 0.05; // duración total

const n = Math.floor(SR * total);
const data = new Float32Array(n);

for (const note of notes) {
  const start = Math.floor(note.t * SR);
  for (let i = 0; i < Math.floor(noteDur * SR); i++) {
    const idx = start + i;
    if (idx >= n) break;
    const tt = i / SR;
    // Envolvente: ataque corto + decay exponencial
    const attack = Math.min(1, tt / 0.005);
    const decay = Math.exp(-tt * 5.5);
    const env = attack * decay;
    // Tono + un toque de octava para brillo
    const s =
      Math.sin(2 * Math.PI * note.f * tt) * 0.6 +
      Math.sin(2 * Math.PI * note.f * 2 * tt) * 0.18;
    data[idx] += s * env * 0.5;
  }
}

// Normalizar a -1..1
let peak = 0;
for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(data[i]));
if (peak > 0) for (let i = 0; i < n; i++) data[i] = (data[i] / peak) * 0.9;

// Escribir WAV 16-bit PCM mono
const bytesPerSample = 2;
const buffer = Buffer.alloc(44 + n * bytesPerSample);
buffer.write('RIFF', 0);
buffer.writeUInt32LE(36 + n * bytesPerSample, 4);
buffer.write('WAVE', 8);
buffer.write('fmt ', 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20); // PCM
buffer.writeUInt16LE(1, 22); // mono
buffer.writeUInt32LE(SR, 24);
buffer.writeUInt32LE(SR * bytesPerSample, 28);
buffer.writeUInt16LE(bytesPerSample, 32);
buffer.writeUInt16LE(16, 34);
buffer.write('data', 36);
buffer.writeUInt32LE(n * bytesPerSample, 40);
for (let i = 0; i < n; i++) {
  const v = Math.max(-1, Math.min(1, data[i]));
  buffer.writeInt16LE(Math.round(v * 32767), 44 + i * bytesPerSample);
}

const out = path.join(__dirname, '..', 'app', 'assets', 'sounds', 'rankup.wav');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, buffer);
console.log('WAV escrito en', out, '·', (buffer.length / 1024).toFixed(1), 'KB');
