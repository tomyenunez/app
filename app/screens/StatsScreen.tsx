import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { subDays, startOfWeek, startOfMonth } from 'date-fns';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useTodos } from '../hooks/useTodos';
import { useHabitos } from '../hooks/useHabitos';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useCategoriasGasto, useMetodosPago } from '../hooks/useOpcionesGasto';
import { useStreak } from '../hooks/useStreak';
import { dateKey, weekDays } from '../utils/dateUtils';
import { formatARS, formatARSWithSign, formatPercent } from '../utils/formatters';
import { DonutChart, DonutSlice } from '../components/stats/DonutChart';
import { XPBar } from '../components/game/XPBar';

type Periodo = 'semana' | 'mes' | 'todo';

const HEX_FALLBACK = ['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#E84393', '#FDCB6E', '#A29BFE', '#B2BEC3'];

export function StatsScreen() {
  const nav = useNavigation<any>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { todos } = useTodos();
  const { habitos, habitDone } = useHabitos();
  const { txs, ingresos, gastos, saldo } = usePresupuesto();
  const categorias = useCategoriasGasto();
  const metodos = useMetodosPago();
  const streak = useStreak();
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const doneTodos = todos.filter((t) => t.done);
  const todosPct = todos.length > 0 ? Math.round((doneTodos.length / todos.length) * 100) : 0;

  // Bar chart 7 días (cuenta toda completación, incluido bonus)
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dk = dateKey(day);
      const habDone = habitos.filter((h) => habitDone[`${dk}-${h.id}`]).length;
      const taskDone = todos.filter((t) => t.done && t.created === dk).length;
      return { day, value: habDone + taskDone };
    });
  }, [habitos, habitDone, todos]);
  const maxVal = Math.max(...last7.map((d) => d.value), 1);
  const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Hábitos 30 días
  const habit30Stats = useMemo(() => {
    return habitos.map((h) => {
      let applies = 0;
      let done = 0;
      for (let i = 0; i < 30; i++) {
        const day = subDays(new Date(), i);
        const idx = (day.getDay() + 6) % 7;
        if (h.days.includes(idx)) {
          applies++;
          if (habitDone[`${dateKey(day)}-${h.id}`]) done++;
        }
      }
      const pct = applies > 0 ? Math.round((done / applies) * 100) : 0;
      return { h, pct };
    });
  }, [habitos, habitDone]);

  // Puntos extra (bonus)
  const bonusStats = useMemo(() => {
    let semana = 0;
    let mes = 0;
    weekDays().forEach((day) => {
      const idx = (day.getDay() + 6) % 7;
      habitos.forEach((h) => {
        if (!h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) semana++;
      });
    });
    for (let i = 0; i < 30; i++) {
      const day = subDays(new Date(), i);
      const idx = (day.getDay() + 6) % 7;
      habitos.forEach((h) => {
        if (!h.days.includes(idx) && habitDone[`${dateKey(day)}-${h.id}`]) mes++;
      });
    }
    return { semana, mes };
  }, [habitos, habitDone]);

  // Filtro por período para los gráficos financieros
  const periodTxs = useMemo(() => {
    if (periodo === 'todo') return txs;
    const limit = periodo === 'semana'
      ? startOfWeek(new Date(), { weekStartsOn: 1 })
      : startOfMonth(new Date());
    return txs.filter((t) => {
      const [y, m, d] = t.fecha.split('-').map(Number);
      return new Date(y, m - 1, d) >= limit;
    });
  }, [txs, periodo]);

  // Gastos por categoría → slices del donut
  const gastosPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    periodTxs.filter((t) => t.tipo === 'gasto').forEach((t) => {
      const id = t.categoria ?? 'sin';
      map.set(id, (map.get(id) ?? 0) + t.monto);
    });
    const entries = [...map.entries()]
      .map(([id, monto], i) => {
        const item = categorias.getItem(id === 'sin' ? undefined : id);
        return { id, nombre: item.nombre, monto, color: colors.familia[item.color].fg, fallback: HEX_FALLBACK[i % HEX_FALLBACK.length] };
      })
      .filter((e) => e.monto > 0)
      .sort((a, b) => b.monto - a.monto);
    return entries;
  }, [periodTxs, categorias, colors]);

  const totalGastosPeriodo = gastosPorCategoria.reduce((s, e) => s + e.monto, 0);
  const categoriaSlices: DonutSlice[] = gastosPorCategoria.map((e) => ({
    value: e.monto, color: e.color, label: e.nombre,
  }));

  // Ingresos vs gastos del período
  const ingPeriodo = periodTxs.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0);
  const gasPeriodo = periodTxs.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0);
  const saldoPeriodo = ingPeriodo - gasPeriodo;
  const ivgSlices: DonutSlice[] = [
    { value: ingPeriodo, color: colors.green, label: 'Ingresos' },
    { value: gasPeriodo, color: colors.pink, label: 'Gastos' },
  ];

  const PERIODOS: { key: Periodo; label: string }[] = [
    { key: 'semana', label: 'Semana' },
    { key: 'mes', label: 'Este mes' },
    { key: 'todo', label: 'Todo' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="bar-chart-outline" size={22} color={colors.violet} />
          </View>
          <View>
            <Text style={styles.title}>Stats</Text>
            <Text style={styles.sub}>tu ritmo</Text>
          </View>
        </View>

        {/* Barra de XP / nivel */}
        <View style={styles.xpWrap}>
          <XPBar onPress={() => nav.navigate('Profile')} />
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          <MetricCard styles={styles} bg={colors.violetLight} valueColor={colors.violet} label="Días de racha" value={streak.toString()} icon="🔥" />
          <MetricCard styles={styles} bg={colors.greenLight} valueColor={colors.green} label="Tareas completadas" value={`${todosPct}%`} icon="✓" />
          <MetricCard styles={styles} bg={colors.orangeLight} valueColor={colors.orange} label="Hábitos activos" value={habitos.length.toString()} icon="⚡" />
          <MetricCard styles={styles} bg={colors.pinkLight} valueColor={colors.pink} label={saldo >= 0 ? 'Ahorrado' : 'En déficit'} value={formatARS(Math.abs(saldo))} icon="💰" />
        </View>

        {/* Puntos extra */}
        <View style={styles.bonusBanner}>
          <Text style={styles.bonusStar}>★</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bonusLabel}>PUNTOS EXTRA</Text>
            <Text style={styles.bonusValue}>+{bonusStats.semana} esta semana</Text>
            <Text style={styles.bonusSub}>+{bonusStats.mes} en los últimos 30 días</Text>
          </View>
        </View>

        {/* Bar chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad — últimos 7 días</Text>
          <View style={styles.barChart}>
            {last7.map(({ day, value }, i) => {
              const isToday = i === 6;
              const barH = Math.max(2, (value / maxVal) * 100);
              const dayI = (day.getDay() + 6) % 7;
              return (
                <View key={i} style={styles.barCol}>
                  <Text style={styles.barValue}>{value > 0 ? value : ''}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { height: `${barH}%`, backgroundColor: isToday ? colors.violet : colors.violetLight }]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: colors.violet, fontFamily: 'Inter_700Bold' }]}>
                    {isToday ? 'HOY' : DAY_LABELS[dayI]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Selector de período (afecta los dos gráficos de torta) */}
        <View style={styles.periodRow}>
          {PERIODOS.map((p) => {
            const active = periodo === p.key;
            return (
              <TouchableOpacity
                key={p.key}
                onPress={() => setPeriodo(p.key)}
                style={[styles.periodChip, active && { backgroundColor: colors.violet }]}
              >
                <Text style={[styles.periodChipText, active && { color: '#fff' }]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Donut: gastos por categoría */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>¿En qué gastás?</Text>
          <View style={styles.donutWrap}>
            <DonutChart
              data={categoriaSlices}
              centerLabel={totalGastosPeriodo > 0 ? formatARS(totalGastosPeriodo) : undefined}
              centerSub={totalGastosPeriodo > 0 ? 'gastado' : undefined}
            />
          </View>
          {gastosPorCategoria.length === 0 ? (
            <Text style={styles.emptyChart}>Agregá gastos para ver tus estadísticas</Text>
          ) : (
            <View style={styles.legend}>
              {gastosPorCategoria.map((e) => (
                <View key={e.id} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: e.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>{e.nombre}</Text>
                  <Text style={styles.legendValue}>
                    {formatARS(e.monto)} ({formatPercent((e.monto / totalGastosPeriodo) * 100)})
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Donut: ingresos vs gastos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu plata</Text>
          <View style={styles.donutWrap}>
            <DonutChart
              data={ivgSlices}
              centerLabel={(ingPeriodo + gasPeriodo) > 0 ? formatARSWithSign(saldoPeriodo) : undefined}
              centerSub={(ingPeriodo + gasPeriodo) > 0 ? 'saldo' : undefined}
            />
          </View>
          <View style={styles.ivgRow}>
            <View style={styles.ivgCol}>
              <Text style={styles.ivgLabel}>Entradas ↓</Text>
              <Text style={[styles.ivgValue, { color: colors.green }]}>{formatARS(ingPeriodo)}</Text>
            </View>
            <View style={styles.ivgCol}>
              <Text style={styles.ivgLabel}>Gastos ↑</Text>
              <Text style={[styles.ivgValue, { color: colors.pink }]}>{formatARS(gasPeriodo)}</Text>
            </View>
          </View>
        </View>

        {/* Hábitos 30-day */}
        {habit30Stats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hábitos — cumplimiento 30 días</Text>
            {habit30Stats.map(({ h, pct }) => (
              <View key={h.id} style={styles.habitStatRow}>
                <Text style={styles.habitStatName} numberOfLines={1}>{h.name}</Text>
                <View style={styles.habitStatBar}>
                  <View style={[styles.habitStatFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.habitStatPct}>{pct}%</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ styles, bg, valueColor, label, value, icon }: {
  styles: Styles; bg: string; valueColor: string; label: string; value: string; icon: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bg }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.violet },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  xpWrap: { marginTop: 6 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, margin: 14 },
  metricCard: {
    width: '47%', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  metricIcon: { fontSize: 20, marginBottom: 6 },
  metricValue: { fontSize: 24, fontFamily: 'Inter_800ExtraBold' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 4 },
  bonusBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FF9F43',
    marginHorizontal: 14, marginBottom: 14,
    borderRadius: 14, padding: 16,
  },
  bonusStar: { fontSize: 28, color: '#fff' },
  bonusLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', color: '#FFE3C4', letterSpacing: 0.8 },
  bonusValue: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 2 },
  bonusSub: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#FFE3C4', marginTop: 2 },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 14, marginBottom: 14,
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 16 },
  barChart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barValue: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, height: 14 },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', color: colors.textSecondary, letterSpacing: 0.3 },
  periodRow: { flexDirection: 'row', gap: 8, marginHorizontal: 14, marginBottom: 14 },
  periodChip: {
    flex: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border,
  },
  periodChipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  donutWrap: { alignItems: 'center', marginBottom: 8 },
  emptyChart: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 4 },
  legend: { marginTop: 8, gap: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  legendValue: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  ivgRow: { flexDirection: 'row', marginTop: 8 },
  ivgCol: { flex: 1, alignItems: 'center' },
  ivgLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  ivgValue: { fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  habitStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  habitStatName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  habitStatBar: { flex: 2, height: 6, backgroundColor: colors.grayLight, borderRadius: 3, overflow: 'hidden' },
  habitStatFill: { height: 6, backgroundColor: colors.orange, borderRadius: 3 },
  habitStatPct: { width: 36, textAlign: 'right', fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.orange },
});

type Styles = ReturnType<typeof createStyles>;
