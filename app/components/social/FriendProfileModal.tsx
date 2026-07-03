import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { getRank } from '../../constants/ranks';
import { initials } from '../../utils/formatters';
import { PublicUser, FriendProfile, getFriendProfile } from '../../services/friends';
import { getRecords, saveRecords } from '../../services/storage';
import { unlockBadge } from '../../services/xpService';

interface Props {
  friend: PublicUser | null; // null = cerrado
  onClose: () => void;
}

// Pop-up con el perfil de un amigo: rango, XP, rachas y totales — un mini
// "Stats" pero con los datos de la otra persona.
export function FriendProfileModal({ friend, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [profile, setProfile] = useState<FriendProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!friend) { setProfile(null); return; }
    let active = true;
    setLoading(true);
    getFriendProfile(friend.id).then((p) => {
      if (!active) return;
      setProfile(p);
      setLoading(false);
    });

    // 🥚 "Stalker cariñoso": 10 visitas al perfil del mismo amigo (contador en la nube)
    (async () => {
      const r = await getRecords();
      const views = { ...(r.profileViews ?? {}) };
      views[friend.id] = (views[friend.id] ?? 0) + 1;
      r.profileViews = views;
      await saveRecords(r);
      if (views[friend.id] >= 10) unlockBadge('stalker_carinoso');
    })();

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friend?.id]);

  if (!friend) return null;

  const rank = getRank(profile?.xpTotal ?? 0);

  const stats: { icon: string; label: string; value: string }[] = profile ? [
    { icon: '⚡', label: 'XP esta semana', value: `+${profile.xpThisWeek}` },
    { icon: '🔥', label: 'Racha actual', value: `${profile.streak} ${profile.streak === 1 ? 'día' : 'días'}` },
    { icon: '🏅', label: 'Mejor racha', value: `${profile.longestStreak} ${profile.longestStreak === 1 ? 'día' : 'días'}` },
    { icon: '💪', label: 'Hábitos cumplidos', value: `${profile.totalHabitsCompleted}` },
    { icon: '✅', label: 'Tareas completadas', value: `${profile.totalTodosCompleted}` },
    { icon: '🎖️', label: 'Logros', value: `${profile.badgesCount}` },
  ] : [];

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.card} onPress={() => {}}>
          {/* Hero con gradiente Dayxo */}
          <LinearGradient
            colors={[Dayxo.orange, Dayxo.purple]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>

            <View style={[styles.avatar, { backgroundColor: friend.avatarColor }]}>
              {friend.avatarUrl
                ? <Image source={{ uri: friend.avatarUrl }} style={styles.avatarImg} />
                : <Text style={styles.avatarTxt}>{initials(friend.username)}</Text>}
            </View>
            <Text style={styles.name} numberOfLines={1}>{friend.username}</Text>

            {/* Chip de rango con los colores del rango */}
            {profile && (
              <View style={[styles.rankChip, { backgroundColor: rank.bgColor }]}>
                <Text style={styles.rankIcon}>{rank.icon}</Text>
                <Text style={[styles.rankName, { color: rank.textColor }]}>{rank.name}</Text>
                <Text style={[styles.rankXp, { color: rank.textColor }]}>· {profile.xpTotal} XP</Text>
              </View>
            )}
          </LinearGradient>

          {/* Stats */}
          <View style={styles.body}>
            {loading ? (
              <ActivityIndicator color={Dayxo.purple} style={{ marginVertical: 26 }} />
            ) : !profile ? (
              <Text style={styles.error}>No pudimos cargar el perfil. Probá de nuevo.</Text>
            ) : (
              <View style={styles.grid}>
                {stats.map((s) => (
                  <View key={s.label} style={styles.statCell}>
                    <Text style={styles.statIcon}>{s.icon}</Text>
                    <Text style={styles.statValue}>{s.value}</Text>
                    <Text style={styles.statLabel} numberOfLines={1}>{s.label}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  card: {
    width: '100%', maxWidth: 360, borderRadius: 24, overflow: 'hidden',
    backgroundColor: colors.card,
  },
  hero: { alignItems: 'center', paddingTop: 26, paddingBottom: 20, paddingHorizontal: 18 },
  closeBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(0,0,0,0.25)', alignItems: 'center', justifyContent: 'center',
  },
  avatar: {
    width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center',
    borderWidth: 3, borderColor: '#fff', overflow: 'hidden',
  },
  avatarImg: { width: 68, height: 68 },
  avatarTxt: { color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 24 },
  name: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 10 },
  rankChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 10,
  },
  rankIcon: { fontSize: 13 },
  rankName: { fontSize: 13, fontFamily: 'Inter_800ExtraBold' },
  rankXp: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },

  body: { padding: 14 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statCell: {
    width: '31.5%', flexGrow: 1,
    backgroundColor: colors.bg, borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 6, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  statIcon: { fontSize: 18 },
  statValue: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, marginTop: 4 },
  statLabel: { fontSize: 9.5, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: 2, textAlign: 'center' },
  error: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 20 },
});
