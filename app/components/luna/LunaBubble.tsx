import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLuna } from '../../hooks/useLuna';
import { LunaModal } from './LunaModal';

export function LunaBubble() {
  const luna = useLuna();
  const scale = useRef(new Animated.Value(1)).current;

  // Pulso suave cada 10 segundos si no se abrió hoy
  useEffect(() => {
    if (luna.openedToday) return;
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.12, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1.08, duration: 250, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    }, 10000);
    return () => clearInterval(interval);
  }, [luna.openedToday]);

  // Degradado cálido en modo crisis, violeta→rosa normal
  const gradientColors: [string, string] = luna.crisisMode
    ? ['#E17055', '#E84393']
    : ['#6C5CE7', '#E84393'];

  return (
    <>
      <Animated.View style={[styles.wrapper, { transform: [{ scale }] }]}>
        <TouchableOpacity onPress={luna.open} activeOpacity={0.85}>
          <LinearGradient
            colors={gradientColors}
            style={[styles.bubble, luna.unreadCount > 0 && styles.bubbleUnread]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
          </LinearGradient>
          {luna.unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{luna.unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>

      <LunaModal
        visible={luna.isOpen}
        onClose={luna.close}
        messages={luna.messages}
        isTyping={luna.isTyping}
        onSend={luna.send}
        onShareContext={luna.shareContext}
      />
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    zIndex: 999,
  },
  bubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C5CE7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  bubbleUnread: {
    borderWidth: 2,
    borderColor: '#fff',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E05C5C',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: { color: '#fff', fontSize: 11, fontFamily: 'Inter_700Bold' },
});
