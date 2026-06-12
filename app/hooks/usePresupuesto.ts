import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Transaction } from '../types';
import { getTxs, saveTxs } from '../services/storage';
import { todayKey } from '../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function usePresupuesto() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getTxs().then((t) => { setTxs(t); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (desc: string, monto: number, tipo: Transaction['tipo']) => {
    const now = new Date();
    const next: Transaction = {
      id: Date.now().toString(),
      desc,
      monto,
      tipo,
      fecha: todayKey(),
      fechaStr: format(now, "d 'de' MMMM", { locale: es }),
    };
    const updated = [next, ...txs];
    setTxs(updated);
    await saveTxs(updated);
  }, [txs]);

  const remove = useCallback(async (id: string) => {
    const updated = txs.filter((t) => t.id !== id);
    setTxs(updated);
    await saveTxs(updated);
  }, [txs]);

  const ingresos = txs.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const gastos = txs.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const saldo = ingresos - gastos;

  return { txs, ingresos, gastos, saldo, loading, add, remove };
}
