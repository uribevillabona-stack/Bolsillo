/**
 * Layout raíz.
 *
 * Arranque: fuentes → base de datos (migraciones + siembra) → perfil → se
 * oculta el splash. Así nunca se ve un destello en blanco ni la pantalla
 * equivocada (onboarding vs. pestañas).
 *
 * Rutas protegidas: sin onboarding terminado solo existe `(onboarding)`;
 * después, solo la app. Expo Router redirige solo según `guard`.
 */
import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  router,
  Stack,
  ThemeProvider,
  useRootNavigationState,
  useSegments,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useMemo } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { Snackbar } from '@/components';
import { QUICK_ADD_BUTTON_CLEARANCE } from '@/components/QuickAddButton';
import { DatabaseGate } from '@/db/DatabaseGate';
import { useProfile } from '@/db/hooks';
import { fontAssets, useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const { scheme, colors } = useTheme();

  // Si las fuentes fallan, se sigue con las del sistema: mejor que bloquear.
  const fontsReady = fontsLoaded || fontError != null;

  useEffect(() => {
    // Color de fondo de la ventana nativa (se ve durante transiciones).
    SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  const navTheme = useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bg,
        card: colors.bg,
        text: colors.ink,
        border: colors.line,
        primary: colors.primary,
        notification: colors.accent,
      },
    };
  }, [scheme, colors]);

  if (!fontsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ThemeProvider value={navTheme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <DatabaseGate>
          <AppNavigator />
        </DatabaseGate>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { colors } = useTheme();
  const profile = useProfile();
  const segments = useSegments();
  const loaded = profile !== undefined;
  const onboarded = profile?.onboardingDone ?? false;
  const inOnboarding = segments[0] === '(onboarding)';
  // Navegar antes de que el Stack esté montado lanza "navigate before mounting".
  const navigationReady = useRootNavigationState()?.key != null;

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Stack.Protected oculta las rutas, pero la URL inicial ("/") apunta a las
  // pestañas: sin onboarding no hay a dónde redirigir y la pantalla queda
  // vacía (probado en Android). Por eso la redirección se hace explícita.
  useEffect(() => {
    if (!loaded || !navigationReady) return;
    if (!onboarded && !inOnboarding) router.replace('/perfil');
    else if (onboarded && inOnboarding) router.replace('/');
  }, [loaded, navigationReady, onboarded, inOnboarding]);

  if (!loaded) return null;
  // En las pestañas el snackbar va encima del botón flotante.
  const inTabs = segments[0] === '(tabs)';

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Protected guard={!onboarded}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>
        <Stack.Protected guard={onboarded}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="ajustes" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="apartado/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="catalogo" options={{ animation: 'slide_from_right' }} />
        </Stack.Protected>
      </Stack>
      <Snackbar bottomOffset={inTabs ? QUICK_ADD_BUTTON_CLEARANCE : 0} />
    </>
  );
}
