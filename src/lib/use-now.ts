/**
 * "Ahora" que se actualiza solo: al volver la app al frente y cada minuto.
 *
 * Sin esto, una pantalla montada desde ayer (app en segundo plano toda la
 * noche) seguiría mostrando "Hoy" con los gastos de ayer, o el mes anterior.
 * Cada minuto es suficiente: la UI solo depende del día, no de los segundos.
 */
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

const TICK_MS = 60_000;

export function useNow(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const refresh = () => setNow(new Date());
    const interval = setInterval(refresh, TICK_MS);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(interval);
      sub.remove();
    };
  }, []);

  return now;
}
