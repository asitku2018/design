import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, Download, Shirt } from 'lucide-react';

// Product Catalog Mockups (These should eventually come from your database)
const GARMENTS = {
  tshirt: { name: 'Classic T-Shirt', image: '/mockups/tshirt.png' },
  hoodie: { name: 'Premium Hoodie', image: '/mockups/hoodie.png' },
  tank: { name: 'Tank Top', image: '/mockups/tank.png' }
};

export default function CanvasEditor({ designId }) {
  const canvasRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject } = useCanvasStore();
  const [printArea, setPrintArea] = useState(null);
  
  // New State for Garment Mockups
  const [activeGarment, setActiveGarment] = useState('tshirt');
  const [garmentColor, setGarmentColor] = useState('#ffffff');

  useEffect(() => {
    // Initialize High-Performance Canvas
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 800,
      height: 600,
      backgroundColor: null, // Must be transparent so the HTML T-shirt shows through
      preserveObjectStacking: true
    });

    setCanvas(initCanvas);

    // Create the T-Shirt Printable Area (Bounding Box)
    const printBoundary = new fabric.Rect({
      left: 200,
      top: 100, // Adjusted for typical chest placement
      width: 400,
      height: 500,
      fill: 'transparent',
      stroke: '#ced4da',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
      selectable: false,
      evented: false,
      name: 'printArea'
    });
    
    initCanvas.add(printBoundary);
    setPrintArea(printBoundary);

    initCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    return () => initCanvas.dispose();
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
      fabric.Image.fromURL(f.target.result, (img) => {
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
    if (printArea) canvas.sendToBack(printArea);
  };

  const exportDesign = () => {
    printArea.set({ stroke: 'transparent' });
    canvas.renderAll();
    const dataURL = canvas.toDataURL({
      format: 'png',
      multiplier: 3,
      left: printArea.left,
      top: printArea.top,
      width: printArea.width,
      height: printArea.height
    });
    printArea.set({ stroke: '#ced4da' });
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = `print-ready-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div style={{ display: 'flex', height: '85vh', border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
      
      {/* SIDEBAR TOOLBAR */}
      <div style={{ width: '280px', backgroundColor: '#ffffff', borderRight: '1px solid #ddd', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto' }}>
        
        {/* GARMENT SELECTOR SECTION */}
        <h3 style={headerStyle}>Product Setup</h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          <select 
            value={activeGarment} 
            onChange={(e) => setActiveGarment(e.target.value)}
            style={{ flexGrow: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            {Object.entries(GARMENTS).map(([key, garment]) => (
              <option key={key} value={key}>{garment.name}</option>
            ))}
          </select>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', gap: '10px', marginBottom: '10px' }}>
          Shirt Color: 
          <input type="color" value={garmentColor} onChange={(e) => setGarmentColor(e.target.value)} style={{ cursor: 'pointer' }} />
        </label>

        <hr style={{ borderTop: '1px solid #eee', width: '100%' }} />

        {/* DESIGN TOOLS SECTION */}
        <h3 style={headerStyle}>Design Tools</h3>
        <button onClick={addText} style={btnStyle}><Type size={18}/> Add Text</button>
        <button onClick={() => addShape('rect')} style={btnStyle}><Square size={18}/> Add Square</button>
        <button onClick={() => addShape('circle')} style={btnStyle}><Circle size={18}/> Add Circle</button>
        
        <label style={{...btnStyle, textAlign: 'center', cursor: 'pointer'}}>
          <ImageIcon size={18} style={{ verticalAlign: 'middle', marginRight: '5px' }}/> Upload Image
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
        </label>

        {activeObject && (
          <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '6px', border: '1px solid #e9ecef' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Edit Element</h4>
            <label style={{ display: 'block', marginBottom: '10px', fontSize: '12px' }}>
              Fill Color: <input type="color" onChange={changeColor} style={{ marginLeft: '10px', verticalAlign: 'middle' }} />
            </label>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => moveLayer('up')} style={iconBtnStyle} title="Bring Forward"><ArrowUp size={16}/></button>
              <button onClick={() => moveLayer('down')} style={iconBtnStyle} title="Send Backward"><ArrowDown size={16}/></button>
              <button onClick={deleteObject} style={{...iconBtnStyle, color: 'red'}} title="Delete"><Trash2 size={16}/></button>
            </div>
          </div>
        )}

        <div style={{ flexGrow: 1 }}></div>
        <button onClick={exportDesign} style={{...btnStyle, backgroundColor: '#10b981', color: 'white', fontWeight: 'bold'}}>
          <Download size={18}/> Download Print File
        </button>
      </div>

      {/* CANVAS AREA WITH LAYERED MOCKUP BACKGROUND */}
      <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f1f3f5', padding: '20px' }}>
        
        {/* Mockup Container: This handles the garment color and image */}
        <div style={{ 
          position: 'relative', 
          width: 800, 
          height: 600, 
          backgroundColor: garmentColor, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          
          {/* Mockup Image Layer (Sits behind the canvas) */}
          {/* Fallback styling ensures it looks okay even before you upload images */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${GARMENTS[activeGarment].image})`,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            pointerEvents: 'none', // Critical: Lets clicks pass through to the Canvas!
            opacity: 0.9,
            mixBlendMode: 'multiply' // Makes the mockup shadows blend nicely with the background color
          }}>
             {/* Temporary placeholder shape in case images aren't uploaded yet */}
             <div style={{ position: 'absolute', top: '10%', left: '15%', width: '70%', height: '80%', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '40px', zIndex: -1 }}></div>
          </div>

          {/* Interactive Fabric Canvas Layer */}
          <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} />
        
        </div>
      </div>
    </div>
  );
}

const headerStyle = { margin: '0 0 5px 0', fontSize: '12px', textTransform: 'uppercase', color: '#6c757d', letterSpacing: '0.5px', fontWeight: 'bold' };
const btnStyle = { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 15px', backgroundColor: '#f8f9fa', border: '1px solid #ddd', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', transition: '0.2s' };
const iconBtnStyle = { padding: '8px', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', flexGrow: 1, display: 'flex', justifyContent: 'center' };
