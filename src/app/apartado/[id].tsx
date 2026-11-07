/**
 * Detalle de un Apartado: cuánto lleva, a qué ritmo, aportar o retirar y
 * su historial. Aportar y retirar se deshacen con el snackbar.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  AmountText,
  ArrowDownIcon,
  ArrowUpIcon,
  Button,
  Chip,
  ConfettiIcon,
  ListRow,
  NotePencilIcon,
  PiggyBankIcon,
  ProgressRing,
  Screen,
  showSnackbar,
  Text,
} from '@/components';
import { db } from '@/db/client';
import { paceSentence } from '@/features/goals/goal-logic';
import { GoalSheet } from '@/features/goals/GoalSheet';
import { addContribution, removeContribution } from '@/features/goals/goals-repo';
import { useMonthOverview } from '@/features/overview/use-month-overview';
import { AmountSheet } from '@/features/shared/AmountSheet';
import { BackHeader } from '@/features/shared/BackHeader';
import { dayLabel } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { formatCOP } from '@/lib/money';
import { useNow } from '@/lib/use-now';
import { hairline, radius, space, useTheme } from '@/theme';

type Mode = 'add' | 'withdraw' | null;

export default function ApartadoScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const goalId = Number(id);
  const now = useNow();
  const { loaded, goals, contributions, totals } = useMonthOverview(now);
  const [mode, setMode] = useState<Mode>(null);
  // El último modo abierto: el título no cambia mientras el sheet baja.
  const [sheetMode, setSheetMode] = useState<'add' | 'withdraw'>('add');
  const [fromSavings, setFromSavings] = useState(false);
  const [editing, setEditing] = useState(false);

  const openSheet = (next: 'add' | 'withdraw') => {
    setSheetMode(next);
    setFromSavings(false);
    setMode(next);
  };

  const entry = goals.find((g) => g.goal.id === goalId);
  // La consulta en vivo arranca vacía: sin esto se vería "no existe" un instante.
  if (!loaded) return <Screen>{null}</Screen>;
  if (!entry) {
    return (
      <Screen>
        <BackHeader title="Apartado" />
        <Text variant="body" tone="inkMuted" style={styles.lead}>
          Este Apartado ya no existe.
        </Text>
      </Screen>
    );
  }

  const { goal, progress } = entry;
  const history = contributions.filter((c) => c.goalId === goal.id);

  const confirm = (amount: number) => {
    const signed = mode === 'withdraw' ? -amount : amount;
    setMode(null);
    try {
      const { row, justCompleted } = addContribution(db, goal.id, signed, { fromSavings });
      if (justCompleted) {
        haptics.success();
        showSnackbar(`¡Completaste "${goal.name}"! Ya tienes toda la plata.`, {
          label: 'Deshacer',
          onPress: () => removeContribution(db, row.id),
        });
        return;
      }
      haptics.confirm();
      showSnackbar(
        signed > 0
          ? `Separaste ${formatCOP(amount)} para "${goal.name}"`
          : `Sacaste ${formatCOP(amount)} de "${goal.name}"`,
        { label: 'Deshacer', onPress: () => removeContribution(db, row.id) },
      );
    } catch (e) {
      haptics.reject();
      showSnackbar(e instanceof Error ? e.message : 'No se pudo guardar.');
    }
  };

  return (
    <Screen>
      <BackHeader title={goal.name} />

      <View style={styles.hero}>
        <View style={styles.heroText}>
          <Text variant="label" tone="inkMuted">
            Llevas
          </Text>
          <AmountText amount={progress.saved} size="large" testID="apartado-saved" />
          <Text variant="caption" tone="inkMuted">
            de {formatCOP(goal.targetAmount)}
            {progress.completed ? '' : ` · faltan ${formatCOP(progress.remaining)}`}
          </Text>
        </View>
        <ProgressRing
          progress={progress.ratio}
          size={88}
          strokeWidth={7}
          tone={progress.completed ? 'butter' : 'primary'}
          accessibilityLabel={`${Math.floor(progress.ratio * 100)} % de la meta`}>
          <Text variant="bodyStrong" style={styles.tabular}>
            {Math.floor(progress.ratio * 100)}%
          </Text>
        </ProgressRing>
      </View>

      {progress.completed ? (
        <View style={[styles.done, { backgroundColor: colors.butter }]}>
          <ConfettiIcon size={24} color={colors.onButter} />
          <Text variant="bodyStrong" tone="onButter" style={styles.flex}>
            ¡Lo lograste! Ya tienes toda la plata para {goal.name}.
          </Text>
        </View>
      ) : (
        <Text variant="body" style={styles.pace}>
          {paceSentence(goal, progress, now, formatCOP)}
        </Text>
      )}

      <View style={styles.actions}>
        <View style={styles.flex}>
          <Button
            label="Aportar"
            icon={ArrowDownIcon}
            block
            onPress={() => openSheet('add')}
            testID="apartado-aportar"
          />
        </View>
        <View style={styles.flex}>
          <Button
            label="Retirar"
            variant="outline"
            icon={ArrowUpIcon}
            block
            disabled={progress.saved <= 0}
            onPress={() => openSheet('withdraw')}
          />
        </View>
      </View>

      <View style={[styles.section, { borderTopColor: colors.lineStrong }]}>
        <Text variant="overline" tone="inkMuted" accessibilityRole="header">
          Movimientos
        </Text>
        {history.length === 0 ? (
          <Text variant="body" tone="inkMuted" style={styles.lead}>
            Todavía no has separado nada. El primer aporte, aunque sea pequeño, es el que más
            cuenta.
          </Text>
        ) : (
          history.map((c, i) => (
            <ListRow
              key={c.id}
              title={c.amount > 0 ? 'Aporte' : 'Retiro'}
              subtitle={dayLabel(new Date(c.createdAt), now)}
              icon={c.amount > 0 ? ArrowDownIcon : ArrowUpIcon}
              amount={c.amount}
              signed
              divider={i < history.length - 1}
            />
          ))
        )}
      </View>

      <Button
        label="Editar Apartado"
        variant="quiet"
        icon={NotePencilIcon}
        onPress={() => setEditing(true)}
      />

      <AmountSheet
        visible={mode !== null}
        title={sheetMode === 'withdraw' ? `Retirar de ${goal.name}` : `Aportar a ${goal.name}`}
        hint={
          sheetMode === 'withdraw'
            ? `Hay ${formatCOP(progress.saved)}. Vuelve a tu disponible del mes.`
            : fromSavings
              ? 'Plata que ya tenías ahorrada: no se descuenta de este mes.'
              : `Sale de tu disponible del mes: te quedan ${formatCOP(totals.available)}.`
        }
        initialAmount={0}
        confirmLabel={sheetMode === 'withdraw' ? 'Retirar' : 'Aportar'}
        maxAmount={sheetMode === 'withdraw' ? progress.saved : undefined}
        maxMessage={`No puedes sacar más de ${formatCOP(progress.saved)}.`}
        onConfirm={confirm}
        onClose={() => setMode(null)}>
        {sheetMode === 'add' ? (
          <View style={styles.savingsToggle}>
            <Chip
              label="Ya la tenía ahorrada"
              icon={PiggyBankIcon}
              selected={fromSavings}
              onPress={() => setFromSavings(!fromSavings)}
            />
          </View>
        ) : null}
      </AmountSheet>
      <GoalSheet
        target={editing ? goal : null}
        onClose={() => setEditing(false)}
        onDeleted={() => router.back()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  lead: {
    marginTop: space[2],
    maxWidth: 340,
  },
  hero: {
    marginTop: space[6],
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space[4],
  },
  heroText: {
    flex: 1,
    gap: space[1],
  },
  savingsToggle: {
    flexDirection: 'row',
    marginTop: space[3],
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
  pace: {
    marginTop: space[4],
    maxWidth: 340,
  },
  done: {
    marginTop: space[5],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    padding: space[4],
    borderRadius: radius.sm,
    borderWidth: hairline,
    borderColor: 'transparent',
  },
  actions: {
    marginTop: space[6],
    flexDirection: 'row',
    gap: space[3],
  },
  section: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[1],
  },
});
