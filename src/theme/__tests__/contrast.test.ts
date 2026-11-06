/**
 * Garantiza que la paleta cumpla WCAG AA en ambos modos. Si alguien cambia un
 * color y rompe el contraste, esta prueba falla antes de llegar al teléfono.
 */
import { palettes, type ColorScheme, type ColorTokens } from '../colors';
import { contrastRatio } from '../contrast';

const AA_TEXT = 4.5;

type Pair = [foreground: keyof ColorTokens, background: keyof ColorTokens];

/** Pares texto/fondo que efectivamente se usan en la app. */
const TEXT_PAIRS: Pair[] = [
  ['ink', 'bg'],
  ['ink', 'surface'],
  ['inkMuted', 'bg'],
  ['inkMuted', 'surface'],
  ['primary', 'bg'],
  ['accentText', 'bg'],
  ['accentText', 'surface'],
  ['onPrimary', 'primary'],
  ['onAccent', 'accent'],
  ['onButter', 'butter'],
  ['bg', 'ink'], // chip seleccionado
];

describe.each(['light', 'dark'] as ColorScheme[])('paleta %s', (scheme) => {
  const colors = palettes[scheme];

  it.each(TEXT_PAIRS)('%s sobre %s cumple AA (≥ 4,5:1)', (fg, bg) => {
    expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(AA_TEXT);
  });
});

describe('restricciones documentadas de la paleta', () => {
  it('el coral NO es apto como texto sobre el fondo claro (por eso existe accentText)', () => {
    expect(contrastRatio(palettes.light.accent, palettes.light.bg)).toBeLessThan(AA_TEXT);
  });

  it('el verde de marca original no sirve sobre el fondo oscuro (por eso se aclara)', () => {
    expect(contrastRatio(palettes.light.primary, palettes.dark.bg)).toBeLessThan(3);
  });
});

describe('contrastRatio', () => {
  it('blanco sobre negro es 21:1', () => {
    expect(contrastRatio('#FFFFFF', '#000000')).toBeCloseTo(21, 5);
  });

  it('rechaza colores mal formados', () => {
    expect(() => contrastRatio('red', '#000000')).toThrow();
  });
});
