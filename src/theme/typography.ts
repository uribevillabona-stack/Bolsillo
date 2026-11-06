/**
 * Tipografía de BOLSILLO.
 *
 * - Display (títulos y montos): Bricolage Grotesque.
 * - Texto: Geist.
 * - Cifras en tablas y teclado: Geist Mono.
 *
 * En Android cada peso es una familia distinta (`fontWeight` no elige el
 * archivo correcto con fuentes personalizadas), por eso cada estilo nombra su
 * familia exacta y nunca usa `fontWeight`.
 *
 * Los montos usan `tabular-nums` (Bricolage y Geist incluyen la función
 * OpenType `tnum`), para que "$ 11.111" y "$ 88.888" ocupen lo mismo y los
 * números no "bailen" al teclear.
 */
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
} from '@expo-google-fonts/bricolage-grotesque';
import { Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import type { TextStyle } from 'react-native';

/** Mapa para `useFonts`: la clave es el nombre de familia que usará RN. */
export const fontAssets = {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
  BricolageGrotesque_800ExtraBold,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  GeistMono_500Medium,
};

export const fontFamily = {
  displaySemi: 'BricolageGrotesque_600SemiBold',
  display: 'BricolageGrotesque_700Bold',
  displayHeavy: 'BricolageGrotesque_800ExtraBold',
  body: 'Geist_400Regular',
  bodyMedium: 'Geist_500Medium',
  bodySemi: 'Geist_600SemiBold',
  mono: 'GeistMono_500Medium',
} as const satisfies Record<string, keyof typeof fontAssets>;

const tabular: TextStyle['fontVariant'] = ['tabular-nums'];

/**
 * Escala tipográfica. Los tamaños grandes llevan `letterSpacing` negativo:
 * Bricolage se ve suelta en tamaños display si no se ajusta.
 */
export const textStyles = {
  /** Monto protagonista (saldo del mes, teclado). */
  amountHero: {
    fontFamily: fontFamily.displayHeavy,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -0.5, // más apretado pega el punto de miles al dígito
    fontVariant: tabular,
  },
  amountLarge: {
    fontFamily: fontFamily.display,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -0.4,
    fontVariant: tabular,
  },
  amountMedium: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.5,
    fontVariant: tabular,
  },
  amountSmall: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    lineHeight: 22,
    fontVariant: tabular,
  },
  display: {
    fontFamily: fontFamily.display,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
  },
  title: {
    fontFamily: fontFamily.displaySemi,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
  },
  body: {
    fontFamily: fontFamily.body,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyStrong: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 16,
    lineHeight: 24,
  },
  label: {
    fontFamily: fontFamily.bodyMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  caption: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 18,
  },
  /** Rótulos pequeños en mayúscula, estilo editorial ("ESTE MES"). */
  overline: {
    fontFamily: fontFamily.bodySemi,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  mono: {
    fontFamily: fontFamily.mono,
    fontSize: 15,
    lineHeight: 20,
    fontVariant: tabular,
  },
} as const satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof textStyles;

/**
 * Límite de escalado por accesibilidad. Respetamos el tamaño de fuente del
 * sistema, pero los montos gigantes se topan para no romper el layout
 * (64px × 2 desbordaría la pantalla).
 */
export const maxFontScale: Partial<Record<TextVariant, number>> = {
  amountHero: 1.3,
  amountLarge: 1.5,
  display: 1.6,
};
