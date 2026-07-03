import React, { useMemo, useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { initials } from '../utils/formatters';
import { GradientPicker } from '../components/groups/GradientPicker';
import { GROUP_COVER_GRADIENTS } from '../components/groups/types';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { createGroup, inviteFriendToGroup, GroupSummary } from '../services/groups';

const EMOJI_PRESETS = ['🔥', '💪', '🏠', '🎯', '🚀', '⭐', '🏆', '🎮', '📚', '🧠'];

interface Props {
  onBack: () => void;
  onCreated: (group: GroupSummary) => void;
}

// Panel "Crear grupo": identidad (nombre + emoji + gradiente) y selección de
// amigos a invitar. Crea el grupo en Supabase y manda las invitaciones.
export function CreateGroupScreen({ onBack, onCreated }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { friends, loading: friendsLoading } = useFriends(true);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(EMOJI_PRESETS[0]);
  const [gradIdx, setGradIdx] = useState(0);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFriend = (id: string) =>
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));

  const selectedCount = Object.values(selected).filter(Boolean).length;
  const canCreate = name.trim().length >= 1 && !saving;

  const handleCreate = async () => {
    if (!canCreate || !user) return;
    setSaving(true);
    setError(null);
    const res = await createGroup(name, emoji, gradIdx);
    if (!res.group) {
      setError(res.error);
      setSaving(false);
      return;
    }
    // Invitaciones a los amigos elegidos (en paralelo; si alguna falla no bloquea)
    const invitees = friends.filter((f) => selected[f.user.id]);
    await Promise.all(
      invitees.map((f) => inviteFriendToGroup(res.group!.id, user.id, f.user.id)),
    );
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onCreated(res.group);
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crear grupo</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>Nombre del grupo</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Ej: Los Pibes"
            placeholderTextColor={colors.textTertiary}
            maxLength={30}
            autoFocus
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

          {/* Amigos a invitar */}
          <Text style={styles.sectionLabel}>
            INVITAR AMIGOS{selectedCount > 0 ? ` (${selectedCount})` : ''}
          </Text>
          {friendsLoading ? (
            <ActivityIndicator color={Dayxo.purple} style={{ marginVertical: 12 }} />
          ) : friends.length === 0 ? (
            <Text style={styles.empty}>
              Todavía no tenés amigos agregados. Podés crear el grupo igual y
              después invitar por código 👍
            </Text>
          ) : (
            friends.map((f) => {
              const on = !!selected[f.user.id];
              return (
                <TouchableOpacity
                  key={f.user.id}
                  style={[styles.friendRow, on && styles.friendRowActive]}
                  onPress={() => toggleFriend(f.user.id)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: f.user.avatarColor }]}>
                    {f.user.avatarUrl
                      ? <Image source={{ uri: f.user.avatarUrl }} style={styles.avatarImg} />
                      : <Text style={styles.avatarText}>{initials(f.user.username)}</Text>}
                  </View>
                  <Text style={styles.friendName} numberOfLines={1}>{f.user.username}</Text>
                  <Ionicons
                    name={on ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={on ? Dayxo.purple : colors.border}
                  />
                </TouchableOpacity>
              );
            })
          )}

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.createBtn, !canCreate && { opacity: 0.5 }]}
            onPress={handleCreate}
            disabled={!canCreate}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.createBtnText}>
                  Crear grupo{selectedCount > 0 ? ` e invitar (${selectedCount})` : ''}
                </Text>}
          </TouchableOpacity>

          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16 },

  fieldLabel: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
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

  friendRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1.5, borderColor: colors.border,
  },
  friendRowActive: { borderColor: Dayxo.purple },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 38, height: 38 },
  avatarText: { color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 14 },
  friendName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 19, paddingVertical: 8 },
  error: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.error, marginTop: 12 },

  createBtn: {
    backgroundColor: Dayxo.purple, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 20,
  },
  createBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
