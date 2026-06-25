import { format, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Todo } from '../types';

export type HistoryFilter = 'all' | 'week' | 'month';

export interface TodoHistoryGroup {
  key: string;     // clave de día (para React)
  label: string;   // "Hoy" / "Ayer" / "17 de junio"
  todos: Todo[];   // ordenadas por hora de completado descendente
}

// Clave de día a partir de un ISO (para agrupar las tareas del mismo día)
function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Etiqueta amigable del día de completado
export function formatHistoryDateLabel(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return 'Hoy';
  if (isYesterday(d)) return 'Ayer';
  return format(d, "d 'de' MMMM", { locale: es });
}

// Filtra las tareas completadas según el rango elegido en las tabs
export function filterByRange(todos: Todo[], range: HistoryFilter): Todo[] {
  if (range === 'all') return todos;
  return todos.filter((t) => {
    if (!t.completedAt) return false;
    const d = new Date(t.completedAt);
    return range === 'week' ? isThisWeek(d, { weekStartsOn: 1 }) : isThisMonth(d);
  });
}

// Agrupa las tareas completadas por día de completado (más reciente primero);
// dentro de cada día, por hora de completado descendente.
export function groupTodosByCompletedDate(completed: Todo[]): TodoHistoryGroup[] {
  const sorted = completed
    .filter((t) => t.completedAt)
    .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

  const groups: TodoHistoryGroup[] = [];
  const byKey: Record<string, TodoHistoryGroup> = {};
  for (const t of sorted) {
    const key = dayKey(t.completedAt!);
    if (!byKey[key]) {
      byKey[key] = { key, label: formatHistoryDateLabel(t.completedAt!), todos: [] };
      groups.push(byKey[key]);
    }
    byKey[key].todos.push(t);
  }
  return groups;
}
