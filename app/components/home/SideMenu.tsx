import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Animated, Dimensions, Switch, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { MissionsSection } from '../game/MissionsSection';
import { AuthPanel } from '../auth/AuthPanel';
import { useAuth } from '../../context/AuthContext';
import { useGame } from '../../context/GameContext';
import { useAccessibility, FONT_SIZE_OPTIONS } from '../../context/AccessibilityContext';
import { unlockBadge } from '../../services/xpService';
import { supabase } from '../../services/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const PANEL_W = Math.min(300, SCREEN_W * 0.82);

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenSocial?: () => void; // abre el panel Social (amigos y grupos) desde el Home
}

export function SideMenu({ visible, onClose, onOpenSocial }: Props) {
  const { colors, isDark, setThemeMode } = useTheme();
  const { user } = useAuth();
  const { profile } = useGame();
  const { fontSizeKey, isBold, setFontSizeKey, setIsBold } = useAccessibility();
  const styles = useMemo(() => createStyles(colors), [colors]);
  // Leemos los insets acá (con contexto del provider); dentro del Modal el
  // SafeAreaView no mide bien la primera vez, así que aplicamos padding a mano.
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const [missionsOpen, setMissionsOpen] = useState(false);
  const [cuentaOpen, setCuentaOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  // Sugerencias/feedback: texto + estado del envío
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [fbText, setFbText] = useState('');
  const [fbStatus, setFbStatus] = useState<'idle' | 'busy' | 'sent' | 'error'>('idle');
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
      setCuentaOpen(false);
      setConfigOpen(false);
      setFeedbackOpen(false);
      setFbStatus('idle');
      Animated.parallel([
        Animated.timing(translateX, { toValue: -PANEL_W, duration: 200, useNativeDriver: true }),
        Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(({ finished }) => { if (finished) setMounted(false); });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!mounted) return null;

  const safePad = { paddingTop: insets.top, paddingBottom: insets.bottom };

  // Envía la sugerencia a la tabla `feedback` (la leemos en Supabase).
  const sendFeedback = async () => {
    const mensaje = fbText.trim();
    if (!mensaje || fbStatus === 'busy' || !user) return;
    setFbStatus('busy');
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      username: profile.username ?? '',
      mensaje,
    });
    if (error) {
      console.warn('[Dayxo feedback] enviar:', error.message);
      setFbStatus('error');
      return;
    }
    setFbText('');
    setFbStatus('sent');
  };

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

            {/* Social (amigos y grupos). Cerramos este modal primero y abrimos el
                panel después, para no anidar modales (mismo patrón que testAward). */}
            {onOpenSocial && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => { onClose(); setTimeout(onOpenSocial, 350); }}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Text style={styles.menuEmoji}>👥</Text>
                  <Text style={styles.menuLabel}>Social</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}

            {/* Sugerencias: feedback de los usuarios → tabla `feedback` en Supabase */}
            <TouchableOpacity style={styles.menuItem} onPress={() => setFeedbackOpen(true)} activeOpacity={0.7}>
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuEmoji}>💡</Text>
                <Text style={styles.menuLabel}>Sugerencias</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            {/* Abajo: cuenta + modo oscuro */}
            <View style={styles.bottomSection}>
              <TouchableOpacity style={styles.row} onPress={() => setCuentaOpen(true)} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-circle-outline" size={22} color={colors.violet} />
                  <View style={{ flexShrink: 1 }}>
                    <Text style={styles.rowLabel}>Cuenta</Text>
                    <Text style={styles.rowSub} numberOfLines={1}>{user ? user.email : 'Iniciá sesión o registrate'}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.row} onPress={() => setConfigOpen(true)} activeOpacity={0.7}>
                <View style={styles.rowLeft}>
                  <Ionicons name="text-outline" size={20} color={colors.violet} />
                  <Text style={styles.rowLabel}>Accesibilidad</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

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

              {/* Versión + nº de update por aire: para verificar qué corre el celu */}
              <Text style={styles.versionText}>Dayxo v1.0.1 🛰️</Text>

              {/* 🥚 "No deberías estar acá": franja invisible al pie del menú */}
              <TouchableOpacity
                style={{ height: 26 }}
                activeOpacity={1}
                onPress={() => unlockBadge('boton_secreto')}
              />
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

        {/* Cuenta: vista dentro del mismo modal */}
        {cuentaOpen && (
          <View style={[styles.missionsCover, safePad]}>
            <View style={styles.missionsHeader}>
              <TouchableOpacity onPress={() => setCuentaOpen(false)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.missionsTitle}>Cuenta</Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
              keyboardShouldPersistTaps="handled"
            >
              <AuthPanel onDone={() => setCuentaOpen(false)} />
            </ScrollView>
          </View>
        )}

        {/* Sugerencias: los amigos proponen mejoras y nos llegan a Supabase */}
        {feedbackOpen && (
          <View style={[styles.missionsCover, safePad]}>
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <View style={styles.missionsHeader}>
                <TouchableOpacity onPress={() => { setFeedbackOpen(false); setFbStatus('idle'); }} style={styles.backBtn}>
                  <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.missionsTitle}>Sugerencias</Text>
                <View style={{ width: 36 }} />
              </View>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 24, paddingTop: 10, paddingHorizontal: 18 }}
                keyboardShouldPersistTaps="handled"
              >
                {fbStatus === 'sent' ? (
                  <View style={styles.fbThanks}>
                    <Text style={styles.fbThanksEmoji}>💜</Text>
                    <Text style={styles.fbThanksTitle}>¡Gracias!</Text>
                    <Text style={styles.fbThanksText}>Tu sugerencia nos llegó. La vamos a leer, posta.</Text>
                    <TouchableOpacity style={styles.fbAgainBtn} onPress={() => setFbStatus('idle')} activeOpacity={0.8}>
                      <Text style={styles.fbAgainText}>Mandar otra</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <>
                    <Text style={styles.fbIntro}>
                      ¿Qué le cambiarías o agregarías a Dayxo? Contanos y nos llega directo.
                    </Text>
                    <TextInput
                      style={styles.fbInput}
                      placeholder="Escribí tu idea acá..."
                      placeholderTextColor={colors.textTertiary}
                      value={fbText}
                      onChangeText={(t) => { setFbText(t); if (fbStatus === 'error') setFbStatus('idle'); }}
                      multiline
                      textAlignVertical="top"
                      maxLength={2000}
                    />
                    {fbStatus === 'error' && (
                      <Text style={styles.fbError}>No se pudo enviar. Revisá tu conexión y probá de nuevo.</Text>
                    )}
                    <TouchableOpacity
                      style={[styles.fbSendBtn, (!fbText.trim() || fbStatus === 'busy') && { opacity: 0.5 }]}
                      onPress={sendFeedback}
                      disabled={!fbText.trim() || fbStatus === 'busy'}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="paper-plane" size={17} color="#fff" />
                      <Text style={styles.fbSendText}>{fbStatus === 'busy' ? 'Enviando...' : 'Enviar sugerencia'}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </KeyboardAvoidingView>
          </View>
        )}

        {/* Accesibilidad: tamaño de texto + negrita */}
        {configOpen && (
          <View style={[styles.missionsCover, safePad]}>
            <View style={styles.missionsHeader}>
              <TouchableOpacity onPress={() => setConfigOpen(false)} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
              <Text style={styles.missionsTitle}>Accesibilidad</Text>
              <View style={{ width: 36 }} />
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 10, paddingHorizontal: 18 }}
            >
              <Text style={styles.configLabel}>TAMAÑO DE TEXTO</Text>
              {FONT_SIZE_OPTIONS.map((opt) => {
                const active = fontSizeKey === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.optionRow, active && { borderColor: colors.violet, backgroundColor: colors.violetLight }]}
                    onPress={() => setFontSizeKey(opt.key)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionLabel, active && { color: colors.violet }]}>{opt.label}</Text>
                    {active && <Ionicons name="checkmark-circle" size={20} color={colors.violet} />}
                  </TouchableOpacity>
                );
              })}

              <View style={styles.previewCard}>
                <Text style={styles.previewText}>Así se ve el texto en Dayxo.</Text>
              </View>

              <View style={styles.configToggleRow}>
                <View style={styles.rowLeft}>
                  <Ionicons name="text" size={20} color={colors.violet} />
                  <Text style={styles.rowLabel}>Negrita</Text>
                </View>
                <Switch
                  value={isBold}
                  onValueChange={setIsBold}
                  trackColor={{ false: colors.grayLight, true: colors.violet }}
                  thumbColor="#fff"
                />
              </View>
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
  rowSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 1 },
  switchWrap: {
    borderWidth: 1.5,
    borderColor: colors.textPrimary,
    borderRadius: 20,
    padding: 2,
  },
  versionText: {
    textAlign: 'center', paddingTop: 10,
    fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.textTertiary,
  },
  missionsCover: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bg,
  },
  missionsHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
  },
  backBtn: { padding: 6 },
  missionsTitle: { fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  // Accesibilidad
  configLabel: {
    fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary,
    letterSpacing: 0.5, marginBottom: 10, marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, marginBottom: 8,
    borderRadius: 12, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.inputBg,
  },
  optionLabel: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  previewCard: {
    marginTop: 8, marginBottom: 18, padding: 16, borderRadius: 12,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  previewText: { fontSize: 16, fontFamily: 'Inter_500Medium', color: colors.textPrimary },
  configToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border,
  },
  // Sugerencias
  fbIntro: { fontSize: 14, fontFamily: 'Inter_500Medium', color: colors.textSecondary, lineHeight: 20, marginBottom: 14 },
  fbInput: {
    backgroundColor: colors.inputBg, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, minHeight: 130,
    fontSize: 15, fontFamily: 'Inter_400Regular', color: colors.textPrimary, lineHeight: 21,
  },
  fbError: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.error, marginTop: 10 },
  fbSendBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.violet, borderRadius: 12, paddingVertical: 14, marginTop: 14,
  },
  fbSendText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  fbThanks: { alignItems: 'center', paddingTop: 40, paddingHorizontal: 10 },
  fbThanksEmoji: { fontSize: 44 },
  fbThanksTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, marginTop: 12 },
  fbThanksText: { fontSize: 14, fontFamily: 'Inter_400Regular', color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  fbAgainBtn: {
    marginTop: 22, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 28,
    borderWidth: 1.5, borderColor: colors.violet,
  },
  fbAgainText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', color: colors.violet },
});
