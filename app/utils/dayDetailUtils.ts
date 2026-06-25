import { Habito, Todo } from '../types';
import { todayIdx, todayKey, isSameDay } from './dateUtils';
import { XP_VALUES } from '../constants/xpValues';

export interface HabitDayStatus {
  id: string;
  name: string;
  done: boolean;
  isExtra: boolean; // completado un día que no tocaba (⭐)
  xp: number;       // 15 si extra, 10 si normal, 0 si no se completó
}

export interface TodoDayStatus {
  completadas: number;
  total: number;
}

// Estado de los hábitos para hoy: los que aplican hoy + los "extra" que se
// completaron hoy aunque no tocaban. Los extra van al final.
export function getHabitsStatusToday(
  habitos: Habito[],
  habitDone: Record<string, boolean>
): HabitDayStatus[] {
  const idx = todayIdx();
  const key = todayKey();
  return habitos
    .filter((h) => h.days.includes(idx) || habitDone[`${key}-${h.id}`])
    .map((h) => {
      const aplicaHoy = h.days.includes(idx);
      const done = !!habitDone[`${key}-${h.id}`];
      const isExtra = done && !aplicaHoy;
      return {
        id: h.id,
        name: h.name,
        done,
        isExtra,
        xp: done ? (isExtra ? XP_VALUES.COMPLETE_HABIT_EXTRA_DAY : XP_VALUES.COMPLETE_HABIT) : 0,
      };
    })
    .sort((a, b) => (a.isExtra ? 1 : 0) - (b.isExtra ? 1 : 0));
}

// Tareas con fecha de hoy: completadas / total (mismo criterio que el score)
export function getTodosStatusToday(todos: Todo[]): TodoDayStatus {
  const today = new Date();
  const hoy = todos.filter((t) => t.fecha && isSameDay(new Date(t.fecha), today));
  return { completadas: hoy.filter((t) => t.done).length, total: hoy.length };
}

// XP del día por completar hábitos y tareas (no incluye racha ni misiones).
// En Dayxo cada tarea completada suma COMPLETE_TODO; los hábitos 10/15.
export function getTotalXPToday(habits: HabitDayStatus[], todos: TodoDayStatus): number {
  const habitXP = habits.reduce((sum, h) => sum + h.xp, 0);
  const todoXP = todos.completadas * XP_VALUES.COMPLETE_TODO;
  return habitXP + todoXP;
}

// Mensaje motivacional según el score y lo que falta
export function getMotivationalMessage(score: number, pendingCount: number): string {
  if (score >= 100) return '¡Día perfecto! No dejaste nada en el tintero. 🔥';
  if (score >= 75) return `Vas muy bien. Te ${pendingCount === 1 ? 'falta' : 'faltan'} ${pendingCount} para el 100%.`;
  if (score >= 50) return 'Vas a mitad de camino. Todavía podés sumar hoy.';
  if (score >= 25) return `Recién arrancando. ${pendingCount === 1 ? 'Queda' : 'Quedan'} ${pendingCount} ${pendingCount === 1 ? 'cosa' : 'cosas'} por hacer.`;
  if (score === 0 && pendingCount > 0) return 'Todavía no completaste nada hoy. ¡Dale, arrancá! 💪';
  return '¡Buen trabajo hoy!';
}
