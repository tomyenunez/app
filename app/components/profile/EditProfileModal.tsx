import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { initials } from '../../utils/formatters';
import { pickAndUploadAvatar } from '../../services/avatarUpload';
import { ModalHeader } from '../shared/ModalHeader';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Pop-up de perfil: editar SOLO la foto y el nombre de la cuenta.
// (Los rangos se ven tocando la gema en la barra de nivel de Stats.)
export function EditProfileModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { profile, setProfile } = useGame();
  const { user } = useAuth();
  const [name, setName] = useState(profile.username);
  const [uploading, setUploading] = useState(false);

  // Al abrir, arranca con el nombre guardado
  useEffect(() => { if (visible) setName(profile.username); }, [visible]);

  const saveName = () => {
    const next = name.trim() || profile.username;
    if (next !== profile.username) setProfile({ ...profile, username: next });
  };

  const close = () => { saveName(); onClose(); };

  const handlePickPhoto = async () => {
    if (!user?.id || uploading) return;
    try {
      setUploading(true);
      const url = await pickAndUploadAvatar(user.id);
      if (url) setProfile({ ...profile, avatarUrl: url });
    } catch (e: any) {
      Alert.alert(
        'No se pudo cambiar la foto',
        e?.message === 'sin-permiso'
          ? 'Necesitamos permiso para acceder a tus fotos. Activalo en los ajustes del teléfono.'
          : 'Algo salió mal subiendo la foto. Probá de nuevo.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = () => setProfile({ ...profile, avatarUrl: undefined });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <ModalHeader title="Mi perfil" onClose={close} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          {/* Avatar — tocar para cambiar la foto */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handlePickPhoto}
            style={[styles.avatar, { backgroundColor: profile.avatarColor }]}
          >
            {profile.avatarUrl
              ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
              : <Text style={styles.avatarText}>{initials(name.trim() || profile.username)}</Text>}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={15} color="#fff" />
            </View>
            {uploading && (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          {profile.avatarUrl && !uploading && (
            <TouchableOpacity onPress={handleRemovePhoto} style={styles.removePhotoBtn}>
              <Text style={styles.removePhotoText}>Quitar foto</Text>
            </TouchableOpacity>
          )}

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

        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 32 },
  avatar: {
    width: 88, height: 88, borderRadius: 44, alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center', marginTop: 6, marginBottom: 18,
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarText: { fontSize: 32, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  cameraBadge: {
    position: 'absolute', bottom: 2, right: 2,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.violet,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.bg,
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 44, backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'center',
  },
  removePhotoBtn: { alignSelf: 'center', marginTop: -10, marginBottom: 14, padding: 6 },
  removePhotoText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.error },
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginBottom: 8, marginTop: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary,
  },
});
