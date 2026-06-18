import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Deuda, Habito, Transaction, Evento, Familia, OpcionGasto } from '../types';

export const KEYS = {
  todos: '@dayxo/todos',
  deudas: '@dayxo/deudas',
  habitos: '@dayxo/habitos',
  txs: '@dayxo/txs',
  eventos: '@dayxo/eventos',
  familias: '@dayxo/familias',
  habitDone: '@dayxo/habitDone',
  streak: '@dayxo/streak',
  longestStreak: '@dayxo/longest_streak',
  lastActive: '@dayxo/lastActive',
  categoriasGasto: '@dayxo/categoriasGasto',
  metodosPago: '@dayxo/metodosPago',
  // Gamificación
  xpTotal: '@dayxo/xp_total',
  xpDaily: '@dayxo/daily_xp', // { "YYYY-M-D": number }
  xpClaims: '@dayxo/xp_claims', // { [key]: true } anti-doble-conteo
  badges: '@dayxo/badges', // { [badgeId]: ISO timestamp }
  records: '@dayxo/records',
  profile: '@dayxo/profile',
  missionsState: '@dayxo/missions_state',
  // Flag de migración (corre una sola vez)
  migratedV2: '@dayxo/migrated_v2',
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

// --- Familias ---
export async function getFamilias(): Promise<Familia[]> {
  return getJSON<Familia[]>(KEYS.familias, []);
}
export async function saveFamilias(familias: Familia[]): Promise<void> {
  return setJSON(KEYS.familias, familias);
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

export async function getLongestStreak(): Promise<number> {
  return getJSON<number>(KEYS.longestStreak, 0);
}
export async function saveLongestStreak(n: number): Promise<void> {
  return setJSON(KEYS.longestStreak, n);
}

export async function getLastActive(): Promise<string> {
  return getJSON<string>(KEYS.lastActive, '');
}
export async function saveLastActive(date: string): Promise<void> {
  return setJSON(KEYS.lastActive, date);
}

// --- Categorías de gasto y formas de pago ---
export async function getCategoriasGasto(): Promise<OpcionGasto[]> {
  return getJSON<OpcionGasto[]>(KEYS.categoriasGasto, []);
}
export async function saveCategoriasGasto(items: OpcionGasto[]): Promise<void> {
  return setJSON(KEYS.categoriasGasto, items);
}
export async function getMetodosPago(): Promise<OpcionGasto[]> {
  return getJSON<OpcionGasto[]>(KEYS.metodosPago, []);
}
export async function saveMetodosPago(items: OpcionGasto[]): Promise<void> {
  return setJSON(KEYS.metodosPago, items);
}

// --- Gamificación ---
import { PersonalRecords, PlayerProfile } from '../types/game';

export async function getXpTotal(): Promise<number> {
  return getJSON<number>(KEYS.xpTotal, 0);
}
export async function saveXpTotal(n: number): Promise<void> {
  return setJSON(KEYS.xpTotal, n);
}
export async function getXpDaily(): Promise<Record<string, number>> {
  return getJSON<Record<string, number>>(KEYS.xpDaily, {});
}
export async function saveXpDaily(d: Record<string, number>): Promise<void> {
  return setJSON(KEYS.xpDaily, d);
}
export async function getXpClaims(): Promise<Record<string, boolean>> {
  return getJSON<Record<string, boolean>>(KEYS.xpClaims, {});
}
export async function saveXpClaims(c: Record<string, boolean>): Promise<void> {
  return setJSON(KEYS.xpClaims, c);
}
export async function getBadges(): Promise<Record<string, string>> {
  return getJSON<Record<string, string>>(KEYS.badges, {});
}
export async function saveBadges(b: Record<string, string>): Promise<void> {
  return setJSON(KEYS.badges, b);
}
export async function getRecords(): Promise<PersonalRecords> {
  return getJSON<PersonalRecords>(KEYS.records, {
    bestStreak: 0, bestWeekXP: 0, bestDayXP: 0, totalExtraStars: 0,
    totalBadges: 0, totalHabitsCompleted: 0, totalTodosCompleted: 0,
  });
}
export async function saveRecords(r: PersonalRecords): Promise<void> {
  return setJSON(KEYS.records, r);
}
export async function getProfile(): Promise<PlayerProfile> {
  return getJSON<PlayerProfile>(KEYS.profile, { username: 'Eladio', avatarColor: '#6C5CE7' });
}
export async function saveProfile(p: PlayerProfile): Promise<void> {
  return setJSON(KEYS.profile, p);
}
export async function getMissionsState(): Promise<any> {
  return getJSON<any>(KEYS.missionsState, null);
}
export async function saveMissionsState(s: any): Promise<void> {
  return setJSON(KEYS.missionsState, s);
}

// --- Acceso crudo (para la migración @kitdeldia → @dayxo) ---
export async function rawGet(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}
export async function rawSet(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}
export async function isMigratedV2(): Promise<boolean> {
  return (await rawGet(KEYS.migratedV2)) === 'true';
}
export async function setMigratedV2(): Promise<void> {
  await rawSet(KEYS.migratedV2, 'true');
}
