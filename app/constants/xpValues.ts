// Escala de XP v2 — calibrada para los 10 rangos gema (~50 XP/día promedio).
export const XP_VALUES = {
  // Tareas
  COMPLETE_TODO: 10,

  // Hábitos
  COMPLETE_HABIT: 10,
  COMPLETE_HABIT_EXTRA_DAY: 15, // día que no tocaba — estrella dorada ⭐
  COMPLETE_ALL_HABITS_OF_DAY: 30, // bonus por completar TODOS los del día

  // Rachas (los puntos diarios reales salen de getDailyStreakPoints)
  DAILY_STREAK: 1,
  STREAK_7_DAYS: 50,
  STREAK_30_DAYS: 300,
  STREAK_50_DAYS: 800,
  STREAK_100_DAYS: 1500, // de 100 en adelante se multiplica x2 cada 100 días

  // Finanzas
  LOG_TRANSACTION: 5,

  // Agenda
  ADD_EVENT: 5,

  // Misiones
  MISSION_DAILY: 50,
  MISSION_WEEKLY: 200,

  // Onboarding
  WELCOME_BONUS: 30,

  // Social (fase futura con Supabase)
  WIN_DUEL: 300,
  JOIN_GROUP: 50,
};

// Penalización por inactividad (a partir de 7 días sin abrir la app)
export const INACTIVITY_PENALTY_PER_WEEK = 50;

// Hitos de racha que otorgan bonus (además de los múltiplos de 100)
export const STREAK_MILESTONES = [7, 30, 50, 100, 200, 300, 400, 500];

/**
 * Puntos de racha por día consecutivo. Escala 1 → 3, con tope en el día 5+.
 */
export function getDailyStreakPoints(currentStreak: number): number {
  if (currentStreak <= 0) return 0;
  if (currentStreak === 1) return 1;
  if (currentStreak === 2) return 1.5;
  if (currentStreak === 3) return 2;
  if (currentStreak === 4) return 2.5;
  return 3; // tope día 5+
}

/**
 * Bonus por llegar a un hito de racha. Se otorga CADA VEZ que se llega al hito.
 * De 100 días en adelante: cada 100 días el valor base (1500) se multiplica.
 */
export function getStreakBonus(days: number): number {
  if (days < 7) return 0;
  if (days === 7) return XP_VALUES.STREAK_7_DAYS;
  if (days === 30) return XP_VALUES.STREAK_30_DAYS;
  if (days === 50) return XP_VALUES.STREAK_50_DAYS;
  if (days < 100) return 0;
  if (days % 100 !== 0) return 0;
  const cycles = Math.floor(days / 100);
  return XP_VALUES.STREAK_100_DAYS * cycles; // 100d=1500, 200d=3000, 300d=4500...
}

/**
 * ¿`days` es un hito de racha que dispara bonus?
 */
export function isStreakMilestone(days: number): boolean {
  return STREAK_MILESTONES.includes(days) || (days >= 100 && days % 100 === 0);
}
