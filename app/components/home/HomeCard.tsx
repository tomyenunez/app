import React, { useMemo } from 'react';
import { TouchableOpacity, View, StyleSheet, ViewStyle } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  bg: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  value: string;
  sub: string;
  onPress?: () => void;
  wide?: boolean;
  style?: ViewStyle;
  chevron?: boolean;
  chevronColor?: string;
}

export function HomeCard({ bg, iconName, iconColor, title, value, sub, onPress, wide, style, chevron, chevronColor }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: bg }, wide && styles.wide, style]}
    >
      <View style={styles.row}>
        <View>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        {chevron && (
          <Ionicons name="chevron-forward" size={18} color={chevronColor ?? colors.textSecondary} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.value, { color: iconColor }]}>{value}</Text>
      <Text style={styles.sub}>{sub}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    minHeight: 100,
  },
  wide: { flex: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  sub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    color: colors.textSecondary,
  },
});
