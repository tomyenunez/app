import {
  getStreak, saveStreak, getLongestStreak, saveLongestStreak,
  getLastActive, saveLastActive,
} from './storage';
import { getDailyStreakPoints, getStreakBonus, isStreakMilestone } from '../constants/xpValues';
import { awardXP } from './xpService';
import { todayKey } from '../utils/dateUtils';

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export interface StreakResult {
  newStreak: number;
  alreadyCounted: boolean; // ya se contó hoy
  pointsEarned: number;
  bonusEarned: number;
  hitMilestone: boolean;
  milestoneDay: number | null;
  broke: boolean; // se rompió una racha previa
}

/**
 * Procesa la racha al abrir la app: continúa, reinicia o no hace nada si ya se
 * contó hoy. Otorga los puntos diarios de racha (1→3) y el bonus de hito si
 * corresponde. Los XP totales NUNCA se pierden por romper la racha — solo el
 * contador de días vuelve a 0.
 */
export async function processStreakOnOpen(): Promise<StreakResult> {
  const [current, longest, lastActive] = await Promise.all([
    getStreak(), getLongestStreak(), getLastActive(),
  ]);
  const today = todayKey();

  // Ya se abrió hoy → no hacer nada
  if (lastActive === today) {
    return {
      newStreak: current, alreadyCounted: true, pointsEarned: 0, bonusEarned: 0,
      hitMilestone: false, milestoneDay: null, broke: false,
    };
  }

  const continues = lastActive === yesterdayKey();
  const broke = !continues && current > 0 && lastActive !== '';
  const newStreak = continues ? current + 1 : 1;

  const pointsEarned = getDailyStreakPoints(newStreak);
  const hitMilestone = isStreakMilestone(newStreak);
  const bonusEarned = hitMilestone ? getStreakBonus(newStreak) : 0;

  const newLongest = Math.max(longest, newStreak);

  // Guardar la racha ANTES de otorgar XP, para que los récords la tomen.
  await Promise.all([
    saveStreak(newStreak),
    saveLastActive(today),
    saveLongestStreak(newLongest),
  ]);

  if (pointsEarned > 0) {
    await awardXP(pointsEarned, `Racha diaria · ${newStreak} día${newStreak !== 1 ? 's' : ''}`);
  }
  if (bonusEarned > 0) {
    await awardXP(bonusEarned, `¡Racha de ${newStreak} días! 🔥`, { isBonus: true });
  }

  return {
    newStreak, alreadyCounted: false, pointsEarned, bonusEarned,
    hitMilestone, milestoneDay: hitMilestone ? newStreak : null, broke,
  };
}
