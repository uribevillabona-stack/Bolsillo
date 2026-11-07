/**
 * Monto en COP. Es el protagonista visual de la app.
 *
 * - Siempre recibe un entero en pesos y lo formatea como `$ 12.500`.
 * - Usa cifras tabulares para que los números no cambien de ancho.
 * - El símbolo `$` se dibuja más pequeño y en tono secundario: el ojo va
 *   directo a la cifra (recurso editorial).
 * - Nunca se parte en dos líneas: si no cabe (montos grandes o tamaño de
 *   letra del sistema aumentado), el texto se reduce para caber en el ancho.
 * - El lector de pantalla oye "12500 pesos", no "dólar doce punto quinientos".
 */
import type { StyleProp, TextStyle } from 'react-native';

import { formatCOP, spokenCOP } from '@/lib/money';
import { textStyles, useTheme } from '@/theme';

import { Text, type TextTone } from './Text';

type AmountSize = 'hero' | 'large' | 'medium' | 'small';

const variantBySize = {
  hero: 'amountHero',
  large: 'amountLarge',
  medium: 'amountMedium',
  small: 'amountSmall',
} as const;

/** Proporción del `$` frente a la cifra en cada tamaño. */
const currencyScale: Record<AmountSize, number> = {
  hero: 0.42,
  large: 0.5,
  medium: 0.66,
  small: 1,
};

export interface AmountTextProps {
  /** Monto entero en pesos. Negativo = egreso. */
  amount: number;
  size?: AmountSize;
  tone?: TextTone;
  /** Muestra `+` en positivos (ingresos). */
  signed?: boolean;
  style?: StyleProp<TextStyle>;
  testID?: string;
}

export function AmountText({
  amount,
  size = 'medium',
  tone = 'ink',
  signed = false,
  style,
  testID,
}: AmountTextProps) {
  const { colors } = useTheme();
  const variant = variantBySize[size];
  const a11y = { accessibilityLabel: spokenCOP(amount), testID };

  // En tamaño pequeño el monto va en línea con texto: sin jerarquía interna.
  if (size === 'small') {
    return (
      <Text variant={variant} tone={tone} style={style} {...a11y}>
        {formatCOP(amount, { signed })}
      </Text>
    );
  }

  const formatted = formatCOP(amount, { signed, bare: true });
  const sign = formatted.startsWith('−') || formatted.startsWith('+') ? formatted[0] : '';
  const digits = sign ? formatted.slice(1) : formatted;
  const currencyColor = tone === 'ink' ? colors.inkMuted : colors[tone];

  // Un solo Text con spans anidados: comparten línea base y se encogen juntos.
  return (
    <Text
      variant={variant}
      tone={tone}
      numberOfLines={1}
      adjustsFontSizeToFit
      minimumFontScale={0.4}
      style={style}
      {...a11y}>
      {sign}
      <Text
        variant={variant}
        style={{
          color: currencyColor,
          fontSize: Math.round(textStyles[variant].fontSize * currencyScale[size]),
          letterSpacing: 0,
        }}>
        {'$ '}
      </Text>
      {digits}
    </Text>
  );
}
