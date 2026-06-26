import React, { useMemo, useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { AppText as Text } from '../shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota } from '../../types';
import { EmptyState } from '../shared/EmptyState';
import { SwipeableRow } from '../shared/SwipeableRow';
import { NotaViewModal } from './NotaViewModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  notas: Nota[];
  onUpdate: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

// Historial de notas guardadas desde el Anotador. Tocá una para verla/editarla;
// deslizá para fijar (derecha) o borrar (izquierda).
export function NotasHistoryModal({ visible, onClose, notas, onUpdate, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openNota, setOpenNota] = useState<Nota | null>(null);
  const [query, setQuery] = useState('');

  const ordered = useMemo(
    () => [...notas].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.fechaEdicion) - +new Date(a.fechaEdicion);
    }),
    [notas]
  );

  // Filtra por coincidencia en título o cuerpo (sin distinguir mayúsculas).
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ordered;
    return ordered.filter((n) => `${n.titulo} ${n.cuerpo}`.toLowerCase().includes(q));
  }, [ordered, query]);

  // Mantiene la nota abierta sincronizada con el store (al guardar cambios).
  const activeNota = openNota ? notas.find((n) => n.id === openNota.id) ?? null : null;

  const confirmRemove = (nota: Nota) => {
    Alert.alert(
      'Borrar nota',
      '¿Seguro que querés borrar esta nota?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => onRemove(nota.id) },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>

        <View style={styles.header}>
          <View style={styles.headerSide} />
          <View style={styles.titleWrap}>
            <LinearGradient
              colors={[Dayxo.orange, Dayxo.purple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.titlePill}
            >
              <Text style={styles.title}>Notas guardadas</Text>
            </LinearGradient>
            <Text style={styles.sub}>
              {notas.length} {notas.length === 1 ? 'nota guardada' : 'notas guardadas'}
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.headerSide} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {ordered.length === 0 ? (
          <EmptyState icon="document-text-outline" text="Todavía no guardaste ninguna nota" />
        ) : (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={18} color={colors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar en notas..."
                placeholderTextColor={colors.textSecondary}
                value={query}
                onChangeText={setQuery}
                selectionColor={Dayxo.orange}
                returnKeyType="search"
              />
              {query.length > 0 && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {filtered.length === 0 ? (
              <EmptyState icon="search-outline" text="Ninguna nota coincide con tu búsqueda" />
            ) : (
          <ScrollView
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {filtered.map((nota) => (
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
                  {nota.pinned && (
                    <Ionicons name="pin" size={14} color={Dayxo.orange} style={styles.pinIcon} />
                  )}
                  {!!nota.titulo && (
                    <Text style={styles.cardTitle} numberOfLines={1}>{nota.titulo}</Text>
                  )}
                  {!!nota.cuerpo && (
                    <Text style={styles.cardBody} numberOfLines={nota.titulo ? 2 : 3}>{nota.cuerpo}</Text>
                  )}
                  {!nota.titulo && !nota.cuerpo && (
                    <Text style={styles.cardBody}>Nota vacía</Text>
                  )}
                  <Text style={styles.cardDate}>
                    {format(new Date(nota.fechaEdicion), "d 'de' MMM · HH:mm", { locale: es })}
                  </Text>
                </TouchableOpacity>
              </SwipeableRow>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
            )}
          </>
        )}

          <NotaViewModal
            nota={activeNota}
            onClose={() => setOpenNota(null)}
            onSave={onUpdate}
            onRemove={onRemove}
          />
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
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 14,
  },
  headerSide: { width: 28, alignItems: 'flex-end', justifyContent: 'center' },
  titleWrap: { flex: 1, alignItems: 'center' },
  titlePill: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 15, overflow: 'hidden',
  },
  title: { fontSize: 21, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 5, textAlign: 'center' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 14, marginTop: 2, marginBottom: 10,
    backgroundColor: colors.inputBg, borderRadius: 12,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary, padding: 0 },

  body: { padding: 14 },
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
