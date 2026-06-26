import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota } from '../../types';
import { NotaModal } from './NotaModal';
import { SwipeableRow } from '../shared/SwipeableRow';

interface Props {
  notas: Nota[];
  onAdd: (titulo: string, cuerpo: string) => Promise<void> | void;
  onUpdate: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

export function NotasSection({ notas, onAdd, onUpdate, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editNota, setEditNota] = useState<Nota | null>(null);

  // Fijadas arriba (orden estable: el resto mantiene su orden)
  const ordered = useMemo(
    () => [...notas].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
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
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleWrap}>
          <Ionicons name="document-text-outline" size={18} color={Dayxo.yellow} />
          <Text style={styles.sectionTitle}>Notas</Text>
        </View>
        <TouchableOpacity style={styles.addPill} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#1A1A1A" />
          <Text style={styles.addPillText}>Nueva nota</Text>
        </TouchableOpacity>
      </View>

      {ordered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyText}>Sin notas — anotá lo que se te ocurra ✦</Text>
        </View>
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
              onPress={() => setEditNota(nota)}
            >
              <View style={styles.cardBody}>
                <View style={styles.titleRow}>
                  {nota.pinned && <Ionicons name="pin" size={13} color={Dayxo.orange} style={styles.pinIcon} />}
                  <Text style={[styles.cardTitle, !nota.titulo && styles.cardTitleEmpty]} numberOfLines={1}>
                    {nota.titulo || 'Sin título'}
                  </Text>
                </View>
                {!!nota.cuerpo && (
                  <Text style={styles.cardPreview} numberOfLines={2}>{nota.cuerpo}</Text>
                )}
                <Text style={styles.cardDate}>{format(new Date(nota.fechaEdicion), "d 'de' MMM", { locale: es })}</Text>
              </View>
            </TouchableOpacity>
          </SwipeableRow>
        ))
      )}

      <NotaModal
        visible={modalVisible || !!editNota}
        onClose={() => { setModalVisible(false); setEditNota(null); }}
        onAdd={onAdd}
        editing={editNota}
        onSave={onUpdate}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: { marginTop: 18, marginHorizontal: 14 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  addPill: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: Dayxo.yellow,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7,
  },
  addPillText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: '#1A1A1A' },
  emptyBox: {
    backgroundColor: colors.card, borderRadius: 12,
    paddingVertical: 22, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed',
  },
  emptyText: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary },
  cardSpacing: { marginBottom: 8 },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.card, borderRadius: 12,
    padding: 14, gap: 8,
    borderLeftWidth: 3, borderLeftColor: Dayxo.yellow,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  cardPinned: { borderWidth: 1.5, borderColor: Dayxo.yellow },
  cardBody: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  pinIcon: { marginRight: 4 },
  cardTitle: { flex: 1, fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  cardTitleEmpty: { color: colors.textSecondary, fontFamily: 'Inter_500Medium' },
  cardPreview: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  cardDate: { fontSize: 11, fontFamily: 'Inter_500Medium', color: colors.textTertiary, marginTop: 6 },
  deleteBtn: { padding: 2 },
});
