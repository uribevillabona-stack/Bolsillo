/**
 * Inicio. Solo lo esencial: saldo disponible del mes, gasto de hoy,
 * pendientes por confirmar, una recomendación y (Fase 5) la próxima lección.
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText, GearSixIcon, Screen, Text } from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { TAB_BAR_HEIGHT } from '@/components/TabBar';
import { useProfile, useTransactionsBetween } from '@/db/hooks';
import { projectionSentence } from '@/features/expenses/hormigas-stats';
import { monthTotals } from '@/features/expenses/month-totals';
import { useHormigaSummary } from '@/features/expenses/use-hormigas';
import { daysLeftLabel, monthName, startOfMonth, startOfNextMonth } from '@/lib/dates';
import { formatCOP } from '@/lib/money';
import { AJUSTES_HREF } from '@/lib/routes';
import { useNow } from '@/lib/use-now';
import { hairline, minTouchTarget, space, useTheme } from '@/theme';

export default function InicioScreen() {
  const { colors } = useTheme();
  const now = useNow();
  const profile = useProfile();
  const rows = useTransactionsBetween(startOfMonth(now).getTime(), startOfNextMonth(now).getTime());
  const totals = monthTotals(rows, now, profile?.monthlyIncomeEstimate ?? 0);
  const hormigas = useHormigaSummary(now);
  const topHormiga = hormigas.categories.find((c) => c.annualProjection > 0);
  const firstName = profile?.name.split(' ')[0];

  return (
    <Screen bottomInset={TAB_BAR_HEIGHT}>
      <View style={styles.topRow}>
        <Text variant="overline" tone="inkMuted" style={styles.flex}>
          {monthName(now)} · {daysLeftLabel(now)}
        </Text>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Ajustes"
          onPress={() => router.push(AJUSTES_HREF)}
          style={styles.iconButton}>
          <GearSixIcon size={24} color={colors.ink} />
        </PressableScale>
      </View>

      <View style={styles.hero}>
        <Text variant="label" tone="inkMuted">
          {firstName ? `${firstName}, te quedan este mes` : 'Disponible este mes'}
        </Text>
        <AmountText
          amount={totals.available}
          size="hero"
          tone={totals.available < 0 ? 'accentText' : 'ink'}
          testID="saldo-mes"
        />
        {totals.usedIncomeEstimate ? (
          <Text variant="caption" tone="inkMuted">
            Con tu ingreso de referencia de {formatCOP(profile?.monthlyIncomeEstimate ?? 0)}.
          </Text>
        ) : null}
      </View>

      <View style={[styles.split, { borderColor: colors.line }]}>
        <View style={styles.splitCell}>
          <Text variant="caption" tone="inkMuted">
            Hoy
          </Text>
          <AmountText amount={totals.today} size="medium" />
        </View>
        <View style={[styles.splitCell, styles.splitRight, { borderLeftColor: colors.line }]}>
          <Text variant="caption" tone="inkMuted">
            Por confirmar
          </Text>
          <Text variant="amountMedium">0</Text>
        </View>
      </View>

      {rows.length === 0 ? (
        <View style={styles.block}>
          <Text variant="title">Arranca por lo pequeño.</Text>
          <Text variant="body" tone="inkMuted">
            Anota tu próximo tinto con el botón +. Con una semana de datos ya te podemos decir a
            dónde se te va la plata.
          </Text>
        </View>
      ) : topHormiga ? (
        <PressableScale
          onPress={() => router.push('/movimientos?vista=hormigas')}
          accessibilityRole="button"
          accessibilityHint="Abre la vista de gastos hormiga"
          scaleTo={0.99}
          style={[styles.block, styles.insight, { borderColor: colors.line }]}>
          <Text variant="overline" tone="inkMuted">
            Gastos hormiga
          </Text>
          <Text variant="title">{projectionSentence(topHormiga, formatCOP)}</Text>
          <Text variant="caption" tone="inkMuted">
            Llevas {formatCOP(hormigas.monthTotal)} en hormigas este mes.
          </Text>
        </PressableScale>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: minTouchTarget,
    height: minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -space[3],
  },
  hero: {
    marginTop: space[8],
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
  block: {
    marginTop: space[10],
    gap: space[2],
    maxWidth: 360,
  },
  insight: {
    borderTopWidth: hairline,
    paddingTop: space[4],
  },
});
