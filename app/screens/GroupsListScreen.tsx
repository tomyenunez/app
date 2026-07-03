import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from '../components/shared/AppText';
import { ModalHeader } from '../components/shared/ModalHeader';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { GroupActivityFeed } from '../components/groups/GroupActivityFeed';
import { CreateGroupBanner } from '../components/groups/CreateGroupBanner';
import { GroupListCard } from '../components/groups/GroupListCard';
import { JoinGroupRow } from '../components/groups/JoinGroupRow';
import { GroupDetailScreen } from './GroupDetailScreen';
import { CreateGroupScreen } from './CreateGroupScreen';
import { GroupActivityFeedItem } from '../components/groups/types';
import { useGroups, toListItem } from '../hooks/useGroups';
import { GroupSummary } from '../services/groups';

// Cover de "Lista de Grupos" — vive dentro del SocialModal (sección Amigos).
export function GroupsListScreen({ onBack, initialGroupId }: { onBack: () => void; initialGroupId?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { groups, invites, feed, loading, refresh, joinByCode, accept, decline } = useGroups(true);
  const [detailGroup, setDetailGroup] = useState<GroupSummary | null>(null);
  const [creating, setCreating] = useState(false);
  const [pendingInitial, setPendingInitial] = useState(initialGroupId);

  // Si venimos del carrusel de Social con un grupo puntual, abrirlo al cargar.
  useEffect(() => {
    if (!pendingInitial || loading) return;
    const g = groups.find((x) => x.id === pendingInitial);
    if (g) setDetailGroup(g);
    setPendingInitial(undefined);
  }, [pendingInitial, loading, groups]);

  const feedItems: GroupActivityFeedItem[] = useMemo(
    () => feed.map((e) => ({ id: e.id, emoji: e.emoji, text: e.text, groupId: e.groupId, timestamp: e.timestamp })),
    [feed],
  );

  const openFromFeed = (groupId: string) => {
    const g = groups.find((x) => x.id === groupId);
    if (g) setDetailGroup(g);
  };

  const handleJoin = async (code: string) => {
    if (code.length < 4) { Alert.alert('Grupos', 'Ingresá un código válido.'); return; }
    const res = await joinByCode(code);
    if (res.error) Alert.alert('Grupos', res.error);
    else Alert.alert('Grupos', '¡Te uniste al grupo! 🎉');
  };

  const handleAccept = async (inviteId: string) => {
    const res = await accept(inviteId);
    if (res.error) Alert.alert('Grupos', res.error);
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      {/* Mismo aire superior que el handle del SocialModal, para que el título
          y la X no queden pegados al borde de la sheet. */}
      <View style={styles.handleWrap}><View style={styles.handle} /></View>
      <ModalHeader
        title="Grupos"
        subtitle={`${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
        onClose={onBack}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {/* Novedades: solo eventos reales; si no hay, la sección no aparece */}
        <GroupActivityFeed items={feedItems} onPressItem={openFromFeed} />

        <View style={{ marginTop: feedItems.length > 0 ? 14 : 0 }}>
          <CreateGroupBanner onPress={() => setCreating(true)} />
        </View>

        {/* Invitaciones que me llegaron */}
        {invites.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>INVITACIONES ({invites.length})</Text>
            {invites.map((inv) => (
              <View key={inv.id} style={styles.inviteRow}>
                <View style={styles.inviteEmojiBox}>
                  <Text style={styles.inviteEmoji}>{inv.groupEmoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inviteName} numberOfLines={1}>{inv.groupName}</Text>
                  <Text style={styles.inviteBy} numberOfLines={1}>Te invitó {inv.inviterName}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: Dayxo.green }]}
                  onPress={() => handleAccept(inv.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.inviteBtn, { backgroundColor: colors.grayLight }]}
                  onPress={() => decline(inv.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        <Text style={styles.sectionLabel}>MIS GRUPOS ({groups.length})</Text>
        {loading ? (
          <ActivityIndicator color={Dayxo.purple} style={{ marginVertical: 16 }} />
        ) : groups.length === 0 ? (
          <Text style={styles.empty}>Todavía no estás en ningún grupo. Creá uno o unite con un código 👇</Text>
        ) : (
          groups.map((g) => (
            <GroupListCard key={g.id} group={toListItem(g)} onPress={() => setDetailGroup(g)} />
          ))
        )}

        <JoinGroupRow onJoin={handleJoin} />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Detalle de grupo (cover sobre la lista) */}
      {detailGroup && (
        <GroupDetailScreen
          group={detailGroup}
          onBack={() => { setDetailGroup(null); refresh(); }}
        />
      )}

      {/* Crear grupo (cover) */}
      {creating && (
        <CreateGroupScreen
          onBack={() => setCreating(false)}
          onCreated={(g) => { setCreating(false); refresh(); setDetailGroup(g); }}
        />
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16, lineHeight: 19 },

  inviteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  inviteEmojiBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.violetLight, alignItems: 'center', justifyContent: 'center',
  },
  inviteEmoji: { fontSize: 20 },
  inviteName: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  inviteBy: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  inviteBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
