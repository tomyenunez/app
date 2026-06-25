import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { dateKey } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const DEFAULT_WEEKS = 12;

interface Props {
  weeks?: number;   // cuántas semanas mostrar
  accent?: string;  // color base del heatmap (por defecto, el del nivel)
}

// Grid tipo GitHub: semanas × 7 días, intensidad por XP del día
export function ActivityGrid({ weeks = DEFAULT_WEEKS, accent }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { xpDaily, level } = useGame();
  const base = accent ?? level.color;
  const [selected, setSelected] = useState<{ date: Date; xp: number } | null>(null);

  const columns = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    const dayIdx = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - dayIdx - (weeks - 1) * 7);

    const cols: { date: Date; xp: number }[][] = [];
    for (let w = 0; w < weeks; w++) {
      const col: { date: Date; xp: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const xp = xpDaily[dateKey(date)] ?? 0;
        col.push({ date, xp });
      }
      cols.push(col);
    }
    return cols;
  }, [xpDaily, weeks]);

  // Intensidad por XP ABSOLUTO del día (no relativa al máximo de la ventana):
  // el color refleja el esfuerzo real, sube en vivo a medida que sumás XP en el
  // día (sin esperar a que termine) y queda fijo como historial — un día no
  // cambia de color porque otro lo supere después.
  const intensity = (xp: number): string => {
    if (xp <= 0) return colors.grayVeryLight;
    const opacity = xp < 15 ? '55' : xp < 30 ? '88' : xp < 50 ? 'BB' : 'FF';
    return base + opacity;
  };

  const today = new Date();

  return (
    <View>
      <View style={styles.grid}>
        {columns.map((col, ci) => (
          <View key={ci} style={styles.column}>
            {col.map((cell, di) => {
              const isFuture = cell.date > today;
              return (
                <TouchableOpacity
                  key={di}
                  activeOpacity={0.7}
                  disabled={isFuture}
                  onPress={() => setSelected(cell)}
                  style={[
                    styles.cell,
                    { backgroundColor: isFuture ? 'transparent' : intensity(cell.xp) },
                    selected && selected.date.getTime() === cell.date.getTime() && styles.cellSelected,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Leyenda */}
      <View style={styles.legend}>
        <Text style={styles.legendText}>Menos</Text>
        {[colors.grayVeryLight, base + '55', base + '88', base + 'BB', base + 'FF'].map((c, i) => (
          <View key={i} style={[styles.legendCell, { backgroundColor: c }]} />
        ))}
        <Text style={styles.legendText}>Más</Text>
      </View>

      <Text style={styles.tooltip}>
        {selected
          ? `${format(selected.date, "d 'de' MMMM", { locale: es })}: ${selected.xp} XP`
          : 'Tocá un día para ver su XP'}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  grid: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  column: { gap: 4 },
  cell: { width: 16, height: 16, borderRadius: 4 },
  cellSelected: { borderWidth: 1.5, borderColor: colors.textPrimary },
  legend: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 12 },
  legendText: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  legendCell: { width: 12, height: 12, borderRadius: 3 },
  tooltip: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
});
