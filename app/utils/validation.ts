// ============================================================================
// Capa central de validación de Dayxo (sin dependencias externas).
// ----------------------------------------------------------------------------
// Principio: NUNCA confiar en la UI. Validar/normalizar acá antes de mandar a
// Supabase o a AsyncStorage. La DB refuerza con constraints (defensa en
// profundidad), pero esto evita datos basura, NaN/Infinity y abuso de longitud.
//
// Cada validador devuelve { ok: true, value } con el dato NORMALIZADO, o
// { ok: false, error } con un mensaje en español apto para mostrar al usuario.
// ============================================================================

export type Validated<T> = { ok: true; value: T } | { ok: false; error: string };

// Límites compartidos (espejá estos números en los CHECK de 0002_constraints.sql).
export const LIMITS = {
  todoText: 500,
  todoDesc: 2000,
  habitName: 120,
  noteTitle: 200,
  noteBody: 20000,
  txDesc: 200,
  username: 24,
  groupName: 60,
  optionName: 60,
  amountMax: 1e12, // 1 billón: techo sano para montos personales
  avatarBytes: 5 * 1024 * 1024, // 5 MB
} as const;

/**
 * Recorta espacios y saca caracteres de control invisibles, sin tocar
 * emojis/acentos. Se permiten tab (9) y newline (10); se descartan el resto de
 * los control chars (0–31) y DEL (127). Hecho por código de carácter para no
 * embeber bytes de control en el fuente.
 */
export function cleanText(input: unknown): string {
  if (typeof input !== 'string') return '';
  let out = '';
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    if ((code <= 31 && code !== 9 && code !== 10) || code === 127) continue;
    out += ch;
  }
  return out.trim();
}

function maxLen(value: string, max: number, label: string): Validated<string> {
  if (value.length > max) return { ok: false, error: `${label} es muy largo (máx. ${max} caracteres).` };
  return { ok: true, value };
}

// ---------------------------------------------------------------------------
// Texto requerido / opcional con límite
// ---------------------------------------------------------------------------
export function validateRequiredText(raw: unknown, max: number, label: string): Validated<string> {
  const v = cleanText(raw);
  if (!v) return { ok: false, error: `${label} no puede estar vacío.` };
  return maxLen(v, max, label);
}

export function validateOptionalText(raw: unknown, max: number, label: string): Validated<string> {
  const v = cleanText(raw);
  return maxLen(v, max, label);
}

// ---------------------------------------------------------------------------
// Montos (FINANZAS) — el bug clásico: NaN/Infinity/negativos
// ---------------------------------------------------------------------------
export function validateAmount(raw: unknown): Validated<number> {
  const n = typeof raw === 'number' ? raw : Number(String(raw ?? '').replace(',', '.'));
  if (!Number.isFinite(n)) return { ok: false, error: 'El monto no es un número válido.' };
  if (n < 0) return { ok: false, error: 'El monto no puede ser negativo.' };
  if (n > LIMITS.amountMax) return { ok: false, error: 'El monto es demasiado grande.' };
  // Normalizamos a 2 decimales para evitar basura de punto flotante.
  return { ok: true, value: Math.round(n * 100) / 100 };
}

// ---------------------------------------------------------------------------
// Email / password (refuerzo del cliente; Supabase es la verdad)
// ---------------------------------------------------------------------------
export function validateEmail(raw: unknown): Validated<string> {
  const v = cleanText(raw).toLowerCase();
  if (!v) return { ok: false, error: 'Ingresá tu email.' };
  // Regex deliberadamente simple: la validación real la hace Supabase.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || v.length > 254) {
    return { ok: false, error: 'El email no es válido.' };
  }
  return { ok: true, value: v };
}

export function validatePassword(raw: unknown): Validated<string> {
  const v = typeof raw === 'string' ? raw : '';
  if (v.length < 6) return { ok: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  if (v.length > 72) return { ok: false, error: 'La contraseña es demasiado larga (máx. 72).' };
  return { ok: true, value: v };
}

// ---------------------------------------------------------------------------
// Validadores de entidad (helpers que pide el plan de hardening)
// ---------------------------------------------------------------------------
export function validateTodoInput(text: unknown, descripcion?: unknown): Validated<{ text: string; descripcion?: string }> {
  const t = validateRequiredText(text, LIMITS.todoText, 'La tarea');
  if (!t.ok) return t;
  const d = validateOptionalText(descripcion, LIMITS.todoDesc, 'La descripción');
  if (!d.ok) return d;
  return { ok: true, value: { text: t.value, ...(d.value ? { descripcion: d.value } : {}) } };
}

export function validateHabitInput(name: unknown): Validated<{ name: string }> {
  const n = validateRequiredText(name, LIMITS.habitName, 'El hábito');
  if (!n.ok) return n;
  return { ok: true, value: { name: n.value } };
}

export function validateNoteInput(titulo: unknown, cuerpo: unknown): Validated<{ titulo: string; cuerpo: string }> {
  const ti = validateOptionalText(titulo, LIMITS.noteTitle, 'El título');
  if (!ti.ok) return ti;
  const cu = validateOptionalText(cuerpo, LIMITS.noteBody, 'La nota');
  if (!cu.ok) return cu;
  if (!ti.value && !cu.value) return { ok: false, error: 'La nota está vacía.' };
  return { ok: true, value: { titulo: ti.value, cuerpo: cu.value } };
}

export function validateProfileInput(username: unknown): Validated<{ username: string }> {
  const u = cleanText(username);
  if (u.length < 2) return { ok: false, error: 'El nombre de usuario es muy corto (mínimo 2).' };
  const r = maxLen(u, LIMITS.username, 'El nombre de usuario');
  if (!r.ok) return r;
  return { ok: true, value: { username: u } };
}

export function validateGroupInput(name: unknown): Validated<{ name: string }> {
  const n = validateRequiredText(name, LIMITS.groupName, 'El nombre del grupo');
  if (!n.ok) return n;
  return { ok: true, value: { name: n.value } };
}

export function validateFinanceInput(
  desc: unknown,
  monto: unknown,
  tipo: unknown,
): Validated<{ desc: string; monto: number; tipo: 'ingreso' | 'gasto' }> {
  const d = validateRequiredText(desc, LIMITS.txDesc, 'La descripción');
  if (!d.ok) return d;
  const m = validateAmount(monto);
  if (!m.ok) return m;
  if (tipo !== 'ingreso' && tipo !== 'gasto') return { ok: false, error: 'Tipo de movimiento inválido.' };
  return { ok: true, value: { desc: d.value, monto: m.value, tipo } };
}

// ---------------------------------------------------------------------------
// Archivos / uploads (avatar, etc.)
// ---------------------------------------------------------------------------
const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'];

export function validateFileUpload(opts: {
  mimeType?: string | null;
  fileName?: string | null;
  sizeBytes?: number | null;
  maxBytes?: number;
}): Validated<{ mimeType: string }> {
  const max = opts.maxBytes ?? LIMITS.avatarBytes;
  const mime = (opts.mimeType ?? '').toLowerCase();

  if (opts.sizeBytes != null && opts.sizeBytes > max) {
    return { ok: false, error: `La imagen es muy pesada (máx. ${Math.round(max / 1024 / 1024)} MB).` };
  }
  // Validamos por MIME si está; si no, por extensión del nombre.
  if (mime) {
    if (!ALLOWED_IMAGE_MIME.includes(mime)) return { ok: false, error: 'Formato de imagen no permitido.' };
    return { ok: true, value: { mimeType: mime } };
  }
  const name = (opts.fileName ?? '').toLowerCase();
  if (/\.(jpe?g|png|webp)$/.test(name)) {
    const value = { mimeType: name.endsWith('.png') ? 'image/png' : name.endsWith('.webp') ? 'image/webp' : 'image/jpeg' };
    return { ok: true, value };
  }
  // Sin info de tipo: aceptamos como jpeg (caso de expo-image-picker con base64),
  // pero ya filtramos por tamaño arriba.
  return { ok: true, value: { mimeType: 'image/jpeg' } };
}

// ---------------------------------------------------------------------------
// URLs externas / esquemas peligrosos (para Linking.openURL a futuro)
// ---------------------------------------------------------------------------
export function isSafeExternalUrl(raw: unknown): boolean {
  if (typeof raw !== 'string') return false;
  const v = raw.trim().toLowerCase();
  // Sólo http/https. Bloquea javascript:, file:, data:, intent:, etc.
  return v.startsWith('http://') || v.startsWith('https://');
}
