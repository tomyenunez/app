import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';
import { GroupActivityFeedItem } from './types';
import { GroupFeedCard } from './GroupFeedCard';

// Punto naranja que late (opacity 1 → 0.3 → 1, loop 2s)
function PulsingDot() {
  const anim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);
  return <Animated.View style={[styles.dot, { opacity: anim }]} />;
}

interface Props {
  items: GroupActivityFeedItem[];
  onPressItem: (groupId: string) => void;
}

// Feed horizontal de novedades de todos los grupos del usuario (máx. 5-8).
export function GroupActivityFeed({ items, onPressItem }: Props) {
  const { colors } = useTheme();
  const labelStyles = useMemo(() => createStyles(colors), [colors]);
  if (items.length === 0) return null;

  return (
    <View style={labelStyles.wrap}>
      <View style={labelStyles.labelRow}>
        <Text style={labelStyles.label}>Novedades</Text>
        <PulsingDot />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={labelStyles.scroll}>
        {items.slice(0, 8).map((item) => (
          <GroupFeedCard key={item.id} item={item} onPress={() => onPressItem(item.groupId)} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Dayxo.orange },
});

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { marginBottom: 4 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 10 },
  label: { fontSize: 11, fontFamily: 'Inter_700Bold', color: colors.textSecondary, letterSpacing: 0.5 },
  scroll: { paddingRight: 6 },
});
