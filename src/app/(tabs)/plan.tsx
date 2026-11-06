/**
 * Plan: presupuesto del mes por categoría y Apartados (metas de ahorro).
 * Fase 4.
 */
import { StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { hairline, space, useTheme } from '@/theme';

export default function PlanScreen() {
  const { colors } = useTheme();

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT}>
      <Text variant="display" accessibilityRole="header">
        Plan
      </Text>

      <View style={[styles.section, { borderTopColor: colors.line }]}>
        <Text variant="overline" tone="inkMuted">
          Presupuesto del mes
        </Text>
        <Text variant="body" tone="inkMuted">
          Ponle un tope a cada categoría y te avisamos con calma cuando vayas en el 80 %.
        </Text>
      </View>

      <View style={[styles.section, { borderTopColor: colors.line }]}>
        <Text variant="overline" tone="inkMuted">
          Apartados
        </Text>
        <Text variant="body" tone="inkMuted">
          Plata separada para algo concreto: el viaje, el portátil, la matrícula.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[2],
    maxWidth: 340,
  },
});
