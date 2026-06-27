import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { GROUP_BADGES, GroupBadgeDisplay } from '../../constants/groupBadges';
import { RecentBadgeBanner } from './RecentBadgeBanner';
import { GroupBadgeItem } from './GroupBadgeItem';

// ⚠️ Estado de desbloqueo de ejemplo (id → hace cuántos días). Lo real lo trae
// el backend de Mateo.
const MOCK_UNLOCKED: Record<string, number> = {
  group_perfect: 1,
  group_machine: 3,
  tournament_gold: 5,
  roulette_7: 10,
};

// Sección "Logros del grupo": banner del logro reciente + grid de 10 badges.
// Se inserta en el Detalle de Grupo, después del ranking.
export function GroupBadgesSection({ onBadgePress }: { onBadgePress: (b: GroupBadgeDisplay) => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const display: GroupBadgeDisplay[] = useMemo(
    () => GROUP_BADGES.map((b) => ({ ...b, unlocked: b.id in MOCK_UNLOCKED, unlockedDaysAgo: MOCK_UNLOCKED[b.id] })),
    []
  );

  const ordered = useMemo(() => [...display].sort((a, b) => {
    if (a.unlocked && b.unlocked) return (a.unlockedDaysAgo ?? 0) - (b.unlockedDaysAgo ?? 0);
    if (a.unlocked) return -1;
    if (b.unlocked) return 1;
    return 0;
  }), [display]);

  const unlockedCount = display.filter((b) => b.unlocked).length;
  const recent = useMemo(
    () => display
      .filter((b) => b.unlocked && (b.unlockedDaysAgo ?? 99) <= 7)
      .sort((a, b) => (a.unlockedDaysAgo ?? 0) - (b.unlockedDaysAgo ?? 0))[0],
    [display]
  );

  return (
    <View>
      <View style={styles.headRow}>
        <Text style={styles.label}>LOGROS DEL GRUPO</Text>
        <Text style={styles.count}>{unlockedCount}/{GROUP_BADGES.length}</Text>
      </View>
      <Text style={styles.subtitle}>Insignias que se desbloquean cumpliendo desafíos en equipo</Text>

      {recent && (
        <RecentBadgeBanner badgeName={recent.name} badgeEmoji={recent.emoji} unlockedDaysAgo={recent.unlockedDaysAgo ?? 0} />
      )}

      <View style={styles.grid}>
        {ordered.map((b) => (
          <GroupBadgeItem key={b.id} badge={b} onPress={() => onBadgePress(b)} />
        ))}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5 },
  count: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  subtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 16 },
});
