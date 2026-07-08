// ============================================================================
// Logger seguro de Dayxo
// ----------------------------------------------------------------------------
// Reglas:
//  - logDebug/logWarn: SÓLO en desarrollo (__DEV__). En producción, no-op.
//  - logError: corre siempre pero SANITIZA — nunca volcamos el objeto crudo
//    del backend (puede traer payloads, ids, detalles internos). Sólo un
//    mensaje corto.
//  - NUNCA loguear: tokens, JWT, refresh tokens, contraseñas, emails, montos,
//    ni el contenido de notas/tareas. Si pasás un Error de Supabase, se extrae
//    sólo `.message` (no el objeto entero).
//
// En builds de producción, babel-plugin-transform-remove-console igual borra
// cualquier console.* que se haya colado. Esto es la segunda capa.
// ============================================================================

/** Saca un string corto y seguro de cualquier cosa que tiremos como error. */
function safeMessage(err: unknown): string {
  if (err == null) return '';
  if (typeof err === 'string') return err.slice(0, 200);
  if (err instanceof Error) return err.message.slice(0, 200);
  // Objetos tipo { message } (errores de Supabase) → sólo el message.
  const m = (err as { message?: unknown }).message;
  if (typeof m === 'string') return m.slice(0, 200);
  return 'error';
}

/** Log de desarrollo. Desaparece en producción. */
export function logDebug(scope: string, ...args: unknown[]): void {
  if (__DEV__) console.log(`[Dayxo ${scope}]`, ...args);
}

/** Aviso de desarrollo. Desaparece en producción. */
export function logWarn(scope: string, err?: unknown): void {
  if (__DEV__) console.warn(`[Dayxo ${scope}]`, err !== undefined ? safeMessage(err) : '');
}

/**
 * Error sanitizado. Pensado para reemplazar los `console.warn('...', error.message)`.
 * Sólo loguea el scope + un mensaje corto, nunca el objeto completo.
 * El día que se agregue Sentry/Crashlytics, este es el único lugar a tocar.
 */
export function logError(scope: string, err?: unknown): void {
  if (__DEV__) {
    console.warn(`[Dayxo ${scope}]`, err !== undefined ? safeMessage(err) : '');
  }
  // En producción: punto único para enviar a un crash-reporter con scrubbing de PII.
  // (Intencionalmente NO mandamos el error crudo a ningún lado todavía.)
}
