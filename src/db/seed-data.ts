/**
 * Datos iniciales: categorías y atajos de gasto hormiga.
 *
 * Son constantes puras (sin base de datos) para poder probarlas, y se
 * insertan una sola vez en `seed.ts`. Montos de referencia en Colombia
 * (2026); el usuario los ajusta en Ajustes → Atajos.
 */
import type { CategoryIconKey } from '@/features/categories/category-icons';

export interface CategorySeed {
  slug: string;
  name: string;
  icon: CategoryIconKey;
  kind: 'expense' | 'income';
  isHormiga: boolean;
}

export const CATEGORY_SEEDS: readonly CategorySeed[] = [
  // Gastos hormiga: pequeños y repetidos.
  { slug: 'cafe', name: 'Tinto y café', icon: 'cafe', kind: 'expense', isHormiga: true },
  {
    slug: 'comida-rapida',
    name: 'Comida al paso',
    icon: 'comida',
    kind: 'expense',
    isHormiga: true,
  },
  { slug: 'transporte', name: 'Transporte', icon: 'transporte', kind: 'expense', isHormiga: true },
  { slug: 'recargas', name: 'Recargas', icon: 'recarga', kind: 'expense', isHormiga: true },
  { slug: 'snacks', name: 'Snacks', icon: 'snack', kind: 'expense', isHormiga: true },
  { slug: 'domicilios', name: 'Domicilios', icon: 'domicilio', kind: 'expense', isHormiga: true },
  {
    slug: 'suscripciones',
    name: 'Suscripciones',
    icon: 'suscripcion',
    kind: 'expense',
    isHormiga: true,
  },
  // Gastos grandes o planeados.
  { slug: 'mercado', name: 'Mercado', icon: 'mercado', kind: 'expense', isHormiga: false },
  { slug: 'hogar', name: 'Hogar y arriendo', icon: 'hogar', kind: 'expense', isHormiga: false },
  { slug: 'estudio', name: 'Estudio', icon: 'estudio', kind: 'expense', isHormiga: false },
  { slug: 'salud', name: 'Salud', icon: 'salud', kind: 'expense', isHormiga: false },
  { slug: 'salidas', name: 'Salidas', icon: 'salidas', kind: 'expense', isHormiga: false },
  { slug: 'ropa', name: 'Ropa', icon: 'ropa', kind: 'expense', isHormiga: false },
  { slug: 'otros-gastos', name: 'Otros gastos', icon: 'otros', kind: 'expense', isHormiga: false },
  // Ingresos.
  { slug: 'mesada', name: 'Mesada', icon: 'mesada', kind: 'income', isHormiga: false },
  { slug: 'sueldo', name: 'Sueldo', icon: 'sueldo', kind: 'income', isHormiga: false },
  { slug: 'beca', name: 'Beca o auxilio', icon: 'estudio', kind: 'income', isHormiga: false },
  {
    slug: 'emprendimiento',
    name: 'Emprendimiento',
    icon: 'emprendimiento',
    kind: 'income',
    isHormiga: false,
  },
  {
    slug: 'otros-ingresos',
    name: 'Otros ingresos',
    icon: 'ingreso',
    kind: 'income',
    isHormiga: false,
  },
];

export interface ShortcutSeed {
  label: string;
  icon: CategoryIconKey;
  amount: number;
  categorySlug: string;
}

export const SHORTCUT_SEEDS: readonly ShortcutSeed[] = [
  { label: 'Tinto', icon: 'cafe', amount: 2500, categorySlug: 'cafe' },
  { label: 'Empanada', icon: 'comida', amount: 3000, categorySlug: 'comida-rapida' },
  { label: 'Pasaje', icon: 'transporte', amount: 3200, categorySlug: 'transporte' },
  { label: 'Recarga', icon: 'recarga', amount: 10000, categorySlug: 'recargas' },
  { label: 'Snack', icon: 'snack', amount: 4000, categorySlug: 'snacks' },
  { label: 'Domicilio', icon: 'domicilio', amount: 6000, categorySlug: 'domicilios' },
  { label: 'Suscripción', icon: 'suscripcion', amount: 17000, categorySlug: 'suscripciones' },
];
