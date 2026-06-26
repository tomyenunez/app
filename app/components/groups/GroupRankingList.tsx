import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { RankingEntry } from './types';
import { GroupRankingRow } from './GroupRankingRow';

// Ranking de la semana: ordenado por XP ganado en la semana actual (no histórico).
export function GroupRankingList({ entries }: { entries: RankingEntry[] }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const ordered = useMemo(
    () => [...entries].sort((a, b) => b.xpThisWeek - a.xpThisWeek).map((e, i) => ({ ...e, position: i + 1 })),
    [entries]
  );

  return (
    <View>
      <Text style={styles.label}>RANKING DE LA SEMANA</Text>
      <View style={styles.card}>
        {ordered.map((e, i) => (
          <View key={e.userId}>
            {i > 0 && <View style={styles.sep} />}
            <GroupRankingRow entry={e} />
          </View>
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  card: {
    backgroundColor: colors.card, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: colors.border,
  },
  sep: { height: 1, backgroundColor: colors.border },
});
