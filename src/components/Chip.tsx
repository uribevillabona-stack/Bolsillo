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
}

export function Chip({
  label,
  onPress,
  selected = false,
  icon: IconComponent,
  amount,
  testID,
}: ChipProps) {
  const { colors } = useTheme();
  const fg = selected ? colors.bg : colors.ink;
  const a11yLabel = amount === undefined ? label : `${label}, ${spokenCOP(amount)}`;

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      accessibilityState={{ selected }}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? colors.ink : 'transparent',
          borderColor: selected ? colors.ink : colors.line,
        },
      ]}>
      <View style={styles.content}>
        {IconComponent ? <IconComponent size={18} color={fg} /> : null}
        <Text variant="label" style={{ color: fg }}>
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
