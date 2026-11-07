/**
 * Error que se muestra dentro de un `Sheet` (ver la prop `error`). Vive aparte
 * de `Sheet.tsx` para poder probarlo sin Reanimated ni Gesture Handler.
 */
import { useState } from 'react';

/** Error que se muestra dentro del sheet. `id` cambia en cada fallo. */
export interface SheetError {
  message: string;
  id: number;
}

let errorSeq = 0;

/**
 * Error de un sheet: `showError` en el `catch` de guardar o eliminar, sin
 * cerrar el sheet. Se borra al ABRIR (no al cerrar, para que el sheet no
 * cambie de alto mientras baja). Cada fallo tiene un `id` nuevo, así un
 * segundo fallo igual se vuelve a anunciar.
 */
export function useSheetError(visible: boolean) {
  const [error, setError] = useState<SheetError | null>(null);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible && error) setError(null);
  }
  const showError = (message: string) => {
    // `+= 1` y no `++`: el React Compiler no compila `++` sobre una variable
    // de módulo y se saltaría todo el hook.
    errorSeq += 1;
    setError({ message, id: errorSeq });
  };
  return { error, showError };
}
