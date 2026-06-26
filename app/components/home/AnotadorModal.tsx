import React, { useMemo, useEffect, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, Platform, Alert, Keyboard } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';

interface Props {
  visible: boolean;
  onClose: () => void;
  draft: string;
  onChangeDraft: (text: string) => void;
  onGuardar: () => Promise<void> | void; // archiva el borrador en el historial
  onBorrar: () => Promise<void> | void;  // descarta el borrador (sin guardar)
}

// Anotador: scratchpad de texto suelto. "Guardar" lo archiva en el historial,
// "Borrar" lo descarta. El texto persiste solo (draft) al cerrar con la X.
export function AnotadorModal({ visible, onClose, draft, onChangeDraft, onGuardar, onBorrar }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  // KeyboardAvoidingView no empuja bien dentro de un Modal pageSheet en iOS, así
  // que seguimos la altura del teclado a mano y subimos el footer por encima.
  const [kbHeight, setKbHeight] = useState(0);
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const s = Keyboard.addListener(showEvt, (e) => setKbHeight(e.endCoordinates.height));
    const h = Keyboard.addListener(hideEvt, () => setKbHeight(0));
    return () => { s.remove(); h.remove(); };
  }, []);

  const hasText = draft.trim().length > 0;

  const handleGuardar = async () => {
    if (!hasText) return;
    await onGuardar();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleBorrar = () => {
    if (!hasText) return;
    Alert.alert(
      'Borrar lo escrito',
      '¿Querés borrar el texto del anotador? No se guardará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => onBorrar() },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={styles.header}>
          <View style={styles.titleWrap}>
            <View style={styles.iconWrap}>
              <Ionicons name="document-text" size={20} color={Dayxo.yellow} />
            </View>
            <View>
              <Text style={styles.title}>Anotador</Text>
              <Text style={styles.sub}>Notas rápidas</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <View style={styles.pad}>
            <TextInput
              style={styles.input}
              placeholder="Escribí algo..."
              placeholderTextColor={colors.textTertiary}
              value={draft}
              onChangeText={onChangeDraft}
              multiline
              textAlignVertical="top"
              selectionColor={Dayxo.orange}
              autoFocus={!draft}
            />
          </View>
        </View>

        <View style={[
          styles.footer,
          { marginBottom: kbHeight, paddingBottom: kbHeight > 0 ? 12 : Math.max(insets.bottom, 12) },
        ]}>
          <TouchableOpacity
            onPress={handleBorrar}
            disabled={!hasText}
            style={[styles.btn, styles.btnBorrar, !hasText && styles.btnDisabled]}
            activeOpacity={0.8}
          >
            <Ionicons name="trash-outline" size={18} color={hasText ? Dayxo.coral : colors.textTertiary} />
            <Text style={[styles.btnBorrarText, !hasText && { color: colors.textTertiary }]}>Borrar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleGuardar}
            disabled={!hasText}
            style={[styles.btn, styles.btnGuardar, !hasText && styles.btnDisabled]}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={19} color="#fff" />
            <Text style={styles.btnGuardarText}>Guardar</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: colors.yellowLight, alignItems: 'center', justifyContent: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.grayVeryLight, alignItems: 'center', justifyContent: 'center',
  },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  pad: {
    flex: 1, borderRadius: 16, padding: 14,
    backgroundColor: colors.bg,
    borderWidth: 1.5, borderColor: Dayxo.orange,
  },
  input: {
    flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular',
    color: colors.textPrimary, lineHeight: 24,
  },

  footer: {
    flexDirection: 'row', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    borderRadius: 14, paddingVertical: 14,
  },
  btnDisabled: { opacity: 0.45 },
  btnBorrar: {
    paddingHorizontal: 20,
    backgroundColor: colors.card,
    borderWidth: 1.5, borderColor: colors.border,
  },
  btnBorrarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: Dayxo.coral },
  btnGuardar: { flex: 1, backgroundColor: Dayxo.orange },
  btnGuardarText: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff' },
});
