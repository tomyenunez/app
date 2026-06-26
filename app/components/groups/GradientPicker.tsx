import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  gradients: [string, string][];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

// Grilla de gradientes predefinidos para la portada del grupo.
export function GradientPicker({ gradients, selectedIndex, onSelect }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.grid}>
      {gradients.map((g, i) => {
        const selected = i === selectedIndex;
        return (
          <TouchableOpacity key={i} onPress={() => onSelect(i)} activeOpacity={0.8} style={styles.cell}>
            <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.swatch, selected && styles.swatchSelected]}>
              {selected && <Ionicons name="checkmark" size={20} color="#fff" />}
            </LinearGradient>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  cell: {},
  swatch: {
    width: 56, height: 40, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'transparent',
  },
  swatchSelected: { borderColor: colors.textPrimary },
});
