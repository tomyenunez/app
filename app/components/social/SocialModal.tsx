import React, { useMemo, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Image, ActivityIndicator, Share, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { initials } from '../../utils/formatters';
import { useFriends } from '../../hooks/useFriends';
import { PublicUser } from '../../services/friends';

function MiniAvatar({ user, size = 44 }: { user: PublicUser; size?: number }) {
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2, overflow: 'hidden',
      backgroundColor: user.avatarColor, alignItems: 'center', justifyContent: 'center',
    }}>
      {user.avatarUrl
        ? <Image source={{ uri: user.avatarUrl }} style={{ width: size, height: size }} />
        : <Text style={{ color: '#fff', fontFamily: 'Inter_800ExtraBold', fontSize: size * 0.36 }}>{initials(user.username)}</Text>}
    </View>
  );
}

export function SocialModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { friends, incoming, outgoing, myCode, loading, find, send, accept, remove } = useFriends(visible);

  const [codeInput, setCodeInput] = useState('');
  const [found, setFound] = useState<PublicUser | null>(null);
  const [searching, setSearching] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; ok: boolean } | null>(null);

  const resetSearch = () => { setCodeInput(''); setFound(null); setFeedback(null); };

  const handleSearch = async () => {
    const c = codeInput.trim();
    if (c.length < 4) { setFeedback({ text: 'Ingresá un código válido.', ok: false }); return; }
    setSearching(true); setFeedback(null); setFound(null);
    const u = await find(c);
    setSearching(false);
    if (!u) { setFeedback({ text: 'No encontramos a nadie con ese código.', ok: false }); return; }
    setFound(u);
  };

  const handleSend = async () => {
    if (!found) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const res = await send(found);
    setFeedback({ text: res.message, ok: res.ok });
    if (res.ok) { setFound(null); setCodeInput(''); }
  };

  const shareCode = () => {
    if (!myCode) return;
    Share.share({ message: `Agregame en Dayxo 👀 Mi código es ${myCode}` }).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <View style={styles.titleWrap}>
              <Ionicons name="people" size={22} color={Dayxo.purple} />
              <Text style={styles.title}>Amigos</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Mi código */}
            <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.codeCard}>
              <Text style={styles.codeLabel}>TU CÓDIGO DE AMIGO</Text>
              <Text style={styles.codeValue}>{myCode ?? '········'}</Text>
              <TouchableOpacity style={styles.shareBtn} onPress={shareCode} disabled={!myCode}>
                <Ionicons name="share-outline" size={16} color={Dayxo.purple} />
                <Text style={styles.shareBtnText}>Compartir mi código</Text>
              </TouchableOpacity>
            </LinearGradient>

            {/* Agregar por código */}
            <Text style={styles.sectionLabel}>AGREGAR AMIGO</Text>
            <View style={styles.addRow}>
              <TextInput
                style={styles.input}
                placeholder="Código del amigo"
                placeholderTextColor={colors.textTertiary}
                value={codeInput}
                onChangeText={(t) => setCodeInput(t.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={12}
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch} disabled={searching}>
                {searching ? <ActivityIndicator color="#fff" /> : <Ionicons name="search" size={20} color="#fff" />}
              </TouchableOpacity>
            </View>

            {found && (
              <View style={styles.foundCard}>
                <MiniAvatar user={found} />
                <Text style={styles.foundName} numberOfLines={1}>{found.username}</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleSend}>
                  <Ionicons name="person-add" size={15} color="#fff" />
                  <Text style={styles.addBtnText}>Agregar</Text>
                </TouchableOpacity>
              </View>
            )}
            {feedback && (
              <Text style={[styles.feedback, { color: feedback.ok ? Dayxo.green : colors.error }]}>{feedback.text}</Text>
            )}

            {/* Solicitudes entrantes */}
            {incoming.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>SOLICITUDES ({incoming.length})</Text>
                {incoming.map((e) => (
                  <View key={e.friendshipId} style={styles.row}>
                    <MiniAvatar user={e.user} />
                    <Text style={styles.rowName} numberOfLines={1}>{e.user.username}</Text>
                    <TouchableOpacity style={[styles.iconCircle, { backgroundColor: Dayxo.green }]} onPress={() => accept(e.friendshipId)}>
                      <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.grayLight }]} onPress={() => remove(e.friendshipId)}>
                      <Ionicons name="close" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            {/* Amigos */}
            <Text style={styles.sectionLabel}>MIS AMIGOS ({friends.length})</Text>
            {loading ? (
              <ActivityIndicator color={Dayxo.purple} style={{ marginTop: 16 }} />
            ) : friends.length === 0 ? (
              <Text style={styles.empty}>Todavía no agregaste amigos. Pasales tu código 👆</Text>
            ) : (
              friends.map((e) => (
                <View key={e.friendshipId} style={styles.row}>
                  <MiniAvatar user={e.user} />
                  <Text style={styles.rowName} numberOfLines={1}>{e.user.username}</Text>
                  <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.grayLight }]} onPress={() => remove(e.friendshipId)}>
                    <Ionicons name="person-remove-outline" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))
            )}

            {/* Solicitudes enviadas (pendientes) */}
            {outgoing.length > 0 && (
              <>
                <Text style={styles.sectionLabel}>ENVIADAS ({outgoing.length})</Text>
                {outgoing.map((e) => (
                  <View key={e.friendshipId} style={styles.row}>
                    <MiniAvatar user={e.user} size={36} />
                    <Text style={[styles.rowName, { color: colors.textSecondary }]} numberOfLines={1}>{e.user.username}</Text>
                    <Text style={styles.pendingTag}>Pendiente</Text>
                    <TouchableOpacity style={[styles.iconCircle, { backgroundColor: colors.grayLight }]} onPress={() => remove(e.friendshipId)}>
                      <Ionicons name="close" size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </>
            )}

            <View style={{ height: 30 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
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

  addRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1, backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
    letterSpacing: 2,
  },
  searchBtn: { width: 50, borderRadius: 10, backgroundColor: Dayxo.purple, alignItems: 'center', justifyContent: 'center' },

  foundCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.border,
  },
  foundName: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Dayxo.purple, borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14,
  },
  addBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  feedback: { fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 10 },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.card, borderRadius: 14, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: colors.border,
  },
  rowName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  iconCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  pendingTag: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textTertiary },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', paddingVertical: 16, lineHeight: 19 },
});
