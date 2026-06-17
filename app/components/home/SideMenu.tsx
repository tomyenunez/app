import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Switch, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { MissionsSection } from '../game/MissionsSection';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(300, SCREEN_W * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SideMenu({ visible, onClose }: Props) {
  const { colors, isDark, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Leemos los insets acá (con contexto del provider); dentro del Modal el
  // SafeAreaView no mide bien la primera vez, así que aplicamos padding a mano.
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const translateX = useRef(new Animated.Value(-PANEL_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateX, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      setMissionsOpen(false);
      Animated.parallel([
        Animated.timing(translateX, { toValue: -PANEL_W, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setMounted(false); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  const safePad = { paddingTop: insets.top, paddingBottom: insets.bottom };

  return (
    <Modal transparent visible animationType="none" onRequestClose={onClose}>
      <View style={styles.root}>
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.panel, { transform: [{ translateX }] }]}>
          <View style={[{ flex: 1 }, safePad]}>
            <View style={styles.header}>
              <Text style={styles.title}>Menú</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Arriba: misiones */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setMissionsOpen(true)} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuEmoji}>🎯</Text>
                <Text style={styles.menuLabel}>Misiones</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Abajo: modo oscuro */}
            <View style={styles.bottomSection}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name="moon" size={20} color={colors.violet} />
                  <Text style={styles.rowLabel}>Modo oscuro</Text>
                </View>
                <View style={styles.switchWrap}>
                  <Switch
                    value={isDark}
                    onValueChange={(v) => setThemeMode(v ? 'dark' : 'light')}
                    trackColor={{ false: colors.grayLight, true: colors.violet }}
                    thumbColor="#fff"
                  />
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Misiones: vista dentro del mismo modal (sin modales anidados) */}
        {missionsOpen && (
          <View style={[styles.missionsCover, safePad]}>
            <View style={styles.missionsHeader}>
              <TouchableOpacity onPress={() => setMissionsOpen(false)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.missionsTitle}>Misiones</Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24, paddingTop: 6 }}>
              <MissionsSection />
            </ScrollView>
          </View>
        )}
      </View>
    </Modal>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  root: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  panel: {
    position: 'absolute', top: 0, bottom: 0, left: 0, width: PANEL_W,
    backgroundColor: colors.card,
    shadowColor: '#000', shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 8,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  closeBtn: { padding: 4 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuEmoji: { fontSize: 20 },
  menuLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  bottomSection: {
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 16,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowLabel: { fontSize: 15, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  switchWrap: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 20,
    padding: 2,
  },
  missionsCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  missionsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  backBtn: { padding: 6 },
  missionsTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
});
