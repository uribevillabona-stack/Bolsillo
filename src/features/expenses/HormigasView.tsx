/**
 * Vista "Hormigas": total del mes, frecuencia por tipo y proyección anual.
 * El objetivo no es regañar sino hacer visible lo que no se ve: $ 2.500
 * diarios no se sienten, $ 913.000 al año sí.
 */
import { StyleSheet, View } from 'react-native';

import { AmountText, ListRow, Text } from '@/components';
import { iconFor } from '@/features/categories/category-icons';
import { formatCOP } from '@/lib/money';
import { useNow } from '@/lib/use-now';
import { hairline, space, useTheme } from '@/theme';

import { projectionSentence } from './hormigas-stats';
import { useHormigaSummary } from './use-hormigas';

export function HormigasView() {
  const { colors } = useTheme();
  const summary = useHormigaSummary(useNow());
  const top = summary.categories.find((c) => c.annualProjection > 0);

  if (summary.monthCount === 0 && !top) {
    return (
      <View style={styles.empty}>
        <Text variant="title">Cero hormigas. Por ahora.</Text>
        <Text variant="body" tone="inkMuted">
          Tintos, pasajes, recargas, snacks: lo pequeño que se repite. Cuando anotes unos cuantos,
          te mostramos cuánto suman al año.
        </Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.hero}>
        <Text variant="label" tone="inkMuted">
          En hormigas este mes
        </Text>
        <AmountText amount={summary.monthTotal} size="large" />
        <Text variant="caption" tone="inkMuted">
          {summary.monthCount} {summary.monthCount === 1 ? 'gasto pequeño' : 'gastos pequeños'}
        </Text>
      </View>

      {top ? (
        <View style={[styles.projection, { borderColor: colors.line }]}>
          <Text variant="title">{projectionSentence(top, formatCOP)}</Text>
          <Text variant="caption" tone="inkMuted">
            Todas tus hormigas juntas: {formatCOP(summary.annualProjection)} al año, calculado con
            tus últimos {summary.windowDays} días.
          </Text>
        </View>
      ) : null}

      <Text variant="overline" tone="inkMuted" style={styles.listTitle}>
        Por tipo
      </Text>
      {summary.categories.map((c, i) => (
        <ListRow
          key={String(c.categoryId)}
          title={c.name}
          subtitle={`${c.monthCount} ${c.monthCount === 1 ? 'vez' : 'veces'} este mes · ${formatCOP(c.annualProjection)} al año`}
          icon={iconFor(c.icon)}
          amount={c.monthTotal}
          divider={i < summary.categories.length - 1}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    marginTop: space[12],
    gap: space[2],
    maxWidth: 320,
  },
  hero: {
    marginTop: space[8],
    gap: space[1],
  },
  projection: {
    marginTop: space[6],
    paddingVertical: space[4],
    borderTopWidth: hairline,
    borderBottomWidth: hairline,
    gap: space[2],
  },
  listTitle: {
    marginTop: space[8],
    marginBottom: space[1],
  },
});
