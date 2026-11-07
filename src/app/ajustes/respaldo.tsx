/**
 * Ajustes → Respaldo: exportar e importar todos los datos como un archivo
 * JSON. Gratis y sin cuentas: el usuario decide dónde guardarlo.
 *
 * Importar reemplaza TODO. Es la única acción de la app con confirmación
 * explícita, y además se puede deshacer: antes de restaurar se guarda en
 * memoria una copia de los datos actuales.
 */
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import {
  Button,
  DownloadSimpleIcon,
  Screen,
  Sheet,
  showSnackbar,
  Text,
  UploadSimpleIcon,
} from '@/components';
import { db } from '@/db/client';
import { buildBackup, type Backup } from '@/features/backup/backup-format';
import {
  collectBackupData,
  exportBackup,
  pickBackup,
  restoreBackup,
} from '@/features/backup/backup-service';
import { BackHeader } from '@/features/shared/BackHeader';
import { haptics } from '@/lib/haptics';
import { hairline, space, useTheme, useThemeStore } from '@/theme';

export default function RespaldoScreen() {
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPendingState] = useState<Backup | null>(null);
  // true si no se pudo copiar lo que hay ahora: restaurar ya no se puede deshacer
  // y el sheet lo advierte antes de un segundo toque en "Restaurar".
  const [noUndo, setNoUndo] = useState(false);
  const setPending = (backup: Backup | null) => {
    setPendingState(backup);
    setNoUndo(false);
  };

  const onExport = async () => {
    setBusy(true);
    setError(null);
    try {
      const count = await exportBackup(db);
      // El menú Compartir no avisa si se descartó: el texto no promete que ya quedó guardado.
      showSnackbar(
        `Respaldo creado con ${count} ${count === 1 ? 'movimiento' : 'movimientos'}: guárdalo en tu Drive o en WhatsApp.`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el respaldo.');
    } finally {
      setBusy(false);
    }
  };

  const onPick = async () => {
    setError(null);
    let result: Awaited<ReturnType<typeof pickBackup>>;
    try {
      result = await pickBackup();
    } catch (e) {
      haptics.reject();
      setError(e instanceof Error ? e.message : 'No se pudo abrir el archivo.');
      return;
    }
    if (result.status === 'canceled') return;
    if (result.status === 'invalid') {
      haptics.reject();
      setError(result.error);
      return;
    }
    setPending(result.backup);
  };

  const onRestore = () => {
    if (!pending) return;
    // Copia para "Deshacer". Si los datos actuales no se pueden leer, no se
    // restaura en este toque: el sheet avisa que no habrá "Deshacer" y un
    // segundo toque restaura igual (es justo cuando más sirve un respaldo).
    let snapshot: Backup | null = null;
    if (!noUndo) {
      try {
        snapshot = buildBackup(collectBackupData(db), new Date());
      } catch {
        haptics.reject();
        setNoUndo(true);
        return;
      }
    }
    try {
      restoreBackup(db, pending);
      useThemeStore.getState().setPreference(pending.data.profile.themePreference);
    } catch (e) {
      setPending(null);
      setError(e instanceof Error ? e.message : 'No se pudo restaurar el respaldo.');
      return;
    }
    setPending(null);
    haptics.success();
    if (!snapshot) {
      showSnackbar('Respaldo restaurado.');
      return;
    }
    showSnackbar('Respaldo restaurado', {
      label: 'Deshacer',
      onPress: () => {
        restoreBackup(db, snapshot);
        useThemeStore.getState().setPreference(snapshot.data.profile.themePreference);
      },
    });
  };

  return (
    <Screen>
      <BackHeader title="Respaldo" />
      <Text variant="body" tone="inkMuted" style={styles.lead}>
        BOLSILLO guarda todo en este teléfono, sin nube. Si lo pierdes o lo cambias, tus datos se
        van con él. Haz un respaldo de vez en cuando y guárdalo en tu Drive o mándatelo por
        WhatsApp.
      </Text>

      <View style={[styles.block, { borderTopColor: colors.line }]}>
        <Text variant="title" accessibilityRole="header">
          Exportar
        </Text>
        <Text variant="body" tone="inkMuted">
          Crea un archivo con todos tus movimientos, atajos, Apartados y ajustes.
        </Text>
        <Button
          label={busy ? 'Preparando…' : 'Crear respaldo'}
          icon={DownloadSimpleIcon}
          disabled={busy}
          onPress={onExport}
        />
      </View>

      <View style={[styles.block, { borderTopColor: colors.line }]}>
        <Text variant="title" accessibilityRole="header">
          Restaurar
        </Text>
        <Text variant="body" tone="inkMuted">
          Elige un archivo de respaldo de BOLSILLO. Reemplaza todo lo que tienes ahora.
        </Text>
        <Button label="Elegir archivo" variant="outline" icon={UploadSimpleIcon} onPress={onPick} />
      </View>

      {error ? (
        <Text
          variant="body"
          tone="accentText"
          style={styles.error}
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Sheet
        visible={pending !== null}
        onClose={() => setPending(null)}
        title="¿Restaurar este respaldo?">
        {pending ? (
          <>
            <Text variant="body" tone="inkMuted">
              Del {new Date(pending.exportedAt).toLocaleDateString('es-CO')}:{' '}
              {pending.data.transactions.length} movimientos, {pending.data.shortcuts.length} atajos
              y {pending.data.goals.length} Apartados.
            </Text>
            {noUndo ? (
              <Text
                variant="body"
                tone="accentText"
                style={styles.warning}
                accessibilityLiveRegion="assertive">
                No pudimos copiar lo que tienes ahora. Si restauras, se reemplaza y no se podrá
                deshacer.
              </Text>
            ) : (
              <Text variant="body" style={styles.warning}>
                Lo que tienes ahora se reemplaza. Podrás deshacerlo durante unos segundos.
              </Text>
            )}
            <View style={styles.actions}>
              <Button
                label={noUndo ? 'Restaurar sin deshacer' : 'Restaurar'}
                variant="accent"
                size="lg"
                block
                onPress={onRestore}
              />
              <Button label="Cancelar" variant="quiet" block onPress={() => setPending(null)} />
            </View>
          </>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: {
    marginTop: space[2],
    maxWidth: 360,
  },
  block: {
    marginTop: space[8],
    paddingTop: space[4],
    borderTopWidth: hairline,
    gap: space[3],
  },
  error: {
    marginTop: space[6],
  },
  warning: {
    marginTop: space[3],
  },
  actions: {
    marginTop: space[6],
    gap: space[1],
  },
});
