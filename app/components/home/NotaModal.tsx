import React, { useState, useMemo, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota } from '../../types';

interface Props {
  visible: boolean;
  onClose: () => void;
  onAdd: (titulo: string, cuerpo: string) => Promise<void> | void;
  editing?: Nota | null;
  onSave?: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
}

export function NotaModal({ visible, onClose, onAdd, editing, onSave }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  useEffect(() => {
    if (visible) {
      setTitulo(editing?.titulo ?? '');
      setCuerpo(editing?.cuerpo ?? '');
    }
  }, [visible, editing]);

  // Se puede guardar si hay al menos título o cuerpo
  const canSave = titulo.trim().length > 0 || cuerpo.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSave) return;
    const t = titulo.trim();
    const c = cuerpo.trim();
    if (editing && onSave) {
      await onSave(editing.id, t, c);
    } else {
      await onAdd(t, c);
    }
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.header}>
            <Text style={styles.title}>{editing ? 'Editar nota' : 'Nueva nota'}</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={!canSave}
                style={[styles.doneBtn, !canSave && { opacity: 0.4 }]}
              >
                <Text style={styles.doneText}>Listo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.tituloInput}
              placeholder="Título"
              placeholderTextColor={colors.textTertiary}
              value={titulo}
              onChangeText={setTitulo}
              returnKeyType="next"
              autoFocus={!editing}
              maxLength={120}
            />
            <TextInput
              style={styles.cuerpoInput}
              placeholder="Escribí lo que quieras..."
              placeholderTextColor={colors.textTertiary}
              value={cuerpo}
              onChangeText={setCuerpo}
              multiline
              textAlignVertical="top"
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  doneBtn: { backgroundColor: Dayxo.purple, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  doneText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
  body: { padding: 16, flexGrow: 1 },
  tituloInput: {
    fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  cuerpoInput: {
    marginTop: 14, fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary,
    lineHeight: 23, minHeight: 220,
  },
});
