import React, { useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Dayxo } from '../../constants/dayxo';

interface Props {
  children: React.ReactNode;
  onPin: () => void;
  onEdit: () => void;
  pinned?: boolean;
  pinColor?: string;
  editColor?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

// Fila deslizable: arrastrando hacia la derecha (desde la izquierda) revela dos
// acciones — fijar (pin) y editar. Reutilizable en todas las listas de la app.
export function SwipeableRow({
  children, onPin, onEdit, pinned,
  pinColor = Dayxo.purple, editColor = Dayxo.blue, containerStyle,
}: Props) {
  const ref = useRef<Swipeable>(null);
  const close = () => ref.current?.close();

  const renderLeftActions = () => (
    <View style={styles.actions}>
      <RectButton
        style={[styles.action, styles.actionFirst, { backgroundColor: pinColor }]}
        onPress={() => { close(); onPin(); }}
      >
        <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={20} color="#fff" />
      </RectButton>
      <RectButton
        style={[styles.action, { backgroundColor: editColor }]}
        onPress={() => { close(); onEdit(); }}
      >
        <Ionicons name="pencil" size={19} color="#fff" />
      </RectButton>
    </View>
  );

  return (
    <Swipeable
      ref={ref}
      renderLeftActions={renderLeftActions}
      overshootLeft={false}
      leftThreshold={36}
      friction={2}
      containerStyle={containerStyle}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', alignItems: 'stretch' },
  action: { width: 58, alignItems: 'center', justifyContent: 'center' },
  actionFirst: { borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
});
