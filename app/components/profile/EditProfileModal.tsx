import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { initials } from '../../utils/formatters';
import { RanksView } from '../game/RanksView';

const AVATAR_COLORS = ['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#E84393', '#FDCB6E'];

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Pop-up de perfil: editar nombre y color de avatar + ver rango actual y la
// escalera de rangos. Reemplaza a la vieja pantalla "Mi perfil".
export function EditProfileModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, setProfile } = useGame();
  const [name, setName] = useState(profile.username);

  // Al abrir, arranca con el nombre guardado
  useEffect(() => { if (visible) setName(profile.username); }, [visible]);

  const saveName = () => {
    const next = name.trim() || profile.username;
    if (next !== profile.username) setProfile({ ...profile, username: next });
  };

  const close = () => { saveName(); onClose(); };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <View style={styles.header}>
          <Text style={styles.title}>Mi perfil</Text>
          <TouchableOpacity onPress={close}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {/* Avatar */}
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.avatarText}>{initials(name.trim() || profile.username)}</Text>
          </View>

          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            onEndEditing={saveName}
            onSubmitEditing={saveName}
            maxLength={20}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textTertiary}
            returnKeyType="done"
          />

          {/* Color de avatar */}
          <Text style={styles.label}>Color de avatar</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setProfile({ ...profile, avatarColor: c })}
                style={[styles.colorDot, { backgroundColor: c }, profile.avatarColor === c && styles.colorDotSelected]}
              />
            ))}
          </View>

          <View style={styles.divider} />

          {/* Rango actual + escalera de rangos */}
          <RanksView />
        </ScrollView>
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
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  body: { padding: 16, paddingBottom: 32 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 18,
  },
  avatarText: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 8, marginTop: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary,
  },
  colorRow: { flexDirection: 'row', gap: 12, marginBottom: 6, flexWrap: 'wrap' },
  colorDot: { width: 34, height: 34, borderRadius: 17 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 20 },
});
