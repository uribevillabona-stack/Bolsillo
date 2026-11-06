/**
 * Fila de lista: movimientos, ajustes, lecciones.
 *
 * Estructura editorial: ícono discreto a la izquierda, título + subtítulo,
 * y a la derecha un monto o un valor. Separadas por un divisor de 1px, no
 * por tarjetas.
 */
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { hairline, minTouchTarget, space, useTheme } from '@/theme';

import { AmountText } from './AmountText';
import { CaretRightIcon, type Icon } from './icons';
import { PressableScale } from './PressableScale';
import { Text } from './Text';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  icon?: Icon;
  /** Monto a la derecha (entero COP). Negativo = egreso. */
  amount?: number;
  /** Texto a la derecha, si no hay monto. */
  value?: string;
  /** Contenido libre a la derecha (switch, insignia). */
  trailing?: ReactNode;
  onPress?: () => void;
  /** Muestra el divisor inferior. */
  divider?: boolean;
  accessibilityHint?: string;
  testID?: string;
}

export function ListRow({
  title,
  subtitle,
  icon: IconComponent,
  amount,
  value,
  trailing,
  onPress,
  divider = true,
  accessibilityHint,
  testID,
}: ListRowProps) {
  const { colors } = useTheme();

  const body = (
    <View
      style={[
        styles.row,
        divider && { borderBottomWidth: hairline, borderBottomColor: colors.line },
      ]}>
      {IconComponent ? (
        <View style={[styles.icon, { borderColor: colors.line }]}>
          <IconComponent size={20} color={colors.ink} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="inkMuted" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {amount !== undefined ? <AmountText amount={amount} size="small" /> : null}
      {value !== undefined ? (
        <Text variant="label" tone="inkMuted">
          {value}
        </Text>
      ) : null}
      {trailing}
      {onPress && !trailing ? <CaretRightIcon size={16} color={colors.inkMuted} /> : null}
    </View>
  );

  if (!onPress) {
    return (
      <View
        testID={testID}
        accessible
        accessibilityLabel={[title, subtitle].filter(Boolean).join(', ')}>
        {body}
      </View>
    );
  }

  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}>
      {body}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: minTouchTarget + 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    paddingVertical: space[3],
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
