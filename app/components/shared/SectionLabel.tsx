import React from 'react';
import { AppText as Text } from './AppText';
import { useTheme } from '../../context/ThemeContext';

export function SectionLabel({ text }: { text: string }) {
  const { colors } = useTheme();
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: 'Inter_700Bold',
        color: colors.textSecondary,
        letterSpacing: 0.8,
        textTransform: 'uppercase',
        marginBottom: 8,
        marginTop: 4,
      }}
    >
      {text}
    </Text>
  );
}
