import { useRef, useCallback } from 'react';

/**
 * Anti multitap: envuelve un handler de guardar/agregar y descarta los toques
 * repetidos dentro de la ventana (ms). Sin esto, tocar rápido varias veces
 * "Guardar" dispara el handler N veces y se crean items duplicados.
 *
 * Uso: const handleSubmit = useTapGuard(async () => { ... });
 */
export function useTapGuard<A extends unknown[]>(
  fn: (...args: A) => void | Promise<void>,
  windowMs = 1500,
): (...args: A) => void {
  const last = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn; // siempre la última versión (closures frescos)

  return useCallback((...args: A) => {
    const now = Date.now();
    if (now - last.current < windowMs) return;
    last.current = now;
    fnRef.current(...args);
  }, [windowMs]);
}
