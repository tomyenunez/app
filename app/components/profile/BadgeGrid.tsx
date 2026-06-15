import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { BADGES, RARITY_LABEL } from '../../constants/badges';

export function BadgeGrid() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { badges } = useGame();

  const unlockedCount = BADGES.filter((b) => badges[b.id]).length;

  return (
    <View>
      <Text style={styles.count}>{unlockedCount} de {BADGES.length} desbloqueados</Text>
      <View style={styles.grid}>
        {BADGES.map((b) => {
          const unlocked = !!badges[b.id];
          return (
            <View
              key={b.id}
              style={[
                styles.badge,
                { borderColor: unlocked ? b.color : colors.border },
                unlocked && b.rarity === 'legendary' && styles.legendary,
                unlocked && b.rarity === 'epic' && styles.epic,
              ]}
            >
              <Text style={[styles.icon, !unlocked && styles.iconLocked]}>{unlocked ? b.icon : '🔒'}</Text>
              <Text style={[styles.name, { color: unlocked ? colors.textPrimary : colors.textTertiary }]} numberOfLines={1}>
                {b.name}
              </Text>
              <Text style={[styles.rarity, { color: unlocked ? b.color : colors.textTertiary }]}>
                {RARITY_LABEL[b.rarity]}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  count: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badge: {
    width: '30%',
    backgroundColor: colors.grayVeryLight,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
    alignItems: 'center',
  },
  legendary: {
    shadowColor: '#FDCB6E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  epic: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 4,
  },
  icon: { fontSize: 28 },
  iconLocked: { opacity: 0.5 },
  name: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4, textAlign: 'center' },
  rarity: { fontSize: 9, fontFamily: 'Inter_500Medium', marginTop: 1 },
});
