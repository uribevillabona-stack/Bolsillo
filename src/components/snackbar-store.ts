/**
 * Snackbar global: un mensaje corto con una acción opcional ("Deshacer").
 *
 * BOLSILLO no usa diálogos de "¿Seguro?": la acción se hace de una y se
 * ofrece deshacer durante 5 segundos. Es más rápido y igual de seguro.
 */
import { create } from 'zustand';

export const SNACKBAR_DURATION_MS = 5000;
/** Con TalkBack activo: tiempo para navegar hasta "Deshacer". */
export const SNACKBAR_READER_DURATION_MS = 20000;

export interface SnackbarAction {
  label: string;
  onPress: () => void;
}

export interface SnackbarMessage {
  /** Cambia con cada mensaje: reinicia el temporizador aunque el texto se repita. */
  key: number;
  text: string;
  action?: SnackbarAction;
}

interface SnackbarState {
  current: SnackbarMessage | null;
  show: (text: string, action?: SnackbarAction) => void;
  dismiss: () => void;
}

let nextKey = 1;

export const useSnackbarStore = create<SnackbarState>((set) => ({
  current: null,
  show: (text, action) => set({ current: { key: nextKey++, text, action } }),
  dismiss: () => set({ current: null }),
}));

/** Atajo para usar fuera de componentes (servicios, callbacks). */
export const showSnackbar = (text: string, action?: SnackbarAction) =>
  useSnackbarStore.getState().show(text, action);
