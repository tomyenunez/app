import React, { useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { Nota, NotaDraft } from '../../types';
import { AnotadorModal } from './AnotadorModal';

interface Props {
  notas: Nota[];
  draft: NotaDraft;
  setDraft: (patch: Partial<NotaDraft>) => void;
  saveDraft: () => Promise<void> | void;
  clearDraft: () => Promise<void> | void;
  onUpdate: (id: string, titulo: string, cuerpo: string) => Promise<void> | void;
  onRemove: (id: string) => Promise<void> | void;
  onTogglePin: (id: string) => Promise<void> | void;
  size: number; // lado del cuadrado (perfecto), para ir al lado del Score
}

// Notas como ícono cuadrado (estilo app iOS): solo la hoja con lápiz, centrada y
// grande. Al tocar, abre el Anotador (escribís arriba; abajo están todas tus notas).
export function QuickNotesCard({
  notas, draft, setDraft, saveDraft, onUpdate, onRemove, onTogglePin, size,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [anotadorVisible, setAnotadorVisible] = useState(false);

  // Hoja centrada + lápiz tirado en diagonal arriba a la derecha
  const sheetSize = Math.round(size * 0.52);
  const pencilSize = Math.round(size * 0.34);
  const pencilOffset = -Math.round(pencilSize * 0.22);

  return (
    <View style={{ width: size, height: size }}>
      <Pressable
        onPress={() => setAnotadorVisible(true)}
        style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}
      >
        <LinearGradient colors={[Dayxo.orange, Dayxo.pink]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.tile}>
          <View style={{ width: sheetSize, height: sheetSize, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={sheetSize} color="#fff" />
            <Ionicons
              name="pencil"
              size={pencilSize}
              color="#fff"
              style={{ position: 'absolute', top: pencilOffset, right: pencilOffset }}
            />
          </View>
        </LinearGradient>
      </Pressable>

      <AnotadorModal
        visible={anotadorVisible}
        onClose={() => setAnotadorVisible(false)}
        draft={draft}
        onChangeDraft={setDraft}
        onGuardar={saveDraft}
        notas={notas}
        onUpdate={onUpdate}
        onRemove={onRemove}
        onTogglePin={onTogglePin}
      />
    </View>
  );
}

const createStyles = (_colors: AppColors) => StyleSheet.create({
  tile: {
    flex: 1, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Dayxo.pink, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 3,
  },
});
