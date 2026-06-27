import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { GroupBadgeDisplay, GROUP_BADGE_RARITY } from '../../constants/groupBadges';

// Badge individual del grid. Desbloqueado → color según rareza. Bloqueado →
// atenuado con candado (RN no tiene grayscale real; se aproxima con opacidad).
export function GroupBadgeItem({ badge, onPress }: { badge: GroupBadgeDisplay; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const rar = GROUP_BADGE_RARITY[badge.rarity];

  const circleStyle = badge.unlocked
    ? [
        styles.circle,
        { backgroundColor: rar.bg, borderColor: rar.border },
        rar.glow ? { shadowColor: rar.glow, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 } : null,
      ]
    : [styles.circle, styles.circleLocked];

  return (
    <TouchableOpacity style={styles.cell} activeOpacity={0.7} onPress={onPress}>
      <View>
        <View style={circleStyle}>
          <Text style={[styles.emoji, !badge.unlocked && styles.emojiLocked]}>{badge.emoji}</Text>
        </View>
        {!badge.unlocked && (
          <View style={[styles.lock, { borderColor: colors.bg }]}>
            <Ionicons name="lock-closed" size={9} color="#fff" />
          </View>
        )}
      </View>
      <Text style={[styles.name, !badge.unlocked && styles.nameLocked]} numberOfLines={2}>{badge.name}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cell: { width: '25%', alignItems: 'center', marginBottom: 16, paddingHorizontal: 2 },
  circle: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  circleLocked: { backgroundColor: colors.grayVeryLight, borderColor: colors.border, opacity: 0.6 },
  emoji: { fontSize: 24 },
  emojiLocked: { opacity: 0.4 },
  lock: {
    position: 'absolute', bottom: -2, right: -2,
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    backgroundColor: '#2A2A35', alignItems: 'center', justifyContent: 'center',
  },
  name: { fontSize: 9, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, textAlign: 'center', marginTop: 6 },
  nameLocked: { color: colors.textTertiary, opacity: 0.7 },
});
