import React, { useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AppColors } from '../constants/colors';
import { useGame } from '../context/GameContext';
import { useStreak } from '../hooks/useStreak';
import { ActivityGrid } from '../components/profile/ActivityGrid';
import { BadgeGrid } from '../components/profile/BadgeGrid';
import { RanksModal } from '../components/game/RanksModal';
import { initials } from '../utils/formatters';

const AVATAR_COLORS = ['#6C5CE7', '#00B894', '#E17055', '#0984E3', '#E84393', '#FDCB6E'];

export function ProfileScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const nav = useNavigation<any>();
  const { level, xpTotal, records, profile, setProfile, badges } = useGame();
  const streak = useStreak();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile.username);
  const [ranksVisible, setRanksVisible] = useState(false);

  const unlockedBadges = Object.keys(badges).length;

  const saveName = () => {
    setProfile({ ...profile, username: name.trim() || 'Eladio' });
    setEditing(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        {/* Header con botón volver */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => nav.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Mi perfil</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Avatar + nombre + nivel */}
        <View style={styles.headerCard}>
          <View style={[styles.avatar, { backgroundColor: profile.avatarColor }]}>
            <Text style={styles.avatarText}>{initials(profile.username)}</Text>
          </View>

          {editing ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                autoFocus
                maxLength={20}
                onSubmitEditing={saveName}
              />
              <TouchableOpacity onPress={saveName} style={styles.saveNameBtn}>
                <Ionicons name="checkmark" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.nameRow} onPress={() => { setName(profile.username); setEditing(true); }}>
              <Text style={styles.username}>{profile.username}</Text>
              <Ionicons name="pencil" size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          )}

          {/* Selector de color de avatar */}
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                onPress={() => setProfile({ ...profile, avatarColor: c })}
                style={[
                  styles.colorDot,
                  { backgroundColor: c },
                  profile.avatarColor === c && styles.colorDotSelected,
                ]}
              />
            ))}
          </View>

          {/* Rango + barra (tappable → modal de rangos) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setRanksVisible(true)}
            style={{ alignSelf: 'stretch', alignItems: 'center' }}
          >
            <View style={styles.levelRow}>
              <Text style={styles.levelIcon}>{level.icon}</Text>
              <Text style={styles.levelName}>Rango {level.level} · {level.name}</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
            </View>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${level.progress}%`, backgroundColor: level.color }]} />
            </View>
            <Text style={styles.xpTotal}>
              {Math.round(xpTotal).toLocaleString('es-AR')} XP{level.xpToNext > 0 ? ` · faltan ${Math.ceil(level.xpToNext).toLocaleString('es-AR')}` : ' · ¡rango máximo!'} · ver rangos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats rápidas */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🔥 {streak}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🏆 {records.bestStreak}</Text>
            <Text style={styles.statLabel}>Récord racha</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>⭐ {records.totalExtraStars}</Text>
            <Text style={styles.statLabel}>Estrellas extra</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🎖️ {unlockedBadges}</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Actividad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad — últimas 12 semanas</Text>
          <ActivityGrid />
        </View>

        {/* Badges */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Logros</Text>
          <BadgeGrid />
        </View>
      </ScrollView>

      <RanksModal visible={ranksVisible} onClose={() => setRanksVisible(false)} />
    </SafeAreaView>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  headerCard: {
    backgroundColor: colors.card,
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 30, fontFamily: 'Inter_800ExtraBold', color: '#fff' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  username: { fontSize: 22, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  nameInput: {
    fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.textPrimary,
    borderBottomWidth: 2, borderBottomColor: colors.violet, minWidth: 140, textAlign: 'center', paddingVertical: 2,
  },
  saveNameBtn: { backgroundColor: colors.violet, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  colorRow: { flexDirection: 'row', gap: 10, marginTop: 14 },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.textPrimary },
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 18 },
  levelIcon: { fontSize: 18 },
  levelName: { fontSize: 15, fontFamily: 'Inter_600SemiBold', color: colors.textPrimary },
  track: { height: 8, width: '80%', backgroundColor: colors.grayVeryLight, borderRadius: 4, overflow: 'hidden', marginTop: 8 },
  fill: { height: 8, borderRadius: 4 },
  xpTotal: { fontSize: 12, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 6 },
  statsRow: { flexDirection: 'row', gap: 8, margin: 14 },
  statBox: {
    flex: 1, backgroundColor: colors.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  statValue: { fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  statLabel: { fontSize: 10, fontFamily: 'Inter_500Medium', color: colors.textSecondary, marginTop: 3, textAlign: 'center' },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: 14, marginBottom: 14,
    borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary, marginBottom: 16 },
});
