import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';

// Sonido de celebración al subir de rango. Genérico/de prueba por ahora
// (ver scripts/gen-rankup-sound.js). El audio nunca es crítico: si algo falla,
// la app sigue sin sonido.
let player: AudioPlayer | null = null;
let configured = false;

export async function playRankUp(): Promise<void> {
  try {
    if (!configured) {
      configured = true;
      // Sonar aunque el teléfono esté en silencio (iOS).
      await setAudioModeAsync({ playsInSilentMode: true });
    }
    if (!player) {
      player = createAudioPlayer(require('../assets/sounds/rankup.wav'));
    }
    player.seekTo(0);
    player.play();
  } catch {
    // sin sonido, no pasa nada
  }
}
