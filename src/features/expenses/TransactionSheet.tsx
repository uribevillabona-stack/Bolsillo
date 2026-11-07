/**
 * Detalle de un movimiento: monto, categoría, fecha, nota y "Eliminar".
 * Eliminar no pregunta "¿seguro?": borra y ofrece deshacer por 5 segundos.
 */
import { StyleSheet, View } from 'react-native';

import { AmountText, Button, ListRow, Sheet, showSnackbar, TrashIcon } from '@/components';
import { db } from '@/db/client';
import { reconcileBudgetAlerts } from '@/features/budget/budget-repo';
import { iconFor } from '@/features/categories/category-icons';
import { dayLabel, timeLabel } from '@/lib/dates';
import { haptics } from '@/lib/haptics';
import { space } from '@/theme';

import { signedAmount } from './group-by-day';
import {
  deleteTransaction,
  restoreTransaction,
  type TransactionWithCategory,
} from './transactions-repo';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'Registrado a mano',
  shortcut: 'Registrado con atajo',
  detected: 'Detectado de una notificación',
  shared: 'Compartido desde otra app',
};

export interface TransactionSheetProps {
  transaction: TransactionWithCategory | null;
  onClose: () => void;
}

export function TransactionSheet({ transaction: t, onClose }: TransactionSheetProps) {
  const visible = t !== null;

  return (
    <Sheet visible={visible} onClose={onClose} title={t?.categoryName ?? 'Movimiento'}>
      {t ? (
        <>
          <AmountText amount={signedAmount(t)} size="large" />
          <View style={styles.rows}>
            <ListRow
              title={t.categoryName ?? 'Sin categoría'}
              subtitle={SOURCE_LABEL[t.source]}
              icon={iconFor(t.categoryIcon)}
            />
            <ListRow
              title={dayLabel(new Date(t.occurredAt), new Date())}
              subtitle={timeLabel(new Date(t.occurredAt))}
              divider={!!t.note}
            />
            {t.note ? <ListRow title={t.note} subtitle="Nota" divider={false} /> : null}
          </View>
          <Button
            label="Eliminar"
            variant="outline"
            icon={TrashIcon}
            block
            onPress={() => {
              const removed = deleteTransaction(db, t.id);
              if (removed) reconcileBudgetAlerts(db, removed.categoryId, new Date());
              haptics.confirm();
              onClose();
              if (removed) {
                showSnackbar('Movimiento eliminado', {
                  label: 'Deshacer',
                  onPress: () => restoreTransaction(db, removed),
                });
              }
            }}
          />
        </>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  rows: {
    marginVertical: space[4],
  },
});
