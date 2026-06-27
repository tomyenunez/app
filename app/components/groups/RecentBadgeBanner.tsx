import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  badgeName: string;
  badgeEmoji: string;
  unlockedDaysAgo: number;
}

// Banner del logro más reciente (solo si fue en los últimos 7 días).
export function RecentBadgeBanner({ badgeName, badgeEmoji, unlockedDaysAgo }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const when = unlockedDaysAgo === 0 ? 'hoy' : unlockedDaysAgo === 1 ? 'ayer' : `hace ${unlockedDaysAgo} días`;

  return (
    <View style={styles.banner}>
      <Text style={styles.emoji}>{badgeEmoji}</Text>
      <Text style={styles.text}>
        El grupo desbloqueó <Text style={styles.name}>'{badgeName}'</Text> {when}
      </Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 14, padding: 14, marginTop: 12,
    backgroundColor: 'rgba(255,217,61,0.12)', borderWidth: 1, borderColor: 'rgba(255,217,61,0.3)',
  },
  emoji: { fontSize: 22 },
  text: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_500Medium', color: colors.textPrimary, lineHeight: 17 },
  name: { fontFamily: 'Inter_800ExtraBold', color: '#E0A800' },
});
