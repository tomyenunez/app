import React, { useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, Animated } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Dayxo } from '../../constants/dayxo';

interface Props {
  children: React.ReactNode;
  onPin?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  pinned?: boolean;
  pinColor?: string;
  editColor?: string;
  deleteColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

// Referencia global a la fila abierta. Sirve para dos cosas:
//  - "uno a la vez": al abrir otra, se cierra la anterior;
//  - con un panel abierto, tocar cualquier fila SOLO cierra el panel (se "come"
//    el toque), así no se dispara nada por debajo (p. ej. completar un pendiente).
let openRow: Swipeable | null = null;

// Fila deslizable reutilizable. Cada acción es opcional (solo se muestra si se
// pasa el handler):
//  - swipe hacia la derecha → fijar (pin) y/o editar
//  - swipe hacia la izquierda → borrar
export function SwipeableRow({
  children, onPin, onEdit, onDelete, pinned,
  pinColor = Dayxo.purple, editColor = Dayxo.blue, deleteColor = Dayxo.coral, containerStyle,
}: Props) {
  const ref = useRef<Swipeable>(null);
  const close = () => ref.current?.close();

  const handleWillOpen = () => {
    if (openRow && openRow !== ref.current) openRow.close();
    openRow = ref.current;
  };
  const handleClose = () => { if (openRow === ref.current) openRow = null; };

  const hasLeft = !!onPin || !!onEdit;

  // Micro-animación: el ícono aparece con un leve escalado + opacidad a medida
  // que se revela la acción (sutil, pero le da fluidez al desliz).
  const iconAnim = (progress: Animated.AnimatedInterpolation<number>) => ({
    opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1], extrapolate: 'clamp' as const }),
    transform: [{
      scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1], extrapolate: 'clamp' as const }),
    }],
  });

  const renderLeftActions = (progress: Animated.AnimatedInterpolation<number>) => (
    <View style={styles.leftActions}>
      {onPin && (
        // Pin = el más externo → redondea su lado izquierdo (sale de "editar")
        <RectButton style={[styles.action, styles.roundLeft, { backgroundColor: pinColor }]} onPress={() => { close(); onPin(); }}>
          <Animated.View style={iconAnim(progress)}>
            <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={20} color="#fff" />
          </Animated.View>
        </RectButton>
      )}
      {onEdit && (
        // Editar se mete por debajo de la burbuja (lado derecho); redondea izquierda solo si no hay pin
        <RectButton style={[styles.actionTuckRight, !onPin && styles.roundLeft, { backgroundColor: editColor }]} onPress={() => { close(); onEdit(); }}>
          <Animated.View style={iconAnim(progress)}>
            <Ionicons name="pencil" size={19} color="#fff" />
          </Animated.View>
        </RectButton>
      )}
    </View>
  );

  const renderRightActions = (progress: Animated.AnimatedInterpolation<number>) => (
    <View style={styles.rightActions}>
      <RectButton style={[styles.actionTuckLeft, styles.roundRight, { backgroundColor: deleteColor }]} onPress={() => { close(); onDelete?.(); }}>
        <Animated.View style={iconAnim(progress)}>
          <Ionicons name="trash" size={20} color="#fff" />
        </Animated.View>
      </RectButton>
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={hasLeft ? renderLeftActions : undefined}
      renderRightActions={onDelete ? renderRightActions : undefined}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={36}
      rightThreshold={36}
      friction={2}
      onSwipeableWillOpen={handleWillOpen}
      onSwipeableClose={handleClose}
      containerStyle={containerStyle}
    >
      {/* Con un panel abierto, interceptamos el toque (fase de captura) para SOLO
          cerrarlo, sin que el contenido de la fila reciba el tap. Los botones
          pin/edit/borrar quedan afuera de este View, así siguen funcionando. */}
      <View
        onStartShouldSetResponderCapture={() => {
          if (openRow) { openRow.close(); return true; }
          return false;
        }}
      >
        {children}
      </View>
    </Swipeable>
  );
}

// Cuánto se mete la acción POR DEBAJO de la burbuja (>= radio, para que la
// burbuja tape el "triángulo" negro de su esquina redondeada).
const OVERLAP = 24;

const styles = StyleSheet.create({
  // Acciones unificadas: flush entre sí y con la burbuja. El botón que toca la
  // burbuja se extiende OVERLAP px por debajo (la burbuja queda encima tapando el
  // sobrante) → no se ve el triángulo negro. Solo las esquinas EXTERNAS redondean.
  leftActions: { flexDirection: 'row', alignItems: 'stretch' },
  rightActions: { flexDirection: 'row', alignItems: 'stretch' },
  action: { width: 56, alignItems: 'center', justifyContent: 'center' },
  // El padding compensa el overlap para que el ícono quede centrado en la parte visible.
  actionTuckRight: { width: 56 + OVERLAP, paddingRight: OVERLAP, marginRight: -OVERLAP, alignItems: 'center', justifyContent: 'center' },
  actionTuckLeft: { width: 56 + OVERLAP, paddingLeft: OVERLAP, marginLeft: -OVERLAP, alignItems: 'center', justifyContent: 'center' },
  roundLeft: { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 },
  roundRight: { borderTopRightRadius: 16, borderBottomRightRadius: 16 },
});
