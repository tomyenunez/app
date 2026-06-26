import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { initials } from '../../utils/formatters';
import { GroupMember } from './types';

interface Props {
  member: GroupMember;
  isSelf: boolean;
  onMakeAdmin: () => void;
  onKick: () => void;
}

// Fila de miembro en la config: avatar + nombre + rol; si no sos vos, podés
// hacerlo admin o expulsarlo.
export function MemberManagementRow({ member, isSelf, onMakeAdmin, onKick }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: member.avatarColor }]}>
        <Text style={styles.avatarText}>{initials(member.username)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{member.username}{isSelf ? ' (vos)' : ''}</Text>
        <Text style={[styles.role, member.isAdmin && { color: Dayxo.purple }]}>{member.isAdmin ? 'Admin' : 'Miembro'}</Text>
      </View>
      {!isSelf && (
        <View style={styles.actions}>
          {!member.isAdmin && (
            <TouchableOpacity style={styles.adminBtn} onPress={onMakeAdmin} activeOpacity={0.8}>
              <Text style={styles.adminBtnText}>Hacer admin</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.kickBtn} onPress={onKick} activeOpacity={0.8}>
            <Text style={styles.kickText}>Expulsar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderRadius: 12, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 13, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  info: { flex: 1 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  role: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminBtn: { backgroundColor: colors.violetLight, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  adminBtnText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: Dayxo.purple },
  kickBtn: { backgroundColor: colors.error + '1A', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  kickText: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.error },
});
