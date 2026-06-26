import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { GradientPicker } from '../components/groups/GradientPicker';
import { MemberManagementRow } from '../components/groups/MemberManagementRow';
import { InviteRequestRow } from '../components/groups/InviteRequestRow';
import { GROUP_COVER_GRADIENTS, GroupMember, GroupInviteRequest } from '../components/groups/types';

const EMOJI_PRESETS = ['🔥', '💪', '🏠', '🎯', '🚀', '⭐', '🏆', '🎮', '📚', '🧠'];

// Solicitudes pendientes de ejemplo (las reales las trae el backend de Mateo).
const MOCK_REQUESTS: GroupInviteRequest[] = [
  { id: 'r1', invitedUsername: 'Lucía', invitedByUsername: 'Mateo', avatarColor: '#E84393' },
  { id: 'r2', invitedUsername: 'Joaco', invitedByUsername: 'Sofi', avatarColor: '#0984E3' },
];

interface Props {
  groupName: string;
  groupEmoji: string;
  gradientIndex: number;
  members: GroupMember[];
  currentUserId: string;
  onBack: () => void;
}

export function GroupSettingsScreen({ groupName, groupEmoji, gradientIndex, members, currentUserId, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(groupName);
  const [emoji, setEmoji] = useState(groupEmoji);
  const [gradIdx, setGradIdx] = useState(gradientIndex);

  const soon = () => Alert.alert('Grupos', 'Esto se conecta cuando esté el backend de grupos 🚧');

  const confirmDelete = () => {
    Alert.alert(
      'Eliminar grupo',
      `Vas a eliminar "${name}" para todos sus miembros. Esta acción no se puede deshacer.`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Eliminar', style: 'destructive', onPress: soon }],
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

          <TouchableOpacity style={styles.photoBtn} onPress={soon} activeOpacity={0.8}>
            <Ionicons name="image-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.photoBtnText}>Subir foto de portada</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={soon} activeOpacity={0.85}>
            <Text style={styles.saveBtnText}>Guardar cambios</Text>
          </TouchableOpacity>

          {/* 2. Miembros */}
          <Text style={styles.sectionLabel}>GESTIONAR MIEMBROS ({members.length})</Text>
          {members.map((m) => (
            <MemberManagementRow
              key={m.userId}
              member={m}
              isSelf={m.userId === currentUserId}
              onMakeAdmin={soon}
              onKick={soon}
            />
          ))}

          {/* 3. Solicitudes pendientes */}
          <Text style={styles.sectionLabel}>SOLICITUDES PENDIENTES ({MOCK_REQUESTS.length})</Text>
          {MOCK_REQUESTS.length === 0 ? (
            <Text style={styles.empty}>No hay solicitudes pendientes.</Text>
          ) : (
            MOCK_REQUESTS.map((r) => (
              <InviteRequestRow key={r.id} request={r} onAccept={soon} onReject={soon} />
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
  photoBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14,
    borderRadius: 10, paddingVertical: 12, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  photoBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  saveBtn: { backgroundColor: Dayxo.purple, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 12 },
  saveBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },

  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, paddingVertical: 8 },

  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, borderWidth: 1.5, borderColor: colors.error + '66',
  },
  deleteText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.error },
});
