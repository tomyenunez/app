import { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { Transaction } from '../types';
import { getTxs, saveTxs } from '../services/storage';
import { todayKey, dateKey } from '../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { awardXPOnce } from '../services/xpService';
import { XP_VALUES } from '../constants/xpValues';

export function usePresupuesto() {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Recarga al enfocar el tab: otra pantalla pudo haber modificado el storage
  useFocusEffect(
    useCallback(() => {
      getTxs().then((t) => { setTxs(t); setLoading(false); });
    }, [])
  );

  const add = useCallback(async (
    desc: string,
    monto: number,
    tipo: Transaction['tipo'],
    categoria?: string,
    metodo?: string,
    fecha?: Date,
  ) => {
    const d = fecha ?? new Date();
    const next: Transaction = {
      id: Date.now().toString(),
      desc,
      monto,
      tipo,
      fecha: dateKey(d),
      fechaStr: format(d, "d 'de' MMMM", { locale: es }),
      ...(categoria ? { categoria } : {}),
      ...(metodo ? { metodo } : {}),
    };
    const updated = [next, ...txs];
    setTxs(updated);
    await saveTxs(updated);
    awardXPOnce(`tx-${next.id}`, XP_VALUES.LOG_TRANSACTION, 'Movimiento registrado');
  }, [txs]);

  const update = useCallback(async (
    id: string,
    desc: string,
    monto: number,
    categoria?: string,
    metodo?: string,
    fecha?: Date,
  ) => {
    const updated = txs.map((t) => {
      if (t.id !== id) return t;
      let base = fecha;
      if (!base) {
        const [y, m, d] = t.fecha.split('-').map(Number);
        base = new Date(y, (m || 1) - 1, d || 1);
      }
      const next: Transaction = {
        ...t,
        desc,
        monto,
        fecha: dateKey(base),
        fechaStr: format(base, "d 'de' MMMM", { locale: es }),
      };
      // categoria/metodo: setear si vino, limpiar si quedó sin seleccionar
      if (categoria) next.categoria = categoria; else delete next.categoria;
      if (metodo) next.metodo = metodo; else delete next.metodo;
      return next;
    });
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

  const ingresosList = txs.filter((t) => t.tipo === 'ingreso');
  const gastosList = txs.filter((t) => t.tipo === 'gasto');

  // Reinicia el mes: borra los movimientos pero conserva el disponible (lo que sobró)
  // como un ingreso inicial "Saldo del mes anterior" — la plata que te quedó no se pierde.
  const resetMes = useCallback(async () => {
    const leftover = ingresos - gastos;
    const carry: Transaction[] = leftover > 0 ? [{
      id: Date.now().toString(),
      desc: 'Saldo del mes anterior',
      monto: leftover,
      tipo: 'ingreso',
      fecha: todayKey(),
      fechaStr: format(new Date(), "d 'de' MMMM", { locale: es }),
    }] : [];
    setTxs(carry);
    await saveTxs(carry);
  }, [ingresos, gastos]);

  return { txs, ingresos, gastos, saldo, ingresosList, gastosList, loading, add, update, remove, resetMes };
}
