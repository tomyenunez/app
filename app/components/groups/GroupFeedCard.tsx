import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { GroupActivityFeedItem } from './types';

// Renderiza el texto del evento: lo que está entre **...** va en negrita blanca,
// el resto en gris claro.
function renderText(text: string, styles: ReturnType<typeof createStyles>) {
  return text.split('**').map((part, i) =>
    i % 2 === 1
      ? <Text key={i} style={styles.bold}>{part}</Text>
      : <Text key={i} style={styles.normal}>{part}</Text>
  );
}

export function GroupFeedCard({ item, onPress }: { item: GroupActivityFeedItem; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <Text style={styles.emoji}>{item.emoji}</Text>
      <Text style={styles.text} numberOfLines={3}>{renderText(item.text, styles)}</Text>
      <Text style={styles.time}>{item.timestamp}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    width: 148, marginRight: 10,
    backgroundColor: colors.card, borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: colors.border,
    justifyContent: 'space-between',
  },
  emoji: { fontSize: 18, marginBottom: 6 },
  text: { fontSize: 11, lineHeight: 15 },
  normal: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  bold: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  time: { fontSize: 9, fontFamily: 'Inter_500Medium', color: colors.textTertiary, marginTop: 8 },
});
