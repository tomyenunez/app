import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useGame } from '../context/GameContext';
import { GroupCover } from '../components/groups/GroupCover';
import { GroupMembersRow } from '../components/groups/GroupMembersRow';
import { GroupStreakBanner } from '../components/groups/GroupStreakBanner';
import { ActiveGameCard } from '../components/groups/ActiveGameCard';
import { GroupRankingList } from '../components/groups/GroupRankingList';
import { GroupActionsRow } from '../components/groups/GroupActionsRow';
import { GroupSettingsScreen } from './GroupSettingsScreen';
import {
  GROUP_COVER_GRADIENTS, GroupListItem, GroupMember, RankingEntry, ActiveGroupGame,
} from '../components/groups/types';

// ⚠️ El rol y todos los datos los define el backend de Mateo. Por ahora marcamos
// al usuario como admin para poder ver toda la UI (⚙️, ruleta, etc.).
const CURRENT_USER_ID = 'me';
const IS_ADMIN = true;

export function GroupDetailScreen({ group, onBack }: { group: GroupListItem; onBack: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile } = useGame();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [gradientIndex] = useState(0);

  // --- Datos de ejemplo (placeholder) ---
  const members: GroupMember[] = useMemo(() => [
    { userId: CURRENT_USER_ID, username: profile.username, avatarColor: profile.avatarColor, isAdmin: true },
    { userId: 'u2', username: 'Mateo', avatarColor: '#0984E3', isAdmin: false },
    { userId: 'u3', username: 'Sofi', avatarColor: '#E84393', isAdmin: false },
    { userId: 'u4', username: 'Joaco', avatarColor: '#00B894', isAdmin: false },
    { userId: 'u5', username: 'Lucía', avatarColor: '#FFD93D', isAdmin: false },
    { userId: 'u6', username: 'Nico', avatarColor: '#7C3AED', isAdmin: false },
  ], [profile.username, profile.avatarColor]);

  const ranking: RankingEntry[] = useMemo(() => [
    { position: 0, userId: 'u2', username: 'Mateo', avatarColor: '#0984E3', rankName: 'Oro', rankIcon: '🥇', xpThisWeek: 420, isCurrentUser: false },
    { position: 0, userId: CURRENT_USER_ID, username: profile.username, avatarColor: profile.avatarColor, rankName: 'Amatista', rankIcon: '💜', xpThisWeek: 380, isCurrentUser: true },
    { position: 0, userId: 'u3', username: 'Sofi', avatarColor: '#E84393', rankName: 'Plata', rankIcon: '🥈', xpThisWeek: 310, isCurrentUser: false },
    { position: 0, userId: 'u4', username: 'Joaco', avatarColor: '#00B894', rankName: 'Bronce', rankIcon: '🥉', xpThisWeek: 210, isCurrentUser: false },
    { position: 0, userId: 'u5', username: 'Lucía', avatarColor: '#FFD93D', rankName: 'Hierro', rankIcon: '⚙️', xpThisWeek: 140, isCurrentUser: false },
    { position: 0, userId: 'u6', username: 'Nico', avatarColor: '#7C3AED', rankName: 'Hierro', rankIcon: '⚙️', xpThisWeek: 90, isCurrentUser: false },
  ], [profile.username, profile.avatarColor]);

  const game: ActiveGroupGame | null = group.hasLiveGame ? {
    type: 'group_mission',
    emoji: '🎯',
    title: 'Misión grupal: 50 hábitos',
    description: 'Entre todos, completen 50 hábitos esta semana para ganar el bonus.',
    timeRemaining: '3 días restantes',
    progress: 68,
    progressLabel: '34 / 50 hábitos · +500 XP al completar',
  } : null;

  const soon = () => Alert.alert('Grupos', 'Esto se conecta cuando esté el backend de grupos 🚧');

  const confirmLeave = () => {
    Alert.alert(
      'Salir del grupo',
      `¿Seguro que querés salir de "${group.name}"?`,
      [{ text: 'Cancelar', style: 'cancel' }, { text: 'Salir', style: 'destructive', onPress: onBack }],
    );
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        <GroupCover
          name={group.name}
          emoji={group.emoji}
          gradient={GROUP_COVER_GRADIENTS[gradientIndex]}
          createdBy="Mateo"
          createdAt="hace 3 semanas"
          isAdmin={IS_ADMIN}
          onBack={onBack}
          onSettings={() => setSettingsOpen(true)}
          onLeave={confirmLeave}
        />

        <View style={styles.content}>
          <GroupMembersRow
            members={members}
            totalCount={members.length}
            onInvite={soon}
            onPressMember={soon}
          />

          <GroupStreakBanner
            currentStreak={group.groupStreak}
            membersOpenedToday={4}
            totalMembers={members.length}
          />

          <ActiveGameCard game={game} isAdmin={IS_ADMIN} onChooseGame={soon} />

          <GroupRankingList entries={ranking} />

          <GroupActionsRow isAdmin={IS_ADMIN} rouletteUsed={false} onRoulette={soon} onLeave={confirmLeave} />
        </View>
      </ScrollView>

      {settingsOpen && (
        <GroupSettingsScreen
          groupName={group.name}
          groupEmoji={group.emoji}
          gradientIndex={gradientIndex}
          members={members}
          currentUserId={CURRENT_USER_ID}
          onBack={() => setSettingsOpen(false)}
        />
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  cover: { backgroundColor: colors.bg },
  content: { padding: 16 },
});
