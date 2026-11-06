/**
 * Estado global del registro rápido: si el sheet está abierto.
 * Es global porque el botón flotante vive en la barra de pestañas y el sheet
 * se puede abrir desde cualquier pantalla (y en la Fase 3, desde un pendiente).
 */
import { create } from 'zustand';

interface QuickAddState {
  open: boolean;
  show: () => void;
  hide: () => void;
}

export const useQuickAddStore = create<QuickAddState>((set) => ({
  open: false,
  show: () => set({ open: true }),
  hide: () => set({ open: false }),
}));
