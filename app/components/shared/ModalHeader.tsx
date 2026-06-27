import React, { useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText as Text } from './AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  title: string;
  subtitle?: string;   // opcional: conteo/descripción debajo del título
  onClose: () => void;
}

// Header estándar de los modales/bottom sheets: título plano centrado (sin la
// "burbuja" con gradiente) y la X flotando a la derecha en absoluto. El handle
// gris de arriba lo dibuja cada modal por separado.
export function ModalHeader({ title, subtitle, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.titleWrap}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {!!subtitle && <Text style={styles.sub} numberOfLines={1}>{subtitle}</Text>}
      </View>
      <TouchableOpacity onPress={onClose} style={styles.close} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="close" size={24} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  header: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 48, // deja aire para que el título no choque con la X
    paddingTop: 8,
    paddingBottom: 12,
  },
  titleWrap: { alignItems: 'center' },
  title: { fontSize: 19, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, letterSpacing: -0.2, textAlign: 'center' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  close: { position: 'absolute', right: 16, top: 6, padding: 2 },
});
