import { format, isToday, isYesterday, isTomorrow, startOfWeek, addDays, getDay } from 'date-fns';
import { es } from 'date-fns/locale';

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

// 0=Lunes, 6=Domingo
export function todayIdx(): number {
  return (new Date().getDay() + 6) % 7;
}

export function weekDays(): Date[] {
  const today = new Date();
  // Monday of current week
  const monday = startOfWeek(today, { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function weekStrip(): Date[] {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => addDays(today, i - 3));
}

export function formatFullDate(date: Date): string {
  return format(date, "EEEE d 'de' MMMM", { locale: es });
}

export function formatDateLabel(date: Date): string {
  return format(date, "EEEE, d 'de' MMMM", { locale: es }).toUpperCase();
}

export function formatShortDay(date: Date): string {
  const days = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];
  return days[(getDay(date) + 6) % 7];
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: es });
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isPast(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

export function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 12) return 'Buenos días ☀️';
  if (hour < 19) return 'Buenas tardes ⚡';
  return 'Buenas noches 🌙';
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
