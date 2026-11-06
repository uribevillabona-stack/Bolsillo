/**
 * Rutas que el generador de tipos de Expo CLI no tipa bien en Windows.
 *
 * En Windows, `@expo/cli` genera `/ajustes/index` en lugar de `/ajustes` para
 * `src/app/ajustes/index.tsx` (su regex que quita `index.tsx` no se aplica a
 * las rutas de Windows). En ejecución `/ajustes` es la ruta correcta, así que
 * se declara aquí una sola vez en vez de dispersar casts por la app.
 */
import type { Href } from 'expo-router';

export const AJUSTES_HREF = '/ajustes' as Href;
