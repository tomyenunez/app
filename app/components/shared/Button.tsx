import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, ActivityIndicator } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, color = Colors.violet, textColor = '#fff', style, loading, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.btn, { backgroundColor: color }, style, (disabled || loading) && styles.disabled]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  disabled: { opacity: 0.6 },
});
