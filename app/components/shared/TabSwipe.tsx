import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';

interface Props {
  left?: string;   // pantalla a la que se va deslizando el dedo hacia la DERECHA
  right?: string;  // pantalla a la que se va deslizando el dedo hacia la IZQUIERDA
  children: React.ReactNode;
}

// Navegación por swipe horizontal entre tabs (Home ↔ Finanzas ↔ Stats).
// Calibrado para convivir con los otros gestos de la app:
//  - activeOffsetX ±30: recién se activa con un arrastre horizontal franco,
//    así los swipes de las filas (pin/borrar) — que activan antes — ganan.
//  - failOffsetY ±15: si el dedo va en vertical, el gesto falla y el scroll
//    de la pantalla sigue funcionando normal.
export function TabSwipe({ left, right, children }: Props) {
  const nav = useNavigation<any>();

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-30, 30])
    .failOffsetY([-15, 15])
    .onEnd((e) => {
      const fast = Math.abs(e.velocityX) > 500;
      if ((e.translationX < -60 || (fast && e.translationX < -20)) && right) {
        nav.navigate(right);
      } else if ((e.translationX > 60 || (fast && e.translationX > 20)) && left) {
        nav.navigate(left);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={{ flex: 1 }} collapsable={false}>{children}</View>
    </GestureDetector>
  );
}
