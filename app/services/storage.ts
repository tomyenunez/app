import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, Deuda, Transaction, Evento, Familia, OpcionGasto, Nota } from '../types';
import { supabase } from './supabase';

export const KEYS = {
  todos: '@dayxo/todos',
  deudas: '@dayxo/deudas',
  habitos: '@dayxo/habitos',
  txs: '@dayxo/txs',
  eventos: '@dayxo/eventos',
  notas: '@dayxo/notas',
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

// ============================================================
// Gamificación: 1 fila por usuario en `game_state` (nube).
// Cache en memoria + escritura agrupada (debounce): un "award" toca varios
// campos, no queremos un round-trip por cada uno. Las firmas async se mantienen
// así xpService / GameContext / useStreak no cambian.
// ============================================================
import { PersonalRecords as PR } from '../types/game';

interface GameState {
  xpTotal: number;
  xpDaily: Record<string, number>;
  xpClaims: Record<string, boolean>;
  badges: Record<string, string>;
  records: PR;
  streak: number;
  longestStreak: number;
  lastActive: string;
}

const DEFAULT_GAME: GameState = {
  xpTotal: 0, xpDaily: {}, xpClaims: {}, badges: {},
  records: {
    bestStreak: 0, bestWeekXP: 0, bestDayXP: 0, totalExtraStars: 0,
    totalBadges: 0, totalHabitsCompleted: 0, totalTodosCompleted: 0,
  },
  streak: 0, longestStreak: 0, lastActive: '',
};

let gameCache: GameState | null = null;
let gameLoad: Promise<GameState> | null = null;
let gameSaveTimer: ReturnType<typeof setTimeout> | null = null;

async function currentUid(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

function gameToRow(uid: string, s: GameState) {
  return {
    user_id: uid,
    xp_total: s.xpTotal,
    xp_daily: s.xpDaily,
    xp_claims: s.xpClaims,
    badges: s.badges,
    records: s.records,
    streak: s.streak,
    longest_streak: s.longestStreak,
    last_active: s.lastActive,
    updated_at: new Date().toISOString(),
  };
}

async function loadGame(): Promise<GameState> {
  if (gameCache) return gameCache;
  if (gameLoad) return gameLoad;
  gameLoad = (async () => {
    const uid = await currentUid();
    if (!uid) { gameCache = { ...DEFAULT_GAME }; return gameCache; }
    const { data, error } = await supabase.from('game_state').select('*').eq('user_id', uid).maybeSingle();
    if (error) console.warn('[Dayxo game] leer:', error.message);
    if (data) {
      gameCache = {
        xpTotal: Number(data.xp_total) || 0,
        xpDaily: data.xp_daily ?? {},
        xpClaims: data.xp_claims ?? {},
        badges: data.badges ?? {},
        records: { ...DEFAULT_GAME.records, ...(data.records ?? {}) },
        streak: data.streak ?? 0,
        longestStreak: data.longest_streak ?? 0,
        lastActive: data.last_active ?? '',
      };
    } else {
      gameCache = { ...DEFAULT_GAME };
      const { error: insErr } = await supabase.from('game_state').upsert(gameToRow(uid, gameCache));
      if (insErr) console.warn('[Dayxo game] crear:', insErr.message);
    }
    return gameCache;
  })();
  try { return await gameLoad; } finally { gameLoad = null; }
}

async function persistGame(): Promise<void> {
  const uid = await currentUid();
  if (!uid || !gameCache) return;
  const { error } = await supabase.from('game_state').upsert(gameToRow(uid, gameCache));
  if (error) console.warn('[Dayxo game] guardar:', error.message);
}

function scheduleGameSave(): void {
  if (gameSaveTimer) clearTimeout(gameSaveTimer);
  gameSaveTimer = setTimeout(() => { persistGame(); }, 400);
}

// Limpia el cache al cambiar de usuario (login/logout) — lo llama GameContext
export function resetGameCache(): void {
  gameCache = null;
  gameLoad = null;
  if (gameSaveTimer) { clearTimeout(gameSaveTimer); gameSaveTimer = null; }
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

// --- Notas (local, igual que eventos) ---
export async function getNotas(): Promise<Nota[]> {
  return getJSON<Nota[]>(KEYS.notas, []);
}
export async function saveNotas(notas: Nota[]): Promise<void> {
  return setJSON(KEYS.notas, notas);
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

// --- Streak (en game_state, nube) ---
export async function getStreak(): Promise<number> { return (await loadGame()).streak; }
export async function saveStreak(streak: number): Promise<void> { (await loadGame()).streak = streak; scheduleGameSave(); }

export async function getLongestStreak(): Promise<number> { return (await loadGame()).longestStreak; }
export async function saveLongestStreak(n: number): Promise<void> { (await loadGame()).longestStreak = n; scheduleGameSave(); }

export async function getLastActive(): Promise<string> { return (await loadGame()).lastActive; }
export async function saveLastActive(date: string): Promise<void> { (await loadGame()).lastActive = date; scheduleGameSave(); }

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

// Orden de las burbujas de Finanzas (reordenable por el usuario) — en profiles.finance_order
export async function getFinanceOrder(): Promise<string[]> {
  const def = ['gastos', 'deudas', 'ingresos'];
  const uid = await currentUid();
  if (!uid) return def;
  const { data, error } = await supabase.from('profiles').select('finance_order').eq('id', uid).maybeSingle();
  if (error) console.warn('[Dayxo finance_order] leer:', error.message);
  const order = data?.finance_order;
  return Array.isArray(order) && order.length === 3 ? order : def;
}
export async function saveFinanceOrder(order: string[]): Promise<void> {
  const uid = await currentUid();
  if (!uid) return;
  const { error } = await supabase.from('profiles').update({ finance_order: order }).eq('id', uid);
  if (error) console.warn('[Dayxo finance_order] guardar:', error.message);
}

// --- Gamificación ---
import { PersonalRecords, PlayerProfile } from '../types/game';

export async function getXpTotal(): Promise<number> { return (await loadGame()).xpTotal; }
export async function saveXpTotal(n: number): Promise<void> { (await loadGame()).xpTotal = n; scheduleGameSave(); }
export async function getXpDaily(): Promise<Record<string, number>> { return { ...(await loadGame()).xpDaily }; }
export async function saveXpDaily(d: Record<string, number>): Promise<void> { (await loadGame()).xpDaily = d; scheduleGameSave(); }
export async function getXpClaims(): Promise<Record<string, boolean>> { return { ...(await loadGame()).xpClaims }; }
export async function saveXpClaims(c: Record<string, boolean>): Promise<void> { (await loadGame()).xpClaims = c; scheduleGameSave(); }
export async function getBadges(): Promise<Record<string, string>> { return { ...(await loadGame()).badges }; }
export async function saveBadges(b: Record<string, string>): Promise<void> { (await loadGame()).badges = b; scheduleGameSave(); }
export async function getRecords(): Promise<PersonalRecords> { return { ...(await loadGame()).records }; }
export async function saveRecords(r: PersonalRecords): Promise<void> { (await loadGame()).records = r; scheduleGameSave(); }
export async function getProfile(): Promise<PlayerProfile> {
  return getJSON<PlayerProfile>(KEYS.profile, { username: 'Eladio', avatarColor: '#6C5CE7' });
}
export async function saveProfile(p: PlayerProfile): Promise<void> {
  return setJSON(KEYS.profile, p);
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
