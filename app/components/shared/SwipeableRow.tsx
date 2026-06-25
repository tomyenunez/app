import React, { useRef } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
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

  const hasLeft = !!onPin || !!onEdit;

  const renderLeftActions = () => (
    <View style={styles.actions}>
      {onPin && (
        <RectButton
          style={[styles.action, styles.actionFirst, { backgroundColor: pinColor }]}
          onPress={() => { close(); onPin(); }}
        >
          <Ionicons name={pinned ? 'pin' : 'pin-outline'} size={20} color="#fff" />
        </RectButton>
      )}
      {onEdit && (
        <RectButton
          style={[styles.action, !onPin && styles.actionFirst, { backgroundColor: editColor }]}
          onPress={() => { close(); onEdit(); }}
        >
          <Ionicons name="pencil" size={19} color="#fff" />
        </RectButton>
      )}
    </View>
  );

  const renderRightActions = () => (
    <View style={styles.actions}>
      <RectButton
        style={[styles.action, styles.actionLast, { backgroundColor: deleteColor }]}
        onPress={() => { close(); onDelete?.(); }}
      >
        <Ionicons name="trash" size={20} color="#fff" />
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
  actionLast: { borderTopRightRadius: 12, borderBottomRightRadius: 12 },
});
