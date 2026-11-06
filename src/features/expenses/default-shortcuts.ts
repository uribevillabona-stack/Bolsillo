/**
 * Atajos de gasto hormiga que vienen por defecto. Montos de referencia en
 * Colombia (2026); el usuario los edita en Ajustes → Atajos (Fase 2), y
 * entonces pasan a vivir en la tabla `shortcuts` de SQLite.
 */
import {
  BusIcon,
  CoffeeIcon,
  CookieIcon,
  DeviceMobileIcon,
  ForkKnifeIcon,
  MopedIcon,
  RepeatIcon,
  type Icon,
} from '@/components';

export interface ShortcutSeed {
  id: string;
  label: string;
  amount: number;
  icon: Icon;
}

export const DEFAULT_SHORTCUTS: readonly ShortcutSeed[] = [
  { id: 'tinto', label: 'Tinto', amount: 2500, icon: CoffeeIcon },
  { id: 'empanada', label: 'Empanada', amount: 3000, icon: ForkKnifeIcon },
  { id: 'pasaje', label: 'Pasaje', amount: 3200, icon: BusIcon },
  { id: 'recarga', label: 'Recarga', amount: 10000, icon: DeviceMobileIcon },
  { id: 'snack', label: 'Snack', amount: 4000, icon: CookieIcon },
  { id: 'domicilio', label: 'Domicilio', amount: 6000, icon: MopedIcon },
  { id: 'suscripcion', label: 'Suscripción', amount: 17000, icon: RepeatIcon },
];
