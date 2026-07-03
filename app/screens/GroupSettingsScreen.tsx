import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { useAuth } from '../context/AuthContext';
import { GradientPicker } from '../components/groups/GradientPicker';
import { MemberManagementRow } from '../components/groups/MemberManagementRow';
import { GROUP_COVER_GRADIENTS, GroupMember } from '../components/groups/types';
import {
  GroupSummary, updateGroup, deleteGroup, removeMember, makeAdmin,
  listGroupPendingInvites, cancelGroupInvite,
} from '../services/groups';

const EMOJI_PRESETS = ['🔥', '💪', '🏠', '🎯', '🚀', '⭐', '🏆', '🎮', '📚', '🧠'];

interface PendingInvite {
  id: string;
  invitedUsername: string;
  invitedByUsername: string;
  avatarColor: string;
}

interface Props {
  group: GroupSummary;
  members: GroupMember[];
  currentUserId: string;
  onBack: () => void;
  onSaved: (fields: { name: string; emoji: string; gradientIndex: number }) => void;
  onMembersChanged: () => void;
  onDeleted: () => void;
}

export function GroupSettingsScreen({ group, members, currentUserId, onBack, onSaved, onMembersChanged, onDeleted }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();

  const [name, setName] = useState(group.name);
  const [emoji, setEmoji] = useState(group.emoji);
  const [gradIdx, setGradIdx] = useState(group.gradientIndex);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<PendingInvite[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);

  useEffect(() => {
    listGroupPendingInvites(group.id).then((list) => {
      setPending(list);
      setPendingLoading(false);
    });
  }, [group.id]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) { Alert.alert('Grupos', 'El nombre no puede quedar vacío.'); return; }
    setSaving(true);
    const renamed = trimmed !== group.name;
    const res = await updateGroup(
      group.id, user?.id ?? '',
      { name: trimmed, emoji, gradientIndex: gradIdx }, renamed,
    );
    setSaving(false);
    if (res.error) { Alert.alert('Grupos', res.error); return; }
    onSaved({ name: trimmed, emoji, gradientIndex: gradIdx });
    Alert.alert('Grupos', 'Cambios guardados ✅');
  };

  const confirmKick = (m: GroupMember) => {
    Alert.alert(
      'Expulsar miembro',
      `¿Sacar a ${m.username} de "${group.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Expulsar', style: 'destructive',
          onPress: async () => {
            await removeMember(group.id, m.userId, m.username, user?.id ?? '');
            onMembersChanged();
          },
        },
      ],
    );
  };

  const handleMakeAdmin = (m: GroupMember) => {
    Alert.alert(
      'Hacer admin',
      `${m.username} va a poder editar el grupo, expulsar miembros y elegir juegos. ¿Confirmás?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Hacer admin',
          onPress: async () => { await makeAdmin(group.id, m.userId); onMembersChanged(); },
        },
      ],
    );
  };

  const cancelInvite = async (id: string) => {
    await cancelGroupInvite(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
  };

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar grupo',
      `Vas a eliminar "${name}" para todos sus miembros. Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive',
          onPress: async () => {
            const res = await deleteGroup(group.id);
            if (res.error) { Alert.alert('Grupos', res.error); return; }
            onDeleted();
          },
        },
      ],
    );
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Configuración</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {/* 1. Identidad */}
          <Text style={styles.sectionLabel}>EDITAR IDENTIDAD</Text>
          <Text style={styles.fieldLabel}>Nombre del grupo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nombre del grupo"
            placeholderTextColor={colors.textTertiary}
            maxLength={30}
          />

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Ícono</Text>
          <View style={styles.emojiRow}>
            {EMOJI_PRESETS.map((e) => (
              <TouchableOpacity
                key={e}
                onPress={() => setEmoji(e)}
                style={[styles.emojiCell, emoji === e && styles.emojiCellActive]}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.fieldLabel, { marginTop: 16 }]}>Color de portada</Text>
          <GradientPicker gradients={GROUP_COVER_GRADIENTS} selectedIndex={gradIdx} onSelect={setGradIdx} />

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar cambios</Text>}
          </TouchableOpacity>

          {/* 2. Miembros */}
          <Text style={styles.sectionLabel}>GESTIONAR MIEMBROS ({members.length})</Text>
          {members.map((m) => (
            <MemberManagementRow
              key={m.userId}
              member={m}
              isSelf={m.userId === currentUserId}
              onMakeAdmin={() => handleMakeAdmin(m)}
              onKick={() => confirmKick(m)}
            />
          ))}

          {/* 3. Invitaciones pendientes (enviadas, esperando respuesta) */}
          <Text style={styles.sectionLabel}>INVITACIONES PENDIENTES ({pending.length})</Text>
          {pendingLoading ? (
            <ActivityIndicator color={Dayxo.purple} style={{ marginVertical: 8 }} />
          ) : pending.length === 0 ? (
            <Text style={styles.empty}>No hay invitaciones pendientes.</Text>
          ) : (
            pending.map((p) => (
              <View key={p.id} style={styles.pendingRow}>
                <View style={[styles.pendingAvatar, { backgroundColor: p.avatarColor }]}>
                  <Text style={styles.pendingAvatarText}>{p.invitedUsername.slice(0, 2).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pendingName} numberOfLines={1}>{p.invitedUsername}</Text>
                  <Text style={styles.pendingBy} numberOfLines={1}>Invitado por {p.invitedByUsername}</Text>
                </View>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelInvite(p.id)} activeOpacity={0.8}>
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}

          {/* 4. Zona de peligro */}
          <Text style={[styles.sectionLabel, { color: colors.error }]}>ZONA DE PELIGRO</Text>
          <TouchableOpacity style={styles.deleteBtn} onPress={confirmDelete} activeOpacity={0.85}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
            <Text style={styles.deleteText}>Eliminar grupo</Text>
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16 },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 12 },
  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  emojiRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiCell: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border,
  },
  emojiCellActive: { borderColor: Dayxo.purple, backgroundColor: colors.violetLight },
  emojiText: { fontSize: 22 },
  saveBtn: { backgroundColor: Dayxo.purple, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, paddingVertical: 8 },

  pendingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  pendingAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  pendingAvatarText: { color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 13 },
  pendingName: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  pendingBy: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  cancelBtn: {
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: colors.grayLight,
  },
  cancelText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.error + '66',
  },
  deleteText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.error },
});
