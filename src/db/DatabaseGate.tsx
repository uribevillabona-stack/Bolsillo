/**
 * Prepara la base de datos antes de mostrar la app:
 * 1. Aplica las migraciones pendientes (Drizzle).
 * 2. Siembra categorías, atajos y el perfil (idempotente).
 * 3. Restaura la preferencia de tema guardada.
 *
 * Si algo falla, muestra el error en vez de una pantalla en blanco: con
 * datos locales, un error de migración es la peor falla posible y debe verse.
 */
import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { Text } from '@/components/Text';
import { getProfile } from '@/features/profile/profile-repo';
import { screenGutter, space, useTheme, useThemeStore, type ThemePreference } from '@/theme';

import { db } from './client';
import migrations from './migrations/migrations';
import { seedDatabase } from './seed';

const THEME_VALUES: readonly ThemePreference[] = ['system', 'light', 'dark'];

type BootState = { status: 'booting' } | { status: 'ready' } | { status: 'error'; error: Error };

/** Migraciones → siembra → tema guardado. Todo antes de mostrar la app. */
async function bootDatabase(): Promise<void> {
  await migrate(db, migrations);
  seedDatabase(db);
  const saved = getProfile(db)?.themePreference as ThemePreference | undefined;
  if (saved && THEME_VALUES.includes(saved)) {
    useThemeStore.getState().setPreference(saved);
  }
}

export function DatabaseGate({ children }: { children: ReactNode }) {
  const [state, setState] = useState<BootState>({ status: 'booting' });

  // Un solo arranque asíncrono en un efecto: escribe en la base de datos y
  // actualiza el store del tema, cosas que no pueden pasar durante un render
  // (React lo marcó en el teléfono: "Cannot update a component while
  // rendering a different component"). El splash sigue visible mientras tanto.
  useEffect(() => {
    let active = true;
    bootDatabase().then(
      () => active && setState({ status: 'ready' }),
      (e: unknown) =>
        active &&
        setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      active = false;
    };
  }, []);

  if (state.status === 'error') return <BootError error={state.error} />;
  if (state.status === 'booting') return null; // el splash nativo sigue visible
  return children;
}

function BootError({ error }: { error: Error }) {
  const { colors } = useTheme();

  // Sin base de datos AppNavigator nunca se monta y no oculta el splash: se
  // oculta aquí para que el error se vea.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={styles.error}
      accessibilityRole="alert">
      <Text variant="title">No pudimos abrir tus datos.</Text>
      <Text variant="body" tone="inkMuted">
        Tus datos siguen guardados en el teléfono. Cierra la app por completo y vuelve a abrirla; si
        el problema sigue, reinicia el teléfono e inténtalo otra vez.
      </Text>
      <Text variant="mono" tone="inkMuted" selectable>
        {error.message}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  error: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: screenGutter,
    gap: space[3],
  },
});
