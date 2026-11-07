/**
 * Inicio. Solo lo esencial: saldo disponible del mes, gasto de hoy,
 * pendientes por confirmar, una recomendación y la próxima lección.
 * La recomendación sale del motor de reglas locales (features/recommendations).
 */
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AmountText, GearSixIcon, Screen, Text } from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { QUICK_ADD_BUTTON_CLEARANCE } from '@/components/QuickAddButton';
import { useMonthOverview } from '@/features/overview/use-month-overview';
import { NextLessonRow } from '@/features/learn/NextLessonRow';
import { useLearn } from '@/features/learn/use-learn';
import { RecommendationCard } from '@/features/recommendations/RecommendationCard';
import { daysLeftLabel, monthName } from '@/lib/dates';
import { formatCOP } from '@/lib/money';
import { AJUSTES_HREF } from '@/lib/routes';
import { useNow } from '@/lib/use-now';
import { hairline, minTouchTarget, space, useTheme } from '@/theme';

export default function InicioScreen() {
  const { colors } = useTheme();
  const now = useNow();
  const { loaded, profile, totals, recommendation, budgets, goals } = useMonthOverview(now);
  const { next } = useLearn(now, {
    tightBudget: budgets.find((b) => b.status !== 'ok')?.categoryName ?? null,
    goalsCount: goals.length,
  });
  const firstName = profile?.name.split(' ')[0];

  return (
    <Screen bottomInset={QUICK_ADD_BUTTON_CLEARANCE}>
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
        {captionFor(totals, profile?.monthlyIncomeEstimate ?? 0).map((line) => (
          <Text key={line} variant="caption" tone="inkMuted">
            {line}
          </Text>
        ))}
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

      {recommendation ? <RecommendationCard rec={recommendation} /> : null}
      {loaded && next ? <NextLessonRow next={next} /> : null}
    </Screen>
  );
}

/** Notas bajo el saldo: de dónde sale el número. */
function captionFor(
  totals: { usedIncomeEstimate: boolean; savedToGoals: number },
  estimate: number,
): string[] {
  const lines: string[] = [];
  if (totals.usedIncomeEstimate) {
    lines.push(`Con tu ingreso de referencia de ${formatCOP(estimate)}.`);
  }
  if (totals.savedToGoals > 0) {
    lines.push(`Ya descontamos ${formatCOP(totals.savedToGoals)} que separaste en Apartados.`);
  }
  return lines;
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
});
