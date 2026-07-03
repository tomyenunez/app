import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { initials } from '../../utils/formatters';
import { GroupMember } from './types';

const MAX_AVATARS = 6;

interface Props {
  name: string;
  emoji: string;
  gradient: [string, string];
  createdBy: string;
  createdAt: string;     // "hace 3 semanas"
  isAdmin: boolean;
  members: GroupMember[];
  onInvite: () => void;
  onBack: () => void;
  onSettings: () => void;
  onLeave: () => void;
}

// Portada del grupo, alineada a la estética Dayxo (misma familia que la de
// gastos compartidos): gradiente con esquinas inferiores redondeadas, contenido
// centrado (emoji grande + nombre + meta) y los miembros integrados a la
// portada con el botón Invitar.
export function GroupCover({
  name, emoji, gradient, createdBy, createdAt, isAdmin, members,
  onInvite, onBack, onSettings, onLeave,
}: Props) {
  const shown = members.slice(0, MAX_AVATARS);
  const extra = members.length - shown.length;

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.wrap}>
      {/* Velo suave para que el texto blanco respire sobre gradientes claros */}
      <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.30)']} style={StyleSheet.absoluteFill} />

      {/* Botones flotantes */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={isAdmin ? onSettings : onLeave} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={isAdmin ? 'settings-sharp' : 'exit-outline'} size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Identidad centrada */}
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <Text style={styles.meta} numberOfLines={1}>
        Creado por {createdBy} · {createdAt}
      </Text>

      {/* Miembros + invitar, integrados a la portada */}
      <View style={styles.avatarsRow}>
        {shown.map((m, i) => (
          <View
            key={m.userId}
            style={[styles.avatar, { backgroundColor: m.avatarColor, marginLeft: i === 0 ? 0 : -8 }]}
          >
            <Text style={styles.avatarTxt}>{initials(m.username)}</Text>
          </View>
        ))}
        {extra > 0 && <Text style={styles.moreTxt}>+{extra}</Text>}
        <TouchableOpacity style={styles.inviteBtn} onPress={onInvite} activeOpacity={0.8}>
          <Ionicons name="person-add" size={14} color="#fff" />
          <Text style={styles.inviteTxt}>Invitar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16, paddingBottom: 20,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  // Dentro de una pageSheet el SafeArea no suma margen: el aire lo ponemos a mano.
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.30)', alignItems: 'center', justifyContent: 'center',
  },
  emoji: { fontSize: 40, textAlign: 'center', marginTop: 4 },
  name: { fontSize: 22, fontFamily: 'Inter_800ExtraBold', color: '#fff', textAlign: 'center', marginTop: 4 },
  meta: { fontSize: 12, fontFamily: 'Inter_600SemiBold', color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 2 },
  avatarsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  avatar: {
    width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  avatarTxt: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  moreTxt: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff', marginLeft: 6 },
  inviteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.30)', borderRadius: 999,
    paddingHorizontal: 13, paddingVertical: 8, marginLeft: 10,
  },
  inviteTxt: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#fff' },
});
