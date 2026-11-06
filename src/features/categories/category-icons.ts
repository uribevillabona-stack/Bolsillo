/**
 * Registro de íconos por clave. La base de datos guarda la clave ("cafe"),
 * no el componente, para que los respaldos JSON sean portables y el set de
 * íconos se pueda cambiar sin migrar datos.
 */
import {
  ArrowDownIcon,
  BriefcaseIcon,
  BusIcon,
  CoffeeIcon,
  ConfettiIcon,
  CookieIcon,
  DeviceMobileIcon,
  DotsThreeIcon,
  FirstAidIcon,
  ForkKnifeIcon,
  GraduationCapIcon,
  HandCoinsIcon,
  HouseIcon,
  MopedIcon,
  RepeatIcon,
  ShoppingCartIcon,
  StorefrontIcon,
  TShirtIcon,
  TagIcon,
  type Icon,
} from '@/components';

export const CATEGORY_ICONS = {
  cafe: CoffeeIcon,
  comida: ForkKnifeIcon,
  transporte: BusIcon,
  recarga: DeviceMobileIcon,
  snack: CookieIcon,
  domicilio: MopedIcon,
  suscripcion: RepeatIcon,
  mercado: ShoppingCartIcon,
  hogar: HouseIcon,
  estudio: GraduationCapIcon,
  salud: FirstAidIcon,
  salidas: ConfettiIcon,
  ropa: TShirtIcon,
  otros: DotsThreeIcon,
  mesada: HandCoinsIcon,
  sueldo: BriefcaseIcon,
  emprendimiento: StorefrontIcon,
  ingreso: ArrowDownIcon,
  etiqueta: TagIcon,
} as const satisfies Record<string, Icon>;

export type CategoryIconKey = keyof typeof CATEGORY_ICONS;

/** Ícono para una clave guardada. Claves desconocidas (respaldo viejo) → etiqueta. */
export function iconFor(key: string | null | undefined): Icon {
  if (key && key in CATEGORY_ICONS) return CATEGORY_ICONS[key as CategoryIconKey];
  return TagIcon;
}
