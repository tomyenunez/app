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

  const SIZE = compact ? 66 : 72;
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
        <View>
          <Text style={styles.scoreLabel} numberOfLines={1}>Score de hoy</Text>
          <Text style={styles.scoreNumber} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{score}%</Text>
        </View>
        <Text style={styles.scoreSub} numberOfLines={1}>
          {compact ? `${completed}/${total}` : `${completed} de ${total} completados`}
        </Text>
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
    padding: compact ? 16 : 20,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bannerPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  left: { flex: 1, justifyContent: 'space-between' },
  scoreLabel: {
    color: colors.textSecondary,
    fontSize: compact ? 13 : 12,
    fontFamily: 'Inter_600SemiBold',
  },
  scoreNumber: {
    color: Dayxo.orange,
    fontSize: compact ? 36 : 34,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: compact ? 40 : 38,
  },
  scoreSub: {
    color: colors.textSecondary,
    fontSize: compact ? 15 : 13,
    fontFamily: compact ? 'Inter_700Bold' : 'Inter_400Regular',
  },
  right: { alignSelf: 'center', alignItems: 'center', justifyContent: 'center' },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenterText: {
    color: Dayxo.orange,
    fontSize: compact ? 18 : 18,
    fontFamily: 'Inter_700Bold',
  },
});
