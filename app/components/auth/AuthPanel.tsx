import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseConfigured } from '../../services/supabase';

interface AuthPanelProps {
  onDone: () => void;
  // El AuthScreen lo usa para pintar el glow/hero según el modo activo.
  onModeChange?: (mode: 'login' | 'signup') => void;
}

// Panel de cuenta:
//  - logueado → estado + cerrar sesión
//  - sin sesión → login / registro y, al registrarse, paso de código de 6 dígitos
export function AuthPanel({ onDone, onModeChange }: AuthPanelProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user, signIn, signUp, verifyOtp, resendCode, signOut } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'form' | 'code'>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setError(null); setInfo(null); };

  // Acento de la pantalla: registro = naranja (energía), login = violeta (calma)
  const accent = mode === 'signup' ? Dayxo.orange : Dayxo.purple;

  // Avisar al padre del modo (para el glow/hero del AuthScreen)
  useEffect(() => { onModeChange?.(mode); }, [mode, onModeChange]);

  const switchMode = (m: 'login' | 'signup') => { setMode(m); reset(); };

  // --- Sesión activa ---
  if (user) {
    return (
      <View style={styles.wrap}>
        <View style={styles.loggedCard}>
          <View style={styles.loggedIcon}>
            <Ionicons name="checkmark-circle" size={28} color={Dayxo.green} />
          </View>
          <Text style={styles.loggedLabel}>Sesión iniciada</Text>
          <Text style={styles.loggedEmail} numberOfLines={1}>{user.email}</Text>
        </View>
        <Text style={styles.note}>
          Tu cuenta y tu perfil están en la nube. El resto de tus datos se va a ir sincronizando.
        </Text>
        <TouchableOpacity style={styles.outlineBtn} onPress={async () => { await signOut(); }}>
          <Ionicons name="log-out-outline" size={18} color={colors.error} />
          <Text style={[styles.outlineBtnText, { color: colors.error }]}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // --- Sin config de Supabase ---
  if (!isSupabaseConfigured) {
    return (
      <View style={styles.wrap}>
        <View style={[styles.loggedCard, { borderColor: Dayxo.orange + '44' }]}>
          <Ionicons name="construct-outline" size={26} color={Dayxo.orange} />
          <Text style={[styles.loggedLabel, { marginTop: 8 }]}>Falta configurar Supabase</Text>
        </View>
        <Text style={styles.note}>
          Completá <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_URL</Text> y{' '}
          <Text style={styles.code}>EXPO_PUBLIC_SUPABASE_ANON_KEY</Text> en el archivo{' '}
          <Text style={styles.code}>.env</Text> y reiniciá el server.
        </Text>
      </View>
    );
  }

  // --- Paso: ingresar el código ---
  if (step === 'code') {
    const submitCode = async () => {
      reset();
      if (code.trim().length < 6) { setError('Ingresá el código completo del mail.'); return; }
      setBusy(true);
      const res = await verifyOtp(email, code);
      setBusy(false);
      if (res.error) { setError(res.error); return; }
      onDone(); // verifyOtp deja la sesión iniciada
    };

    const resend = async () => {
      reset();
      const res = await resendCode(email);
      setInfo(res.error ? res.error : 'Código reenviado. Revisá tu mail.');
    };

    return (
      <View style={styles.wrap}>
        <Text style={styles.codeTitle}>Revisá tu mail 📬</Text>
        <Text style={styles.codeSub}>
          Te enviamos un código a <Text style={styles.code}>{email.trim()}</Text>. Ingresalo para confirmar tu cuenta.
        </Text>

        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 8))}
          placeholder="––––––"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
          maxLength={8}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {info && <Text style={styles.info}>{info}</Text>}

        <TouchableOpacity style={[styles.submitBtn, busy && { opacity: 0.6 }]} onPress={submitCode} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Confirmar cuenta</Text>}
        </TouchableOpacity>

        <View style={styles.linksRow}>
          <TouchableOpacity onPress={resend}><Text style={styles.link}>Reenviar código</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep('form'); setCode(''); reset(); }}>
            <Text style={styles.link}>Usar otro email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- Paso: login / registro ---
  const submitForm = async () => {
    reset();
    if (!email.trim() || password.length < 6) {
      setError('Ingresá un email y una contraseña de 6+ caracteres.');
      return;
    }
    if (mode === 'signup' && username.trim().length < 2) {
      setError('Elegí un nombre de usuario (mínimo 2 caracteres).');
      return;
    }
    setBusy(true);
    if (mode === 'signup') {
      const res = await signUp(email, password, username);
      setBusy(false);
      if (res.error) { setError(res.error); return; }
      setStep('code');
      setInfo(null);
    } else {
      const res = await signIn(email, password);
      setBusy(false);
      if (res.needsConfirm) {
        await resendCode(email);
        setStep('code');
        setInfo('Tu cuenta no estaba confirmada — te enviamos un código.');
        return;
      }
      if (res.error) { setError(res.error); return; }
      onDone();
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'login' && { backgroundColor: Dayxo.purple }]}
          onPress={() => switchMode('login')}
        >
          <Text style={[styles.toggleText, mode === 'login' && styles.toggleTextActive]}>Iniciar sesión</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'signup' && { backgroundColor: Dayxo.orange }]}
          onPress={() => switchMode('signup')}
        >
          <Text style={[styles.toggleText, mode === 'signup' && styles.toggleTextActive]}>Crear cuenta</Text>
        </TouchableOpacity>
      </View>

      {mode === 'signup' && (
        <>
          <Text style={styles.label}>NOMBRE DE USUARIO</Text>
          <TextInput
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            placeholder="Cómo te van a ver los demás"
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="words"
            autoCorrect={false}
            maxLength={24}
          />
        </>
      )}

      <Text style={[styles.label, mode === 'signup' && { marginTop: 14 }]}>EMAIL</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="tucorreo@email.com"
        placeholderTextColor={colors.textTertiary}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        textContentType="emailAddress"
      />

      <Text style={[styles.label, { marginTop: 14 }]}>CONTRASEÑA</Text>
      <View style={styles.passwordWrap}>
        <TextInput
          style={[styles.input, { paddingRight: 48 }]}
          value={password}
          onChangeText={setPassword}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor={colors.textTertiary}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          spellCheck={false}
          textContentType="password"
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPressIn={() => setShowPassword(true)}
          onPressOut={() => setShowPassword(false)}
          activeOpacity={1}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {info && <Text style={styles.info}>{info}</Text>}

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={submitForm}
        disabled={busy}
        style={[styles.submitWrap, { shadowColor: accent }, busy && { opacity: 0.6 }]}
      >
        {mode === 'signup' ? (
          <LinearGradient colors={['#FF6B00', '#FF8C42']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.submitBtn}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Crear cuenta y arrancar →</Text>}
          </LinearGradient>
        ) : (
          <View style={[styles.submitBtn, { backgroundColor: Dayxo.purple }]}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Entrar</Text>}
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.switchRow}
        onPress={() => switchMode(mode === 'login' ? 'signup' : 'login')}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.switchText}>
          {mode === 'login' ? '¿No tenés cuenta? ' : '¿Ya tenés cuenta? '}
          <Text style={[styles.switchLink, { color: accent }]}>
            {mode === 'login' ? 'Crear cuenta' : 'Iniciar sesión'}
          </Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { paddingHorizontal: 18, paddingTop: 8 },
  toggle: { flexDirection: 'row', gap: 6, backgroundColor: colors.grayVeryLight, borderRadius: 12, padding: 4, marginBottom: 18 },
  toggleBtn: { flex: 1, borderRadius: 9, paddingVertical: 10, alignItems: 'center' },
  toggleText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  toggleTextActive: { color: '#fff' },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5, marginBottom: 8 },
  input: {
    backgroundColor: colors.inputBg, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 16, fontFamily: 'Inter_400Regular', color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  passwordWrap: { position: 'relative', justifyContent: 'center' },
  eyeBtn: { position: 'absolute', right: 4, top: 0, bottom: 0, width: 44, alignItems: 'center', justifyContent: 'center' },
  error: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.error, marginTop: 14 },
  info: { fontSize: 13, fontFamily: 'Inter_500Medium', color: Dayxo.green, marginTop: 14, lineHeight: 18 },
  submitWrap: {
    marginTop: 20, borderRadius: 14,
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 6,
  },
  submitBtn: { borderRadius: 14, paddingVertical: 15, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  switchRow: { marginTop: 16, alignItems: 'center' },
  switchText: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary },
  switchLink: { fontFamily: 'Inter_700Bold' },

  // Paso código
  codeTitle: { fontSize: 18, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary },
  codeSub: { fontSize: 13, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 6, lineHeight: 19 },
  codeInput: {
    backgroundColor: colors.inputBg, borderRadius: 12, paddingVertical: 14, marginTop: 18,
    fontSize: 26, fontFamily: 'Inter_800ExtraBold', color: colors.textPrimary, textAlign: 'center',
    letterSpacing: 5, borderWidth: 1, borderColor: colors.border,
  },
  linksRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  link: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: Dayxo.purple },

  loggedCard: {
    backgroundColor: colors.card, borderRadius: 16, padding: 18, alignItems: 'center',
    borderWidth: 1, borderColor: colors.border,
  },
  loggedIcon: { marginBottom: 6 },
  loggedLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary },
  loggedEmail: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginTop: 4 },
  note: { fontSize: 12, fontFamily: 'Inter_400Regular', color: colors.textSecondary, lineHeight: 18, marginTop: 14 },
  code: { fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  outlineBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, marginTop: 18,
    borderWidth: 1, borderColor: colors.error + '55',
  },
  outlineBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
