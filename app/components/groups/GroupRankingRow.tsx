import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { initials } from '../../utils/formatters';
import { RankingEntry } from './types';

const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

export function GroupRankingRow({ entry }: { entry: RankingEntry }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const medal = MEDALS[entry.position];

  return (
    <View style={[styles.row, entry.isCurrentUser && styles.rowMe]}>
      <View style={styles.posWrap}>
        {medal ? <Text style={styles.medal}>{medal}</Text> : <Text style={styles.posNum}>{entry.position}</Text>}
      </View>
      <View style={[styles.avatar, { backgroundColor: entry.avatarColor }]}>
        <Text style={styles.avatarText}>{initials(entry.username)}</Text>
      </View>
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{entry.username}</Text>
          {entry.isCurrentUser && (
            <View style={styles.meTag}><Text style={styles.meTagText}>VOS</Text></View>
          )}
        </View>
        <Text style={styles.rank} numberOfLines={1}>{entry.rankIcon} {entry.rankName}</Text>
      </View>
      <Text style={styles.xp}>+{entry.xpThisWeek}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  rowMe: {
    backgroundColor: colors.violetLight, borderRadius: 12,
    paddingHorizontal: 10, marginHorizontal: -10,
  },
  posWrap: { width: 26, alignItems: 'center' },
  medal: { fontSize: 18 },
  posNum: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  meTag: { backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 1 },
  meTagText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange, letterSpacing: 0.5 },
  rank: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  xp: { fontSize: 14, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange },
});
