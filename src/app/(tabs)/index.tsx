/**
 * Inicio. Solo lo esencial: saldo disponible del mes, gasto de hoy,
 * pendientes por confirmar, una recomendación y la próxima lección.
 *
 * Fase 1: estructura y estado vacío. Los datos reales llegan en la Fase 4.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText, Button, Screen, Text } from '@/components';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { daysLeftLabel, monthName } from '@/lib/dates';
import { hairline, space, useTheme } from '@/theme';

export default function InicioScreen() {
  const { colors } = useTheme();
  const today = new Date();

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT}>
      <Text variant="overline" tone="inkMuted">
        {monthName(today)} · {daysLeftLabel(today)}
      </Text>

      <View style={styles.hero}>
        <Text variant="label" tone="inkMuted">
          Disponible este mes
        </Text>
        <AmountText amount={0} size="hero" testID="saldo-mes" />
      </View>

      <View style={[styles.split, { borderColor: colors.line }]}>
        <View style={styles.splitCell}>
          <Text variant="caption" tone="inkMuted">
            Hoy
          </Text>
          <AmountText amount={0} size="medium" />
        </View>
        <View style={[styles.splitCell, styles.splitRight, { borderLeftColor: colors.line }]}>
          <Text variant="caption" tone="inkMuted">
            Por confirmar
          </Text>
          <Text variant="amountMedium">0</Text>
        </View>
      </View>

      <View style={styles.empty}>
        <Text variant="title">Arranca por lo pequeño.</Text>
        <Text variant="body" tone="inkMuted">
          Anota tu próximo tinto con el botón +. Con una semana de datos ya te podemos decir a dónde
          se te va la plata.
        </Text>
      </View>

      {__DEV__ ? (
        <Button
          label="Catálogo de componentes"
          variant="outline"
          onPress={() => router.push('/catalogo')}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginTop: space[10],
    gap: space[1],
  },
  split: {
    flexDirection: 'row',
    marginTop: space[8],
    borderTopWidth: hairline,
    borderBottomWidth: hairline,
  },
  splitCell: {
    flex: 1,
    paddingVertical: space[4],
    gap: space[1],
  },
  splitRight: {
    paddingLeft: space[4],
    borderLeftWidth: hairline,
  },
  empty: {
    marginTop: space[12],
    marginBottom: space[8],
    gap: space[2],
    maxWidth: 320,
  },
});
