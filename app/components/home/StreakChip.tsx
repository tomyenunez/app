import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  streak: number;
  habitosHoy: number;
  totalHoy: number;
  bonus?: number;
}

export function StreakChips({ streak, habitosHoy, totalHoy, bonus = 0 }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={styles.chipDark}>
        <Text style={styles.chipDarkText}>🔥 Racha</Text>
        <Text style={styles.streakNum}>{streak}</Text>
      </View>
      <View style={styles.chipYellow}>
        <Text style={styles.chipYellowText}>⚡ Hábitos hoy</Text>
        <Text style={styles.habitNum}>{habitosHoy}/{totalHoy}</Text>
      </View>
      {bonus > 0 && (
        <View style={styles.chipBonus}>
          <Text style={styles.chipBonusText}>★</Text>
          <Text style={styles.bonusNum}>+{bonus}</Text>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 14,
    marginTop: 12,
  },
  chipDark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.chipDark,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDarkText: {
    color: colors.chipDarkText,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  streakNum: {
    color: '#FF9F43',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  chipYellow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.yellowLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipYellowText: {
    color: colors.familia.amarillo.fg,
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  habitNum: {
    color: colors.orange,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  // Chip de puntos bonus: dorado, solo aparece cuando hay extras
  chipBonus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FF9F43',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipBonusText: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
  },
  bonusNum: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Inter_800ExtraBold',
  },
});
