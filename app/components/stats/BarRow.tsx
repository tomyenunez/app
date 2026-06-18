import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  label: string;
  value: string;
  fraction: number; // 0..1
  color: string;
}

// Mini barra horizontal: etiqueta · barra · valor. Reutilizada en hábitos,
// tareas por categoría e ingresos vs gastos.
export function BarRow({ label, value, fraction, color }: Props) {
  const { colors } = useTheme();
  const pct = Number.isFinite(fraction) ? Math.max(0, Math.min(1, fraction)) : 0;

  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>
        {label}
      </Text>
      <View style={[styles.track, { backgroundColor: colors.grayVeryLight }]}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.value, { color: colors.textSecondary }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  label: { width: 84, fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  track: { flex: 1, height: 8, borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999 },
  value: { minWidth: 44, fontSize: 12, fontFamily: 'Inter_700Bold', textAlign: 'right' },
});
