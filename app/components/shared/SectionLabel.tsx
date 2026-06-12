import React from 'react';
import { Text, StyleSheet } from 'react-native';
import { Colors } from '../../constants/colors';

export function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
});
