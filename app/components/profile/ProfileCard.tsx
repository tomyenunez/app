import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { Dayxo } from '../../constants/dayxo';
import { useGame } from '../../context/GameContext';
import { initials } from '../../utils/formatters';

interface Props {
  onPress?: () => void; // abre el pop-up de editar perfil / ver rangos
}

// Hero de Stats: burbuja con gradiente de marca (igual que Home/Finanzas).
// Contenido en blanco; los acentos no cambian entre claro y oscuro.
export function ProfileCard({ onPress }: Props) {
  const { profile, level, xpTotal, reload } = useGame();
  const maxed = level.xpToNext <= 0;
  const nextMinXP = Math.round(xpTotal) + Math.ceil(level.xpToNext);

  // Refresca XP/nivel al enfocar la pantalla
  useFocusEffect(useCallback(() => { reload(); }, [reload]));

  return (
    <LinearGradient colors={[Dayxo.orange, Dayxo.purple]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.topRow}>
        {/* Avatar tappable → editar perfil */}
        <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.avatarWrap}>
          <View style={styles.avatarRing}>
            <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
              {profile.avatarUrl
                ? <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImg} />
                : <Text style={styles.avatarText}>{initials(profile.username)}</Text>}
            </View>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelBadgeText}>{level.icon}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>{profile.username}</Text>
          <Text style={styles.phrase} numberOfLines={2}>Pequeños hábitos, grandes cambios.</Text>
        </View>
      </View>

      {/* Card de nivel — barra de XP pronunciada */}
      <View style={styles.levelCard}>
        <View style={styles.levelHex}>
          <Text style={styles.levelHexIcon}>{level.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.levelTitle}>Nivel {level.level} · {level.name}</Text>
          <View style={styles.trackBig}>
            <View style={[styles.fillBig, { width: `${level.progress}%` }]} />
          </View>
          <Text style={styles.xpLine}>
            <Text style={styles.xpStrong}>{Math.round(xpTotal).toLocaleString('es-AR')} XP</Text>
            {maxed ? ' · ¡Nivel máximo!' : ` / ${nextMinXP.toLocaleString('es-AR')} XP para Nivel ${level.level + 1}`}
          </Text>
        </View>
        {!maxed && (
          <View style={styles.nextLvl}>
            <Text style={styles.nextLvlText}>{level.level + 1}</Text>
          </View>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    marginHorizontal: 14,
    marginTop: 8,
    padding: 18,
    shadowColor: Dayxo.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 5,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 76, height: 76 },
  avatarRing: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 3, borderColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatar: { width: 62, height: 62, borderRadius: 31, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg: { width: 62, height: 62, borderRadius: 31 },
  avatarText: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  levelBadge: {
    position: 'absolute', bottom: -2, right: -2,
    minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 5,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff',
  },
  levelBadgeText: { fontSize: 13 },
  identity: { flex: 1 },
  name: { fontSize: 24, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  phrase: { fontSize: 13, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  levelCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, padding: 14, marginTop: 16,
  },
  levelHex: { width: 46, height: 46, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  levelHexIcon: { fontSize: 22 },
  levelTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', color: '#fff', marginBottom: 8 },
  trackBig: { height: 12, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 6, overflow: 'hidden' },
  fillBig: { height: 12, borderRadius: 6, backgroundColor: '#fff' },
  xpLine: { fontSize: 12, fontFamily: 'Inter_500Medium', color: 'rgba(255,255,255,0.85)', marginTop: 8 },
  xpStrong: { fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  nextLvl: { width: 34, height: 34, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', alignItems: 'center', justifyContent: 'center' },
  nextLvlText: { fontSize: 15, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
});
