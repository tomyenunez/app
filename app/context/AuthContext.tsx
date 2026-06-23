import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../services/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  verifyOtp: (email: string, token: string) => Promise<{ error: string | null }>;
  resendCode: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  signUp: async () => ({ error: null }),
  signIn: async () => ({ error: null, needsConfirm: false }),
  verifyOtp: async () => ({ error: null }),
  resendCode: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email: email.trim(), password });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    const needsConfirm = !!error && error.message.toLowerCase().includes('email not confirmed');
    return { error: error ? translateError(error.message) : null, needsConfirm };
  }, []);

  // Confirma la cuenta con el código de 6 dígitos del mail (deja la sesión iniciada)
  const verifyOtp = useCallback(async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: token.trim(), type: 'signup' });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const resendCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    return { error: error ? translateError(error.message) : null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signUp, signIn, verifyOtp, resendCode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

// Mensajes en español para los errores más comunes de Supabase Auth
function translateError(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email o contraseña incorrectos.';
  if (m.includes('already registered') || m.includes('already exists')) return 'Ya existe una cuenta con ese email.';
  if (m.includes('password should be at least')) return 'La contraseña es muy corta (mínimo 6 caracteres).';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'El email no es válido.';
  if (m.includes('token has expired') || m.includes('invalid') && m.includes('otp')) return 'El código es inválido o expiró. Pedí uno nuevo.';
  if (m.includes('email not confirmed')) return 'Tu cuenta todavía no está confirmada.';
  if (m.includes('for security purposes') || m.includes('rate limit') || m.includes('too many')) {
    return 'Demasiados intentos. Esperá unos segundos y probá de nuevo.';
  }
  if (m.includes('unexpected_failure') || m.includes('error sending') || m.includes('sending confirmation') || m.includes('"status":500')) {
    return 'No se pudo crear la cuenta: el sistema no pudo enviar el mail de confirmación. En modo de prueba solo se puede registrar tu propio email; para usar otros hay que verificar un dominio en Resend.';
  }
  if (m.includes('network') || m.includes('failed to fetch') || m.includes('fetch')) {
    return 'No se pudo conectar. Revisá tu internet o la configuración de Supabase.';
  }
  // Respuesta cruda / mensaje demasiado largo → algo limpio en vez del volcado completo
  if (msg.length > 140) return 'Algo salió mal. Probá de nuevo en unos segundos.';
  return msg;
}
