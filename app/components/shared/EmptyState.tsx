import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export function EmptyState({ icon, text }: Props) {
  const { colors } = useTheme();
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 }}>
      <Ionicons name={icon} size={52} color={colors.grayLight} />
      <Text style={{ fontSize: 15, color: colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
        {text}
      </Text>
    </View>
  );
}
