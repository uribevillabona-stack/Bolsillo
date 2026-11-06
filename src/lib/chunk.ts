/** Parte una lista en lotes de `size` elementos (el último puede ser más corto). */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size <= 0) throw new Error(`chunk: tamaño inválido (${size})`);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
