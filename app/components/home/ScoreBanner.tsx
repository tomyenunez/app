import React, { useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { AppColors } from '../../constants/colors';

interface Props {
  score: number; // puede superar 100 con bonus
  completed: number;
  total: number;
}

const SIZE = 72;
const STROKE = 6;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function ScoreBanner({ score, completed, total }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const animVal = useRef(new Animated.Value(0)).current;

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

  return (
    <View style={styles.banner}>
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
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={STROKE}
            fill="none"
          />
          <AnimatedCircle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            stroke="#fff"
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
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  banner: {
    backgroundColor: colors.scoreBg,
    borderRadius: 16,
    marginHorizontal: 14,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  left: { flex: 1 },
  scoreLabel: {
    color: '#C8C4FF',
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginBottom: 4,
  },
  scoreNumber: {
    color: '#fff',
    fontSize: 34,
    fontFamily: 'Inter_800ExtraBold',
    lineHeight: 38,
  },
  scoreSub: {
    color: '#B0A8F8',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 4,
  },
  right: { alignItems: 'center', justifyContent: 'center' },
  scoreCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreCenterText: {
    color: '#fff',
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
});
