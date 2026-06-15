import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

function Dot({ delay, color }: { delay: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -5, duration: 250, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.delay(500 - delay),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return <Animated.View style={[styles.dot, { backgroundColor: color, transform: [{ translateY: anim }] }]} />;
}

export function LunaTyping() {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <View style={[styles.avatar, { backgroundColor: colors.violet }]}>
        <View style={styles.avatarInner} />
      </View>
      <View style={[styles.bubble, { backgroundColor: colors.lunaBubble }]}>
        <Dot delay={0} color={colors.violet} />
        <Dot delay={150} color={colors.violet} />
        <Dot delay={300} color={colors.violet} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginVertical: 4 },
  avatar: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E84393' },
  bubble: {
    flexDirection: 'row', gap: 4,
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 12,
    alignItems: 'center',
  },
  dot: { width: 7, height: 7, borderRadius: 4, opacity: 0.6 },
});
