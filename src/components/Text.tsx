/**
 * Texto base del design system. Toda la tipografía de la app pasa por aquí,
 * para que la escala, el color por rol y el límite de escalado por
 * accesibilidad sean consistentes.
 */
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { maxFontScale, textStyles, useTheme, type ColorTokens, type TextVariant } from '@/theme';

export type TextTone = keyof Pick<
  ColorTokens,
  'ink' | 'inkMuted' | 'primary' | 'accentText' | 'onPrimary' | 'onAccent' | 'onButter'
>;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({ variant = 'body', tone = 'ink', style, ...rest }: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontScale[variant]}
      style={[textStyles[variant], { color: colors[tone] }, style]}
      {...rest}
    />
  );
}
