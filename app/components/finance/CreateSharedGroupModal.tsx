import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { ModalHeader } from '../shared/ModalHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useGame } from '../../context/GameContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { SharedMember } from '../../types';
import { GROUP_COVER_GRADIENTS } from '../groups/types';
import { initials } from '../../utils/formatters';
import { useTapGuard } from '../../hooks/useTapGuard';
import { useFriends } from '../../hooks/useFriends';

export const AVATAR_COLORS = [Dayxo.orange, Dayxo.purple, Dayxo.green, Dayxo.blue, Dayxo.pink, Dayxo.coral, Dayxo.habitos, Dayxo.yellow];
const GROUP_EMOJIS = ['🍖', '🍕', '🍻', '🏖️', '✈️', '🏠', '🎉', '⚽', '🎬', '🛒', '🚗', '🎂'];

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreate: (data: { nombre: string; emoji: string; gradient: [string, string]; members: SharedMember[] }) => void;
}

export function CreateSharedGroupModal({ visible, onClose, onCreate }: Props) {
  const { colors } = useTheme();
  const { profile } = useGame();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [nombre, setNombre] = useState('');
  const [emoji, setEmoji] = useState(GROUP_EMOJIS[0]);
  const [gradIdx, setGradIdx] = useState(0);
  const [nuevoMiembro, setNuevoMiembro] = useState('');
  const [otros, setOtros] = useState<string[]>([]); // nombres de los demás integrantes
  const { friends } = useFriends(visible); // amigos de Dayxo, seleccionables como integrantes
  const [friendSel, setFriendSel] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!visible) return;
    setNombre(''); setEmoji(GROUP_EMOJIS[0]); setGradIdx(0); setNuevoMiembro(''); setOtros([]);
    setFriendSel({});
  }, [visible]);

  const yo = profile.username || 'Vos';

  const agregarMiembro = () => {
    const n = nuevoMiembro.trim();
    if (!n) return;
    setOtros((prev) => [...prev, n]);
    setNuevoMiembro('');
  };

  const canCreate = nombre.trim().length > 0;

  const handleCreate = useTapGuard(() => {
    if (!canCreate) return;
    const elegidos = friends.filter((f) => friendSel[f.user.id]);
    const members: SharedMember[] = [
      { id: 'you', nombre: yo, color: AVATAR_COLORS[0], isYou: true },
      // Amigos de Dayxo elegidos (guardamos su userId para cuando el backend
      // de gastos compartidos sincronice entre cuentas)
      ...elegidos.map((f, i) => ({
        id: `f${i}`, nombre: f.user.username, color: f.user.avatarColor, userId: f.user.id,
      })),
      ...otros.map((n, i) => ({
        id: `m${i}`, nombre: n, color: AVATAR_COLORS[(i + 1 + elegidos.length) % AVATAR_COLORS.length],
      })),
    ];
    onCreate({ nombre: nombre.trim(), emoji, gradient: GROUP_COVER_GRADIENTS[gradIdx], members });
    onClose();
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <ModalHeader title="Nuevo grupo" subtitle="Gastos compartidos" onClose={onClose} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {/* Preview de portada */}
            <LinearGradient colors={GROUP_COVER_GRADIENTS[gradIdx]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.preview}>
              <Text style={styles.previewEmoji}>{emoji}</Text>
              <Text style={styles.previewName} numberOfLines={1}>{nombre.trim() || 'Nombre del grupo'}</Text>
            </LinearGradient>

            <Text style={styles.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Asado, Viaje a la costa, Depto..."
              placeholderTextColor={colors.textSecondary}
              value={nombre}
              onChangeText={setNombre}
              maxLength={40}
              returnKeyType="done"
            />

            <Text style={[styles.label, { marginTop: 18 }]}>ÍCONO</Text>
            <View style={styles.emojiWrap}>
              {GROUP_EMOJIS.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[styles.emojiBtn, emoji === e && { borderColor: Dayxo.blue, backgroundColor: Dayxo.blue + '14' }]}
                  onPress={() => { Keyboard.dismiss(); setEmoji(e); }}
                >
                  <Text style={styles.emojiTxt}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>PORTADA</Text>
            <View style={styles.gradWrap}>
              {GROUP_COVER_GRADIENTS.map((g, i) => (
                <TouchableOpacity key={i} onPress={() => { Keyboard.dismiss(); setGradIdx(i); }} activeOpacity={0.8}>
                  <LinearGradient colors={g} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.gradDot, gradIdx === i && styles.gradDotSel]} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: 18 }]}>INTEGRANTES</Text>
            <View style={styles.memberRow}>
              <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[0] }]}><Text style={styles.avatarTxt}>{initials(yo)}</Text></View>
              <Text style={styles.memberName}>{yo}</Text>
              <Text style={styles.youTag}>Vos</Text>
            </View>
            {otros.map((n, i) => (
              <View key={i} style={styles.memberRow}>
                <View style={[styles.avatar, { backgroundColor: AVATAR_COLORS[(i + 1) % AVATAR_COLORS.length] }]}><Text style={styles.avatarTxt}>{initials(n)}</Text></View>
                <Text style={styles.memberName}>{n}</Text>
                <TouchableOpacity onPress={() => setOtros((prev) => prev.filter((_, idx) => idx !== i))} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.addMemberRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Agregar integrante..."
                placeholderTextColor={colors.textSecondary}
                value={nuevoMiembro}
                onChangeText={setNuevoMiembro}
                onSubmitEditing={agregarMiembro}
                returnKeyType="done"
                maxLength={30}
              />
              <TouchableOpacity style={[styles.addMemberBtn, !nuevoMiembro.trim() && { opacity: 0.4 }]} onPress={agregarMiembro} disabled={!nuevoMiembro.trim()}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Amigos de Dayxo — se suman como integrantes con un toque */}
            {friends.length > 0 && (
              <>
                <Text style={[styles.label, { marginTop: 18 }]}>O SUMÁ AMIGOS DE DAYXO</Text>
                {friends.map((f) => {
                  const on = !!friendSel[f.user.id];
                  return (
                    <TouchableOpacity
                      key={f.user.id}
                      style={styles.memberRow}
                      onPress={() => setFriendSel((prev) => ({ ...prev, [f.user.id]: !prev[f.user.id] }))}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.avatar, { backgroundColor: f.user.avatarColor }]}>
                        <Text style={styles.avatarTxt}>{initials(f.user.username)}</Text>
                      </View>
                      <Text style={styles.memberName}>{f.user.username}</Text>
                      <Ionicons
                        name={on ? 'checkmark-circle' : 'ellipse-outline'}
                        size={22}
                        color={on ? Dayxo.blue : colors.border}
                      />
                    </TouchableOpacity>
                  );
                })}
              </>
            )}
          </ScrollView>

          {/* Footer fijo: el botón no queda tapado por el teclado ni escondido al final del scroll */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleCreate} style={[styles.submit, !canCreate && { opacity: 0.5 }]} disabled={!canCreate}>
              <Text style={styles.submitTxt}>Crear grupo</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 18, paddingBottom: 14 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 40 },

  preview: { borderRadius: 18, paddingVertical: 22, alignItems: 'center', marginBottom: 18 },
  previewEmoji: { fontSize: 40 },
  previewName: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: '#fff', marginTop: 8 },

  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },

  emojiWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  emojiBtn: {
    width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.inputBg, borderWidth: 1.5, borderColor: colors.border,
  },
  emojiTxt: { fontSize: 22 },

  gradWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gradDot: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'transparent' },
  gradDotSel: { borderColor: colors.textPrimary },

  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarTxt: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  memberName: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  youTag: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Dayxo.blue, backgroundColor: Dayxo.blue + '18', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },

  addMemberRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  addMemberBtn: { width: 46, height: 46, borderRadius: 12, backgroundColor: Dayxo.blue, alignItems: 'center', justifyContent: 'center' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textTertiary, marginTop: 10 },

  footer: {
    paddingHorizontal: 16, paddingTop: 10, paddingBottom: 20,
    borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card,
  },
  submit: { backgroundColor: Dayxo.blue, borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  submitTxt: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
