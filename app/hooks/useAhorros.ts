import { useState, useEffect, useCallback } from 'react';
import { getAhorros, saveAhorros } from '../services/storage';

// Ahorros "caja aparte" (Modelo A): un único saldo local que el usuario ajusta
// con depositar/retirar o editando el total. No toca el disponible ni las
// transacciones; es plata apartada del flujo diario.
export function useAhorros() {
  const [balance, setBalance] = useState(0);

  useEffect(() => { getAhorros().then(setBalance); }, []);

  const set = useCallback(async (monto: number) => {
    const v = Math.max(0, Math.round(monto));
    setBalance(v);
    await saveAhorros(v);
  }, []);

  const depositar = useCallback((monto: number) => {
    setBalance((prev) => {
      const v = Math.max(0, prev + Math.round(monto));
      saveAhorros(v);
      return v;
    });
  }, []);

  const retirar = useCallback((monto: number) => {
    setBalance((prev) => {
      const v = Math.max(0, prev - Math.round(monto));
      saveAhorros(v);
      return v;
    });
  }, []);

  return { balance, set, depositar, retirar };
}
