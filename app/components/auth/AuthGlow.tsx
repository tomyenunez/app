import React from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

interface Props {
  color: string;        // color del glow (acento de la pantalla)
  intensity?: number;   // opacidad del centro (0..1)
}

// Glow radial decorativo: mancha de color difuminada arriba-centro, detrás del
// contenido. No interactiva. Se usa en el AuthScreen para diferenciar registro
// (naranja, energía) de login (violeta, calma).
export function AuthGlow({ color, intensity = 0.4 }: Props) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="authGlow" cx="50%" cy="0%" r="80%">
            <Stop offset="0%" stopColor={color} stopOpacity={intensity} />
            <Stop offset="55%" stopColor={color} stopOpacity={intensity * 0.28} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#authGlow)" />
      </Svg>
    </View>
  );
}
