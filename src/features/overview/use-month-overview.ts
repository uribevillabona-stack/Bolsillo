/**
 * Todo lo del mes en un solo hook: totales, presupuesto, Apartados y la
 * recomendación. Lo usan Inicio y Plan, así los dos dicen lo mismo.
 */
import {
  useBudgets,
  useContributions,
  useDismissals,
  useGoals,
  useHasAnyMovement,
  useProfile,
  useTransactionsBetween,
} from '@/db/hooks';
import { budgetLines, spentByCategory } from '@/features/budget/budget-logic';
import { monthTotals } from '@/features/expenses/month-totals';
import { useHormigaSummary } from '@/features/expenses/use-hormigas';
import { goalProgress, netSavedInMonth } from '@/features/goals/goal-logic';
import { pickRecommendation } from '@/features/recommendations/recommendations';
import { addMonths, daysLeftInMonth, startOfMonth, startOfNextMonth } from '@/lib/dates';
import { formatCOP } from '@/lib/money';

export function useMonthOverview(now: Date) {
  const profile = useProfile();
  const monthFrom = startOfMonth(now).getTime();
  const monthTo = startOfNextMonth(now).getTime();
  const rows = useTransactionsBetween(monthFrom, monthTo);
  const lastMonthRows = useTransactionsBetween(addMonths(now, -1).getTime(), monthFrom);
  const budgetRows = useBudgets();
  const { goals, loaded: goalsLoaded } = useGoals();
  const { contributions, loaded: contributionsLoaded } = useContributions();
  const dismissedAt = useDismissals();
  const hasAnyMovement = useHasAnyMovement();
  const hormigas = useHormigaSummary(now);

  const totals = monthTotals(
    rows,
    now,
    profile?.monthlyIncomeEstimate ?? 0,
    netSavedInMonth(contributions, now),
  );
  const spent = spentByCategory(rows);
  const lastMonthSpent = spentByCategory(lastMonthRows);
  const budgets = budgetLines(budgetRows, spent);
  const goalsWithProgress = goals.map((goal) => ({
    goal,
    progress: goalProgress(goal, contributions, now),
  }));

  // Categoría con más gasto del mes (para sugerir el primer tope). Solo
  // egresos: una categoría de ingreso no tiene sentido como tope.
  let topCategory: { name: string; spent: number } | null = null;
  for (const r of rows) {
    if (r.categoryId === null || !r.categoryName) continue;
    const s = spent.get(r.categoryId) ?? 0;
    if (s > 0 && (!topCategory || s > topCategory.spent)) {
      topCategory = { name: r.categoryName, spent: s };
    }
  }

  // Hasta que lleguen las primeras lecturas no se decide nada (ni "no tienes
  // Apartados" ni "arranca por lo pequeño"): evita un parpadeo al abrir.
  const loaded = goalsLoaded && contributionsLoaded && hasAnyMovement !== undefined;

  const daysLeft = daysLeftInMonth(now);
  const recommendation = !loaded
    ? null
    : pickRecommendation(
        {
          now,
          daysLeft,
          totals,
          incomeBase: totals.incomeBase,
          monthExpenseCount: rows.filter((r) => r.type === 'expense').length,
          hasAnyMovement: hasAnyMovement ?? false,
          budgets,
          hormigas,
          goals: goalsWithProgress,
          topCategory,
          dismissedAt,
        },
        formatCOP,
      );

  return {
    loaded,
    profile,
    rows,
    totals,
    budgets,
    spent,
    lastMonthSpent,
    goals: goalsWithProgress,
    contributions,
    hormigas,
    daysLeft,
    recommendation,
  };
}
