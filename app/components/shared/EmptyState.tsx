import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
}

export function EmptyState({ icon, text }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={52} color={Colors.grayLight} />
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  text: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});
