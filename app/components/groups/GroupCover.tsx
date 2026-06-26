import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  name: string;
  emoji: string;
  gradient: [string, string];
  createdBy: string;
  createdAt: string;     // "hace 3 semanas"
  isAdmin: boolean;
  onBack: () => void;
  onSettings: () => void;
  onLeave: () => void;
}

// Portada del grupo (130px): gradiente personalizable + overlay oscuro abajo para
// legibilidad, botones flotantes (atrás / ⚙️ si admin, si no salir) y el ícono+nombre.
export function GroupCover({ name, emoji, gradient, createdBy, createdAt, isAdmin, onBack, onSettings, onLeave }: Props) {
  return (
    <View style={styles.wrap}>
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {/* Overlay para legibilidad del texto */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(13,13,15,0.75)']}
        style={StyleSheet.absoluteFill}
      />

      {/* Botones flotantes */}
      <TouchableOpacity style={[styles.floatBtn, styles.floatLeft]} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="arrow-back" size={22} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.floatBtn, styles.floatRight]} onPress={isAdmin ? onSettings : onLeave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name={isAdmin ? 'settings-sharp' : 'exit-outline'} size={20} color="#fff" />
      </TouchableOpacity>

      {/* Contenido abajo */}
      <View style={styles.content}>
        <View style={styles.iconBox}>
          <Text style={styles.iconEmoji}>{emoji}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={1}>{name}</Text>
          <Text style={styles.meta} numberOfLines={1}>Creado por {createdBy} · {createdAt}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: 130, justifyContent: 'flex-end', overflow: 'hidden' },
  floatBtn: {
    position: 'absolute', top: 12,
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center',
  },
  floatLeft: { left: 12 },
  floatRight: { right: 12 },
  content: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  iconBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  iconEmoji: { fontSize: 26 },
  name: { fontSize: 19, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  meta: { fontSize: 11, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.8)', marginTop: 2 },
});
