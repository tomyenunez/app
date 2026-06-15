import { LunaMessage, ContextType } from '../types/luna';
import {
  LUNA_SYSTEM_PROMPT, CRISIS_KEYWORDS,
  LUNA_ERROR_NETWORK, LUNA_ERROR_NO_KEY, LUNA_ERROR_AUTH, LUNA_ERROR_RATE,
} from '../constants/lunaPrompt';
import {
  getTodos, getHabitos, getDeudas, getTxs, getEventos, getHabitDone, getStreak,
} from './storage';
import { todayKey, todayIdx } from '../utils/dateUtils';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_HISTORY_LIMIT = 20; // solo los últimos N mensajes van a la API

export class LunaError extends Error {}

// --- Detección de crisis (lista interna, respuesta local sin API) ---
export function detectCrisis(text: string): boolean {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
}

// --- Contexto de la app: el usuario decide qué compartir ---
export async function buildAppContext(type: ContextType): Promise<string> {
  const [todos, habitos, deudas, txs, eventos, habitDone, streak] = await Promise.all([
    getTodos(), getHabitos(), getDeudas(), getTxs(), getEventos(), getHabitDone(), getStreak(),
  ]);

  const tk = todayKey();

  const tareas = () => {
    const pending = todos.filter((t) => !t.done);
    const done = todos.filter((t) => t.done);
    return `TAREAS DE ELADIO:
Pendientes (${pending.length}):
${pending.map((t) => `- ${t.text} [${t.tag}]`).join('\n') || '(ninguna)'}
Completadas (${done.length}):
${done.map((t) => `- ${t.text}`).join('\n') || '(ninguna)'}`;
  };

  const habitosCtx = () => {
    const idx = todayIdx();
    const todayHabits = habitos.filter((h) => h.days.includes(idx));
    return `HÁBITOS DE ELADIO:
Para hoy (${todayHabits.length}):
${todayHabits.map((h) => `- ${h.name} ${habitDone[`${tk}-${h.id}`] ? '✓ hecho' : '○ pendiente'}`).join('\n') || '(ninguno aplica hoy)'}
Todos los hábitos configurados: ${habitos.map((h) => h.name).join(', ') || '(ninguno)'}
Racha actual: ${streak} días`;
  };

  const finanzas = () => {
    const ing = txs.filter((t) => t.tipo === 'ingreso').reduce((a, t) => a + t.monto, 0);
    const gas = txs.filter((t) => t.tipo === 'gasto').reduce((a, t) => a + t.monto, 0);
    const meDeben = deudas.filter((d) => d.tipo === 'me-debe');
    const leDebo = deudas.filter((d) => d.tipo === 'le-debo');
    return `SITUACIÓN FINANCIERA DE ELADIO:
Ingresos: $${ing.toLocaleString('es-AR')}
Gastos: $${gas.toLocaleString('es-AR')}
Saldo: $${(ing - gas).toLocaleString('es-AR')}
Le deben: $${meDeben.reduce((a, d) => a + d.monto, 0).toLocaleString('es-AR')} (${meDeben.length} personas)
Le debe a otros: $${leDebo.reduce((a, d) => a + d.monto, 0).toLocaleString('es-AR')} (${leDebo.length} personas)`;
  };

  if (type === 'tareas') return tareas();
  if (type === 'habitos') return habitosCtx();
  if (type === 'finanzas') return finanzas();

  // completo
  const now = new Date();
  const upcoming = eventos
    .filter((e) => new Date(e.fecha) >= now)
    .slice(0, 3)
    .map((e) => `- ${e.titulo} (${e.hora || 'sin hora'})`)
    .join('\n');
  return [
    tareas(),
    habitosCtx(),
    finanzas(),
    `PRÓXIMOS EVENTOS:\n${upcoming || 'Sin eventos próximos'}`,
  ].join('\n\n');
}

// --- Conversión del historial al formato de la Messages API ---
// Las burbujas de contexto (role system) se mandan como turno de usuario con los datos;
// la API exige que el primer mensaje sea de rol user, así que se descartan los
// mensajes de asistente que queden al inicio (ej: el saludo de bienvenida).
function toApiMessages(history: LunaMessage[]): { role: 'user' | 'assistant'; content: string }[] {
  const recent = history.slice(-API_HISTORY_LIMIT);
  const mapped = recent.map((m) => {
    if (m.role === 'system') {
      return {
        role: 'user' as const,
        content: `[Eladio compartió estos datos de su app Kit del Día]\n${m.contextData ?? ''}`,
      };
    }
    return { role: m.role, content: m.content };
  });
  const firstUser = mapped.findIndex((m) => m.role === 'user');
  return firstUser === -1 ? [] : mapped.slice(firstUser);
}

// --- Llamada a la API de Anthropic ---
export async function sendToLuna(history: LunaMessage[]): Promise<string> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) throw new LunaError(LUNA_ERROR_NO_KEY);

  const messages = toApiMessages(history);
  if (messages.length === 0) throw new LunaError(LUNA_ERROR_NETWORK);

  let response: Response;
  try {
    response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1024,
        system: LUNA_SYSTEM_PROMPT,
        messages,
      }),
    });
  } catch {
    throw new LunaError(LUNA_ERROR_NETWORK);
  }

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) throw new LunaError(LUNA_ERROR_AUTH);
    if (response.status === 429 || response.status === 529) throw new LunaError(LUNA_ERROR_RATE);
    throw new LunaError(LUNA_ERROR_NETWORK);
  }

  const data = await response.json();
  // La respuesta llega como bloques de contenido; tomamos el primer bloque de texto
  const textBlock = Array.isArray(data.content)
    ? data.content.find((b: { type: string }) => b.type === 'text')
    : null;
  if (!textBlock?.text) throw new LunaError(LUNA_ERROR_NETWORK);
  return textBlock.text as string;
}
