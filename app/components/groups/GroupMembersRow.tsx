import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { initials } from '../../utils/formatters';
import { GroupMember } from './types';

const MAX_AVATARS = 5;

interface Props {
  members: GroupMember[];
  totalCount: number;
  onInvite: () => void;
  onPressMember: (m: GroupMember) => void;
}

// Avatares circulares superpuestos (con borde del color de fondo para el efecto
// apilado) + contador + botón "Invitar" (disponible para cualquier miembro).
export function GroupMembersRow({ members, totalCount, onInvite, onPressMember }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const shown = members.slice(0, MAX_AVATARS);
  const extra = totalCount - shown.length;

  return (
    <View style={styles.row}>
      <View style={styles.avatars}>
        {shown.map((m, i) => (
          <TouchableOpacity
            key={m.userId}
            activeOpacity={0.8}
            onPress={() => onPressMember(m)}
            style={[styles.avatar, { backgroundColor: m.avatarColor, borderColor: colors.bg, marginLeft: i === 0 ? 0 : -10 }]}
          >
            <Text style={styles.avatarText}>{initials(m.username)}</Text>
          </TouchableOpacity>
        ))}
        {extra > 0 && (
          <View style={[styles.avatar, styles.extra, { borderColor: colors.bg, marginLeft: -10 }]}>
            <Text style={styles.extraText}>+{extra}</Text>
          </View>
        )}
      </View>

      <Text style={styles.count}>{totalCount} miembros</Text>

      <TouchableOpacity style={styles.inviteBtn} onPress={onInvite} activeOpacity={0.8}>
        <Ionicons name="person-add" size={14} color={Dayxo.purple} />
        <Text style={styles.inviteText}>Invitar</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 34, height: 34, borderRadius: 17, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  extra: { backgroundColor: colors.grayLight },
  extraText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
  count: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: colors.violetLight, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  inviteText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Dayxo.purple },
});
