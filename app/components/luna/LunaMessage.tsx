import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import { LunaMessage as LunaMessageType } from '../../types/luna';

export function LunaMessageBubble({ message }: { message: LunaMessageType }) {
  const { colors } = useTheme();

  // Burbuja de sistema: "Compartiste X con Luna" — centrada, gris
  if (message.role === 'system') {
    return (
      <View style={styles.systemRow}>
        <Text style={[styles.systemText, { color: colors.textSecondary, backgroundColor: colors.grayVeryLight }]}>
          📊 {message.content}
        </Text>
      </View>
    );
  }

  if (message.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={[styles.userBubble, { backgroundColor: colors.violet }]}>
          <Text style={styles.userText}>{message.content}</Text>
        </View>
      </View>
    );
  }

  // Luna
  return (
    <View style={styles.lunaRow}>
      <LinearGradient
        colors={['#6C5CE7', '#E84393']}
        style={styles.avatar}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={styles.avatarText}>L</Text>
      </LinearGradient>
      <View style={[styles.lunaBubble, { backgroundColor: colors.lunaBubble }]}>
        <Text style={[styles.lunaText, { color: colors.textPrimary }]}>{message.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  systemRow: { alignItems: 'center', marginVertical: 8 },
  systemText: {
    fontSize: 12, fontFamily: 'Inter_500Medium',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6,
    overflow: 'hidden',
  },
  userRow: { alignItems: 'flex-end', marginVertical: 4 },
  userBubble: {
    borderRadius: 16, borderBottomRightRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: '75%',
  },
  userText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  lunaRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 4 },
  avatar: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
  lunaBubble: {
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
    maxWidth: '80%',
  },
  lunaText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
});
