import {
  digitsToAmount,
  formatCOP,
  groupThousands,
  keepMoneyTogether,
  speakMoney,
  spokenCOP,
} from '../money';

describe('groupThousands', () => {
  it.each([
    [0, '0'],
    [999, '999'],
    [1000, '1.000'],
    [12500, '12.500'],
    [1250000, '1.250.000'],
    [999999999, '999.999.999'],
  ] as const)('%i → %s', (input, expected) => {
    expect(groupThousands(input)).toBe(expected);
  });
});

describe('formatCOP', () => {
  it('usa el formato colombiano con espacio tras el símbolo', () => {
    expect(formatCOP(12500)).toBe('$ 12.500');
  });

  it('formatea cero', () => {
    expect(formatCOP(0)).toBe('$ 0');
  });

  it('usa el signo menos tipográfico en egresos', () => {
    expect(formatCOP(-3000)).toBe('−$ 3.000');
  });

  it('agrega + solo si se pide y el monto es positivo', () => {
    expect(formatCOP(50000, { signed: true })).toBe('+$ 50.000');
    expect(formatCOP(0, { signed: true })).toBe('$ 0');
  });

  it('omite el símbolo en modo bare', () => {
    expect(formatCOP(2500, { bare: true })).toBe('2.500');
  });

  it('rechaza montos con decimales (los montos son enteros en pesos)', () => {
    expect(() => formatCOP(12.5)).toThrow(/enteros/);
  });
});

describe('spokenCOP', () => {
  it('se lee bien en TalkBack', () => {
    expect(spokenCOP(12500)).toBe('12500 pesos');
    expect(spokenCOP(1)).toBe('1 peso');
    expect(spokenCOP(-3000)).toBe('menos 3000 pesos');
  });
});

describe('digitsToAmount', () => {
  it('convierte la cadena del teclado', () => {
    expect(digitsToAmount('')).toBe(0);
    expect(digitsToAmount('12500')).toBe(12500);
  });

  it('rechaza caracteres que no son dígitos', () => {
    expect(() => digitsToAmount('12.500')).toThrow();
  });
});

describe('keepMoneyTogether', () => {
  it('une "$" con la cifra en textos libres', () => {
    expect(keepMoneyTogether('Un tinto de $ 2.500 y $ 600.000 al año')).toBe(
      'Un tinto de $ 2.500 y $ 600.000 al año',
    );
    expect(keepMoneyTogether('Cuesta $ mucho')).toBe('Cuesta $ mucho');
  });
});

describe('speakMoney', () => {
  it('cambia cada monto con formato de formatCOP por su versión hablada', () => {
    expect(speakMoney(`Gastado ${formatCOP(12500)}`)).toBe('Gastado 12500 pesos');
    expect(speakMoney(`${formatCOP(80000)} de ${formatCOP(1250000)}`)).toBe(
      '80000 pesos de 1250000 pesos',
    );
  });

  it('lee los signos: − como "menos" y omite el + de los ingresos', () => {
    expect(speakMoney(`${formatCOP(-3000)} retirados`)).toBe('menos 3000 pesos retirados');
    expect(speakMoney(`Ingreso ${formatCOP(50000, { signed: true })}`)).toBe('Ingreso 50000 pesos');
  });

  it('respeta singular, cero y la puntuación alrededor', () => {
    expect(speakMoney(`Hay ${formatCOP(1)}.`)).toBe('Hay 1 peso.');
    expect(speakMoney(`Quedan ${formatCOP(0)}, nada más`)).toBe('Quedan 0 pesos, nada más');
    expect(speakMoney(`Faltan ${formatCOP(999999999)}.`)).toBe('Faltan 999999999 pesos.');
  });

  it('funciona con textos pasados por keepMoneyTogether', () => {
    expect(speakMoney(keepMoneyTogether('Un tinto de $ 2.500 al día'))).toBe(
      'Un tinto de 2500 pesos al día',
    );
  });

  it('no toca textos sin montos ni cifras que no tienen el formato exacto', () => {
    expect(speakMoney('Sin montos aquí')).toBe('Sin montos aquí');
    expect(speakMoney('Cuesta $ mucho')).toBe('Cuesta $ mucho');
    expect(speakMoney('Precio $ 2.500 con espacio normal')).toBe(
      'Precio $ 2.500 con espacio normal',
    );
    expect(speakMoney('$\u00A01234')).toBe('$\u00A01234');
    expect(speakMoney('3 veces · 1.000 pasos')).toBe('3 veces · 1.000 pasos');
  });
});
