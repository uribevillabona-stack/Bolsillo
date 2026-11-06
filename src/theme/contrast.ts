/**
 * Cálculo de contraste WCAG 2.1, usado por las pruebas para garantizar que
 * los pares de tokens texto/fondo cumplan AA (4,5:1 texto normal, 3:1 texto
 * grande o componentes de UI).
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Luminancia relativa de un color `#RRGGBB`. */
export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!match) throw new Error(`Color inválido (se espera #RRGGBB): ${hex}`);
  const [r, g, b] = match.slice(1).map((h) => channel(Number.parseInt(h, 16)));
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

export function contrastRatio(foreground: string, background: string): number {
  const a = relativeLuminance(foreground);
  const b = relativeLuminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
