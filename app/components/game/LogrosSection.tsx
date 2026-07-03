import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { BADGES, RARITY_LABEL, CATEGORY_LABEL, CATEGORY_ORDER, BadgeDef } from '../../constants/badges';
import { unlockBadge } from '../../services/xpService';

// Grilla de logros agrupada por familia. Los secretos aparecen como "???"
// hasta desbloquearse. Cada logro es tappable: muestra abajo cómo conseguirlo
// (los secretos bloqueados no dan ninguna pista 🤫).
export function LogrosSection() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { badges } = useGame();
  const [selected, setSelected] = useState<string | null>(null);

  const unlockedCount = BADGES.filter((b) => badges[b.id]).length;
  const sel = selected ? BADGES.find((b) => b.id === selected) ?? null : null;
  const selUnlocked = sel ? !!badges[sel.id] : false;
  const selHidden = !!sel?.secret && !selUnlocked;

  const families = useMemo(
    () => CATEGORY_ORDER.map((cat) => ({
      cat,
      items: BADGES.filter((b) => b.category === cat),
    })).filter((f) => f.items.length > 0),
    [],
  );

  const renderBadge = (b: BadgeDef) => {
    const unlocked = !!badges[b.id];
    const hidden = !!b.secret && !unlocked; // secreto sin desbloquear → "???"
    const isSel = selected === b.id;
    return (
      <TouchableOpacity
        key={b.id}
        activeOpacity={0.8}
        onPress={() => setSelected(isSel ? null : b.id)}
        // 🗝️ Easter egg "Sin instrucciones": mantener apretado un secreto bloqueado
        onLongPress={hidden ? () => unlockBadge('sin_instrucciones') : undefined}
        delayLongPress={1200}
        style={[
          styles.badge,
          { borderColor: unlocked ? b.color : colors.border },
          isSel && { borderWidth: 2, borderColor: unlocked ? b.color : colors.textSecondary },
          unlocked && b.rarity === 'legendary' && styles.legendary,
          unlocked && b.rarity === 'epic' && styles.epic,
        ]}
      >
        <Text style={[styles.icon, !unlocked && styles.iconLocked]}>
          {unlocked ? b.icon : hidden ? '❓' : '🔒'}
        </Text>
        <Text style={[styles.name, { color: unlocked ? colors.textPrimary : colors.textTertiary }]} numberOfLines={1}>
          {hidden ? '???' : b.name}
        </Text>
        <Text style={[styles.rarity, { color: unlocked ? b.color : colors.textTertiary }]}>
          {hidden ? 'Secreto' : RARITY_LABEL[b.rarity]}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.count}>{unlockedCount} de {BADGES.length} desbloqueados</Text>

      {families.map(({ cat, items }) => {
        const got = items.filter((b) => badges[b.id]).length;
        return (
          <View key={cat} style={styles.family}>
            <View style={styles.familyHead}>
              <Text style={styles.familyLabel}>{CATEGORY_LABEL[cat]}</Text>
              <Text style={styles.familyCount}>{got}/{items.length}</Text>
            </View>
            <View style={styles.grid}>
              {items.map(renderBadge)}
            </View>
          </View>
        );
      })}

      {sel ? (
        <View style={[styles.detail, { borderColor: (selHidden ? colors.border : sel.color) + '55' }]}>
          <Text style={styles.detailTitle}>
            {selUnlocked ? sel.icon : selHidden ? '❓' : '🔒'} {selHidden ? '???' : sel.name}
          </Text>
          <Text style={[styles.detailRarity, { color: selHidden ? colors.textSecondary : sel.color }]}>
            {selHidden ? 'Secreto' : RARITY_LABEL[sel.rarity]}
          </Text>
          <Text style={styles.detailDesc}>
            {selUnlocked
              ? `✅ ${sel.description}.`
              : selHidden
                ? 'Es un secreto. Lo vas a saber cuando lo encuentres 🤫'
                : `Cómo conseguirlo: ${sel.description}.`}
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
  count: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginBottom: 4 },
  family: { marginTop: 14 },
  familyHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  familyLabel: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.textPrimary, letterSpacing: 0.3 },
  familyCount: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
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
