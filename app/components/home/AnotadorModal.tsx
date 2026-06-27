import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota, NotaDraft } from '../../types';
import { SwipeableRow } from '../shared/SwipeableRow';
import { NotaViewModal } from './NotaViewModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  draft: NotaDraft;
  onChangeDraft: (patch: Partial<NotaDraft>) => void;
  onGuardar: () => Promise<void> | void; // archiva el borrador en el historial
  notas: Nota[];
  onUpdate: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

// Anotador estilo Apple Notes: escribís arriba (título + texto chico) y debajo
// están TODAS tus notas (deslizás para abajo para verlas). Sin botones de
// guardar/borrar: al cerrar, lo escrito se archiva solo en el historial.
export function AnotadorModal({
  visible, onClose, draft, onChangeDraft, onGuardar, notas, onUpdate, onRemove, onTogglePin,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openNota, setOpenNota] = useState<Nota | null>(null);
  const tituloRef = useRef<TextInput>(null);
  const bodyRef = useRef<TextInput>(null);

  // Al abrir, foco directo en el título (teclado arriba, listo para escribir).
  // Un pequeño delay para que el sheet termine de aparecer.
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => tituloRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [visible]);

  const hasText = (draft.titulo + draft.cuerpo).trim().length > 0;

  const ordered = useMemo(
    () => [...notas].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.fechaEdicion) - +new Date(a.fechaEdicion);
    }),
    [notas]
  );
  const activeNota = openNota ? notas.find((n) => n.id === openNota.id) ?? null : null;

  // Al cerrar, archiva el borrador (si tiene texto) y lo limpia.
  const handleClose = async () => {
    if (hasText) await onGuardar();
    onClose();
  };

  const confirmRemove = (nota: Nota) => {
    Alert.alert('Borrar nota', '¿Seguro que querés borrar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Borrar', style: 'destructive', onPress: () => onRemove(nota.id) },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

          <View style={styles.header}>
            <View style={styles.headerSide} />
            <View style={styles.titleWrap}>
              <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.titlePill}>
                <Text style={styles.title}>Anotador</Text>
              </LinearGradient>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Scratchpad: título + texto chico */}
            <View style={styles.newLabel}>
              <Ionicons name="create-outline" size={14} color={colors.textPrimary} />
              <Text style={styles.newLabelText}>Nueva nota rápida</Text>
            </View>
            <TextInput
              ref={tituloRef}
              style={styles.tituloInput}
              placeholder="Título"
              placeholderTextColor={colors.textTertiary}
              value={draft.titulo}
              onChangeText={(t) => onChangeDraft({ titulo: t })}
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => bodyRef.current?.focus()}
              maxLength={120}
            />
            <TextInput
              ref={bodyRef}
              style={styles.bodyInput}
              placeholder="Escribí algo..."
              placeholderTextColor={colors.textSecondary}
              value={draft.cuerpo}
              onChangeText={(t) => onChangeDraft({ cuerpo: t })}
              multiline
              textAlignVertical="top"
              selectionColor={Dayxo.orange}
            />

            {/* Todas las notas */}
            <Text style={styles.allLabel}>TODAS LAS NOTAS ({notas.length})</Text>
            {ordered.length === 0 ? (
              <Text style={styles.empty}>Todavía no tenés notas. Escribí arriba y al cerrar se guarda acá.</Text>
            ) : (
              ordered.map((nota) => (
                <SwipeableRow
                  key={nota.id}
                  pinned={nota.pinned}
                  pinColor={Dayxo.orange}
                  containerStyle={styles.cardSpacing}
                  onPin={() => onTogglePin(nota.id)}
                  onDelete={() => confirmRemove(nota)}
                >
                  <TouchableOpacity
                    style={[styles.card, nota.pinned && styles.cardPinned]}
                    activeOpacity={0.7}
                    onPress={() => setOpenNota(nota)}
                  >
                    {nota.pinned && <Ionicons name="pin" size={14} color={Dayxo.orange} style={styles.pinIcon} />}
                    {!!nota.titulo && <Text style={styles.cardTitle} numberOfLines={1}>{nota.titulo}</Text>}
                    {!!nota.cuerpo && <Text style={styles.cardBody} numberOfLines={nota.titulo ? 2 : 3}>{nota.cuerpo}</Text>}
                    {!nota.titulo && !nota.cuerpo && <Text style={styles.cardBody}>Nota vacía</Text>}
                    <Text style={styles.cardDate}>{format(new Date(nota.fechaEdicion), "d 'de' MMM · HH:mm", { locale: es })}</Text>
                  </TouchableOpacity>
                </SwipeableRow>
              ))
            )}
            <View style={{ height: 24 }} />
          </ScrollView>

          <NotaViewModal nota={activeNota} onClose={() => setOpenNota(null)} onSave={onUpdate} onRemove={onRemove} />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 12,
  },
  headerSide: { width: 28, alignItems: 'flex-end', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  titlePill: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 16, overflow: 'hidden' },
  title: { fontSize: 23, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center' },

  body: { paddingHorizontal: 14, paddingTop: 8 },
  newLabel: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8, marginLeft: 2 },
  newLabelText: { fontSize: 12.5, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  tituloInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 13, marginBottom: 10,
    fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary,
  },
  // Cuerpo chico, para que se vean las primeras notas abajo
  bodyInput: {
    backgroundColor: colors.inputBg,
    borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 92, maxHeight: 132,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, lineHeight: 22,
  },

  allLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginTop: 20, marginBottom: 10, marginLeft: 2,
  },
  empty: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 19, paddingVertical: 6 },

  cardSpacing: { marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: Dayxo.orange,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardPinned: { borderWidth: 1.5, borderColor: Dayxo.orange, borderLeftWidth: 3 },
  pinIcon: { position: 'absolute', top: 12, right: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 3, paddingRight: 18 },
  cardBody: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 20 },
  cardDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary, marginTop: 8 },
});
