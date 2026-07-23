import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Download } from 'lucide-react';

export default function CanvasEditor({ designId }) {
  const canvasRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject } = useCanvasStore();
  const [printArea, setPrintArea] = useState(null);

  useEffect(() => {
    // Initialize High-Performance Canvas
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: '#e9ecef',
      preserveObjectStacking: true // Keeps selected objects from jumping to the front
    });

    setCanvas(initCanvas);

    // Create the T-Shirt Printable Area (Bounding Box)
    const printBoundary = new fabric.Rect({
      left: 200,
      top: 50,
      width: 400,
      height: 500,
      fill: '#ffffff',
      stroke: '#ced4da',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      name: 'printArea'
    });
    
    initCanvas.add(printBoundary);
    initCanvas.centerObject(printBoundary);
    setPrintArea(printBoundary);

    // Event Listeners for State
    initCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    return () => {
      initCanvas.dispose();
    };
  }, [setCanvas, setActiveObject]);

  // --- PROFESSIONAL TOOLS ---

  const addText = () => {
    const text = new fabric.IText('Double Click to Edit', {
      left: 300,
      top: 250,
      fontFamily: 'Arial',
      fill: '#000000',
      fontSize: 32,
      fontWeight: 'bold'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const addShape = (type) => {
    let shape;
    const props = { left: 350, top: 250, fill: '#3b82f6', width: 100, height: 100 };
    
    if (type === 'rect') shape = new fabric.Rect(props);
    if (type === 'circle') shape = new fabric.Circle({ ...props, radius: 50 });

    canvas.add(shape);
    canvas.setActiveObject(shape);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (f) => {
      const data = f.target.result;
      fabric.Image.fromURL(data, (img) => {
        img.scaleToWidth(200);
        img.set({ left: 300, top: 200 });
        canvas.add(img);
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const changeColor = (e) => {
    if (activeObject) {
      activeObject.set('fill', e.target.value);
      canvas.renderAll();
    }
  };

  const deleteObject = () => {
    if (activeObject) {
      canvas.remove(activeObject);
      setActiveObject(null);
    }
  };

  const moveLayer = (direction) => {
    if (!activeObject) return;
    if (direction === 'up') canvas.bringForward(activeObject);
    if (direction === 'down') canvas.sendBackwards(activeObject);
    
    // Ensure the print area always stays at the absolute back
    if (printArea) canvas.sendToBack(printArea);
  };

  // High-Resolution Export for Print Production
  const exportDesign = () => {
    // 1. Hide the dashed boundary line for export
    printArea.set({ stroke: 'transparent' });
    canvas.renderAll();

    // 2. Export ONLY the coordinates of the print area at 3x resolution (300 DPI)
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 3,
      left: printArea.left,
      top: printArea.top,
      width: printArea.width,
      height: printArea.height
    });

    // 3. Restore the boundary line for the user
    printArea.set({ stroke: '#ced4da' });
    canvas.renderAll();

    // 4. Trigger download
    const link = document.createElement('a');
    link.download = `tshirt-design-${Date.now()}.png`;
    link.href = dataURL;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', height: '80vh', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* SIDEBAR TOOLBAR */}
      <div style={{ width: '250px', backgroundColor: '#ffffff', borderRight: '1px solid #ddd', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Design Tools</h3>
        
        <button onClick={addText} style={btnStyle}><Type size={18}/> Add Text</button>
        <button onClick={() => addShape('rect')} style={btnStyle}><Square size={18}/> Add Square</button>
        <button onClick={() => addShape('circle')} style={btnStyle}><Circle size={18}/> Add Circle</button>
        
        <label style={{...btnStyle, textAlign: 'center', cursor: 'pointer'}}>
          <ImageIcon size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Upload Image
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </label>

        {/* DYNAMIC CONTEXT MENU (Only shows when an object is selected) */}
        {activeObject && (
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Edit Selection</h4>
            
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px' }}>
              Color: 
              <input type="color" onChange={changeColor} style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
            </label>

            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
              <button onClick={() => moveLayer('up')} style={iconBtnStyle} title="Bring Forward"><ArrowUp size={16}/></button>
              <button onClick={() => moveLayer('down')} style={iconBtnStyle} title="Send Backward"><ArrowDown size={16}/></button>
              <button onClick={deleteObject} style={{...iconBtnStyle, color: 'red'}} title="Delete"><Trash2 size={16}/></button>
            </div>
          </div>
        )}

        <div style={{ flexGrow: 1 }}></div>

        {/* EXPORT BUTTON */}
        <button onClick={exportDesign} style={{...btnStyle, backgroundColor: '#10b981', color: 'white', fontWeight: 'bold'}}>
          <Download size={18}/> Download Print File
        </button>
      </div>

      {/* CANVAS AREA */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f3f5' }}>
        <div style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>

    </div>
  );
}

// Reusable CSS styles for React components
const btnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: '0.2s' };
const iconBtnStyle = { padding: '8px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', flexGrow: 1, display: 'flex', justifyContent: 'center' };
