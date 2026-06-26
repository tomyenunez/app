import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { initials } from '../../utils/formatters';
import { GroupInviteRequest } from './types';

interface Props {
  request: GroupInviteRequest;
  onAccept: () => void;
  onReject: () => void;
}

// Solicitud pendiente: avatar + nombre + quién invitó + aceptar / rechazar.
export function InviteRequestRow({ request, onAccept, onReject }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: request.avatarColor }]}>
        <Text style={styles.avatarText}>{initials(request.invitedUsername)}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{request.invitedUsername}</Text>
        <Text style={styles.by} numberOfLines={1}>Invitado por {request.invitedByUsername}</Text>
      </View>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: Dayxo.green }]} onPress={onAccept} activeOpacity={0.8}>
        <Ionicons name="checkmark" size={18} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.iconBtn, { backgroundColor: colors.grayLight }]} onPress={onReject} activeOpacity={0.8}>
        <Ionicons name="close" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
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
  by: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  iconBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
