import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Deuda } from '../types';
import { getDeudas, saveDeudas } from '../services/storage';
import { todayKey } from '../utils/dateUtils';

export function useDeudas() {
  const [deudas, setDeudas] = useState<Deuda[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getDeudas().then((d) => { setDeudas(d); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (nombre: string, monto: number, desc: string, tipo: Deuda['tipo']) => {
    const next: Deuda = { id: Date.now().toString(), nombre, monto, desc, tipo, fecha: todayKey() };
    const updated = [next, ...deudas];
    setDeudas(updated);
    await saveDeudas(updated);
  }, [deudas]);

  const remove = useCallback(async (id: string) => {
    const updated = deudas.filter((d) => d.id !== id);
    setDeudas(updated);
    await saveDeudas(updated);
  }, [deudas]);

  const totalMeDeben = deudas.filter((d) => d.tipo === 'me-debe').reduce((s, d) => s + d.monto, 0);
  const totalLeDebo = deudas.filter((d) => d.tipo === 'le-debo').reduce((s, d) => s + d.monto, 0);
  const balance = totalMeDeben - totalLeDebo;
  const meDeben = deudas.filter((d) => d.tipo === 'me-debe');
  const leDebo = deudas.filter((d) => d.tipo === 'le-debo');

  return { deudas, meDeben, leDebo, totalMeDeben, totalLeDebo, balance, loading, add, remove };
}
