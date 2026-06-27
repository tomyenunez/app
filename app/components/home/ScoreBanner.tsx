import React, { useEffect, useRef, useMemo } from 'react';
import { View, StyleSheet, Animated, Pressable, StyleProp, ViewStyle } from 'react-native';
import { AppText as Text } from '../shared/AppText';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';
import { Dayxo } from '../../constants/dayxo';

interface Props {
  score: number; // puede superar 100 con bonus
  completed: number;
  total: number;
  onPress?: () => void; // si se pasa, el card es tappable (abre el detalle del día)
  compact?: boolean;    // versión comprimida (al lado del cuadrado de Notas)
  style?: StyleProp<ViewStyle>; // override del contenedor (flex/height en el row)
}

const STROKE = 6;

export function ScoreBanner({ score, completed, total, onPress, compact, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors, !!compact), [colors, compact]);
  const animVal = useRef(new Animated.Value(0)).current;

  const SIZE = compact ? 56 : 72;
  const R = (SIZE - STROKE) / 2;
  const CIRCUMFERENCE = 2 * Math.PI * R;

  useEffect(() => {
    // El score puede pasar de 100 con bonus; el anillo se llena hasta 100 como máximo
    Animated.timing(animVal, {
      toValue: Math.min(score, 100) / 100,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [score]);

  const strokeDashoffset = animVal.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  const content = (
    <>
      <View style={styles.left}>
        <Text style={styles.scoreLabel}>Score de hoy</Text>
        <Text style={styles.scoreNumber}>{score}%</Text>
        <Text style={styles.scoreSub}>{completed} de {total} completados</Text>
      </View>
      <View style={styles.right}>
        <Svg width={SIZE} height={SIZE}>
          <Circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={colors.grayLight}
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke={Dayxo.orange}
            strokeWidth={STROKE}
            fill="none"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${SIZE / 2}, ${SIZE / 2}`}
          />
        </Svg>
        <View style={styles.scoreCenter}>
          <Text style={styles.scoreCenterText}>{score}</Text>
        </View>
      </View>
    </>
  );

  if (!onPress) {
    return <View style={[styles.banner, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.banner, style, pressed && styles.bannerPressed]}
    >
      {content}
    </Pressable>
  );
}

const createStyles = (colors: AppColors, compact: boolean) => StyleSheet.create({
  banner: {
    backgroundColor: colors.card,
    borderRadius: 18,
    marginHorizontal: compact ? 0 : 14,
    padding: compact ? 14 : 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  left: { flex: 1 },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: compact ? 11 : 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: compact ? 2 : 4,
  },
  scoreNumber: {
    color: Dayxo.orange,
    fontSize: compact ? 26 : 34,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: compact ? 30 : 38,
  },
  scoreSub: {
    color: colors.textSecondary,
    fontSize: compact ? 10 : 11,
    fontFamily: 'Inter_400Regular',
    marginTop: compact ? 2 : 4,
  },
  right: { alignItems: 'center', justifyContent: 'center' },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenterText: {
    color: Dayxo.orange,
    fontSize: compact ? 15 : 18,
    fontFamily: 'Inter_700Bold',
  },
});
