import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { GroupListItem } from './types';

export function GroupListCard({ group, onPress }: { group: GroupListItem; onPress: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const meta = group.groupStreak > 0
    ? `${group.memberCount} miembros · 🔥 ${group.groupStreak} días`
    : `${group.memberCount} miembros · sin racha activa`;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      {/* Ícono + badge de no leídos */}
      <View>
        <View style={[styles.iconBox, { backgroundColor: group.accentColor + '22' }]}>
          <Text style={styles.iconEmoji}>{group.emoji}</Text>
        </View>
        {group.unreadCount > 0 && (
          <View style={[styles.unreadBadge, { borderColor: colors.bg }]}>
            <Text style={styles.unreadText}>{group.unreadCount > 9 ? '9+' : group.unreadCount}</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
          {group.hasLiveGame && (
            <View style={styles.liveBadge}>
              <Text style={styles.liveText}>EN VIVO</Text>
            </View>
          )}
        </View>
        <Text style={styles.meta} numberOfLines={1}>{meta}</Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  iconBox: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconEmoji: { fontSize: 24 },
  unreadBadge: {
    position: 'absolute', top: -5, right: -5,
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: '#FF6B00', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  unreadText: { fontSize: 11, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  liveBadge: { backgroundColor: 'rgba(255,107,0,0.15)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  liveText: { fontSize: 9, fontFamily: 'Inter_800ExtraBold', color: '#FF8C42', letterSpacing: 0.5 },
  meta: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 3 },
});
