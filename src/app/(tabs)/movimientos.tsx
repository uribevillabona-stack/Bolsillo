/**
 * Movimientos: lista de todo lo registrado, con el filtro "Hormigas"
 * (total del mes, frecuencia por tipo y proyección anual en la Fase 2).
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Chip, Screen, Text } from '@/components';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { space } from '@/theme';

type Filter = 'todo' | 'hormigas';

export default function MovimientosScreen() {
  const [filter, setFilter] = useState<Filter>('todo');

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT}>
      <Text variant="display" accessibilityRole="header">
        Movimientos
      </Text>

      <View style={styles.filters} accessibilityRole="tablist">
        <Chip label="Todo" selected={filter === 'todo'} onPress={() => setFilter('todo')} />
        <Chip
          label="Hormigas"
          selected={filter === 'hormigas'}
          onPress={() => setFilter('hormigas')}
        />
      </View>

      <View style={styles.empty}>
        {filter === 'todo' ? (
          <>
            <Text variant="title">Nada por aquí todavía.</Text>
            <Text variant="body" tone="inkMuted">
              Lo que registres o detectemos de tus apps del banco aparece en esta lista.
            </Text>
          </>
        ) : (
          <>
            <Text variant="title">Cero hormigas. Por ahora.</Text>
            <Text variant="body" tone="inkMuted">
              Tintos, pasajes, recargas, snacks: lo pequeño que se repite. Cuando anotes unos
              cuantos, te mostramos cuánto suman al año.
            </Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[6],
  },
  empty: {
    marginTop: space[12],
    gap: space[2],
    maxWidth: 320,
  },
});
