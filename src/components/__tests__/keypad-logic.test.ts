import { applyKey, type KeypadKey } from '../keypad-logic';

const type = (keys: KeypadKey[], start = ''): string => keys.reduce(applyKey, start);

describe('applyKey', () => {
  it('escribe dígitos en orden', () => {
    expect(type(['1', '2', '5', '0', '0'])).toBe('12500');
  });

  it('la tecla 000 agrega tres ceros', () => {
    expect(type(['2', '000'])).toBe('2000');
  });

  it('no permite ceros a la izquierda', () => {
    expect(type(['0'])).toBe('');
    expect(type(['000'])).toBe('');
    expect(type(['0', '5'])).toBe('5');
  });

  it('borra el último dígito y no falla con la cadena vacía', () => {
    expect(type(['1', '2', 'back'])).toBe('1');
    expect(type(['back'])).toBe('');
  });

  it('respeta el tope de 9 dígitos', () => {
    const full = '999999999';
    expect(applyKey(full, '1')).toBe(full);
    expect(applyKey('9999999', '000')).toBe('9999999');
  });
});
