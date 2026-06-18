import { getXpTotal, saveXpTotal, getLastActive } from './storage';
import { INACTIVITY_PENALTY_PER_WEEK } from '../constants/xpValues';
import { getRank } from '../constants/ranks';
import { todayKey } from '../utils/dateUtils';

function parseKey(key: string): Date | null {
  const parts = key.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

function daysBetween(fromKey: string, toKey: string): number {
  const a = parseKey(fromKey);
  const b = parseKey(toKey);
  if (!a || !b) return 0;
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

export interface InactivityResult {
  penaltyApplied: number;
  newXP: number;
  rankDropped: boolean;
  daysInactive: number;
}

/**
 * Penalización por inactividad. Empieza después de 7 días sin abrir la app:
 * -50 XP por semana inactiva (creciente), nunca por debajo de 0. Si los XP caen
 * por debajo del umbral del rango actual, el rango baja automáticamente (queda
 * reflejado al recalcular el rango desde el XP).
 *
 * IMPORTANTE: debe correr ANTES de procesar la racha (usa el lastActive viejo).
 */
export async function processInactivityOnOpen(): Promise<InactivityResult> {
  const [lastActive, xpTotal] = await Promise.all([getLastActive(), getXpTotal()]);
  if (!lastActive) {
    return { penaltyApplied: 0, newXP: xpTotal, rankDropped: false, daysInactive: 0 };
  }

  const days = daysBetween(lastActive, todayKey());
  if (days < 7) {
    return { penaltyApplied: 0, newXP: xpTotal, rankDropped: false, daysInactive: days };
  }

  const weeks = Math.floor(days / 7);
  const penalty = weeks * INACTIVITY_PENALTY_PER_WEEK;
  const newXP = Math.max(0, xpTotal - penalty);
  const rankDropped = getRank(xpTotal).level > getRank(newXP).level;

  if (newXP !== xpTotal) await saveXpTotal(newXP);

  return { penaltyApplied: xpTotal - newXP, newXP, rankDropped, daysInactive: days };
}
