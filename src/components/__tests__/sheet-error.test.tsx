import { act, renderHook } from '@testing-library/react-native';

import { useSheetError } from '../sheet-error';

describe('useSheetError', () => {
  it('guarda el error y lo mantiene mientras el sheet sigue abierto', async () => {
    const { result, rerender } = await renderHook(
      ({ visible }: { visible: boolean }) => useSheetError(visible),
      {
        initialProps: { visible: true },
      },
    );
    expect(result.current.error).toBeNull();

    await act(() => result.current.showError('No se pudo guardar.'));
    expect(result.current.error?.message).toBe('No se pudo guardar.');

    await rerender({ visible: true });
    expect(result.current.error?.message).toBe('No se pudo guardar.');
  });

  it('da un id nuevo a cada fallo, aunque el mensaje sea igual', async () => {
    const { result } = await renderHook(() => useSheetError(true));

    await act(() => result.current.showError('No se pudo guardar.'));
    const first = result.current.error?.id;
    await act(() => result.current.showError('No se pudo guardar.'));
    const second = result.current.error?.id;

    expect(first).toBeDefined();
    expect(second).toBeDefined();
    expect(second).not.toBe(first);
  });

  it('no lo borra al cerrar (el sheet no cambia de alto mientras baja), sí al volver a abrir', async () => {
    const { result, rerender } = await renderHook(
      ({ visible }: { visible: boolean }) => useSheetError(visible),
      {
        initialProps: { visible: true },
      },
    );
    await act(() => result.current.showError('No se pudo eliminar.'));

    await rerender({ visible: false });
    expect(result.current.error?.message).toBe('No se pudo eliminar.');

    await rerender({ visible: true });
    expect(result.current.error).toBeNull();
  });
});
