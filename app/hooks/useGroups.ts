import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listMyGroups, listMyInvites, listActivity, createGroup, joinGroupByCode,
  acceptGroupInvite, declineGroupInvite,
  GroupSummary, MyGroupInvite, GroupActivityEvent,
} from '../services/groups';
import { GroupListItem, GROUP_COVER_GRADIENTS } from '../components/groups/types';
import { unlockBadge } from '../services/xpService';

// Adapta el shape de datos al contrato visual de las cards existentes.
// groupStreak/hasLiveGame/unreadCount quedan neutros hasta que existan
// los juegos grupales (no inventamos datos).
export function toListItem(g: GroupSummary): GroupListItem {
  const gradient = GROUP_COVER_GRADIENTS[g.gradientIndex] ?? GROUP_COVER_GRADIENTS[0];
  return {
    id: g.id, name: g.name, emoji: g.emoji,
    accentColor: gradient[0],
    memberCount: g.memberCount,
    groupStreak: 0, hasLiveGame: false, unreadCount: 0,
  };
}

// Estado de Grupos: mis grupos, invitaciones que me llegaron y novedades reales.
export function useGroups(visible: boolean) {
  const { user } = useAuth();
  const uid = user?.id;
  const [groups, setGroups] = useState<GroupSummary[]>([]);
  const [invites, setInvites] = useState<MyGroupInvite[]>([]);
  const [feed, setFeed] = useState<GroupActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const [gs, inv] = await Promise.all([listMyGroups(uid), listMyInvites(uid)]);
    setGroups(gs);
    setInvites(inv);
    const names: Record<string, string> = {};
    gs.forEach((g) => { names[g.id] = g.name; });
    setFeed(await listActivity(gs.map((g) => g.id), names));
    setLoading(false);
    // "La banda": ser parte de 3 grupos
    if (gs.length >= 3) unlockBadge('la_banda');
  }, [uid]);

  useEffect(() => {
    if (visible && uid) { setLoading(true); refresh(); }
  }, [visible, uid, refresh]);

  const create = useCallback(async (name: string, emoji: string, gradientIndex: number) => {
    const res = await createGroup(name, emoji, gradientIndex);
    if (res.group) {
      unlockBadge('fundador'); // "Fundador": tu primer grupo
      await refresh();
    }
    return res;
  }, [refresh]);

  const joinByCode = useCallback(async (code: string) => {
    const res = await joinGroupByCode(code);
    if (res.groupId) await refresh();
    return res;
  }, [refresh]);

  const accept = useCallback(async (inviteId: string) => {
    const res = await acceptGroupInvite(inviteId);
    await refresh();
    return res;
  }, [refresh]);

  const decline = useCallback(async (inviteId: string) => {
    await declineGroupInvite(inviteId);
    await refresh();
  }, [refresh]);

  const listItems = useMemo(() => groups.map(toListItem), [groups]);

  return { groups, listItems, invites, feed, loading, refresh, create, joinByCode, accept, decline };
}
