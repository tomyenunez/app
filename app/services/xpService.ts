import {
  getXpTotal, saveXpTotal, getXpDaily, saveXpDaily,
  getXpClaims, saveXpClaims, getBadges, saveBadges,
  getRecords, saveRecords, getStreak,
} from './storage';
import { getUserLevel } from '../constants/levels';
import { BADGES, BadgeStats } from '../constants/badges';
import { AwardResult, Badge } from '../types/game';
import { todayKey, dateKey } from '../utils/dateUtils';
import { startOfWeek } from 'date-fns';

// --- Emisor de eventos minimalista (la UI se suscribe para toasts/modales) ---
type Listener = (r: AwardResult) => void;
const listeners = new Set<Listener>();

export const gameEvents = {
  subscribe(fn: Listener): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  emit(r: AwardResult) {
    listeners.forEach((fn) => fn(r));
  },
};

interface AwardOpts {
  isBonus?: boolean;
  isStar?: boolean;
  stats?: Partial<BadgeStats>; // pistas del caller (hábito nocturno, perfecto, etc.)
}

// Suma XP del día y devuelve el total del día y de la semana
async function bumpDailyXP(amount: number): Promise<{ today: number; week: number }> {
  const daily = await getXpDaily();
  const tk = todayKey();
  daily[tk] = (daily[tk] ?? 0) + amount;
  await saveXpDaily(daily);

  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  let week = 0;
  Object.entries(daily).forEach(([key, xp]) => {
    const [y, m, d] = key.split('-').map(Number);
    if (new Date(y, m - 1, d) >= weekStart) week += xp;
  });
  return { today: daily[tk], week };
}

async function checkBadges(stats: BadgeStats): Promise<Badge[]> {
  const unlocked = await getBadges();
  const nuevos: Badge[] = [];
  for (const def of BADGES) {
    if (!unlocked[def.id] && def.check(stats)) {
      unlocked[def.id] = new Date().toISOString();
      nuevos.push({
        id: def.id, name: def.name, description: def.description,
        icon: def.icon, rarity: def.rarity, color: def.color,
      });
    }
  }
  if (nuevos.length > 0) await saveBadges(unlocked);
  return nuevos;
}

/**
 * Otorga XP. El XP nunca resta. Verifica subida de nivel y badges, y emite
 * un evento para que la UI muestre toasts / modal de nivel.
 */
export async function awardXP(amount: number, reason: string, opts: AwardOpts = {}): Promise<AwardResult> {
  const prevTotal = await getXpTotal();
  const newTotal = prevTotal + amount;
  await saveXpTotal(newTotal);

  const prevLevel = getUserLevel(prevTotal);
  const newLevel = getUserLevel(newTotal);
  const leveledUp = newLevel.level > prevLevel.level;

  const { today, week } = await bumpDailyXP(amount);

  // Récords (mejor día / mejor semana)
  const records = await getRecords();
  let newWeekRecord = false;
  if (today > records.bestDayXP) records.bestDayXP = today;
  if (week > records.bestWeekXP) {
    // Solo cuenta como "nuevo récord" si ya había un récord previo distinto de 0
    if (records.bestWeekXP > 0 && week > records.bestWeekXP) newWeekRecord = true;
    records.bestWeekXP = week;
  }
  const streak = await getStreak();
  if (streak > records.bestStreak) records.bestStreak = streak;
  await saveRecords(records);

  // Badges
  const stats: BadgeStats = {
    streak,
    xpTotal: newTotal,
    totalTodos: records.totalTodosCompleted,
    weeklyStars: opts.stats?.weeklyStars ?? 0,
    perfectDays7: opts.stats?.perfectDays7 ?? false,
    completedAfter23: opts.stats?.completedAfter23 ?? false,
    completedBefore7: opts.stats?.completedBefore7 ?? false,
    perfectDay: opts.stats?.perfectDay ?? false,
    newWeekRecord: opts.stats?.newWeekRecord ?? newWeekRecord,
  };
  const newBadges = await checkBadges(stats);

  const result: AwardResult = {
    awarded: amount,
    reason,
    isBonus: opts.isBonus ?? false,
    isStar: opts.isStar ?? false,
    newTotal,
    leveledUp,
    newLevel: leveledUp ? newLevel : undefined,
    newBadges,
  };
  gameEvents.emit(result);
  return result;
}

/**
 * Otorga XP una sola vez por `key` (anti doble-conteo: re-marcar una tarea no
 * vuelve a dar XP). Si la key ya fue reclamada, no hace nada.
 */
export async function awardXPOnce(key: string, amount: number, reason: string, opts: AwardOpts = {}): Promise<void> {
  const claims = await getXpClaims();
  if (claims[key]) return;
  claims[key] = true;
  await saveXpClaims(claims);
  await awardXP(amount, reason, opts);
}

/**
 * Revierte un award puntual (anti XP-fantasma): si la `key` estaba reclamada,
 * la libera y resta ese XP del total y del día en curso (nunca baja de 0). Es la
 * operación inversa de `awardXPOnce`, para cuando una acción que sumó puntos se
 * deshace (desmarcar hábito, descompletar tarea, borrar evento/movimiento).
 *
 * Emite un evento con `awarded` negativo: la UI lo usa para refrescar el total,
 * pero NO dispara toast ni efectos (el overlay solo reacciona a awarded > 0).
 * Devuelve true si efectivamente revirtió (la key existía).
 */
export async function reverseXPOnce(key: string, amount: number): Promise<boolean> {
  const claims = await getXpClaims();
  if (!claims[key]) return false; // nunca se otorgó (o ya se revirtió): no-op
  delete claims[key];
  await saveXpClaims(claims);

  const prevTotal = await getXpTotal();
  const newTotal = Math.max(0, prevTotal - amount);
  await saveXpTotal(newTotal);

  const daily = await getXpDaily();
  const tk = todayKey();
  daily[tk] = Math.max(0, (daily[tk] ?? 0) - amount);
  await saveXpDaily(daily);

  gameEvents.emit({
    awarded: -amount,
    reason: 'Acción deshecha',
    isBonus: false,
    isStar: false,
    newTotal,
    leveledUp: false,
    newBadges: [],
  });
  return true;
}

// Incrementadores de récords (totales históricos)
export async function incrementTodoRecord(): Promise<void> {
  const r = await getRecords();
  r.totalTodosCompleted += 1;
  await saveRecords(r);
}
export async function incrementHabitRecord(isStar: boolean): Promise<void> {
  const r = await getRecords();
  r.totalHabitsCompleted += 1;
  if (isStar) r.totalExtraStars += 1;
  await saveRecords(r);
}

// Decrementadores: al deshacer la acción, revierten el conteo (nunca bajan de 0)
export async function decrementTodoRecord(): Promise<void> {
  const r = await getRecords();
  r.totalTodosCompleted = Math.max(0, r.totalTodosCompleted - 1);
  await saveRecords(r);
}
export async function decrementHabitRecord(isStar: boolean): Promise<void> {
  const r = await getRecords();
  r.totalHabitsCompleted = Math.max(0, r.totalHabitsCompleted - 1);
  if (isStar) r.totalExtraStars = Math.max(0, r.totalExtraStars - 1);
  await saveRecords(r);
}

// Estrellas extra de la semana actual (para el badge "Sobre-humano")
export async function weeklyStarsCount(habitDone: Record<string, boolean>, habitos: { id: string; days: number[] }[]): Promise<number> {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  let stars = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + i);
    const idx = (day.getDay() + 6) % 7;
    habitos.forEach((h) => {
      if (!h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) stars++;
    });
  }
  return stars;
}
