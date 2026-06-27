import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { DurationOption } from '../../constants/gameOptions';

interface Props {
  options: DurationOption[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

// Chips de duración (dinámicos según el juego elegido). Si no hay opciones, no renderiza.
export function DurationSelector({ options, selectedIndex, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (options.length === 0) return null;

  return (
    <View>
      <Text style={styles.label}>DURACIÓN</Text>
      <View style={styles.row}>
        {options.map((opt, i) => {
          const active = i === selectedIndex;
          return (
            <TouchableOpacity
              key={opt.label}
              onPress={() => onSelect(i)}
              style={[styles.chip, active && styles.chipActive]}
              activeOpacity={0.8}
            >
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 18, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9, borderRadius: 20,
    backgroundColor: colors.grayVeryLight,
  },
  chipActive: { backgroundColor: Dayxo.purple },
  chipText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  chipTextActive: { color: '#fff' },
});
