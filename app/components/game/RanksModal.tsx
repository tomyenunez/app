import React, { useMemo } from 'react';
import { Modal, StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { RanksView } from './RanksView';

interface Props {
  visible: boolean;
  onClose: () => void;
}

// Sheet de Rangos: se abre tocando la gema en la barra de nivel de Stats.
// Muestra el rango actual y la escalera completa con el arte en grande.
export function RanksModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.handleWrap}><View style={styles.handle} /></View>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
          <RanksView />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 10 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  body: { padding: 16, paddingBottom: 32 },
});
