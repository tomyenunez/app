import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Habito } from '../types';

// Cómo se muestran las notificaciones con la app abierta.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android' || channelReady) return;
  channelReady = true;
  await Notifications.setNotificationChannelAsync('habitos', {
    name: 'Recordatorios de hábitos',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('tareas', {
    name: 'Recordatorios de tareas',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
}

export async function hasNotificationPermission(): Promise<boolean> {
  const c = await Notifications.getPermissionsAsync();
  return c.granted || c.status === 'granted';
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  let granted = current.granted || current.status === 'granted';
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.granted || req.status === 'granted';
  }
  if (granted) await ensureAndroidChannel();
  return granted;
}

// app idx (0=Lunes..6=Domingo) → weekday de expo (1=Domingo..7=Sábado)
function toExpoWeekday(appIdx: number): number {
  return appIdx === 6 ? 1 : appIdx + 2;
}

function reminderId(habitId: string, appIdx: number): string {
  return `habit-${habitId}-d${appIdx}`;
}

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

// Cancela los recordatorios de un hábito (todos los días posibles, así también
// limpia días que se hayan sacado al editar).
export async function cancelHabitReminders(habitId: string): Promise<void> {
  await Promise.all(
    ALL_DAYS.map((d) =>
      Notifications.cancelScheduledNotificationAsync(reminderId(habitId, d)).catch(() => {})
    )
  );
}

// (Re)programa los recordatorios de un hábito según su config. Pide permiso si
// hace falta; si no se concede, no programa nada.
export async function scheduleHabitReminders(habito: Habito): Promise<void> {
  await cancelHabitReminders(habito.id);
  const rec = habito.recordatorio;
  if (!rec || !rec.enabled || habito.days.length === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  const [hRaw, mRaw] = (rec.hora || '09:00').split(':').map(Number);
  const hour = Number.isFinite(hRaw) ? hRaw : 9;
  const minute = Number.isFinite(mRaw) ? mRaw : 0;
  const mensaje = (rec.mensaje && rec.mensaje.trim()) || `No te olvides: ${habito.name} 💪`;

  for (const d of habito.days) {
    await Notifications.scheduleNotificationAsync({
      identifier: reminderId(habito.id, d),
      content: {
        title: '🔥 Hábito del día',
        body: mensaje,
        sound: true,
        data: { type: 'habit_reminder', habitId: habito.id, screen: 'Habitos' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        channelId: 'habitos',
        weekday: toExpoWeekday(d),
        hour,
        minute,
      },
    });
  }
}

// Resincroniza todos los recordatorios al arrancar la app (por si el SO los
// limpió). No-op si ningún hábito tiene recordatorio activo.
export async function syncAllHabitReminders(habitos: Habito[]): Promise<void> {
  if (!habitos.some((h) => h.recordatorio?.enabled)) return;
  // No pedir permiso al arrancar; solo resincronizar si ya está concedido.
  if (!(await hasNotificationPermission())) return;
  for (const h of habitos) {
    if (h.recordatorio?.enabled) await scheduleHabitReminders(h);
  }
}

// --- Recordatorios de tareas (to-do con fecha + hora) ---

type TodoReminderInput = {
  id: string;
  text: string;
  fecha?: string; // ISO
  hora?: string;  // "HH:MM"
  done?: boolean;
};

export async function cancelTodoReminders(todoId: string): Promise<void> {
  await Promise.all(
    [`todo-2h-${todoId}`, `todo-1h-${todoId}`].map((id) =>
      Notifications.cancelScheduledNotificationAsync(id).catch(() => {})
    )
  );
}

// (Re)programa avisos 2h y 1h antes de la fecha+hora de la tarea. Salta los que
// ya pasaron; no hace nada si falta fecha/hora o si la tarea está completada.
// Solo pide permiso de notificaciones si efectivamente hay algo para agendar.
export async function scheduleTodoReminders(todo: TodoReminderInput): Promise<void> {
  await cancelTodoReminders(todo.id);
  if (todo.done || !todo.fecha || !todo.hora) return;

  const target = new Date(todo.fecha);
  const [hRaw, mRaw] = todo.hora.split(':').map(Number);
  target.setHours(Number.isFinite(hRaw) ? hRaw : 9, Number.isFinite(mRaw) ? mRaw : 0, 0, 0);

  const now = Date.now();
  const reminders = [
    { id: `todo-2h-${todo.id}`, offsetMs: 2 * 60 * 60 * 1000, label: 'en 2 horas' },
    { id: `todo-1h-${todo.id}`, offsetMs: 60 * 60 * 1000, label: 'en 1 hora' },
  ].filter((r) => target.getTime() - r.offsetMs > now);

  if (reminders.length === 0) return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  for (const r of reminders) {
    await Notifications.scheduleNotificationAsync({
      identifier: r.id,
      content: {
        title: '📋 Tarea pendiente',
        body: `${todo.text} — vence ${r.label} (${todo.hora})`,
        sound: true,
        data: { type: 'todo_reminder', todoId: todo.id, screen: 'Todo' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        channelId: 'tareas',
        date: new Date(target.getTime() - r.offsetMs),
      },
    });
  }
}
