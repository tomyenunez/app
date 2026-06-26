import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota } from '../../types';
import { AnotadorModal } from './AnotadorModal';
import { NotasHistoryModal } from './NotasHistoryModal';

interface Props {
  notas: Nota[];
  draft: string;
  setDraft: (text: string) => void;
  saveDraft: () => Promise<void> | void;
  clearDraft: () => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

// Tarjeta de "Notas rápidas" en el Home: abre el Anotador (scratchpad) y da
// acceso al historial de notas guardadas.
export function QuickNotesCard({ notas, draft, setDraft, saveDraft, clearDraft, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [anotadorVisible, setAnotadorVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  const hasDraft = draft.trim().length > 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Pressable style={styles.main} onPress={() => setAnotadorVisible(true)}>
          <View style={styles.iconWrap}>
            <Ionicons name="document-text" size={18} color={Dayxo.yellow} />
          </View>
          <View style={styles.texts}>
            <Text style={styles.title}>Notas rápidas</Text>
            <Text style={styles.sub} numberOfLines={1}>
              {hasDraft ? 'Tenés algo sin guardar · tocá para abrir' : 'Toca para abrir'}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.historyBtn}
            onPress={() => setHistoryVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="time-outline" size={18} color={colors.textSecondary} />
            {notas.length > 0 && <Text style={styles.historyCount}>{notas.length}</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setAnotadorVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <AnotadorModal
        visible={anotadorVisible}
        onClose={() => setAnotadorVisible(false)}
        draft={draft}
        onChangeDraft={setDraft}
        onGuardar={saveDraft}
        onBorrar={clearDraft}
      />

      <NotasHistoryModal
        visible={historyVisible}
        onClose={() => setHistoryVisible(false)}
        notas={notas}
        onRemove={onRemove}
        onTogglePin={onTogglePin}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginTop: 14, marginHorizontal: 14 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 14,
    paddingVertical: 9, paddingHorizontal: 12,
    borderWidth: 1, borderColor: 'rgba(255,107,0,0.4)',
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: colors.yellowLight, alignItems: 'center', justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: { fontSize: 15, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  historyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10,
    backgroundColor: colors.grayVeryLight,
  },
  historyCount: { fontSize: 12, fontFamily: 'Inter_700Bold', color: colors.textSecondary },
});
