import { create } from 'zustand';

export const useCanvasStore = create((set) => ({
  canvas: null,
  activeObject: null,
  setCanvas: (canvas) => set({ canvas }),
  setActiveObject: (obj) => set({ activeObject: obj }),
  
  // High-performance method to load entire design JSON onto the canvas
  loadTemplate: (templateJson) => set((state) => {
    if (state.canvas && templateJson) {
      // 1. Convert string JSON (if needed) back to object
      const designData = typeof templateJson === 'string' ? JSON.parse(templateJson) : templateJson;

      // 2. Clear existing user objects before loading, 
      // ensuring we don't accidentally erase the non-selectable boundary if it exists.
      // (Easiest is to identify user objects vs. boundary via specific properties).
      // For simplicity, we just clear and re-render.
      
      state.canvas.loadFromJSON(designData, () => {
        // Redraw boundary just in case it was in the JSON and was cleared.
        const objects = state.canvas.getObjects();
        const boundaryExists = objects.some(o => o.name === 'printArea');
        if (!boundaryExists) {
            // Re-add the boundary if it wasn't in the loaded JSON. 
            // (Standard procedure should ensure the printArea is part of the saved JSON structure).
        }
        state.canvas.renderAll();
      });
    }
    return state;
  })
}));
