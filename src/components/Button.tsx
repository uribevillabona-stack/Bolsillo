/**
 * Botón del design system.
 *
 * Variantes (usar con intención):
 * - `primary`: acción principal de una pantalla (verde de marca).
 * - `accent`:  el CTA más importante de la app (guardar gasto). Coral.
 *              Máximo uno visible a la vez.
 * - `outline`: acción secundaria, borde de 1px.
 * - `quiet`:   acción terciaria, solo texto ("Ahora no").
 */
import { StyleSheet, View } from 'react-native';

import { haptics } from '@/lib/haptics';
import { hairline, minTouchTarget, radius, space, useTheme, type ColorTokens } from '@/theme';

import type { Icon } from './icons';
import { PressableScale } from './PressableScale';
import { Text, type TextTone } from './Text';

export type ButtonVariant = 'primary' | 'accent' | 'outline' | 'quiet';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: 'md' | 'lg';
  icon?: Icon;
  disabled?: boolean;
  /** Ocupa todo el ancho disponible. */
  block?: boolean;
  accessibilityHint?: string;
  /**
   * Si se define, el botón es una opción de un grupo excluyente (rol radio) y
   * el lector de pantalla anuncia si está elegida; no solo el color la marca.
   */
  selected?: boolean;
  testID?: string;
}

interface VariantStyle {
  background: keyof ColorTokens | 'transparent';
  border: keyof ColorTokens | 'transparent';
  text: TextTone;
}

const variants: Record<ButtonVariant, VariantStyle> = {
  primary: { background: 'primary', border: 'primary', text: 'onPrimary' },
  accent: { background: 'accent', border: 'accent', text: 'onAccent' },
  outline: { background: 'transparent', border: 'line', text: 'ink' },
  quiet: { background: 'transparent', border: 'transparent', text: 'ink' },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: IconComponent,
  disabled = false,
  block = false,
  accessibilityHint,
  selected,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const v = variants[variant];
  const resolve = (key: VariantStyle['background']) =>
    key === 'transparent' ? 'transparent' : colors[key];

  return (
    <PressableScale
      testID={testID}
      accessibilityRole={selected === undefined ? 'button' : 'radio'}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={selected === undefined ? { disabled } : { disabled, checked: selected }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={[
        styles.base,
        size === 'lg' && styles.large,
        block && styles.block,
        variant === 'quiet' && styles.quiet,
        {
          backgroundColor: resolve(v.background),
          borderColor: resolve(v.border),
          opacity: disabled ? 0.4 : 1,
        },
      ]}>
      <View style={styles.content}>
        {IconComponent ? <IconComponent size={20} color={colors[v.text]} weight="bold" /> : null}
        <Text variant="bodyStrong" tone={v.text}>
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    paddingHorizontal: space[5],
    borderRadius: radius.sm,
    borderWidth: hairline,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  large: {
    minHeight: 56,
    paddingHorizontal: space[6],
  },
  block: {
    alignSelf: 'stretch',
  },
  quiet: {
    paddingHorizontal: space[2],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
});
