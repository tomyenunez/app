import React, { useMemo } from 'react';
import { View, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { GroupBadgeDisplay, GROUP_BADGE_RARITY, GROUP_BADGE_RARITY_LABEL } from '../../constants/groupBadges';

interface Props {
  badge: GroupBadgeDisplay | null;
  onClose: () => void;
}

// Overlay (no modal RN, para no anidar) con el detalle de un badge al tocarlo.
export function GroupBadgeDetailModal({ badge, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  if (!badge) return null;

  const rar = GROUP_BADGE_RARITY[badge.rarity];
  const when = badge.unlockedDaysAgo === 0 ? 'hoy'
    : badge.unlockedDaysAgo === 1 ? 'ayer'
    : `hace ${badge.unlockedDaysAgo} días`;

  return (
    <View style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.card}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={22} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={[
          styles.circle,
          badge.unlocked
            ? { backgroundColor: rar.bg, borderColor: rar.border }
            : { backgroundColor: colors.grayVeryLight, borderColor: colors.border },
        ]}>
          <Text style={[styles.emoji, !badge.unlocked && { opacity: 0.4 }]}>{badge.emoji}</Text>
        </View>

        {badge.unlocked ? (
          <>
            <Text style={styles.name}>{badge.name}</Text>
            <Text style={styles.rarity}>{GROUP_BADGE_RARITY_LABEL[badge.rarity]}</Text>
            <Text style={styles.desc}>{badge.description}</Text>
            <Text style={styles.when}>Conseguido {when}</Text>
          </>
        ) : (
          <>
            <Text style={styles.locked}>🔒 Bloqueado</Text>
            <Text style={styles.name}>{badge.name}</Text>
            <Text style={styles.desc}>{badge.description}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 32 },
  card: {
    width: '100%', maxWidth: 320, borderRadius: 20, padding: 22, alignItems: 'center',
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  closeBtn: { position: 'absolute', top: 12, right: 12 },
  circle: { width: 76, height: 76, borderRadius: 38, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  emoji: { fontSize: 34 },
  locked: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textSecondary, marginTop: 14 },
  name: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, marginTop: 12, textAlign: 'center' },
  rarity: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.textSecondary, marginTop: 4 },
  desc: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 12, textAlign: 'center', lineHeight: 19 },
  when: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textTertiary, marginTop: 12 },
});
