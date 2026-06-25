import React from 'react';
import { TextInput, TextInputProps, View } from 'react-native';
import { AppText as Text } from './AppText';
import { useTheme } from '../../context/ThemeContext';

interface Props extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: Props) {
  const { colors } = useTheme();
  return (
    <View>
      {label && (
        <Text
          style={{
            fontSize: 11,
            fontFamily: 'Inter_600SemiBold',
            color: colors.textSecondary,
            letterSpacing: 0.5,
            marginBottom: 6,
            textTransform: 'uppercase',
          }}
        >
          {label}
        </Text>
      )}
      <TextInput
        style={[
          {
            backgroundColor: colors.inputBg,
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontFamily: 'Inter_400Regular',
            color: colors.textPrimary,
            borderWidth: 1,
            borderColor: colors.border,
          },
          style,
        ]}
        placeholderTextColor={colors.textSecondary}
        {...props}
      />
    </View>
  );
}
