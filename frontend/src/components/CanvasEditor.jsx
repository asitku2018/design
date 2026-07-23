import React, { useEffect, useRef, useState } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { 
  Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, 
  Download, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, 
  PaintBucket, LayoutGrid, Star, Palette
} from 'lucide-react';

// --- ENTERPRISE CATALOG MOCK DATA (Should be fetched via API) ---
const GARMENTS = {
  tshirt: { name: 'T-Shirt', image: '/mockups/tshirt.png' },
  hoodie: { name: 'Hoodie', image: '/mockups/hoodie.png' }
};

// Enterprise font list (integrated with Fabric.js via CSS)
const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

// Vector Illustration paths (Scalable vector art library)
const ILLUSTRATIONS = [
  { id: 'star1', name: 'Premium Star', path: 'M 100 10 L 123 78 L 195 78 L 137 119 L 159 187 L 100 146 L 41 187 L 63 119 L 5 78 L 77 78 Z' },
  { id: 'rect1', name: 'Rounded Rect', path: 'M 20 20 H 180 A 20 20 0 0 1 200 40 V 160 A 20 20 0 0 1 180 180 H 20 A 20 20 0 0 1 0 160 V 40 A 20 20 0 0 1 20 20 Z' },
  { id: 'tiger', name: 'Tiger Vector', path: 'M10 10 H90 V90 H10 Z' }, // Mock simple shape for tiger illustration shown above
];

// Design Templates library (JSON serializations of common designs)
const TEMPLATES = [
  { id: 't1', name: 'Typography Sample 1', data: '{"version":"5.3.0","objects":[{"type":"i-text","version":"5.3.0","originX":"left","originY":"top","left":250,"top":200,"width":300,"height":45,"fill":"#ff4444","fontFamily":"Helvetica","fontWeight":"bold","text":"SAMPLE TEXT","textAlign":"center"}]}' },
  { id: 't2', name: 'Geometric Pattern 1', data: '{"version":"5.3.0","objects":[{"type":"circle","version":"5.3.0","left":300,"top":200,"fill":"#3b82f6","radius":50}]}' }
];


export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject, loadTemplate } = useCanvasStore();
  const [activeGarment, setActiveGarment] = useState('tshirt');
  const [garmentColor, setGarmentColor] = useState('#f3f4f6');
  
  // UI Panels state (like Canva tabs)
  const [activePanel, setActivePanel] = useState('text'); // text, illustrations, templates, colors

  useEffect(() => {
    // 1. Initialize Transparency-Optimized Canvas (No Background)
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      width: 900, height: 700,
      backgroundColor: null, // Critical: canvas must be transparent
      preserveObjectStacking: true
    });
    setCanvas(initCanvas);

    // 2. Set Up Non-Selectable Print Boundary (as visual guide)
    const printBoundary = new fabric.Rect({
      left: 250, top: 100, width: 400, height: 500,
      fill: 'transparent', stroke: '#cbd5e1', strokeWidth: 2,
      strokeDashArray: [5, 5], selectable: false, evented: false, name: 'printArea'
    });
    initCanvas.add(printBoundary);

    // 3. Setup Selection Event Listeners
    initCanvas.on('selection:created', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:updated', (e) => setActiveObject(e.selected[0]));
    initCanvas.on('selection:cleared', () => setActiveObject(null));

    return () => initCanvas.dispose();
  }, [setCanvas, setActiveObject]);


  // --- CANVAS & OBJECT MANIPULATION ---

  const addText = () => {
    const text = new fabric.IText('New Typography Element', {
      left: 350, top: 250,
      fontFamily: 'Helvetica', fill: '#1f2937', fontSize: 36, fontWeight: 'normal'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
  };

  const addIllustration = (svgPath) => {
    // Convert path string to SVG Path element for Fabric.js
    const path = new fabric.Path(svgPath, {
      left: 350, top: 250, fill: '#3b82f6', scaleX: 1, scaleY: 1
    });
    canvas.add(path);
    canvas.setActiveObject(path);
    canvas.renderAll();
  };


  // --- TOP TOOLBAR TEXT FORMATTING ---
  const toggleStyle = (style, value) => {
    if (activeObject && activeObject.type === 'i-text') {
      const current = activeObject.get(style);
      activeObject.set(style, current === value ? '' : value);
      canvas.renderAll();
    }
  };

  const updateActiveTextProp = (prop, value) => {
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set(prop, value);
      canvas.renderAll();
    }
  };


  // --- DYNAMIC LAYER & DEPTH MANIPULATION ---
  const handleLayer = (direction) => {
    if (!activeObject) return;
    if (direction === 'up') canvas.bringForward(activeObject);
    if (direction === 'down') canvas.sendBackwards(activeObject);
    
    // Ensure the non-selectable print area boundary always stays at the back.
    canvas.getObjects().find(o => o.name === 'printArea')?.sendToBack();
  };


  // --- HIGH-RESOLUTION INDUSTRIAL EXPORT ---
  const exportDesign = () => {
    const printArea = canvas.getObjects().find(o => o.name === 'printArea');
    if (!printArea) return;

    // 1. Clean up boundary line for export
    printArea.set({ stroke: 'transparent' });
    canvas.renderAll();

    // 2. Perform High-Res (multiplier: 3) Export of just the print area.
    // This creates the transparent print-ready PNG for DTG machines.
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 3,
      left: printArea.left, top: printArea.top,
      width: printArea.width, height: printArea.height
    });

    // 3. Restore boundary line for visual guide
    printArea.set({ stroke: '#cbd5e1' });
    canvas.renderAll();

    // 4. Trigger download
    const link = document.createElement('a');
    link.download = `print-ready-design-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };


  // --- JSX & COMPONENT RENDER ---
  return (
    <div className="editor-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* 1. DYNAMIC TOP CONTEXTUAL TOOLBAR */}
      {/* Adaptation from visualization: The toolbar contents change based on selection. */}
      <div className="top-toolbar" style={{ display: 'flex', gap: '10px', padding: '10px 20px', backgroundColor: '#111827', color: 'white', alignItems: 'center', height: '60px' }}>
        
        {/* Formatting section - only visible for IText objects */}
        {activeObject?.type === 'i-text' && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', borderRight: '1px solid #374151', paddingRight: '15px' }}>
            <select onChange={(e) => updateActiveTextProp('fontFamily', e.target.value)} style={toolbarSelectStyle}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            
            <input type="number" onChange={(e) => updateActiveTextProp('fontSize', parseInt(e.target.value))} defaultValue={activeObject.fontSize} style={{...toolbarSelectStyle, width: '60px'}} />
            
            <button onClick={() => toggleStyle('fontWeight', 'bold')} style={activeObject.fontWeight === 'bold' ? tActiveBtnStyle : tBtnStyle}><Bold size={18}/></button>
            <button onClick={() => toggleStyle('fontStyle', 'italic')} style={activeObject.fontStyle === 'italic' ? tActiveBtnStyle : tBtnStyle}><Italic size={18}/></button>
            <button onClick={() => toggleStyle('underline', true)} style={activeObject.underline ? tActiveBtnStyle : tBtnStyle}><Underline size={18}/></button>
            
            <button onClick={() => updateActiveTextProp('textAlign', 'left')} style={activeObject.textAlign === 'left' ? tActiveBtnStyle : tBtnStyle}><AlignLeft size={18}/></button>
            <button onClick={() => updateActiveTextProp('textAlign', 'center')} style={activeObject.textAlign === 'center' ? tActiveBtnStyle : tBtnStyle}><AlignCenter size={18}/></button>
            <button onClick={() => updateActiveTextProp('textAlign', 'right')} style={activeObject.textAlign === 'right' ? tActiveBtnStyle : tBtnStyle}><AlignRight size={18}/></button>
            
            <input type="color" onChange={(e) => updateActiveTextProp('fill', e.target.value)} defaultValue={activeObject.fill} style={toolbarColorStyle} />
          </div>
        )}

        {/* Dynamic Global actions (Color pick, Layers, Delete) */}
        {activeObject && (
          <div style={{ display: 'flex', gap: '5px' }}>
            {activeObject.type === 'path' && (
              <input type="color" onChange={(e) => activeObject.set('fill', e.target.value) || canvas.renderAll()} defaultValue={activeObject.fill} style={toolbarColorStyle} />
            )}
            <button onClick={() => handleLayer('up')} style={tBtnStyle}><ArrowUp size={18}/></button>
            <button onClick={() => handleLayer('down')} style={tBtnStyle}><ArrowDown size={18}/></button>
            <button onClick={() => canvas.remove(activeObject)} style={{...tBtnStyle, color: '#ef4444'}}><Trash2 size={18}/></button>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />
        <button onClick={exportDesign} style={{...tBtnStyle, backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '4px'}}>
          <Download size={18}/> Export Print PNG
        </button>
      </div>

      {/* Main Workspace split into Library Sidebar and Canvas Workspace */}
      <div style={{ display: 'flex', flexGrow: 1 }}>
        
        {/* 2. SIDEBAR LIBRARY PANELS (Canva-style structure) */}
        <div className="sidebar" style={{ width: '300px', backgroundColor: '#f9fafb', borderRight: '1px solid #e5e7eb', display: 'flex' }}>
          
          {/* Vertical icons for switching active panels */}
          <div style={{ width: '60px', backgroundColor: '#fff', borderRight: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px' }}>
            <button onClick={() => setActivePanel('text')} style={activePanel === 'text' ? iconTabActive : iconTab}><Type size={22}/></button>
            <button onClick={() => setActivePanel('illustrations')} style={activePanel === 'illustrations' ? iconTabActive : iconTab}><Star size={22}/></button>
            <button onClick={() => setActivePanel('templates')} style={activePanel === 'templates' ? iconTabActive : iconTab}><LayoutGrid size={22}/></button>
            <button onClick={() => setActivePanel('colors')} style={activePanel === 'colors' ? iconTabActive : iconTab}><Palette size={22}/></button>
          </div>

          {/* Panel Content (Text Tools, Vector Library, Templates) */}
          <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            
            {/* TEXT PANEL */}
            {activePanel === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <h3 style={pHeader}>Typography</h3>
                <button onClick={addText} style={btnSecondary}><Type size={18}/> Add IText Element</button>
                <div style={{ marginTop: '20px', fontSize: '13px', color: '#6b7280' }}>
                  Select text on the canvas to open the Contextual Top Toolbar for advanced formatting.
                </div>
              </div>
            )}

            {/* ILLUSTRATIONS PANEL (Vector Illustrations tool) */}
            {activePanel === 'illustrations' && (
              <div>
                <h3 style={pHeader}>Vector Illustrations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {ILLUSTRATIONS.map(item => (
                    <div key={item.id} onClick={() => addIllustration(item.path)} style={itemCard}>
                      <svg viewBox="0 0 200 200" width="60" height="60"><path d={item.path} fill="#3b82f6" /></svg>
                      <span style={{fontSize: '11px'}}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TEMPLATES PANEL */}
            {activePanel === 'templates' && (
              <div>
                <h3 style={pHeader}>Design Templates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} onClick={() => loadTemplate(tmpl.data)} style={tmplCard}>
                      <LayoutGrid size={24} color="#6b7280" />
                      <span style={{fontSize: '11px'}}>{tmpl.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRODUCT PANEL (For Garment Type and Color) */}
            {activePanel === 'colors' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Product Setup</h3>
                <select value={activeGarment} onChange={(e) => setActiveGarment(e.target.value)} style={btnSecondary}>
                  {Object.entries(GARMENTS).map(([key, g]) => (
                    <option key={key} value={key}>{g.name}</option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', gap: '10px' }}>
                  Fabric Color: <input type="color" value={garmentColor} onChange={(e) => setGarmentColor(e.target.value)} style={{cursor: 'pointer'}}/>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* 3. MAIN WORKSPACE */}
        <div className="workspace" style={{ flexGrow: 1, backgroundColor: '#f1f5f9', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '30px' }}>
          
          {/* MOCKUP & CANVAS LAYER (Standard layout as visualized) */}
          <div className="mockup-container" style={{ 
            position: 'relative', width: '900px', height: '700px', backgroundColor: garmentColor, 
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' 
          }}>
            {/* The non-interactive garment image is layered behind the canvas. */}
            <div className="mockup-image" style={{ 
              position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
              backgroundImage: `url(${GARMENTS[activeGarment].image})`,
              backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
              pointerEvents: 'none', mixBlendMode: 'multiply' 
            }} />
            
            {/* The interactive Fabric.js canvas layer. */}
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, zIndex: 10 }} />
          </div>
        </div>
      </div>
    </div>
  );
}


// --- CSS STYLES FOR REACT (Enterprise Standard) ---

// Top Context Toolbar Buttons
const tBtnStyle = { padding: '8px', backgroundColor: 'transparent', border: '1px solid #374151', borderRadius: '4px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center' };
const tActiveBtnStyle = { ...tBtnStyle, backgroundColor: '#374151' };
const toolbarSelectStyle = { padding: '6px', backgroundColor: '#1f2937', color: 'white', border: '1px solid #374151', borderRadius: '4px', fontSize: '13px' };
const toolbarColorStyle = { padding: '0', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', width: '30px', height: '30px' };

// Sidebar Styling
const pHeader = { margin: '0 0 15px 0', fontSize: '14px', color: '#1f2937', textTransform: 'uppercase', letterSpacing: '0.5px' };
const btnSecondary = { display: 'flex', gap: '8px', alignItems: 'center', width: '100%', padding: '10px', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer', fontSize: '14px' };

// Sidebar Main Icon Tabs
const iconTab = { padding: '10px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#6b7280' };
const iconTabActive = { ...iconTab, backgroundColor: '#f3f4f6', color: '#1f2937' };

// Illustration and Template cards
const itemCard = { border: '1px solid #e5e7eb', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '10px' };
const tmplCard = { ...itemCard, justifyContent: 'center' };
