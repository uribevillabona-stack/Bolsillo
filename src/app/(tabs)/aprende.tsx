/**
 * Aprende: micro-lecciones conectadas con los datos del usuario (Fase 5).
 */
import { StyleSheet, View } from 'react-native';

import { Screen, Text } from '@/components';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { radius, space, useTheme } from '@/theme';

export default function AprendeScreen() {
  const { colors } = useTheme();

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT}>
      <Text variant="display" accessibilityRole="header">
        Aprende
      </Text>
      <Text variant="body" tone="inkMuted" style={styles.lead}>
        Lecciones de 3 a 5 minutos sobre tu propia plata. Sin sermones.
      </Text>

      {/* Amarillo mantequilla = aprendizaje y logros. Relleno, con texto en tinta. */}
      <View style={[styles.streak, { backgroundColor: colors.butter }]}>
        <Text variant="overline" tone="onButter">
          Racha semanal
        </Text>
        <Text variant="amountLarge" tone="onButter">
          0 semanas
        </Text>
        <Text variant="caption" tone="onButter">
          Completa una lección esta semana para empezarla.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: space[2],
    maxWidth: 300,
  },
  streak: {
    marginTop: space[8],
    padding: space[5],
    borderRadius: radius.md,
    gap: space[1],
  },
});
