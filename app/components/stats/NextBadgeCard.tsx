import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';

export interface NextBadge {
  icon: string;
  name: string;
  description: string;
  color: string;
  current: number | null;
  target: number | null;
}

interface Props {
  badges: NextBadge[]; // hasta 2
}

// Card "Próximos logros": los próximos badges sin desbloquear (+ progreso si es medible).
export function NextBadgeCard({ badges }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Ionicons name="ribbon" size={16} color={Dayxo.purple} />
        <Text style={styles.title}>Próximos logros</Text>
      </View>

      {badges.length === 0 ? (
        <Text style={styles.allDone}>¡Desbloqueaste todos los logros! 🏆</Text>
      ) : (
        badges.map((b, i) => {
          const hasProg = b.current != null && b.target != null && b.target > 0;
          const ratio = hasProg ? Math.min(b.current! / b.target!, 1) : 0;
          return (
            <View key={i} style={[styles.item, i > 0 && styles.itemDivider]}>
              <View style={[styles.gem, { backgroundColor: b.color + '22' }]}>
                <Text style={styles.gemIcon}>{b.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={1}>{b.name}</Text>
                {hasProg ? (
                  <>
                    <View style={styles.track}>
                      <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: b.color }]} />
                    </View>
                    <Text style={styles.prog}>{Math.min(b.current!, b.target!)} / {b.target}</Text>
                  </>
                ) : (
                  <Text style={styles.desc} numberOfLines={2}>{b.description}</Text>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  allDone: { fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.textSecondary, lineHeight: 18, marginTop: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  itemDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  gem: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  gemIcon: { fontSize: 18 },
  name: { fontSize: 13, fontFamily: 'Inter_700Bold', color: colors.textPrimary },
  desc: { fontSize: 11, fontFamily: 'Inter_400Regular', color: colors.textSecondary, marginTop: 2, lineHeight: 15 },
  track: { height: 6, backgroundColor: colors.grayLight, borderRadius: 3, overflow: 'hidden', marginTop: 6 },
  fill: { height: 6, borderRadius: 3 },
  prog: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.textSecondary, marginTop: 4, textAlign: 'right' },
});
