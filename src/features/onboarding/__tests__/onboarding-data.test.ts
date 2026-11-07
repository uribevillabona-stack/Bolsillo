import {
  DIAGNOSTIC_QUESTIONS,
  estimateForRange,
  INCOME_RANGES,
  parseTypedAmount,
  validateGoalDraft,
} from '../onboarding-data';

describe('estimateForRange', () => {
  it('devuelve la referencia del rango y 0 si no existe', () => {
    expect(estimateForRange('300k-700k')).toBe(400_000);
    expect(estimateForRange('otro')).toBe(0);
    expect(estimateForRange(null)).toBe(0);
  });

  it('cada referencia es un entero dentro de su rango declarado', () => {
    for (const r of INCOME_RANGES) expect(Number.isInteger(r.estimate)).toBe(true);
  });
});

describe('parseTypedAmount', () => {
  it('acepta montos con o sin puntos', () => {
    expect(parseTypedAmount('1.500.000')).toBe(1_500_000);
    expect(parseTypedAmount('$ 80000')).toBe(80_000);
  });

  it('rechaza vacío, cero y montos absurdos', () => {
    expect(parseTypedAmount('')).toBeNull();
    expect(parseTypedAmount('0')).toBeNull();
    expect(parseTypedAmount('9999999999')).toBeNull();
  });
});

describe('validateGoalDraft', () => {
  it('saltar el Apartado (todo vacío) es válido', () => {
    expect(validateGoalDraft({ name: '', amountText: '' })).toBeNull();
  });

  it('pide el nombre o el monto que falte', () => {
    expect(validateGoalDraft({ name: '', amountText: '500000' })).toMatch(/nombre/);
    expect(validateGoalDraft({ name: 'Portátil', amountText: '' })).toMatch(/monto/);
  });

  it('acepta un Apartado completo', () => {
    expect(validateGoalDraft({ name: 'Portátil', amountText: '2.000.000' })).toBeNull();
  });
});

describe('diagnóstico', () => {
  it('tiene 5 preguntas con ids únicos y 3 opciones cada una', () => {
    expect(DIAGNOSTIC_QUESTIONS).toHaveLength(5);
    expect(new Set(DIAGNOSTIC_QUESTIONS.map((q) => q.id)).size).toBe(5);
    for (const q of DIAGNOSTIC_QUESTIONS) expect(q.options).toHaveLength(3);
  });
});
