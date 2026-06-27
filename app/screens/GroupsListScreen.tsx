import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
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
import { GroupActivityFeedItem, GroupListItem } from '../components/groups/types';

// ⚠️ Datos de ejemplo (placeholder). El backend de grupos lo desarrolla Mateo;
// cuando esté, se reemplazan por los datos reales (hook tipo useGroups()).
const MOCK_FEED: GroupActivityFeedItem[] = [
  { id: 'f1', emoji: '🥇', text: '**Mateo** subió a rango Oro', groupId: 'g1', timestamp: 'Hace 20 min' },
  { id: 'f2', emoji: '🎯', text: 'Misión grupal completada en **Los Pibes**', groupId: 'g1', timestamp: 'Hace 2 hs' },
  { id: 'f3', emoji: '🎲', text: 'Nuevo reto de ruleta en **Gym Bros**', groupId: 'g2', timestamp: 'Hace 3 hs' },
  { id: 'f4', emoji: '🔥', text: 'La racha de **Los Pibes** está en riesgo', groupId: 'g1', timestamp: 'Ayer' },
  { id: 'f5', emoji: '🏆', text: 'Torneo finalizado en **Gym Bros**', groupId: 'g2', timestamp: 'Ayer' },
  { id: 'f6', emoji: '🪞', text: 'Resultado del hábito espejo con **Sofi**', groupId: 'g3', timestamp: 'Ayer' },
];

export const MOCK_GROUPS: GroupListItem[] = [
  { id: 'g1', name: 'Los Pibes', emoji: '🔥', accentColor: Dayxo.orange, memberCount: 6, groupStreak: 12, hasLiveGame: true, unreadCount: 3 },
  { id: 'g2', name: 'Gym Bros', emoji: '💪', accentColor: Dayxo.purple, memberCount: 4, groupStreak: 5, hasLiveGame: true, unreadCount: 0 },
  { id: 'g3', name: 'Familia', emoji: '🏠', accentColor: Dayxo.purple, memberCount: 8, groupStreak: 0, hasLiveGame: false, unreadCount: 0 },
];

// Relevancia: 1° con novedades sin ver, 2° con juego en vivo, 3° el resto.
function rank(g: GroupListItem): number {
  return (g.unreadCount > 0 ? 2 : 0) + (g.hasLiveGame ? 1 : 0);
}

// Ordena los grupos por relevancia (reutilizado por el carrusel de Social).
export function sortGroupsByRelevance(list: GroupListItem[]): GroupListItem[] {
  return [...list].sort((a, b) => rank(b) - rank(a));
}

// Cover de "Lista de Grupos" — vive dentro del SocialModal (sección Amigos).
export function GroupsListScreen({ onBack, initialGroupId }: { onBack: () => void; initialGroupId?: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const groups = useMemo(() => sortGroupsByRelevance(MOCK_GROUPS), []);
  const [detailGroup, setDetailGroup] = useState<GroupListItem | null>(
    () => (initialGroupId ? MOCK_GROUPS.find((g) => g.id === initialGroupId) ?? null : null),
  );

  // Placeholders hasta que esté el backend de grupos.
  const comingSoon = () =>
    Alert.alert('Grupos', 'Estamos terminando los grupos 🚧\n¡Muy pronto vas a poder crearlos y competir!');

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <ModalHeader
        title="Grupos"
        subtitle={`${groups.length} ${groups.length === 1 ? 'grupo' : 'grupos'}`}
        onClose={onBack}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <GroupActivityFeed items={MOCK_FEED} onPressItem={comingSoon} />

        <View style={{ marginTop: 14 }}>
          <CreateGroupBanner onPress={comingSoon} />
        </View>

        <Text style={styles.sectionLabel}>MIS GRUPOS ({groups.length})</Text>
        {groups.length === 0 ? (
          <Text style={styles.empty}>Todavía no estás en ningún grupo. Creá uno o unite con un código 👇</Text>
        ) : (
          groups.map((g) => <GroupListCard key={g.id} group={g} onPress={() => setDetailGroup(g)} />)
        )}

        <JoinGroupRow onJoin={comingSoon} />

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Detalle de grupo (cover sobre la lista) */}
      {detailGroup && <GroupDetailScreen group={detailGroup} onBack={() => setDetailGroup(null)} />}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  body: { padding: 16 },
  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16, lineHeight: 19 },
});
