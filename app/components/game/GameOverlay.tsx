import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity, Easing } from 'react-native';
import * as Haptics from 'expo-haptics';
import { gameEvents } from '../../services/xpService';
import { AwardResult, Badge, UserLevel } from '../../types/game';
import { RARITY_LABEL } from '../../constants/badges';
import { rankUpMessage } from '../../constants/rankMessages';
import { playRankUp } from '../../services/sound';

// Toast de XP que flota desde abajo (encima del tab bar)
function XPToast({ amount, isBonus, isStar, onDone }: {
  amount: number; isBonus: boolean; isStar: boolean; onDone: () => void;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 250, useNativeDriver: true, easing: Easing.out(Easing.back(1.5)) }),
      Animated.delay(1100),
      Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  const color = isStar ? '#FF9F43' : isBonus ? '#E17055' : '#6C5CE7';
  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] });

  return (
    <Animated.View style={[styles.xpToast, { backgroundColor: color, opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.xpToastText}>{isStar ? '⭐' : '⚡'} +{Math.max(1, Math.round(amount))} XP</Text>
    </Animated.View>
  );
}

// Toast de badge que baja desde arriba
function BadgeToast({ badge, onDone }: { badge: Badge; onDone: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone());
  }, []);

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-90, 0] });

  return (
    <Animated.View style={[styles.badgeToast, { borderColor: badge.color, opacity: anim, transform: [{ translateY }] }]}>
      <Text style={styles.badgeIcon}>{badge.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.badgeSmall}>¡Badge desbloqueado!</Text>
        <Text style={styles.badgeName}>{badge.name}</Text>
        <Text style={[styles.badgeRarity, { color: badge.color }]}>{RARITY_LABEL[badge.rarity]}</Text>
      </View>
    </Animated.View>
  );
}

// Ráfaga de partículas del color del rango que explota desde el centro
const PARTICLE_COUNT = 16;
function RankParticles({ color }: { color: string }) {
  const anims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    Animated.stagger(
      18,
      anims.map((a) =>
        Animated.timing(a, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true })
      )
    ).start();
  }, []);

  return (
    <View style={styles.particleField} pointerEvents="none">
      {anims.map((a, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT;
        const dist = 90 + (i % 3) * 26;
        const translateX = a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(angle) * dist] });
        const translateY = a.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(angle) * dist] });
        const opacity = a.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] });
        const scale = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.4] });
        return (
          <Animated.View
            key={i}
            style={[styles.particle, { backgroundColor: color, opacity, transform: [{ translateX }, { translateY }, { scale }] }]}
          />
        );
      })}
    </View>
  );
}

// Modal de subida de RANGO (mínimo 2s, no cerrable antes)
function LevelUpModal({ level, onClose }: { level: UserLevel; onClose: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playRankUp();
    Animated.spring(anim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    const t = setTimeout(() => setCanClose(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Fondo: el bgColor del rango oscurecido para que destaquen los efectos
  return (
    <Modal visible transparent animationType="fade">
      <View style={[styles.levelOverlay, { backgroundColor: 'rgba(8,8,12,0.92)' }]}>
        <RankParticles color={level.color} />
        <Animated.View style={{ transform: [{ scale: anim }], alignItems: 'center' }}>
          <Text style={styles.levelIcon}>{level.icon}</Text>
          <Text style={styles.levelUpText}>SUBISTE DE RANGO</Text>
          <Text style={[styles.levelName, { color: level.color }]}>{level.name}</Text>
          <Text style={styles.levelMsg}>{rankUpMessage(level.name)}</Text>
          <TouchableOpacity
            onPress={canClose ? onClose : undefined}
            style={[styles.levelBtn, { borderColor: level.color }, !canClose && { opacity: 0.35 }]}
            disabled={!canClose}
          >
            <Text style={[styles.levelBtnText, { color: level.color }]}>{canClose ? '¡Vamos!' : '...'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

export function GameOverlay() {
  const [xpToasts, setXpToasts] = useState<{ id: string; amount: number; isBonus: boolean; isStar: boolean }[]>([]);
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);
  const [levelUp, setLevelUp] = useState<UserLevel | null>(null);

  useEffect(() => {
    const unsub = gameEvents.subscribe((r: AwardResult) => {
      if (r.awarded > 0) {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        setXpToasts((prev) => [...prev, { id, amount: r.awarded, isBonus: r.isBonus, isStar: r.isStar }]);
      }
      if (r.newBadges.length > 0) {
        setBadgeQueue((prev) => [...prev, ...r.newBadges]);
      }
      if (r.leveledUp && r.newLevel) {
        setLevelUp(r.newLevel);
      }
    });
    return unsub;
  }, []);

  const removeToast = useCallback((id: string) => {
    setXpToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const currentBadge = badgeQueue[0];

  return (
    <>
      {/* Toasts de XP apilados encima del tab bar */}
      <View style={styles.xpToastContainer} pointerEvents="none">
        {xpToasts.map((t) => (
          <XPToast key={t.id} amount={t.amount} isBonus={t.isBonus} isStar={t.isStar} onDone={() => removeToast(t.id)} />
        ))}
      </View>

      {/* Toast de badge arriba */}
      {currentBadge && (
        <View style={styles.badgeToastContainer} pointerEvents="none">
          <BadgeToast
            key={currentBadge.id}
            badge={currentBadge}
            onDone={() => setBadgeQueue((prev) => prev.slice(1))}
          />
        </View>
      )}

      {/* Modal de nivel */}
      {levelUp && <LevelUpModal level={levelUp} onClose={() => setLevelUp(null)} />}
    </>
  );
}

const styles = StyleSheet.create({
  xpToastContainer: {
    position: 'absolute',
    bottom: 72,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: 6,
    zIndex: 1000,
  },
  xpToast: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 9,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  xpToastText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  badgeToastContainer: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 1001,
  },
  badgeToast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1A1A22',
    borderRadius: 14,
    padding: 14,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  badgeIcon: { fontSize: 32 },
  badgeSmall: { color: '#888', fontSize: 11, fontFamily: 'Inter_500Medium' },
  badgeName: { color: '#F0F0F0', fontSize: 16, fontFamily: 'Inter_700Bold', marginTop: 1 },
  badgeRarity: { fontSize: 12, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
  levelOverlay: {
    flex: 1,
    backgroundColor: 'rgba(8,8,12,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleField: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  levelIcon: { fontSize: 72, marginBottom: 10 },
  levelUpText: { color: '#9A9AA5', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 2 },
  levelName: { fontSize: 40, fontFamily: 'Inter_800ExtraBold', marginTop: 6 },
  levelMsg: {
    color: '#D8D8DE',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 36,
    lineHeight: 20,
  },
  levelBtn: {
    marginTop: 28,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 13,
  },
  levelBtnText: { fontSize: 16, fontFamily: 'Inter_800ExtraBold' },
});
