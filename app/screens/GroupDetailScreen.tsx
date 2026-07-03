import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { useAuth } from '../context/AuthContext';
import { getRank } from '../constants/ranks';
import { GroupCover } from '../components/groups/GroupCover';
import { ActiveGameCard } from '../components/groups/ActiveGameCard';
import { GroupRankingList } from '../components/groups/GroupRankingList';
import { GroupActionsRow } from '../components/groups/GroupActionsRow';
import { GroupBadgesSection } from '../components/groups/GroupBadgesSection';
import { GroupBadgeDetailModal } from '../components/groups/GroupBadgeDetailModal';
import { GroupSettingsScreen } from './GroupSettingsScreen';
import { ChooseGroupGameScreen } from './ChooseGroupGameScreen';
import { InviteFriendsScreen } from './InviteFriendsScreen';
import { GROUP_COVER_GRADIENTS, GroupMember, RankingEntry } from '../components/groups/types';
import { GroupBadgeDisplay } from '../constants/groupBadges';
import {
  GroupSummary, GroupMemberXP, listGroupMembers, leaveGroup, relativeTime,
} from '../services/groups';

export function GroupDetailScreen({ group, onBack }: { group: GroupSummary; onBack: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const uid = user?.id;

  // Copia editable: la Configuración actualiza nombre/emoji/gradiente en vivo.
  const [info, setInfo] = useState(group);
  const [members, setMembers] = useState<GroupMemberXP[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [chooseGameOpen, setChooseGameOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedBadge, setSelectedBadge] = useState<GroupBadgeDisplay | null>(null);

  const loadMembers = useCallback(async () => {
    const list = await listGroupMembers(group.id);
    setMembers(list);
    setLoadingMembers(false);
  }, [group.id]);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const isAdmin = members.find((m) => m.userId === uid)?.isAdmin ?? info.isAdmin;

  const uiMembers: GroupMember[] = useMemo(
    () => members.map((m) => ({
      userId: m.userId, username: m.username, avatarColor: m.avatarColor, isAdmin: m.isAdmin,
    })),
    [members],
  );

  // Ranking semanal real: XP de la semana desde game_state de cada miembro.
  const ranking: RankingEntry[] = useMemo(
    () => members.map((m) => {
      const rank = getRank(m.xpTotal);
      return {
        position: 0, // lo asigna GroupRankingList al ordenar
        userId: m.userId,
        username: m.username,
        avatarColor: m.avatarColor,
        rankName: rank.name,
        rankIcon: rank.icon,
        xpThisWeek: m.xpThisWeek,
        isCurrentUser: m.userId === uid,
      };
    }),
    [members, uid],
  );

  const creatorName = members.find((m) => m.userId === info.createdBy)?.username ?? 'un miembro';
  const gradient = GROUP_COVER_GRADIENTS[info.gradientIndex] ?? GROUP_COVER_GRADIENTS[0];

  const soon = () => Alert.alert('Grupos', 'Los juegos grupales llegan muy pronto 🚧');

  const confirmLeave = () => {
    Alert.alert(
      'Salir del grupo',
      `¿Seguro que querés salir de "${info.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Salir', style: 'destructive',
          onPress: async () => { await leaveGroup(info.id); onBack(); },
        },
      ],
    );
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <GroupCover
          name={info.name}
          emoji={info.emoji}
          gradient={gradient}
          createdBy={creatorName}
          createdAt={relativeTime(info.createdAt).toLowerCase()}
          isAdmin={isAdmin}
          members={uiMembers}
          onInvite={() => setInviteOpen(true)}
          onBack={onBack}
          onSettings={() => setSettingsOpen(true)}
          onLeave={confirmLeave}
        />

        <View style={styles.content}>
          {loadingMembers ? (
            <ActivityIndicator color={Dayxo.purple} style={{ marginVertical: 24 }} />
          ) : (
            <>
              <ActiveGameCard
                game={null}
                isAdmin={isAdmin}
                onChooseGame={() => setChooseGameOpen(true)}
                onChangeGame={() => setChooseGameOpen(true)}
              />

              <GroupRankingList entries={ranking} />

              <GroupBadgesSection onBadgePress={setSelectedBadge} />

              <GroupActionsRow isAdmin={isAdmin} rouletteUsed={false} onRoulette={soon} onLeave={confirmLeave} />
            </>
          )}
        </View>
      </ScrollView>

      {settingsOpen && (
        <GroupSettingsScreen
          group={info}
          members={uiMembers}
          currentUserId={uid ?? ''}
          onBack={() => setSettingsOpen(false)}
          onSaved={(fields) => setInfo((prev) => ({ ...prev, ...fields }))}
          onMembersChanged={loadMembers}
          onDeleted={onBack}
        />
      )}

      {chooseGameOpen && <ChooseGroupGameScreen onBack={() => setChooseGameOpen(false)} />}

      {inviteOpen && (
        <InviteFriendsScreen
          group={info}
          memberIds={members.map((m) => m.userId)}
          onBack={() => setInviteOpen(false)}
        />
      )}

      {/* Detalle de badge (overlay centrado) */}
      <GroupBadgeDetailModal badge={selectedBadge} onClose={() => setSelectedBadge(null)} />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  content: { padding: 16 },
});
