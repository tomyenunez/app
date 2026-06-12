import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { useTodos } from '../hooks/useTodos';
import { useHabitos } from '../hooks/useHabitos';
import { usePresupuesto } from '../hooks/usePresupuesto';
import { useStreak } from '../hooks/useStreak';
import { dateKey } from '../utils/dateUtils';
import { formatARS, formatARSWithSign } from '../utils/formatters';
import { subDays } from 'date-fns';

function MetricCard({ bg, valueColor, label, value, icon }: {
  bg: string; valueColor: string; label: string; value: string; icon: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor: bg }]}>
      <Text style={styles.metricIcon}>{icon}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function StatsScreen() {
  const { todos } = useTodos();
  const { habitos, habitDone, isDoneOnDate } = useHabitos();
  const { ingresos, gastos, saldo } = usePresupuesto();
  const streak = useStreak();

  const doneTodos = todos.filter((t) => t.done);
  const todosPct = todos.length > 0 ? Math.round((doneTodos.length / todos.length) * 100) : 0;

  // Last 7 days bar chart
  const last7 = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = subDays(new Date(), 6 - i);
      const dk = dateKey(day);
      const habDone = habitos.filter((h) => {
        const idx = (day.getDay() + 6) % 7;
        return h.days.includes(idx) && habitDone[`${dk}-${h.id}`];
      }).length;
      const taskDone = todos.filter((t) => t.done && t.created === dk).length;
      return { day, value: habDone + taskDone };
    });
  }, [habitos, habitDone, todos]);

  const maxVal = Math.max(...last7.map((d) => d.value), 1);

  const DAY_LABELS = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB', 'DOM'];

  // Habit 30-day stats
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

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="bar-chart-outline" size={22} color={Colors.violet} />
          </View>
          <View>
            <Text style={styles.title}>Stats</Text>
            <Text style={styles.sub}>tu ritmo</Text>
          </View>
        </View>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          <MetricCard bg={Colors.violetLight} valueColor={Colors.violet} label="Días de racha" value={streak.toString()} icon="🔥" />
          <MetricCard bg={Colors.greenLight} valueColor={Colors.green} label="Tareas completadas" value={`${todosPct}%`} icon="✓" />
          <MetricCard bg={Colors.orangeLight} valueColor={Colors.orange} label="Hábitos activos" value={habitos.length.toString()} icon="⚡" />
          <MetricCard
            bg={Colors.pinkLight}
            valueColor={Colors.pink}
            label={saldo >= 0 ? 'Ahorrado' : 'En déficit'}
            value={formatARS(Math.abs(saldo))}
            icon="💰"
          />
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
                    <View style={[
                      styles.barFill,
                      { height: `${barH}%`, backgroundColor: isToday ? Colors.violet : Colors.violetLight },
                    ]} />
                  </View>
                  <Text style={[styles.barLabel, isToday && { color: Colors.violet, fontFamily: 'Inter_700Bold' }]}>
                    {isToday ? 'HOY' : DAY_LABELS[dayI]}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Habits 30-day */}
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

        {/* Finances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finanzas</Text>
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Ingresos</Text>
            <Text style={[styles.finValue, { color: Colors.green }]}>+{formatARS(ingresos)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Gastos</Text>
            <Text style={[styles.finValue, { color: Colors.pink }]}>-{formatARS(gastos)}</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.finRow}>
            <Text style={styles.finLabel}>Balance</Text>
            <Text style={[styles.finValue, { color: saldo >= 0 ? Colors.blue : Colors.pink }]}>
              {formatARSWithSign(saldo)}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.card,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.violetLight,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: Colors.violet },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: Colors.textSecondary, marginTop: 2 },
  metricsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    margin: 14,
  },
  metricCard: {
    width: '47%', borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  metricIcon: { fontSize: 20, marginBottom: 6 },
  metricValue: { fontSize: 24, fontFamily: 'Inter_800ExtraBold' },
  metricLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, marginTop: 4 },
  section: {
    backgroundColor: Colors.card,
    marginHorizontal: 14, marginBottom: 14,
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: {
    fontSize: 14, fontFamily: 'Inter_700Bold', color: Colors.textPrimary,
    marginBottom: 16,
  },
  barChart: { flexDirection: 'row', height: 120, alignItems: 'flex-end', gap: 4 },
  barCol: { flex: 1, alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: 4 },
  barValue: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary, height: 14 },
  barTrack: { flex: 1, width: '70%', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 4, minHeight: 2 },
  barLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', color: Colors.textSecondary, letterSpacing: 0.3 },
  habitStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  habitStatName: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  habitStatBar: { flex: 2, height: 6, backgroundColor: '#F0F0F0', borderRadius: 3, overflow: 'hidden' },
  habitStatFill: { height: 6, backgroundColor: Colors.orange, borderRadius: 3 },
  habitStatPct: { width: 36, textAlign: 'right', fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Colors.orange },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  finLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: Colors.textPrimary },
  finValue: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  separator: { height: 1, backgroundColor: Colors.border },
});
