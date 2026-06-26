import React, { useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota, NotaDraft } from '../../types';
import { AnotadorModal } from './AnotadorModal';
import { NotasHistoryModal } from './NotasHistoryModal';

interface Props {
  notas: Nota[];
  draft: NotaDraft;
  setDraft: (patch: Partial<NotaDraft>) => void;
  saveDraft: () => Promise<void> | void;
  clearDraft: () => Promise<void> | void;
  onUpdate: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
}

// Tarjeta de "Notas rápidas" en el Home: abre el Anotador (scratchpad) y da
// acceso al historial de notas guardadas.
export function QuickNotesCard({ notas, draft, setDraft, saveDraft, clearDraft, onUpdate, onRemove, onTogglePin }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [anotadorVisible, setAnotadorVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);

  return (
    <View style={styles.wrap}>
      <LinearGradient
        colors={[Dayxo.orange, Dayxo.purple]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.borderGrad}
      >
        <View style={styles.card}>
          <Pressable style={styles.main} onPress={() => setAnotadorVisible(true)}>
            <LinearGradient
              colors={[Dayxo.orange, Dayxo.pink]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconWrap}
            >
              <Ionicons name="create-outline" size={24} color="#fff" />
            </LinearGradient>
            <View style={styles.texts}>
              <Text style={styles.title}>Notas rápidas</Text>
              <Text style={styles.sub} numberOfLines={2}>
                Captura ideas al instante y tenlas siempre a mano.
              </Text>
            </View>
          </Pressable>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.countPill}
              onPress={() => setHistoryVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="document-text" size={16} color="#fff" />
              <Text style={styles.countText}>{notas.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setAnotadorVisible(true)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

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
        onUpdate={onUpdate}
        onRemove={onRemove}
        onTogglePin={onTogglePin}
      />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginTop: 14, marginHorizontal: 14 },
  borderGrad: { borderRadius: 18, padding: 1.5 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.card, borderRadius: 16.5,
    paddingVertical: 11, paddingHorizontal: 12,
  },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  texts: { flex: 1 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  sub: { fontSize: 12.5, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 17 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  countPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 11, paddingVertical: 8, borderRadius: 12,
    backgroundColor: Dayxo.orange,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.55)',
  },
  countText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
});
