/**
 * Chip seleccionable: atajos de gasto ("Tinto $ 2.500"), categorías y
 * filtros. Seleccionado = relleno de tinta; no seleccionado = borde de 1px.
 */
import { StyleSheet, View } from 'react-native';

import { formatCOP, spokenCOP } from '@/lib/money';
import { hairline, minTouchTarget, radius, space, useTheme } from '@/theme';

import type { Icon } from './icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  icon?: Icon;
  /** Monto predeterminado, para los atajos de gasto. */
  amount?: number;
  testID?: string;
  /** Qué pasa al tocarlo, si no es obvio por la etiqueta. */
  accessibilityHint?: string;
  /**
   * Rol para el lector de pantalla. Dentro de un grupo de opciones excluyentes
   * usar 'radio'; como filtro de vistas, 'tab'.
   */
  role?: 'button' | 'radio' | 'tab';
}

export function Chip({
  label,
  onPress,
  selected = false,
  icon: IconComponent,
  amount,
  testID,
  accessibilityHint,
  role = 'button',
}: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.bg : colors.ink;
  const a11yLabel = amount === undefined ? label : `${label}, ${spokenCOP(amount)}`;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={role}
      accessibilityLabel={a11yLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={role === 'radio' ? { checked: selected } : { selected }}
      // El chip mide 44 dp; con 2 dp arriba y abajo el área táctil llega a 48 dp.
      hitSlop={{ top: 2, bottom: 2 }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}>
      <View style={styles.content}>
        {IconComponent ? <IconComponent size={18} color={fg} /> : null}
        <Text variant="label" numberOfLines={1} style={{ color: fg }}>
          {label}
        </Text>
        {amount !== undefined ? (
          <Text
            variant="mono"
            style={[styles.amount, { color: selected ? colors.bg : colors.inkMuted }]}>
            {formatCOP(amount)}
          </Text>
        ) : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    // 44: mínimo táctil de accesibilidad; los chips van en filas densas.
    minHeight: minTouchTarget - 4,
    paddingHorizontal: space[3],
    borderRadius: radius.sm,
    borderWidth: hairline,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  amount: {
    fontSize: 13,
  },
});
