import { create } from 'zustand';

export const useCanvasStore = create((set) => ({
  canvas: null,
  activeObject: null,
  setCanvas: (canvas) => set({ canvas }),
  setActiveObject: (obj) => set({ activeObject: obj }),
  updateCanvasState: (canvasJson) => set((state) => {
    if (state.canvas) {
      state.canvas.loadFromJSON(canvasJson, () => {
        state.canvas.renderAll();
      });
    }
    return state;
  })
}));
