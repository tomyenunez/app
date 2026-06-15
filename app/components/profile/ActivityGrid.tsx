import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { dateKey } from '../../utils/dateUtils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const WEEKS = 12;

// Grid tipo GitHub: 12 semanas × 7 días, intensidad por XP del día
export function ActivityGrid() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { xpDaily, level } = useGame();
  const [selected, setSelected] = useState<{ date: Date; xp: number } | null>(null);

  const { columns, maxXP } = useMemo(() => {
    const today = new Date();
    // Empezamos el lunes de hace 12 semanas
    const start = new Date(today);
    const dayIdx = (today.getDay() + 6) % 7;
    start.setDate(today.getDate() - dayIdx - (WEEKS - 1) * 7);

    const cols: { date: Date; xp: number }[][] = [];
    let max = 1;
    for (let w = 0; w < WEEKS; w++) {
      const col: { date: Date; xp: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const date = new Date(start);
        date.setDate(start.getDate() + w * 7 + d);
        const xp = xpDaily[dateKey(date)] ?? 0;
        if (xp > max) max = xp;
        col.push({ date, xp });
      }
      cols.push(col);
    }
    return { columns: cols, maxXP: max };
  }, [xpDaily]);

  const cellColor = (xp: number): string => {
    if (xp === 0) return colors.grayVeryLight;
    const ratio = xp / maxXP;
    // 4 niveles de intensidad del color del nivel del usuario
    const opacity = ratio < 0.25 ? '40' : ratio < 0.5 ? '70' : ratio < 0.75 ? 'B0' : 'FF';
    return level.color + opacity;
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
                    { backgroundColor: isFuture ? 'transparent' : cellColor(cell.xp) },
                    selected && selected.date.getTime() === cell.date.getTime() && styles.cellSelected,
                  ]}
                />
              );
            })}
          </View>
        ))}
      </View>
      {selected ? (
        <Text style={styles.tooltip}>
          {format(selected.date, "d 'de' MMMM", { locale: es })}: {selected.xp} XP
        </Text>
      ) : (
        <Text style={styles.tooltip}>Tocá un día para ver su XP</Text>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  grid: { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  column: { gap: 4 },
  cell: { width: 14, height: 14, borderRadius: 3 },
  cellSelected: { borderWidth: 1.5, borderColor: colors.textPrimary },
  tooltip: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, textAlign: 'center', marginTop: 10 },
});
