import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  listFriends, getMyFriendCode, findByCode, sendRequest, acceptRequest, removeFriendship,
  FriendsData, PublicUser,
} from '../services/friends';

// Maneja el estado de Social: amigos, solicitudes y mi código. Refresca al abrir.
export function useFriends(visible: boolean) {
  const { user } = useAuth();
  const uid = user?.id;
  const [data, setData] = useState<FriendsData>({ friends: [], incoming: [], outgoing: [] });
  const [myCode, setMyCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!uid) return;
    const [d, code] = await Promise.all([listFriends(uid), getMyFriendCode(uid)]);
    setData(d);
    setMyCode(code);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    if (visible && uid) { setLoading(true); refresh(); }
  }, [visible, uid, refresh]);

  const send = useCallback(async (other: PublicUser) => {
    if (!uid) return { ok: false, message: 'Iniciá sesión.' };
    const res = await sendRequest(uid, other);
    if (res.ok) await refresh();
    return res;
  }, [uid, refresh]);

  const accept = useCallback(async (id: string) => { await acceptRequest(id); await refresh(); }, [refresh]);
  const remove = useCallback(async (id: string) => { await removeFriendship(id); await refresh(); }, [refresh]);

  return { ...data, myCode, loading, refresh, find: findByCode, send, accept, remove };
}
