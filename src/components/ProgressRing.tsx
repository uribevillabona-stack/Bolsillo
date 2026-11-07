/**
 * Anillo de progreso: avance de un Apartado, presupuesto usado, lección.
 *
 * El trazo se anima hasta el valor nuevo (orienta: "subió" o "bajó"). Si el
 * progreso supera 1 (presupuesto pasado), el anillo queda completo en coral.
 */
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { duration, useTheme, type ColorTokens } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Con lector de pantalla, el anillo se describe con su etiqueta. Si va dentro
 * de una fila tocable que ya lo dice todo, `decorative` lo oculta para no
 * crear una parada de foco repetida.
 */
type ProgressA11y =
  | {
      /** El anillo solo no dice nada a un lector de pantalla. */
      accessibilityLabel: string;
      decorative?: false;
    }
  | { decorative: true; accessibilityLabel?: undefined };

export type ProgressRingProps = ProgressRingBaseProps & ProgressA11y;

interface ProgressRingBaseProps {
  /** 0 a 1. Valores mayores a 1 se muestran como excedido. */
  progress: number;
  size?: number;
  strokeWidth?: number;
  tone?: keyof Pick<ColorTokens, 'primary' | 'accent' | 'butter'>;
  /** Contenido centrado (porcentaje, ícono). */
  children?: ReactNode;
}

export function ProgressRing({
  progress,
  size = 72,
  strokeWidth = 6,
  tone = 'primary',
  children,
  accessibilityLabel,
  decorative = false,
}: ProgressRingProps) {
  const { colors } = useTheme();
  const reduceMotion = useReducedMotion();
  const exceeded = progress > 1;
  const clamped = Math.max(0, Math.min(progress, 1));

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const animated = useSharedValue(reduceMotion ? clamped : 0);

  useEffect(() => {
    animated.set(reduceMotion ? clamped : withTiming(clamped, { duration: duration.base * 2 }));
  }, [animated, clamped, reduceMotion]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.get()),
  }));

  return (
    <View
      style={{ width: size, height: size }}
      {...(decorative
        ? { accessible: false, importantForAccessibility: 'no-hide-descendants' as const }
        : {
            accessible: true,
            accessibilityRole: 'progressbar' as const,
            accessibilityLabel,
            accessibilityValue: { min: 0, max: 100, now: Math.round(clamped * 100) },
          })}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.line}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors[exceeded ? 'accent' : tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
          // Empieza arriba (12 en punto), no a la derecha.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
