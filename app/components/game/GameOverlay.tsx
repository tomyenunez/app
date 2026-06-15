import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Modal, TouchableOpacity, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gameEvents } from '../../services/xpService';
import { AwardResult, Badge, UserLevel } from '../../types/game';
import { RARITY_LABEL } from '../../constants/badges';

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
      <Text style={styles.xpToastText}>{isStar ? '⭐' : '⚡'} +{amount} XP</Text>
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

// Modal de subida de nivel (mínimo 2.5s, no cerrable antes)
function LevelUpModal({ level, onClose }: { level: UserLevel; onClose: () => void }) {
  const anim = useRef(new Animated.Value(0)).current;
  const [canClose, setCanClose] = useState(false);

  useEffect(() => {
    Animated.spring(anim, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }).start();
    const t = setTimeout(() => setCanClose(true), 2500);
    return () => clearTimeout(t);
  }, []);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.levelOverlay}>
        <Animated.View style={{ transform: [{ scale: anim }], alignItems: 'center' }}>
          <LinearGradient
            colors={[level.color, '#1A1A22']}
            style={styles.levelCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.levelIcon}>{level.icon}</Text>
            <Text style={styles.levelUpText}>¡Subiste de nivel!</Text>
            <Text style={styles.levelName}>{level.name}</Text>
            <Text style={styles.levelNum}>Nivel {level.level}</Text>
            <TouchableOpacity
              onPress={canClose ? onClose : undefined}
              style={[styles.levelBtn, !canClose && { opacity: 0.4 }]}
              disabled={!canClose}
            >
              <Text style={styles.levelBtnText}>{canClose ? '¡Genial!' : '...'}</Text>
            </TouchableOpacity>
          </LinearGradient>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelCard: {
    width: 280,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  levelIcon: { fontSize: 64, marginBottom: 8 },
  levelUpText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold', opacity: 0.9 },
  levelName: { color: '#fff', fontSize: 28, fontFamily: 'Inter_800ExtraBold', marginTop: 4 },
  levelNum: { color: '#fff', fontSize: 14, fontFamily: 'Inter_500Medium', opacity: 0.85, marginTop: 2 },
  levelBtn: {
    marginTop: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  levelBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
