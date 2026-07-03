import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Share, ActivityIndicator, Image } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { initials } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { useFriends } from '../hooks/useFriends';
import { GroupSummary, inviteFriendToGroup } from '../services/groups';

interface Props {
  group: GroupSummary;
  memberIds: string[]; // para no mostrar amigos que ya están adentro
  onBack: () => void;
}

// Cover "Invitar amigos": lista de amigos con botón invitar + código del grupo
// para compartir con gente que todavía no es amiga en Dayxo.
export function InviteFriendsScreen({ group, memberIds, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuth();
  const { friends, loading } = useFriends(true);

  // estado por amigo: 'idle' | 'sending' | 'sent' | mensaje de error
  const [status, setStatus] = useState<Record<string, string>>({});

  const invitable = useMemo(
    () => friends.filter((f) => !memberIds.includes(f.user.id)),
    [friends, memberIds],
  );

  const invite = async (friendId: string) => {
    if (!user) return;
    setStatus((s) => ({ ...s, [friendId]: 'sending' }));
    const res = await inviteFriendToGroup(group.id, user.id, friendId);
    setStatus((s) => ({ ...s, [friendId]: res.ok ? 'sent' : res.message }));
  };

  const shareCode = () => {
    Share.share({
      message: `Sumate a mi grupo "${group.name}" en Dayxo 🔥 El código es ${group.inviteCode}`,
    }).catch(() => {});
  };

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.cover]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invitar al grupo</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {/* Código del grupo — para compartir por fuera */}
        <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.codeCard}>
          <Text style={styles.codeLabel}>CÓDIGO DEL GRUPO</Text>
          <Text style={styles.codeValue}>{group.inviteCode}</Text>
          <TouchableOpacity style={styles.shareBtn} onPress={shareCode}>
            <Ionicons name="share-outline" size={16} color={Dayxo.purple} />
            <Text style={styles.shareBtnText}>Compartir código</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionLabel}>MIS AMIGOS</Text>
        {loading ? (
          <ActivityIndicator color={Dayxo.purple} style={{ marginTop: 16 }} />
        ) : invitable.length === 0 ? (
          <Text style={styles.empty}>
            {friends.length === 0
              ? 'Todavía no tenés amigos en Dayxo. Compartí el código del grupo 👆'
              : 'Todos tus amigos ya están en el grupo 🙌'}
          </Text>
        ) : (
          invitable.map((f) => {
            const st = status[f.user.id] ?? 'idle';
            return (
              <View key={f.user.id} style={styles.row}>
                <View style={[styles.avatar, { backgroundColor: f.user.avatarColor }]}>
                  {f.user.avatarUrl
                    ? <Image source={{ uri: f.user.avatarUrl }} style={styles.avatarImg} />
                    : <Text style={styles.avatarText}>{initials(f.user.username)}</Text>}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.name} numberOfLines={1}>{f.user.username}</Text>
                  {st !== 'idle' && st !== 'sending' && st !== 'sent' && (
                    <Text style={styles.rowError} numberOfLines={1}>{st}</Text>
                  )}
                </View>
                {st === 'sent' ? (
                  <View style={styles.sentTag}>
                    <Ionicons name="checkmark" size={14} color={Dayxo.green} />
                    <Text style={styles.sentText}>Enviada</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.inviteBtn}
                    onPress={() => invite(f.user.id)}
                    disabled={st === 'sending'}
                    activeOpacity={0.8}
                  >
                    {st === 'sending'
                      ? <ActivityIndicator color="#fff" size="small" />
                      : <Text style={styles.inviteBtnText}>Invitar</Text>}
                  </TouchableOpacity>
                )}
              </View>
            );
          })
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
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

  codeCard: { borderRadius: 18, padding: 18, alignItems: 'center' },
  codeLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: 'rgba(255,255,255,0.85)', letterSpacing: 1 },
  codeValue: { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: '#fff', letterSpacing: 3, marginTop: 6 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 16,
  },
  shareBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: Dayxo.purple },

  sectionLabel: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginTop: 24, marginBottom: 10 },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16, lineHeight: 19 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 40, height: 40 },
  avatarText: { color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: 14 },
  name: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  rowError: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.error, marginTop: 2 },

  inviteBtn: {
    backgroundColor: Dayxo.purple, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 16,
    minWidth: 74, alignItems: 'center',
  },
  inviteBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  sentTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sentText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Dayxo.green },
});
