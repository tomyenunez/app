import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { BADGES, RARITY_LABEL } from '../../constants/badges';

// Grilla de logros. Cada logro es tappable: al tocarlo se muestra abajo cómo
// conseguirlo (o un check si ya lo desbloqueaste).
export function LogrosSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { badges } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const unlockedCount = BADGES.filter((b) => badges[b.id]).length;
  const sel = selected ? BADGES.find((b) => b.id === selected) ?? null : null;
  const selUnlocked = sel ? !!badges[sel.id] : false;

  return (
    <View style={styles.wrap}>
      <Text style={styles.count}>{unlockedCount} de {BADGES.length} desbloqueados</Text>

      <View style={styles.grid}>
        {BADGES.map((b) => {
          const unlocked = !!badges[b.id];
          const isSel = selected === b.id;
          return (
            <TouchableOpacity
              key={b.id}
              activeOpacity={0.8}
              onPress={() => setSelected(isSel ? null : b.id)}
              style={[
                styles.badge,
                { borderColor: unlocked ? b.color : colors.border },
                isSel && { borderWidth: 2, borderColor: unlocked ? b.color : colors.textSecondary },
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
            </TouchableOpacity>
          );
        })}
      </View>

      {sel ? (
        <View style={[styles.detail, { borderColor: sel.color + '55' }]}>
          <Text style={styles.detailTitle}>{selUnlocked ? sel.icon : '🔒'} {sel.name}</Text>
          <Text style={[styles.detailRarity, { color: sel.color }]}>{RARITY_LABEL[sel.rarity]}</Text>
          <Text style={styles.detailDesc}>
            {selUnlocked ? '✅ ¡Ya lo conseguiste!' : `Cómo conseguirlo: ${sel.description}.`}
          </Text>
        </View>
      ) : (
        <Text style={styles.hint}>Tocá un logro para ver cómo conseguirlo</Text>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginHorizontal: 14 },
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
    shadowOpacity: 0.6, shadowRadius: 8, elevation: 6,
  },
  epic: {
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 5, elevation: 4,
  },
  icon: { fontSize: 28 },
  iconLocked: { opacity: 0.5 },
  name: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 4, textAlign: 'center' },
  rarity: { fontSize: 9, fontFamily: 'Inter_500Medium', marginTop: 1 },
  detail: {
    backgroundColor: colors.card,
    borderRadius: 12, borderWidth: 1, padding: 14, marginTop: 14,
  },
  detailTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  detailRarity: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginTop: 2 },
  detailDesc: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 8, lineHeight: 18 },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 16 },
});
