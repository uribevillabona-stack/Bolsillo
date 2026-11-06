/**
 * Retroalimentación háptica con intención. Un solo lugar para decidir qué
 * vibración corresponde a cada tipo de acción, y para que un fallo del motor
 * háptico (teléfonos sin vibrador) nunca rompa la interacción.
 */
import * as Haptics from 'expo-haptics';

function safe(promise: Promise<void>): void {
  promise.catch(() => {
    // Sin vibrador o desactivado por el usuario: se ignora en silencio.
  });
}

export const haptics = {
  /** Cada tecla del teclado numérico, cambio de chip. */
  tick: () => safe(Haptics.selectionAsync()),
  /** Botones y acciones normales. */
  tap: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  /** Guardar un gasto. */
  confirm: () => safe(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  /** Meta cumplida. */
  success: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  /** Acción no permitida (p. ej. monto máximo alcanzado). */
  reject: () => safe(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
