import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { DonutChart } from './DonutChart';

export interface WeekDay { label: string; ratio: number; future: boolean; hasItems: boolean; }

interface Props {
  pct: number;
  done: number;
  total: number;
  days: WeekDay[];
}

function dotStyle(d: WeekDay, colors: AppColors) {
  if (d.future) return { borderWidth: 1.5, borderColor: colors.border };
  if (!d.hasItems) return { borderWidth: 1.5, borderColor: colors.border, opacity: 0.5 };
  if (d.ratio >= 1) return { backgroundColor: Dayxo.purple };
  if (d.ratio > 0) return { backgroundColor: Dayxo.purple, opacity: 0.45 };
  return { borderWidth: 1.5, borderColor: colors.borderStrong };
}

// Card "Resumen semanal": dona de progreso + días de la semana.
export function WeeklySummaryCard({ pct, done, total, days }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const phrase = pct >= 80 ? '¡Espectacular!' : pct >= 50 ? '¡Vas por buen camino!' : pct > 0 ? 'A meterle un poco más' : 'Arrancá hoy 💪';

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="trending-up" size={16} color={Dayxo.purple} />
        <Text style={styles.title}>Resumen semanal</Text>
      </View>
      <Text style={styles.phrase}>{phrase}</Text>

      <View style={styles.donutWrap}>
        <DonutChart
          size={92}
          strokeWidth={11}
          data={[
            { value: pct, color: Dayxo.purple, label: 'hecho' },
            { value: Math.max(0, 100 - pct), color: colors.grayLight, label: 'resto' },
          ]}
          centerLabel={`${pct}%`}
        />
      </View>

      <Text style={styles.completaste}>
        Completaste <Text style={styles.bold}>{done} de {total}</Text> objetivos
      </Text>

      <View style={styles.dots}>
        {days.map((d, i) => (
          <View key={i} style={styles.dayCol}>
            <View style={[styles.dot, dotStyle(d, colors)]} />
            <Text style={styles.dayLabel}>{d.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  phrase: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: Dayxo.purple, marginTop: 2 },
  donutWrap: { alignItems: 'center', marginTop: 10 },
  completaste: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 10, lineHeight: 17 },
  bold: { fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  dots: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  dayCol: { alignItems: 'center', gap: 4 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  dayLabel: { fontSize: 9, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
});
