import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota } from '../../types';
import { useKeyboardHeight } from '../../hooks/useKeyboardHeight';

interface Props {
  nota: Nota | null;
  onClose: () => void;
  onSave: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
}

// Ver / editar una nota guardada. Se abre al tocar una nota del historial.
export function NotaViewModal({ nota, onClose, onSave, onRemove }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const kbHeight = useKeyboardHeight();
  const [titulo, setTitulo] = useState('');
  const [cuerpo, setCuerpo] = useState('');

  useEffect(() => {
    if (nota) { setTitulo(nota.titulo); setCuerpo(nota.cuerpo); }
  }, [nota]);

  const hasText = (titulo + cuerpo).trim().length > 0;
  const dirty = !!nota && (titulo.trim() !== nota.titulo.trim() || cuerpo.trim() !== nota.cuerpo.trim());

  const handleGuardar = async () => {
    if (!nota || !hasText) return;
    if (dirty) await onSave(nota.id, titulo.trim(), cuerpo.trim());
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
  };

  const handleBorrar = () => {
    if (!nota) return;
    Alert.alert(
      'Borrar nota',
      '¿Seguro que querés borrar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: async () => { await onRemove(nota.id); onClose(); } },
      ],
    );
  };

  return (
    <Modal visible={!!nota} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={styles.header}>
          <View style={styles.headerSide} />
          <View style={styles.titleWrap}>
            <Text style={styles.title}>Nota</Text>
            {!!nota && (
              <Text style={styles.subtitle}>
                {format(new Date(nota.fechaEdicion), "d 'de' MMMM · HH:mm", { locale: es })}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <TextInput
            style={styles.tituloInput}
            placeholder="Título"
            placeholderTextColor={colors.textTertiary}
            value={titulo}
            onChangeText={setTitulo}
            returnKeyType="next"
            maxLength={120}
          />
          <View style={styles.pad}>
            <TextInput
              style={styles.input}
              placeholder="Escribí algo..."
              placeholderTextColor={colors.textSecondary}
              value={cuerpo}
              onChangeText={setCuerpo}
              multiline
              textAlignVertical="top"
              selectionColor={Dayxo.orange}
            />
          </View>
        </View>

        <View style={[
          styles.footer,
          { marginBottom: kbHeight, paddingBottom: kbHeight > 0 ? 10 : Math.max(insets.bottom, 10) },
        ]}>
          <TouchableOpacity onPress={handleBorrar} style={styles.btnBorrar} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={Dayxo.coral} />
            <Text style={styles.btnBorrarText}>Borrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGuardar}
            disabled={!hasText}
            style={[styles.btnGuardarWrap, !hasText && styles.btnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[Dayxo.orange, Dayxo.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.btnGuardar}
            >
              <Text style={styles.btnGuardarText}>{dirty ? 'Guardar cambios' : 'Listo'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.card },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerSide: { width: 28, alignItems: 'flex-end', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center', gap: 1 },
  title: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, textAlign: 'center' },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  tituloInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10,
    fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary,
  },
  pad: {
    flex: 1, borderRadius: 12, padding: 14,
    backgroundColor: colors.inputBg,
    borderWidth: 1, borderColor: colors.border,
  },
  input: {
    flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular',
    color: colors.textPrimary, lineHeight: 24,
  },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  btnDisabled: { opacity: 0.5 },
  btnBorrar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 12, paddingVertical: 15, paddingHorizontal: 22,
    backgroundColor: colors.grayVeryLight,
  },
  btnBorrarText: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: Dayxo.coral },
  btnGuardarWrap: { flex: 1, borderRadius: 12, overflow: 'hidden' },
  btnGuardar: { paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  btnGuardarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
