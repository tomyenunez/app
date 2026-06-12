import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Deuda, Habito, Transaction, Evento } from '../types';

const KEYS = {
  todos: '@kitdeldia/todos',
  deudas: '@kitdeldia/deudas',
  habitos: '@kitdeldia/habitos',
  txs: '@kitdeldia/txs',
  eventos: '@kitdeldia/eventos',
  habitDone: '@kitdeldia/habitDone',
  streak: '@kitdeldia/streak',
  lastActive: '@kitdeldia/lastActive',
};

async function getJSON<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

async function setJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// --- Todos ---
export async function getTodos(): Promise<Todo[]> {
  return getJSON<Todo[]>(KEYS.todos, []);
}
export async function saveTodos(todos: Todo[]): Promise<void> {
  return setJSON(KEYS.todos, todos);
}

// --- Deudas ---
export async function getDeudas(): Promise<Deuda[]> {
  return getJSON<Deuda[]>(KEYS.deudas, []);
}
export async function saveDeudas(deudas: Deuda[]): Promise<void> {
  return setJSON(KEYS.deudas, deudas);
}

// --- Habitos ---
export async function getHabitos(): Promise<Habito[]> {
  return getJSON<Habito[]>(KEYS.habitos, []);
}
export async function saveHabitos(habitos: Habito[]): Promise<void> {
  return setJSON(KEYS.habitos, habitos);
}

// --- Transactions ---
export async function getTxs(): Promise<Transaction[]> {
  return getJSON<Transaction[]>(KEYS.txs, []);
}
export async function saveTxs(txs: Transaction[]): Promise<void> {
  return setJSON(KEYS.txs, txs);
}

// --- Eventos ---
export async function getEventos(): Promise<Evento[]> {
  return getJSON<Evento[]>(KEYS.eventos, []);
}
export async function saveEventos(eventos: Evento[]): Promise<void> {
  return setJSON(KEYS.eventos, eventos);
}

// --- Habit Done ---
export async function getHabitDone(): Promise<Record<string, boolean>> {
  return getJSON<Record<string, boolean>>(KEYS.habitDone, {});
}
export async function saveHabitDone(done: Record<string, boolean>): Promise<void> {
  return setJSON(KEYS.habitDone, done);
}

// --- Streak ---
export async function getStreak(): Promise<number> {
  return getJSON<number>(KEYS.streak, 0);
}
export async function saveStreak(streak: number): Promise<void> {
  return setJSON(KEYS.streak, streak);
}

export async function getLastActive(): Promise<string> {
  return getJSON<string>(KEYS.lastActive, '');
}
export async function saveLastActive(date: string): Promise<void> {
  return setJSON(KEYS.lastActive, date);
}
