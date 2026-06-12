import React from 'react';
import { TextInput, StyleSheet, TextInputProps, View, Text } from 'react-native';
import { Colors } from '../../constants/colors';

interface Props extends TextInputProps {
  label?: string;
}

export function Input({ label, style, ...props }: Props) {
  return (
    <View>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, style]}
        placeholderTextColor={Colors.textSecondary}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.grayVeryLight,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
