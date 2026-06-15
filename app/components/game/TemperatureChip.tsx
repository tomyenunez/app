import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useTemperature } from '../../hooks/useTemperature';

export function TemperatureChip() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { temp, todayXP, avg } = useTemperature();

  return (
    <View style={[styles.chip, { backgroundColor: temp.color + (colors.bg === '#0F0F12' ? '33' : '22') }]}>
      <Text style={styles.emoji}>{temp.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[styles.label, { color: temp.color }]}>{temp.label}</Text>
        <Text style={styles.sub}>
          {todayXP} XP hoy{avg > 0 ? ` · promedio ${avg}` : ''}
        </Text>
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 12,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emoji: { fontSize: 26 },
  label: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  sub: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 1 },
});
