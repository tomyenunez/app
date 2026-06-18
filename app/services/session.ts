import { processInactivityOnOpen, InactivityResult } from './inactivityService';
import { processStreakOnOpen, StreakResult } from './streakService';

export interface AppOpenResult {
  inactivity: InactivityResult;
  streak: StreakResult;
}

// Se cachea para correr una sola vez por arranque (evita doble ejecución por
// el doble-render de React en desarrollo). El orden importa: primero la
// penalización por inactividad (usa el lastActive viejo), después la racha.
let inFlight: Promise<AppOpenResult> | null = null;

export function onAppOpen(): Promise<AppOpenResult> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const inactivity = await processInactivityOnOpen();
    const streak = await processStreakOnOpen();
    return { inactivity, streak };
  })();
  return inFlight;
}
