/**
 * Texto base del design system. Toda la tipografía de la app pasa por aquí,
 * para que la escala, el color por rol y el límite de escalado por
 * accesibilidad sean consistentes.
 *
 * Si el texto trae montos embebidos ("Gastado $ 12.500") y no tiene etiqueta
 * propia, el lector de pantalla oye la versión hablada ("Gastado 12500
 * pesos"). Los textos sin montos no reciben etiqueta.
 */
import type { ReactNode } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { speakMoney } from '@/lib/money';
import { maxFontScale, textStyles, useTheme, type ColorTokens, type TextVariant } from '@/theme';

export type TextTone = keyof Pick<
  ColorTokens,
  'ink' | 'inkMuted' | 'primary' | 'accentText' | 'onPrimary' | 'onAccent' | 'onButter'
>;

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  tone?: TextTone;
}

export function Text({
  variant = 'body',
  tone = 'ink',
  style,
  accessibilityLabel,
  children,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontScale[variant]}
      style={[textStyles[variant], { color: colors[tone] }, style]}
      accessibilityLabel={accessibilityLabel ?? spokenMoneyLabel(children)}
      {...rest}>
      {children}
    </RNText>
  );
}

/**
 * Etiqueta hablada si `children` es texto plano (o varios trozos de texto) con
 * montos; `undefined` en cualquier otro caso, para no tocar el texto normal.
 */
function spokenMoneyLabel(children: ReactNode): string | undefined {
  const parts = Array.isArray(children) ? children : [children];
  let plain = '';
  for (const part of parts) {
    if (typeof part === 'string' || typeof part === 'number') plain += String(part);
    else if (part != null && typeof part !== 'boolean') return undefined; // hay elementos anidados
  }
  const spoken = speakMoney(plain);
  return spoken === plain ? undefined : spoken;
}
