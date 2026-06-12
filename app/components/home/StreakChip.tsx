import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  streak: number;
  habitosHoy: number;
  totalHoy: number;
}

export function StreakChips({ streak, habitosHoy, totalHoy }: Props) {
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
    </View>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: Colors.textPrimary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipDarkText: {
    color: '#fff',
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
    backgroundColor: Colors.yellowLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipYellowText: {
    color: '#7A5C00',
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  habitNum: {
    color: '#E17055',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
