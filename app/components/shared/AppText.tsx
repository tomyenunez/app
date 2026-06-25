import React from 'react';
import { Text as RNText, TextProps, TextStyle, StyleSheet } from 'react-native';
import { useAccessibility } from '../../context/AccessibilityContext';

// Mapa de "subir un escalón" de peso para la opción Negrita. La app usa familias
// con peso fijo (Inter_* → Poppins), donde fontWeight se ignora; por eso la
// negrita se logra cambiando a una familia más pesada.
const BOLD_FAMILY: Record<string, string> = {
  Inter_400Regular: 'Inter_600SemiBold',
  Inter_500Medium: 'Inter_700Bold',
  Inter_600SemiBold: 'Inter_700Bold',
  Inter_700Bold: 'Inter_800ExtraBold',
  Inter_800ExtraBold: 'Inter_800ExtraBold',
};

// Texto base de la app. Todos los componentes lo importan como `Text`, así que
// el tamaño (fontScale) y la negrita (isBold) de Accesibilidad se aplican a TODA
// la tipografía sin tocar cada estilo a mano. Desactiva el escalado del SO para
// que el selector in-app sea el único control (evita doble escala).
export function AppText({ style, allowFontScaling, ...rest }: TextProps) {
  const { fontScale, isBold } = useAccessibility();
  const flat = (StyleSheet.flatten(style) || {}) as TextStyle;

  const baseSize = typeof flat.fontSize === 'number' ? flat.fontSize : 14;
  const override: TextStyle = { fontSize: Math.round(baseSize * fontScale) };

  // Escalar también el interlineado si está fijado, para que no se solape al agrandar
  if (typeof flat.lineHeight === 'number') {
    override.lineHeight = Math.round(flat.lineHeight * fontScale);
  }

  if (isBold) {
    const fam = typeof flat.fontFamily === 'string' ? flat.fontFamily : undefined;
    if (fam && BOLD_FAMILY[fam]) override.fontFamily = BOLD_FAMILY[fam];
    else if (!fam) override.fontWeight = 'bold';
  }

  return <RNText {...rest} allowFontScaling={allowFontScaling ?? false} style={[style, override]} />;
}
