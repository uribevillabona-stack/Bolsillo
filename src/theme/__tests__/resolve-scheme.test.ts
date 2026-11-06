import { resolveScheme } from '../index';

describe('resolveScheme', () => {
  it('sigue al sistema cuando la preferencia es "system"', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('usa claro si el sistema no reporta esquema', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', undefined)).toBe('light');
  });

  it('la preferencia explícita gana sobre el sistema', () => {
    expect(resolveScheme('light', 'dark')).toBe('light');
    expect(resolveScheme('dark', 'light')).toBe('dark');
  });
});
