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
  onBack?: () => void; // opcional: flecha a la izquierda para volver un nivel
}

// Header estándar de los modales/bottom sheets: título plano centrado (sin la
// "burbuja" con gradiente) y la X flotando a la derecha en absoluto. Si se pasa
// onBack, aparece una flecha a la izquierda (volver un nivel; la X cierra todo).
// El handle gris de arriba lo dibuja cada modal por separado.
export function ModalHeader({ title, subtitle, onClose, onBack }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      {onBack && (
        <TouchableOpacity onPress={onBack} style={styles.back} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      )}
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
  // Mismo tamaño/fuente que el título "Inicio" del Home, para que quede acorde.
  // color: textPrimary → se adapta solo a modo claro y oscuro.
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary, textAlign: 'center' },
  sub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  close: { position: 'absolute', right: 16, top: 6, padding: 2 },
  back: { position: 'absolute', left: 16, top: 6, padding: 2 },
});
