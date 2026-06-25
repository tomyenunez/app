import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { AppText as Text } from '../components/shared/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { Dayxo } from '../constants/dayxo';
import { AuthPanel } from '../components/auth/AuthPanel';
import { AuthGlow } from '../components/auth/AuthGlow';

// Pantalla de entrada (online-only): sin sesión, la app muestra esto.
// El estilo cambia según el modo del panel: registro = naranja (energía),
// login = violeta (calma). El modo lo reporta el AuthPanel vía onModeChange.
export function AuthScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const accent = mode === 'signup' ? Dayxo.orange : Dayxo.purple;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <AuthGlow color={accent} intensity={mode === 'signup' ? 0.45 : 0.28} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.body}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <View style={styles.logoRow}>
              <Ionicons name="flash" size={28} color={Dayxo.orange} />
              <Text style={styles.logo}>Dayxo</Text>
            </View>
            <Text style={styles.tagline}>Ordená tus días, hábitos y plata.</Text>
          </View>

          {mode === 'signup' ? (
            <View style={styles.hero}>
              <Text style={styles.heroLine}>
                Empezá a sumar <Text style={{ color: Dayxo.orange }}>XP</Text> desde el día 1
              </Text>
              <Text style={styles.heroSub}>Hábitos, tareas y plata. Todo en un solo lugar.</Text>
            </View>
          ) : (
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Ionicons name="flash" size={28} color="#fff" />
              </View>
              <Text style={styles.welcomeTitle}>Bienvenido de nuevo</Text>
              <Text style={styles.heroSub}>Tu racha te está esperando</Text>
              <View style={styles.streakPill}>
                <Text style={styles.streakPillText}>🔥 No perdás tu progreso — entrá</Text>
              </View>
            </View>
          )}

          <AuthPanel onDone={() => {}} onModeChange={setMode} />

          {mode === 'login' && (
            <Text style={styles.loginNote}>
              Tus hábitos, tu plata y tu progreso te esperan tal como los dejaste.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  body: { flexGrow: 1, justifyContent: 'center', paddingVertical: 30 },
  brand: { alignItems: 'center', marginBottom: 16, paddingHorizontal: 18 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  logo: { fontSize: 38, fontFamily: 'Inter_800ExtraBold', color: Dayxo.orange },
  tagline: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 6, textAlign: 'center' },

  hero: { alignItems: 'center', marginBottom: 22, paddingHorizontal: 28 },
  heroLine: { fontSize: 21, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, textAlign: 'center', lineHeight: 28 },
  heroSub: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  avatar: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: Dayxo.purple, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: Dayxo.purple, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 20, elevation: 8,
  },
  welcomeTitle: { fontSize: 20, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, textAlign: 'center' },
  streakPill: {
    marginTop: 14, alignSelf: 'center',
    backgroundColor: 'rgba(255,107,0,0.10)', borderWidth: 1, borderColor: 'rgba(255,107,0,0.22)',
    borderRadius: 20, paddingVertical: 7, paddingHorizontal: 14,
  },
  streakPillText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: Dayxo.orange },

  loginNote: {
    fontSize: 10.5, fontFamily: 'Inter_400Regular', color: colors.textTertiary,
    textAlign: 'center', marginTop: 18, paddingHorizontal: 40, lineHeight: 15,
  },
});
