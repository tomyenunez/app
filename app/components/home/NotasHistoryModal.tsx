import React, { useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
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

interface Props {
  visible: boolean;
  onClose: () => void;
  notas: Nota[];
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

// Historial de notas guardadas desde el Anotador. Fijadas arriba; deslizar para
// fijar (derecha) o borrar (izquierda).
export function NotasHistoryModal({ visible, onClose, notas, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const ordered = useMemo(
    () => [...notas].sort((a, b) => {
      if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1;
      return +new Date(b.fechaEdicion) - +new Date(a.fechaEdicion);
    }),
    [notas]
  );

  const confirmRemove = (nota: Nota) => {
    Alert.alert(
      'Borrar nota',
      `¿Seguro que querés borrar${nota.titulo ? ` "${nota.titulo}"` : ' esta nota'}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => onRemove(nota.id) },
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
              <Text style={styles.title}>Notas guardadas</Text>
              <Text style={styles.sub}>
                {notas.length} {notas.length === 1 ? 'nota guardada' : 'notas guardadas'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {ordered.length === 0 ? (
          <EmptyState icon="document-text-outline" text="Todavía no guardaste ninguna nota" />
        ) : (
          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {ordered.map((nota) => (
              <SwipeableRow
                key={nota.id}
                pinned={nota.pinned}
                pinColor={Dayxo.orange}
                containerStyle={styles.cardSpacing}
                onPin={() => onTogglePin(nota.id)}
                onDelete={() => confirmRemove(nota)}
              >
                <View style={[styles.card, nota.pinned && styles.cardPinned]}>
                  {!!nota.titulo && (
                    <View style={styles.titleRow}>
                      {nota.pinned && <Ionicons name="pin" size={13} color={Dayxo.orange} style={styles.pinIcon} />}
                      <Text style={styles.cardTitle} numberOfLines={1}>{nota.titulo}</Text>
                    </View>
                  )}
                  {!!nota.cuerpo && (
                    <Text style={styles.cardBody} numberOfLines={4}>{nota.cuerpo}</Text>
                  )}
                  <Text style={styles.cardDate}>
                    {format(new Date(nota.fechaEdicion), "d 'de' MMM · HH:mm", { locale: es })}
                  </Text>
                </View>
              </SwipeableRow>
            ))}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 6, backgroundColor: colors.card },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    backgroundColor: colors.card,
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

  body: { padding: 14 },
  cardSpacing: { marginBottom: 8 },
  card: {
    backgroundColor: colors.card, borderRadius: 12, padding: 14,
    borderLeftWidth: 3, borderLeftColor: Dayxo.yellow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardPinned: { borderWidth: 1.5, borderColor: Dayxo.yellow, borderLeftWidth: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pinIcon: { marginRight: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  cardBody: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textPrimary, lineHeight: 20 },
  cardDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary, marginTop: 8 },
});
