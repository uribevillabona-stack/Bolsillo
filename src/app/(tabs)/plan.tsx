/**
 * Plan: topes del mes por categoría y Apartados (metas de ahorro).
 *
 * Una sola columna editorial con divisores, no una grilla de tarjetas. El
 * coral aparece solo donde hay alerta de gasto (80 % o más).
 */
import { router, type Href } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountText,
  Button,
  PiggyBankIcon,
  type Icon,
  PlusIcon,
  ProgressBar,
  ProgressRing,
  Screen,
  Text,
} from '@/components';
import { PressableScale } from '@/components/PressableScale';
import { QUICK_ADD_BUTTON_CLEARANCE } from '@/components/QuickAddButton';
import type { Goal } from '@/db/schema';
import type { BudgetLine } from '@/features/budget/budget-logic';
import { percentLabel } from '@/features/budget/budget-logic';
import { BudgetSheet, type BudgetSheetTarget } from '@/features/budget/BudgetSheet';
import { iconFor } from '@/features/categories/category-icons';
import { paceSentence } from '@/features/goals/goal-logic';
import { GoalSheet } from '@/features/goals/GoalSheet';
import { useMonthOverview } from '@/features/overview/use-month-overview';
import { daysLeftLabel, monthName } from '@/lib/dates';
import { formatCOP, spokenCOP } from '@/lib/money';
import { useNow } from '@/lib/use-now';
import { hairline, space, useTheme } from '@/theme';

export default function PlanScreen() {
  const { colors } = useTheme();
  const now = useNow();
  const { loaded, budgets, spent, lastMonthSpent, goals, totals } = useMonthOverview(now);
  const [budgetTarget, setBudgetTarget] = useState<BudgetSheetTarget>(null);
  const [goalTarget, setGoalTarget] = useState<Goal | 'new' | null>(null);

  const totalLimit = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);
  const taken = new Set(budgets.map((b) => b.categoryId));

  return (
    <Screen bottomInset={QUICK_ADD_BUTTON_CLEARANCE}>
      <Text variant="display" accessibilityRole="header">
        Plan
      </Text>
      <Text variant="overline" tone="inkMuted" style={styles.subtitle}>
        {monthName(now)} · {daysLeftLabel(now)}
      </Text>

      {/* Presupuesto */}
      <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
        <View style={styles.sectionHead}>
          <Text variant="title" accessibilityRole="header" style={styles.flex}>
            Topes del mes
          </Text>
          {budgets.length > 0 ? (
            <Text variant="caption" tone="inkMuted">
              {formatCOP(totalSpent)} de {formatCOP(totalLimit)}
            </Text>
          ) : null}
        </View>

        {budgets.length === 0 ? (
          <Text variant="body" tone="inkMuted" style={styles.lead}>
            Ponle un tope a lo que más se te va. Te avisamos con calma cuando vayas en el 80 %;
            nunca te bloqueamos un gasto.
          </Text>
        ) : (
          <View>
            {budgets.map((line, i) => (
              <BudgetRow
                key={line.id}
                line={line}
                divider={i < budgets.length - 1}
                onPress={() => setBudgetTarget({ mode: 'edit', line })}
              />
            ))}
          </View>
        )}

        <Button
          label={budgets.length === 0 ? 'Poner mi primer tope' : 'Tope para otra categoría'}
          variant="outline"
          icon={PlusIcon}
          onPress={() => setBudgetTarget({ mode: 'new' })}
        />
      </View>

      {/* Apartados */}
      <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
        <View style={styles.sectionHead}>
          <Text variant="title" accessibilityRole="header" style={styles.flex}>
            Apartados
          </Text>
          {totals.savedToGoals !== 0 ? (
            <Text variant="caption" tone="inkMuted">
              {totals.savedToGoals > 0
                ? `${formatCOP(totals.savedToGoals)} este mes`
                : `${formatCOP(-totals.savedToGoals)} retirados este mes`}
            </Text>
          ) : null}
        </View>

        {!loaded ? null : goals.length === 0 ? (
          <Text variant="body" tone="inkMuted" style={styles.lead}>
            Plata separada para algo concreto: el viaje, el portátil, la matrícula. Lo que separas
            sale de tu disponible del mes, así no te lo gastas sin darte cuenta.
          </Text>
        ) : (
          <View>
            {goals.map(({ goal, progress }, i) => (
              <PressableScale
                key={goal.id}
                onPress={() => router.push(`/apartado/${goal.id}` as Href)}
                scaleTo={0.99}
                accessibilityRole="button"
                accessibilityLabel={`${goal.name}. ${spokenCOP(progress.saved)} de ${spokenCOP(goal.targetAmount)}.`}
                accessibilityHint="Abre el Apartado para aportar o retirar"
                style={[
                  styles.goalRow,
                  i < goals.length - 1 && {
                    borderBottomWidth: hairline,
                    borderBottomColor: colors.line,
                  },
                ]}>
                <ProgressRing
                  progress={progress.ratio}
                  size={56}
                  strokeWidth={5}
                  tone={progress.completed ? 'butter' : 'primary'}
                  accessibilityLabel={`${Math.floor(progress.ratio * 100)} % de ${goal.name}`}>
                  {progress.completed ? (
                    <PiggyBankIcon size={22} color={colors.ink} />
                  ) : (
                    <Text variant="caption" style={styles.ringText}>
                      {Math.floor(progress.ratio * 100)}%
                    </Text>
                  )}
                </ProgressRing>
                <View style={styles.flex}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {goal.name}
                  </Text>
                  <Text variant="caption" tone="inkMuted">
                    {formatCOP(progress.saved)} de {formatCOP(goal.targetAmount)}
                  </Text>
                  <Text variant="caption" tone="inkMuted" numberOfLines={2}>
                    {paceSentence(goal, progress, now, formatCOP)}
                  </Text>
                </View>
              </PressableScale>
            ))}
          </View>
        )}

        <Button
          label="Nuevo Apartado"
          variant="outline"
          icon={PlusIcon}
          onPress={() => setGoalTarget('new')}
        />
      </View>

      <BudgetSheet
        target={budgetTarget}
        onClose={() => setBudgetTarget(null)}
        takenCategoryIds={taken}
        spentThisMonth={spent}
        spentLastMonth={lastMonthSpent}
      />
      <GoalSheet target={goalTarget} onClose={() => setGoalTarget(null)} />
    </Screen>
  );
}

function BudgetRow({
  line,
  divider,
  onPress,
}: {
  line: BudgetLine;
  divider: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const alert = line.status !== 'ok';
  // Mismo texto en pantalla y para TalkBack, pero los montos hablados con
  // spokenCOP ("8000 pesos"): "$ 8.000" se lee mal con algunos motores de voz.
  const status = (fmt: (n: number) => string) =>
    line.status === 'over'
      ? line.overBy > 0
        ? `Te pasaste ${fmt(line.overBy)}`
        : 'Llegaste al tope'
      : `Te quedan ${fmt(line.remaining)} · ${percentLabel(line.spent, line.limitAmount)}`;

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${line.categoryName}: ${spokenCOP(line.spent)} de ${spokenCOP(line.limitAmount)}. ${status(spokenCOP)}.`}
      accessibilityHint="Cambiar o quitar el tope"
      style={[
        styles.budgetRow,
        divider && { borderBottomWidth: hairline, borderBottomColor: colors.line },
      ]}>
      <View style={styles.budgetTop}>
        <Glyph icon={iconFor(line.categoryIcon)} color={colors.ink} />
        <Text variant="bodyStrong" numberOfLines={1} style={styles.flex}>
          {line.categoryName}
        </Text>
        <AmountText amount={line.spent} size="small" />
        <Text variant="caption" tone="inkMuted">
          / {formatCOP(line.limitAmount)}
        </Text>
      </View>
      <ProgressBar
        progress={line.ratio}
        tone={alert ? 'accent' : 'primary'}
        accessibilityLabel={`Presupuesto de ${line.categoryName}`}
      />
      <Text variant="caption" tone={alert ? 'accentText' : 'inkMuted'}>
        {status(formatCOP)}
      </Text>
    </PressableScale>
  );
}

/** El ícono llega como prop: crear el componente en el render rompe la memoización. */
function Glyph({ icon: IconComponent, color }: { icon: Icon; color: string }) {
  return <IconComponent size={20} color={color} />;
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  subtitle: {
    marginTop: space[1],
  },
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[3],
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space[3],
  },
  lead: {
    maxWidth: 340,
  },
  budgetRow: {
    paddingVertical: space[4],
    gap: space[2],
  },
  budgetTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[2],
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    paddingVertical: space[4],
  },
  ringText: {
    fontVariant: ['tabular-nums'],
  },
});
