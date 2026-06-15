import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { ContextType } from '../../types/luna';

const OPTIONS: { type: ContextType; label: string }[] = [
  { type: 'tareas', label: '📋 Compartir mis tareas de hoy' },
  { type: 'habitos', label: '🔥 Compartir mis hábitos' },
  { type: 'finanzas', label: '💸 Compartir mi situación financiera' },
  { type: 'completo', label: '📊 Compartir resumen completo del día' },
];

export function ContextMenu({ onSelect }: { onSelect: (type: ContextType) => void }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.menu, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {OPTIONS.map((opt, i) => (
        <TouchableOpacity
          key={opt.type}
          onPress={() => onSelect(opt.type)}
          style={[styles.option, i < OPTIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
        >
          <Text style={[styles.optionText, { color: colors.textPrimary }]}>{opt.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
  },
  option: { paddingHorizontal: 16, paddingVertical: 13 },
  optionText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
