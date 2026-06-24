// Cálculo de estadísticas e insights de la pantalla Stats.
// Funciones puras: reciben los datos crudos + la fecha de referencia y devuelven
// estructuras listas para renderizar. Toda la lógica vive acá para mantener
// StatsScreen liviana y poder testear los cálculos por separado.
import {
  startOfWeek, startOfMonth, subMonths, addMonths, subDays, subWeeks, addDays, getDaysInMonth,
} from 'date-fns';
import { Todo, Habito, Transaction, Familia, OpcionGasto, FamiliaColor } from '../types';
import { PersonalRecords } from '../types/game';
import { dateKey } from './dateUtils';
import { Dayxo } from '../constants/dayxo';

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

// "YYYY-M-D" (formato de dateKey / created / tx.fecha / claves de xpDaily) → Date local
function parseKey(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

// 0 = lunes ... 6 = domingo
function weekdayIdx(d: Date): number {
  return (d.getDay() + 6) % 7;
}

// ---------- A) HÁBITOS ----------
export interface HabitPct { id: string; name: string; pct: number; }
export interface DayStat { idx: number; name: string; pct: number; }
export interface HabitInsights {
  activos: number;
  weekDone: number;
  weekTotal: number;
  best: HabitPct | null;
  worst: HabitPct | null;
  perHabit: HabitPct[];
  bestDay: DayStat | null;
  worstDay: DayStat | null;
}

export function habitInsights(
  habitos: Habito[],
  habitDone: Record<string, boolean>,
  today: Date,
): HabitInsights {
  const monday = startOfWeek(today, { weekStartsOn: 1 });

  // Semana actual: ocurrencias programadas vs cumplidas (meta semanal)
  let weekDone = 0;
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const day = addDays(monday, i);
    const idx = weekdayIdx(day);
    habitos.forEach((h) => {
      if (h.days.includes(idx)) {
        weekTotal++;
        if (habitDone[`${dateKey(day)}-${h.id}`]) weekDone++;
      }
    });
  }

  // Cumplimiento por hábito en los últimos 30 días
  const perHabit: HabitPct[] = habitos
    .map((h) => {
      let applies = 0;
      let done = 0;
      for (let i = 0; i < 30; i++) {
        const day = subDays(today, i);
        const idx = weekdayIdx(day);
        if (h.days.includes(idx)) {
          applies++;
          if (habitDone[`${dateKey(day)}-${h.id}`]) done++;
        }
      }
      return { id: h.id, name: h.name, pct: applies > 0 ? Math.round((done / applies) * 100) : 0 };
    })
    .sort((a, b) => b.pct - a.pct);

  const best = perHabit.length > 0 ? perHabit[0] : null;
  const worst = perHabit.length > 1 ? perHabit[perHabit.length - 1] : null;

  // Día más fuerte / más flojo: cumplimiento por día de semana (últimas 8 semanas)
  const agg = Array.from({ length: 7 }, () => ({ a: 0, d: 0 }));
  for (let i = 0; i < 56; i++) {
    const day = subDays(today, i);
    const idx = weekdayIdx(day);
    habitos.forEach((h) => {
      if (h.days.includes(idx)) {
        agg[idx].a++;
        if (habitDone[`${dateKey(day)}-${h.id}`]) agg[idx].d++;
      }
    });
  }
  const dayStats: DayStat[] = agg
    .map((s, idx) => ({ idx, name: WEEKDAY_NAMES[idx], pct: s.a > 0 ? Math.round((s.d / s.a) * 100) : -1 }))
    .filter((s) => s.pct >= 0)
    .sort((a, b) => b.pct - a.pct);

  const bestDay = dayStats.length > 0 ? dayStats[0] : null;
  const worstDay = dayStats.length > 1 ? dayStats[dayStats.length - 1] : null;

  return { activos: habitos.length, weekDone, weekTotal, best, worst, perHabit, bestDay, worstDay };
}

// ---------- B) TAREAS / PENDIENTES ----------
export interface CatCount { id: string; name: string; count: number; colorKey: FamiliaColor; }
export interface TaskInsights {
  weekDone: number;
  overdue: number;
  topCategory: string | null;
  topPending: string | null;
  perDay: number;
  perCategory: CatCount[];
  totalActive: number;
  totalTodos: number;
}

export function taskInsights(
  todos: Todo[],
  getFamilia: (id: string) => Familia,
  today: Date,
): TaskInsights {
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const sot = startOfDay(today);

  const weekDone = todos.filter((t) => t.done && parseKey(t.created) >= monday).length;
  const overdue = todos.filter((t) => !t.done && t.fecha && new Date(t.fecha) < sot).length;

  // Conteo por familia (todas las tareas)
  const map = new Map<string, number>();
  const pendingMap = new Map<string, number>();
  todos.forEach((t) => {
    map.set(t.tag, (map.get(t.tag) ?? 0) + 1);
    if (!t.done) pendingMap.set(t.tag, (pendingMap.get(t.tag) ?? 0) + 1);
  });

  const perCategory: CatCount[] = [...map.entries()]
    .map(([tag, count]) => {
      const f = getFamilia(tag);
      return { id: tag, name: f.nombre, count, colorKey: f.color };
    })
    .sort((a, b) => b.count - a.count);

  const topCategory = perCategory.length > 0 ? perCategory[0].name : null;

  let topPending: string | null = null;
  const pendingSorted = [...pendingMap.entries()].sort((a, b) => b[1] - a[1]);
  if (pendingSorted.length > 0) topPending = getFamilia(pendingSorted[0][0]).nombre;

  const daysElapsed = weekdayIdx(today) + 1;
  const perDay = Math.round((weekDone / daysElapsed) * 10) / 10;

  return {
    weekDone,
    overdue,
    topCategory,
    topPending,
    perDay,
    perCategory,
    totalActive: todos.filter((t) => !t.done).length,
    totalTodos: todos.length,
  };
}

// ---------- C) FINANZAS ----------
export interface FinanceInsights {
  gastoMes: number;
  ingresoMes: number;
  disponible: number;
  gastoDiario: number;
  topCategoria: { name: string; monto: number; colorKey: FamiliaColor } | null;
  proyeccion: number | null;
  gastoMesAnterior: number;
  gastoDeltaPct: number | null;
  hasData: boolean;
}

export function financeInsights(
  txs: Transaction[],
  getCategoria: (id: string | undefined) => OpcionGasto,
  today: Date,
): FinanceInsights {
  const mStart = startOfMonth(today);
  const mEnd = startOfMonth(addMonths(today, 1));
  const lmStart = startOfMonth(subMonths(today, 1));

  const inRange = (t: Transaction, s: Date, e: Date) => {
    const dt = parseKey(t.fecha);
    return dt >= s && dt < e;
  };

  let gastoMes = 0;
  let ingresoMes = 0;
  let gastoMesAnterior = 0;
  const catMap = new Map<string, number>();

  txs.forEach((t) => {
    if (inRange(t, mStart, mEnd)) {
      if (t.tipo === 'gasto') {
        gastoMes += t.monto;
        const id = t.categoria ?? 'sin';
        catMap.set(id, (catMap.get(id) ?? 0) + t.monto);
      } else {
        ingresoMes += t.monto;
      }
    }
    if (t.tipo === 'gasto' && inRange(t, lmStart, mStart)) gastoMesAnterior += t.monto;
  });

  // Disponible = balance total (coincide con la card "Disponible" de Finanzas)
  const disponible = txs.reduce((s, t) => s + (t.tipo === 'ingreso' ? t.monto : -t.monto), 0);

  const daysElapsed = today.getDate();
  const daysInMonth = getDaysInMonth(today);
  const gastoDiario = daysElapsed > 0 ? Math.round(gastoMes / daysElapsed) : 0;

  // Proyección: disponible actual menos lo que gastarías el resto del mes al ritmo actual
  let proyeccion: number | null = null;
  if (gastoMes > 0) {
    const remaining = daysInMonth - daysElapsed;
    proyeccion = Math.round(disponible - gastoDiario * remaining);
  }

  let topCategoria: FinanceInsights['topCategoria'] = null;
  if (catMap.size > 0) {
    const [id, monto] = [...catMap.entries()].sort((a, b) => b[1] - a[1])[0];
    const c = getCategoria(id === 'sin' ? undefined : id);
    topCategoria = { name: c.nombre, monto, colorKey: c.color };
  }

  const gastoDeltaPct = gastoMesAnterior > 0
    ? Math.round(((gastoMes - gastoMesAnterior) / gastoMesAnterior) * 100)
    : null;

  return {
    gastoMes,
    ingresoMes,
    disponible,
    gastoDiario,
    topCategoria,
    proyeccion,
    gastoMesAnterior,
    gastoDeltaPct,
    hasData: txs.length > 0,
  };
}

// ---------- D) EVOLUCIÓN ----------
export interface Variation { label: string; display: string; good: boolean; dir: 'up' | 'down' | 'flat'; }
export interface EvolutionInsights {
  prodDeltaPct: number | null;
  tasksMonthDiff: number;
  trend: 'up' | 'down' | 'flat' | 'none';
  variations: Variation[];
  hasData: boolean;
}

export function evolutionInsights(
  todos: Todo[],
  habitos: Habito[],
  habitDone: Record<string, boolean>,
  xpDaily: Record<string, number>,
  txs: Transaction[],
  today: Date,
): EvolutionInsights {
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  const lastMonday = subWeeks(monday, 1);

  const sumXP = (s: Date, e: Date) => {
    let sum = 0;
    Object.entries(xpDaily).forEach(([k, xp]) => {
      const dt = parseKey(k);
      if (dt >= s && dt < e) sum += xp;
    });
    return sum;
  };
  const weekXP = sumXP(monday, addDays(monday, 7));
  const lastWeekXP = sumXP(lastMonday, monday);
  const prodDeltaPct = lastWeekXP > 0 ? Math.round(((weekXP - lastWeekXP) / lastWeekXP) * 100) : null;

  const habitDoneCount = (start: Date) => {
    let c = 0;
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      const idx = weekdayIdx(day);
      habitos.forEach((h) => {
        if (h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) c++;
      });
    }
    return c;
  };
  const habWeek = habitDoneCount(monday);
  const habLast = habitDoneCount(lastMonday);

  const gastoBetween = (s: Date, e: Date) => {
    let g = 0;
    txs.forEach((t) => {
      if (t.tipo === 'gasto') {
        const dt = parseKey(t.fecha);
        if (dt >= s && dt < e) g += t.monto;
      }
    });
    return g;
  };
  const gWeek = gastoBetween(monday, addDays(monday, 7));
  const gLast = gastoBetween(lastMonday, monday);
  const gastoDeltaPct = gLast > 0 ? Math.round(((gWeek - gLast) / gLast) * 100) : null;

  const mStart = startOfMonth(today);
  const lmStart = startOfMonth(subMonths(today, 1));
  const doneCreatedBetween = (s: Date, e: Date) =>
    todos.filter((t) => t.done && parseKey(t.created) >= s && parseKey(t.created) < e).length;
  const tasksThisMonth = doneCreatedBetween(mStart, startOfMonth(addMonths(today, 1)));
  const tasksLastMonth = doneCreatedBetween(lmStart, mStart);
  const tasksMonthDiff = tasksThisMonth - tasksLastMonth;

  let trend: EvolutionInsights['trend'] = 'none';
  if (prodDeltaPct !== null) {
    trend = prodDeltaPct > 5 ? 'up' : prodDeltaPct < -5 ? 'down' : 'flat';
  }

  const variations: Variation[] = [];
  if (prodDeltaPct !== null) {
    variations.push({
      label: 'Productividad',
      display: `${prodDeltaPct >= 0 ? '+' : ''}${prodDeltaPct}%`,
      good: prodDeltaPct >= 0,
      dir: prodDeltaPct > 0 ? 'up' : prodDeltaPct < 0 ? 'down' : 'flat',
    });
  }
  const habDiff = habWeek - habLast;
  variations.push({
    label: 'Hábitos',
    display: `${habDiff >= 0 ? '+' : ''}${habDiff}`,
    good: habDiff >= 0,
    dir: habDiff > 0 ? 'up' : habDiff < 0 ? 'down' : 'flat',
  });
  if (gastoDeltaPct !== null) {
    variations.push({
      label: 'Gastos',
      display: `${gastoDeltaPct >= 0 ? '+' : ''}${gastoDeltaPct}%`,
      good: gastoDeltaPct <= 0, // gastar menos es bueno
      dir: gastoDeltaPct > 0 ? 'up' : gastoDeltaPct < 0 ? 'down' : 'flat',
    });
  }
  const xpDiff = weekXP - lastWeekXP;
  variations.push({
    label: 'XP',
    display: `${xpDiff >= 0 ? '+' : ''}${xpDiff}`,
    good: xpDiff >= 0,
    dir: xpDiff > 0 ? 'up' : xpDiff < 0 ? 'down' : 'flat',
  });

  const hasData = lastWeekXP > 0 || habLast > 0 || gLast > 0 || tasksLastMonth > 0;

  return { prodDeltaPct, tasksMonthDiff, trend, variations, hasData };
}

// ---------- E) INSIGHTS INTELIGENTES ----------
export interface SmartInsight { icon: string; accent: string; text: string; }

export function buildSmartInsights(input: {
  habit: HabitInsights;
  task: TaskInsights;
  finance: FinanceInsights;
  evolution: EvolutionInsights;
  level: { level: number; xpToNext: number };
  streak: number;
  records: PersonalRecords;
  weekXP: number;
}): SmartInsight[] {
  const { habit, task, finance, evolution, level, streak, records, weekXP } = input;
  const out: SmartInsight[] = [];

  // ----- 1) PROGRESO REAL / comparaciones (lo más personalizado, va primero) -----

  // Racha en su mejor momento histórico
  if (streak >= 3 && streak >= records.bestStreak) {
    out.push({ icon: 'flame', accent: Dayxo.orange, text: `¡${streak} días seguidos — es tu mejor racha hasta ahora! 🔥` });
  }

  // Productividad vs la semana pasada (XP)
  if (evolution.prodDeltaPct !== null && evolution.prodDeltaPct >= 10) {
    out.push({ icon: 'trending-up', accent: Dayxo.green, text: `Venís un ${evolution.prodDeltaPct}% más productivo que la semana pasada 🚀` });
  } else if (evolution.prodDeltaPct !== null && evolution.prodDeltaPct <= -10) {
    out.push({ icon: 'trending-down', accent: Dayxo.coral, text: `Tu actividad bajó ${Math.abs(evolution.prodDeltaPct)}% vs la semana pasada. ¡A retomar el ritmo!` });
  }

  // Hábitos completados vs la semana pasada
  const habVar = evolution.variations.find((v) => v.label === 'Hábitos');
  if (habVar && habVar.dir === 'up') {
    out.push({ icon: 'barbell', accent: Dayxo.habitos, text: `Completaste ${habVar.display.replace('+', '')} hábitos más que la semana pasada 💪` });
  }

  // Semana récord de XP
  if (weekXP > 0 && records.bestWeekXP > 0 && weekXP >= records.bestWeekXP) {
    out.push({ icon: 'sparkles', accent: Dayxo.pink, text: `Sumaste ${weekXP} XP esta semana — ¡tu mejor semana! ✨` });
  }

  // Gastos vs el mes pasado
  if (finance.gastoDeltaPct !== null && finance.gastoDeltaPct <= -10) {
    out.push({ icon: 'trending-down', accent: Dayxo.green, text: `Gastaste un ${Math.abs(finance.gastoDeltaPct)}% menos que el mes pasado. ¡Bien ahí! 👏` });
  } else if (finance.gastoDeltaPct !== null && finance.gastoDeltaPct >= 20) {
    out.push({ icon: 'card', accent: Dayxo.coral, text: `Tus gastos subieron ${finance.gastoDeltaPct}% respecto al mes pasado. Ojo con eso.` });
  }

  // ----- 2) TU DATA DESTACADA (personalizado, no comparativo) -----

  if (habit.best && habit.best.pct >= 60) {
    out.push({ icon: 'trophy', accent: Dayxo.habitos, text: `${habit.best.name} es tu hábito más firme (${habit.best.pct}% de cumplimiento).` });
  }
  if (habit.worst && habit.worst.pct < 40 && habit.perHabit.length > 1) {
    out.push({ icon: 'alert-circle', accent: Dayxo.coral, text: `${habit.worst.name} es el que más se te escapa (${habit.worst.pct}%). ¡Dale una chance hoy!` });
  }
  if (habit.bestDay) {
    out.push({ icon: 'calendar', accent: Dayxo.green, text: `Tus ${habit.bestDay.name} son tu día más fuerte. Aprovechalos.` });
  }
  if (finance.topCategoria) {
    out.push({ icon: 'card', accent: Dayxo.blue, text: `Tu mayor gasto del mes fue en ${finance.topCategoria.name}.` });
  }
  if (task.overdue > 0) {
    const s = task.overdue === 1;
    out.push({ icon: 'time', accent: Dayxo.coral, text: `Tenés ${task.overdue} ${s ? 'tarea vencida' : 'tareas vencidas'} — dales prioridad.` });
  }
  if (task.topPending && task.totalActive > 0) {
    out.push({ icon: 'list', accent: Dayxo.purple, text: `Lo que más tenés pendiente es de ${task.topPending}.` });
  }

  // ----- 3) MOTIVACIONAL / fallback (genérico, solo si quedó lugar) -----

  if (level.xpToNext > 0) {
    out.push({ icon: 'flash', accent: Dayxo.purple, text: `Te faltan ${Math.ceil(level.xpToNext)} XP para subir de rango.` });
  }
  if (streak >= 3 && streak < records.bestStreak) {
    out.push({ icon: 'flame', accent: Dayxo.orange, text: `Llevás ${streak} días de racha 🔥 ¡No la cortes!` });
  }

  return out.slice(0, 4);
}
