import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Deuda } from '../types';
import { getDeudas, saveDeudas } from '../services/storage';
import { dateKey } from '../utils/dateUtils';

export function useDeudas() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);

  // Recarga al enfocar: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getDeudas().then(setDeudas);
    }, [])
  );

  const add = useCallback(async (nombre: string, monto: number, tipo: Deuda['tipo'], fecha?: Date) => {
    const d = fecha ?? new Date();
    const next: Deuda = { id: Date.now().toString(), nombre, monto, desc: '', tipo, fecha: dateKey(d) };
    const updated = [next, ...deudas];
    setDeudas(updated);
    await saveDeudas(updated);
  }, [deudas]);

  const remove = useCallback(async (id: string) => {
    const updated = deudas.filter((d) => d.id !== id);
    setDeudas(updated);
    await saveDeudas(updated);
  }, [deudas]);

  const clearAll = useCallback(async () => {
    setDeudas([]);
    await saveDeudas([]);
  }, []);

  const totalMeDeben = deudas.filter((d) => d.tipo === 'me-debe').reduce((s, d) => s + d.monto, 0);
  const totalLeDebo = deudas.filter((d) => d.tipo === 'le-debo').reduce((s, d) => s + d.monto, 0);
  const balance = totalMeDeben - totalLeDebo;

  return { deudas, totalMeDeben, totalLeDebo, balance, add, remove, clearAll };
}
