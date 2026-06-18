import { KEYS, rawGet, rawSet, isMigratedV2, setMigratedV2 } from './storage';

// Migración única "Kit del Día" → "Dayxo" (@kitdeldia/* → @dayxo/*).
//
// Criterio (pre-lanzamiento): se PRESERVA el contenido real del usuario y se
// RESETEA la gamificación, porque la escala de XP vieja (25/hábito) no es
// comparable con la nueva (10/hábito + rangos gema). Corre una sola vez, detrás
// del flag @dayxo/migrated_v2.

// [keyVieja @kitdeldia, keyNueva @dayxo] — solo contenido que se conserva.
const PRESERVE: [string, string][] = [
  ['@kitdeldia/todos', KEYS.todos],
  ['@kitdeldia/deudas', KEYS.deudas],
  ['@kitdeldia/habitos', KEYS.habitos],
  ['@kitdeldia/txs', KEYS.txs],
  ['@kitdeldia/eventos', KEYS.eventos],
  ['@kitdeldia/familias', KEYS.familias],
  ['@kitdeldia/habitDone', KEYS.habitDone],
  ['@kitdeldia/streak', KEYS.streak], // racha de días (no es XP) — se conserva
  ['@kitdeldia/lastActive', KEYS.lastActive],
  ['@kitdeldia/categoriasGasto', KEYS.categoriasGasto],
  ['@kitdeldia/metodosPago', KEYS.metodosPago],
  ['@kitdeldia/profile', KEYS.profile], // username + color de avatar
];

// NO se migran (arrancan de 0): xp_total, daily_xp, xp_claims, badges, records,
// missions_state. Al no existir bajo @dayxo, toman sus defaults (0 / {}).

export async function runMigrationIfNeeded(): Promise<void> {
  if (await isMigratedV2()) return;

  for (const [oldKey, newKey] of PRESERVE) {
    // Si ya hay data nueva no la pisamos (idempotente, seguro ante re-runs).
    const already = await rawGet(newKey);
    if (already != null) continue;

    const oldValue = await rawGet(oldKey);
    if (oldValue != null) await rawSet(newKey, oldValue);
  }

  await setMigratedV2();
}
