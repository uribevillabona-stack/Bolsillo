/**
 * Movimientos: todo lo registrado, agrupado por día y navegable por mes,
 * más la vista "Hormigas".
 */
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AmountText, Button, Chip, ListRow, Screen, Text } from '@/components';
import { QUICK_ADD_BUTTON_CLEARANCE } from '@/components/QuickAddButton';
import { useTransactionsBetween } from '@/db/hooks';
import { iconFor } from '@/features/categories/category-icons';
import { groupByDay, signedAmount } from '@/features/expenses/group-by-day';
import { HormigasView } from '@/features/expenses/HormigasView';
import { TransactionSheet } from '@/features/expenses/TransactionSheet';
import type { TransactionWithCategory } from '@/features/expenses/transactions-repo';
import { monthName, startOfMonth, startOfNextMonth, timeLabel } from '@/lib/dates';
import { formatCOP } from '@/lib/money';
import { useNow } from '@/lib/use-now';
import { space } from '@/theme';

type Vista = 'todo' | 'hormigas';

export default function MovimientosScreen() {
  const params = useLocalSearchParams<{ vista?: string }>();
  const requested: Vista = params.vista === 'hormigas' ? 'hormigas' : 'todo';

  // Si llega con ?vista=hormigas (desde Inicio), se respeta aunque la pestaña
  // ya estuviera montada.
  const [view, setView] = useState<Vista>(requested);
  const [lastRequested, setLastRequested] = useState(requested);
  if (requested !== lastRequested) {
    setLastRequested(requested);
    setView(requested);
  }

  return (
    <Screen bottomInset={QUICK_ADD_BUTTON_CLEARANCE}>
      <Text variant="display" accessibilityRole="header">
        Movimientos
      </Text>
      <View style={styles.filters} accessibilityRole="tablist">
        <Chip role="tab" label="Todo" selected={view === 'todo'} onPress={() => setView('todo')} />
        <Chip
          role="tab"
          label="Hormigas"
          selected={view === 'hormigas'}
          onPress={() => setView('hormigas')}
        />
      </View>
      {view === 'todo' ? <AllMovements /> : <HormigasView />}
    </Screen>
  );
}

function AllMovements() {
  const now = useNow();
  const [monthOffset, setMonthOffset] = useState(0);
  const [selected, setSelected] = useState<TransactionWithCategory | null>(null);
  const month = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  const rows = useTransactionsBetween(
    startOfMonth(month).getTime(),
    startOfNextMonth(month).getTime(),
  );
  const groups = groupByDay(rows, now);
  const spent = groups.reduce((sum, g) => sum + g.spent, 0);
  const sameYear = month.getFullYear() === now.getFullYear();
  const monthTitle = `${monthName(month)}${sameYear ? '' : ` ${month.getFullYear()}`}`;

  return (
    <View>
      <View style={styles.monthBar}>
        <Button
          label="Anterior"
          variant="quiet"
          onPress={() => setMonthOffset((o) => o - 1)}
          accessibilityHint="Muestra el mes anterior"
        />
        <View style={styles.monthTitle}>
          <Text variant="bodyStrong" accessibilityRole="header">
            {monthTitle[0]!.toUpperCase() + monthTitle.slice(1)}
          </Text>
          <Text variant="caption" tone="inkMuted">
            Gastado {formatCOP(spent)}
          </Text>
        </View>
        <Button
          label="Siguiente"
          variant="quiet"
          disabled={monthOffset === 0}
          onPress={() => setMonthOffset((o) => Math.min(0, o + 1))}
          accessibilityHint="Muestra el mes siguiente"
        />
      </View>

      {groups.length === 0 ? (
        <View style={styles.empty}>
          <Text variant="title">
            {monthOffset === 0 ? 'Nada por aquí todavía.' : 'Sin movimientos ese mes.'}
          </Text>
          <Text variant="body" tone="inkMuted">
            Lo que registres o detectemos de tus apps del banco aparece en esta lista.
          </Text>
        </View>
      ) : (
        groups.map((g) => (
          <View key={g.key} style={styles.group}>
            <View style={styles.groupHeader}>
              <Text variant="overline" tone="inkMuted" accessibilityRole="header">
                {g.label}
              </Text>
              {g.spent > 0 ? <AmountText amount={-g.spent} size="small" tone="inkMuted" /> : null}
            </View>
            {g.items.map((t, i) => (
              <ListRow
                key={t.id}
                title={t.categoryName ?? (t.note || 'Gasto')}
                subtitle={[timeLabel(new Date(t.occurredAt)), t.categoryName ? t.note : null]
                  .filter(Boolean)
                  .join(' · ')}
                icon={iconFor(t.categoryIcon)}
                amount={signedAmount(t)}
                divider={i < g.items.length - 1}
                onPress={() => setSelected(t)}
                accessibilityHint="Abre el detalle del movimiento"
              />
            ))}
          </View>
        ))
      )}

      <TransactionSheet transaction={selected} onClose={() => setSelected(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  filters: {
    flexDirection: 'row',
    gap: space[2],
    marginTop: space[6],
  },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: space[6],
  },
  monthTitle: {
    alignItems: 'center',
  },
  empty: {
    marginTop: space[10],
    gap: space[2],
    maxWidth: 320,
  },
  group: {
    marginTop: space[6],
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
