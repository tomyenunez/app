import React from 'react';
import { TouchableOpacity, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  label: string;
  onPress: () => void;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ label, onPress, color, textColor = '#fff', style, loading, disabled }: Props) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[
        {
          backgroundColor: color ?? colors.violet,
          borderRadius: 10,
          paddingVertical: 13,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
        },
        style,
        (disabled || loading) && { opacity: 0.6 },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled || loading}
    >
      {loading
        ? <ActivityIndicator color={textColor} size="small" />
        : <Text style={{ fontSize: 15, fontFamily: 'Inter_600SemiBold', color: textColor }}>{label}</Text>
      }
    </TouchableOpacity>
  );
}
