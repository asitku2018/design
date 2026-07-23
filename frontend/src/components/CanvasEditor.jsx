import React, { useEffect, useRef } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { io } from 'socket.io-client';

const socket = io(process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000');

export default function CanvasEditor({ designId }) {
  const canvasRef = useRef(null);
  const { setCanvas, setActiveObject } = useCanvasStore();

  useEffect(() => {
    // Initialize Fabric.js on the canvas element
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 600,
      height: 800,
      backgroundColor: '#f5f5f5',
      preserveObjectStacking: true
    });

    setCanvas(initCanvas);

    // Set up a basic T-shirt printable area (Bounding Box)
    const printArea = new fabric.Rect({
      left: 100,
      top: 150,
      width: 400,
      height: 500,
      fill: 'transparent',
      stroke: '#ccc',
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false
    });
    initCanvas.add(printArea);

    // Event Listeners for UI updates
    initCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    // Real-time synchronization
    initCanvas.on('object:modified', () => {
      const jsonState = initCanvas.toJSON();
      socket.emit('canvas-update', { designId, state: jsonState });
    });

    socket.on('sync-canvas', (newState) => {
      initCanvas.loadFromJSON(newState, () => initCanvas.renderAll());
    });

    return () => {
      initCanvas.dispose();
      socket.disconnect();
    };
  }, [setCanvas, setActiveObject, designId]);

  const addText = () => {
    const text = new fabric.IText('New Design', {
      left: 200,
      top: 300,
      fontFamily: 'Helvetica',
      fill: '#333333',
      fontSize: 40
    });
    const canvas = useCanvasStore.getState().canvas;
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="toolbar" style={{ padding: '10px', background: '#222', width: '100%' }}>
        <button onClick={addText} style={{ padding: '8px 16px', background: '#007BFF', color: '#FFF', border: 'none', borderRadius: '4px' }}>
          Add Text
        </button>
      </div>
      <canvas ref={canvasRef} />
    </div>
  );
}
