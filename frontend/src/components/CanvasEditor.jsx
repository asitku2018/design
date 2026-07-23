import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { 
  Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, 
  Download, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, 
  LayoutGrid, Star, ZoomIn, ZoomOut, Maximize, Move, Grid, Magnet, Monitor, Settings
} from 'lucide-react';

// --- ENTERPRISE ARTBOARDS & PRINT AREAS ---
// Real-world DTG (Direct-to-Garment) print specifications
const ARTBOARDS = {
  front: { name: 'Front Chest', width: 400, height: 500, safe: 20, bleed: 10, defaultColor: '#ffffff' },
  back: { name: 'Full Back', width: 400, height: 550, safe: 20, bleed: 10, defaultColor: '#ffffff' },
  left_sleeve: { name: 'Left Sleeve', width: 150, height: 150, safe: 10, bleed: 5, defaultColor: '#ffffff' },
  right_sleeve: { name: 'Right Sleeve', width: 150, height: 150, safe: 10, bleed: 5, defaultColor: '#ffffff' },
  hood: { name: 'Hood Outer', width: 200, height: 200, safe: 15, bleed: 10, defaultColor: '#ffffff' },
  pocket: { name: 'Front Pocket', width: 100, height: 100, safe: 5, bleed: 5, defaultColor: '#ffffff' },
  collar: { name: 'Inner Collar Tag', width: 80, height: 80, safe: 5, bleed: 2, defaultColor: '#ffffff' }
};

const GRID_SIZE = 20;
const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

const ILLUSTRATIONS = [
  { id: 'star1', name: 'Premium Star', path: 'M 100 10 L 123 78 L 195 78 L 137 119 L 159 187 L 100 146 L 41 187 L 63 119 L 5 78 L 77 78 Z' },
  { id: 'rect1', name: 'Rounded Rect', path: 'M 20 20 H 180 A 20 20 0 0 1 200 40 V 160 A 20 20 0 0 1 180 180 H 20 A 20 20 0 0 1 0 160 V 40 A 20 20 0 0 1 20 20 Z' }
];

const TEMPLATES = [
  { id: 't1', name: 'Typography Sample', data: '{"version":"5.3.0","objects":[{"type":"i-text","originX":"center","originY":"center","left":450,"top":350,"width":300,"height":45,"fill":"#ff4444","fontFamily":"Helvetica","fontWeight":"bold","text":"SAMPLE TEXT","textAlign":"center"}]}' }
];

export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject, loadTemplate } = useCanvasStore();
  
  // UI & Workspace State
  const [activePanel, setActivePanel] = useState('settings'); 
  const [activeArtboard, setActiveArtboard] = useState('front');
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [dimensions, setDimensions] = useState(null);

  // --- CORE CANVAS INITIALIZATION ---
  useEffect(() => {
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#e2e8f0', // Workspace background
      preserveObjectStacking: true,
      selection: true
    });

    setCanvas(initCanvas);

    const handleResize = () => {
      if (!wrapperRef.current) return;
      initCanvas.setWidth(wrapperRef.current.clientWidth);
      initCanvas.setHeight(wrapperRef.current.clientHeight);
      initCanvas.renderAll();
    };
    
    // Initial size setup
    setTimeout(handleResize, 100); 
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      initCanvas.dispose();
    };
  }, [setCanvas]);

  const renderArtboard = useCallback(() => {
    if (!canvas) return;

    // Clear existing workspace visual guides
    const objectsToRemove = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    objectsToRemove.forEach(o => canvas.remove(o));

    const board = ARTBOARDS[activeArtboard];
    const centerX = canvas.getWidth() / 2 || 450;
    const centerY = canvas.getHeight() / 2 || 350;

    // 1. The Physical Garment Area (White Board)
    const boardRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width, height: board.height, fill: board.defaultColor,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 20, offsetX: 0, offsetY: 10 }),
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'garment_board'
    });

    // 2. Bleed Area (Red Dashed)
    const bleedRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width - (board.bleed * 2), height: board.height - (board.bleed * 2),
      fill: 'transparent', stroke: '#ef4444', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'bleed_area'
    });

    // 3. Safe Print Area (Green Dashed)
    const safeRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width - (board.safe * 2), height: board.height - (board.safe * 2),
      fill: 'transparent', stroke: '#10b981', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'safe_area'
    });

    canvas.add(boardRect, bleedRect, safeRect);
    canvas.sendToBack(boardRect);

    // 4. Grid System
    if (showGrid) {
      for (let i = 0; i < board.width; i += GRID_SIZE) {
        canvas.add(new fabric.Line([centerX - board.width/2 + i, centerY - board.height/2, centerX - board.width/2 + i, centerY + board.height/2], {
          stroke: '#cbd5e1', strokeWidth: 0.5, selectable: false, evented: false, isWorkspaceLayer: true, name: 'grid_line'
        }));
      }
      for (let i = 0; i < board.height; i += GRID_SIZE) {
        canvas.add(new fabric.Line([centerX - board.width/2, centerY - board.height/2 + i, centerX + board.width/2, centerY - board.height/2 + i], {
          stroke: '#cbd5e1', strokeWidth: 0.5, selectable: false, evented: false, isWorkspaceLayer: true, name: 'grid_line'
        }));
      }
    }

    // Reset Zoom and center viewport
    canvas.setZoom(1);
    const vpt = canvas.viewportTransform;
    vpt[4] = 0; vpt[5] = 0; 
    canvas.requestRenderAll();
    setZoom(1);

  }, [canvas, activeArtboard, showGrid]);

  useEffect(() => {
    renderArtboard();
  }, [renderArtboard]);

  useEffect(() => {
    if (!canvas) return;

    // Infinite Zoom via Mouse Wheel
    canvas.on('mouse:wheel', function(opt) {
      let delta = opt.e.deltaY;
      let newZoom = canvas.getZoom();
      newZoom *= 0.999 ** delta;
      if (newZoom > 5) newZoom = 5;      
      if (newZoom < 0.1) newZoom = 0.1;  
      
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    // Panning Logic (Spacebar + Drag or Pan Mode)
    let isDragging = false;
    let lastPosX, lastPosY;

    canvas.on('mouse:down', function(opt) {
      if (opt.e.altKey || isPanning) {
        isDragging = true;
        canvas.selection = false;
        lastPosX = opt.e.clientX;
        lastPosY = opt.e.clientY;
      }
    });

    canvas.on('mouse:move', function(opt) {
      if (isDragging) {
        let e = opt.e;
        let vpt = canvas.viewportTransform;
        vpt[4] += e.clientX - lastPosX;
        vpt[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX;
        lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', function() {
      canvas.setViewportTransform(canvas.viewportTransform);
      isDragging = false;
      canvas.selection = true;
    });

    return () => {
      canvas.off('mouse:wheel');
      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
    };
  }, [canvas, isPanning]);

  useEffect(() => {
    if (!canvas) return;

    const updateLiveDimensions = (obj) => {
      if (!obj) { setDimensions(null); return; }
      const width = (obj.getScaledWidth()).toFixed(0);
      const height = (obj.getScaledHeight()).toFixed(0);
      setDimensions({ w: width, h: height, x: obj.left, y: obj.top });
    };

    canvas.on('object:moving', (options) => {
      const obj = options.target;

      // 1. Snap to Grid
      if (snapToGrid) {
        obj.set({
          left: Math.round(obj.left / GRID_SIZE) * GRID_SIZE,
          top: Math.round(obj.top / GRID_SIZE) * GRID_SIZE
        });
      }

      // 2. Smart Alignment Guides (Center Snapping)
      const centerX = canvas.getWidth() / 2;
      const centerY = canvas.getHeight() / 2;
      const snapZone = 10;

      if (Math.abs(obj.left - centerX) < snapZone) obj.set({ left: centerX });
      if (Math.abs(obj.top - centerY) < snapZone) obj.set({ top: centerY });

      updateLiveDimensions(obj);
    });

    canvas.on('object:scaling', (e) => updateLiveDimensions(e.target));
    canvas.on('selection:created', (e) => { setActiveObject(e.selected[0]); updateLiveDimensions(e.selected[0]); });
    canvas.on('selection:updated', (e) => { setActiveObject(e.selected[0]); updateLiveDimensions(e.selected[0]); });
    canvas.on('selection:cleared', () => { setActiveObject(null); setDimensions(null); });

  }, [canvas, snapToGrid, setActiveObject]);

  const addText = () => {
    const text = new fabric.IText('New Typography', {
      left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
      fontFamily: 'Helvetica', fill: '#0f172a', fontSize: 40, fontWeight: 'bold'
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const addIllustration = (svgPath) => {
    const path = new fabric.Path(svgPath, {
      left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
      fill: '#3b82f6', scaleX: 1.5, scaleY: 1.5
    });
    canvas.add(path);
    canvas.setActiveObject(path);
  };

  const updateActiveTextProp = (prop, value) => {
    if (activeObject && activeObject.type === 'i-text') {
      activeObject.set(prop, value);
      canvas.renderAll();
    }
  };

  const handleLayer = (direction) => {
    if (!activeObject) return;
    if (direction === 'up') canvas.bringForward(activeObject);
    if (direction === 'down') canvas.sendBackwards(activeObject);
    
    // Ensure all workspace layers stay strictly at the back
    const workspaceLayers = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    workspaceLayers.forEach(o => canvas.sendToBack(o));
  };

  const exportDesign = () => {
    const board = canvas.getObjects().find(o => o.name === 'garment_board');
    if (!board) return;

    // Hide visual guides for export
    const guides = canvas.getObjects().filter(o => o.name === 'bleed_area' || o.name === 'safe_area' || o.name === 'grid_line');
    guides.forEach(g => g.visible = false);
    canvas.renderAll();

    // Export strictly the board area at 300 DPI equivalent (multiplier: 3)
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 3,
      left: board.left - (board.width / 2),
      top: board.top - (board.height / 2),
      width: board.width, height: board.height
    });

    // Restore guides
    guides.forEach(g => g.visible = true);
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = `print-${activeArtboard}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', backgroundColor: '#f8fafc' }}>
      
      {/* 1. TOP CONTEXTUAL TOOLBAR */}
      <div style={{ display: 'flex', gap: '10px', padding: '10px 20px', backgroundColor: '#1e293b', color: 'white', alignItems: 'center', height: '60px', borderBottom: '1px solid #0f172a' }}>
        
        {/* Dynamic Text Formatting */}
        {activeObject?.type === 'i-text' && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', borderRight: '1px solid #334155', paddingRight: '15px' }}>
            <select onChange={(e) => updateActiveTextProp('fontFamily', e.target.value)} style={toolbarSelectStyle}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="number" onChange={(e) => updateActiveTextProp('fontSize', parseInt(e.target.value))} defaultValue={activeObject.fontSize} style={{...toolbarSelectStyle, width: '60px'}} />
            <button onClick={() => updateActiveTextProp('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')} style={activeObject.fontWeight === 'bold' ? tActiveBtnStyle : tBtnStyle}><Bold size={16}/></button>
            <button onClick={() => updateActiveTextProp('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')} style={activeObject.fontStyle === 'italic' ? tActiveBtnStyle : tBtnStyle}><Italic size={16}/></button>
            <button onClick={() => updateActiveTextProp('underline', !activeObject.underline)} style={activeObject.underline ? tActiveBtnStyle : tBtnStyle}><Underline size={16}/></button>
            <button onClick={() => updateActiveTextProp('textAlign', 'left')} style={activeObject.textAlign === 'left' ? tActiveBtnStyle : tBtnStyle}><AlignLeft size={16}/></button>
            <button onClick={() => updateActiveTextProp('textAlign', 'center')} style={activeObject.textAlign === 'center' ? tActiveBtnStyle : tBtnStyle}><AlignCenter size={16}/></button>
            <button onClick={() => updateActiveTextProp('textAlign', 'right')} style={activeObject.textAlign === 'right' ? tActiveBtnStyle : tBtnStyle}><AlignRight size={16}/></button>
          </div>
        )}

        {/* Global Object Actions */}
        {activeObject && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
             <input type="color" onChange={(e) => { activeObject.set('fill', e.target.value); canvas.renderAll(); }} defaultValue={activeObject.fill} style={toolbarColorStyle} title="Color" />
            <button onClick={() => handleLayer('up')} style={tBtnStyle} title="Bring Forward"><ArrowUp size={16}/></button>
            <button onClick={() => handleLayer('down')} style={tBtnStyle} title="Send Backward"><ArrowDown size={16}/></button>
            <button onClick={() => { canvas.remove(activeObject); setActiveObject(null); }} style={{...tBtnStyle, color: '#ef4444'}} title="Delete"><Trash2 size={16}/></button>
          </div>
        )}

        <div style={{ flexGrow: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}><Monitor size={14}/> {ARTBOARDS[activeArtboard].name}</span>
          <button onClick={exportDesign} style={{...tBtnStyle, backgroundColor: '#10b981', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold'}}>
            <Download size={16} style={{marginRight: '8px'}}/> Print Ready Export
          </button>
        </div>
      </div>

      {/* 2. MAIN LAYOUT (Sidebar + Workspace) */}
      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* SIDEBAR */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex' }}>
          
          {/* Vertical Icon Menu */}
          <div style={{ width: '60px', backgroundColor: '#f8fafc', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px' }}>
            <button onClick={() => setActivePanel('settings')} style={activePanel === 'settings' ? iconTabActive : iconTab} title="Artboard Settings"><Settings size={22}/></button>
            <button onClick={() => setActivePanel('text')} style={activePanel === 'text' ? iconTabActive : iconTab} title="Typography"><Type size={22}/></button>
            <button onClick={() => setActivePanel('illustrations')} style={activePanel === 'illustrations' ? iconTabActive : iconTab} title="Vectors"><Star size={22}/></button>
            <button onClick={() => setActivePanel('templates')} style={activePanel === 'templates' ? iconTabActive : iconTab} title="Templates"><LayoutGrid size={22}/></button>
          </div>

          {/* Panel Content */}
          <div style={{ flexGrow: 1, padding: '20px', overflowY: 'auto' }}>
            
            {activePanel === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Print Artboard</h3>
                <select value={activeArtboard} onChange={(e) => setActiveArtboard(e.target.value)} style={selectInput}>
                  {Object.entries(ARTBOARDS).map(([key, board]) => (
                    <option key={key} value={key}>{board.name} ({board.width}x{board.height}px)</option>
                  ))}
                </select>
                <hr style={{ borderTop: '1px solid #e2e8f0', margin: '5px 0' }} />
                <h3 style={pHeader}>Workspace Setup</h3>
                <label style={toggleLabel}><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Show Grid System</label>
                <label style={toggleLabel}><input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} /> Snap to Grid</label>
                <label style={toggleLabel}><input type="checkbox" defaultChecked /> Smart Guides & Alignment</label>
              </div>
            )}

            {activePanel === 'text' && (
              <div>
                <h3 style={pHeader}>Typography</h3>
                <button onClick={addText} style={btnSecondary}><Type size={18}/> Add Header Text</button>
              </div>
            )}

            {activePanel === 'illustrations' && (
              <div>
                <h3 style={pHeader}>Vector Illustrations</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {ILLUSTRATIONS.map(item => (
                    <div key={item.id} onClick={() => addIllustration(item.path)} style={itemCard}>
                      <svg viewBox="0 0 200 200" width="40" height="40"><path d={item.path} fill="#3b82f6" /></svg>
                      <span style={{fontSize: '11px', textAlign: 'center'}}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePanel === 'templates' && (
              <div>
                <h3 style={pHeader}>Design Templates</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  {TEMPLATES.map(tmpl => (
                    <div key={tmpl.id} onClick={() => loadTemplate(tmpl.data)} style={{...itemCard, flexDirection: 'row'}}>
                      <LayoutGrid size={20} color="#64748b" />
                      <span style={{fontSize: '13px'}}>{tmpl.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. WORKSPACE WITH RULERS AND CANVAS */}
        <div ref={wrapperRef} style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
          
          {/* CSS-Based Rulers */}
          <div style={{ position: 'absolute', top: 0, left: '25px', right: 0, height: '25px', backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1', zIndex: 10, backgroundSize: '100px 100%', backgroundImage: 'repeating-linear-gradient(to right, #94a3b8 0, #94a3b8 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>
          <div style={{ position: 'absolute', top: '25px', left: 0, bottom: 0, width: '25px', backgroundColor: '#f8fafc', borderRight: '1px solid #cbd5e1', zIndex: 10, backgroundSize: '100% 100px', backgroundImage: 'repeating-linear-gradient(to bottom, #94a3b8 0, #94a3b8 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', backgroundColor: '#f1f5f9', borderRight: '1px solid #cbd5e1', borderBottom: '1px solid #cbd5e1', zIndex: 11 }}></div>

          <canvas ref={canvasRef} style={{ zIndex: 1 }} />

          {/* Live Dimensions Tooltip overlay */}
          {dimensions && (
            <div style={{ position: 'absolute', top: '35px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '6px 12px', borderRadius: '20px', fontSize: '12px', zIndex: 20, boxShadow: '0 4px 6px rgba(0,0,0,0.1)', fontWeight: 'bold' }}>
              W: {dimensions.w}px | H: {dimensions.h}px
            </div>
          )}

          {/* Floating Zoom & Pan Controls */}
          <div style={{ position: 'absolute', bottom: '20px', right: '20px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', border: '1px solid #e2e8f0', zIndex: 20 }}>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} style={ctrlBtn} title="Zoom Out"><ZoomOut size={18}/></button>
            <div style={{ padding: '0 15px', display: 'flex', alignItems: 'center', fontSize: '13px', fontWeight: 'bold', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#334155' }}>
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} style={ctrlBtn} title="Zoom In"><ZoomIn size={18}/></button>
            <button onClick={() => { canvas.setZoom(1); setZoom(1); canvas.viewportTransform[4]=0; canvas.viewportTransform[5]=0; canvas.requestRenderAll(); }} style={{...ctrlBtn, borderLeft: '1px solid #e2e8f0'}} title="Fit to Screen"><Maximize size={18}/></button>
            
            <button 
              onClick={() => setIsPanning(!isPanning)} 
              style={{...ctrlBtn, borderLeft: '1px solid #e2e8f0', backgroundColor: isPanning ? '#eff6ff' : 'transparent', color: isPanning ? '#3b82f6' : '#64748b'}} 
              title="Pan Tool (or Hold Alt + Drag)"
            >
              <Move size={18}/>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- CSS-IN-JS STYLES ---
const tBtnStyle = { padding: '8px', backgroundColor: 'transparent', border: '1px solid #334155', borderRadius: '4px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', transition: '0.2s' };
const tActiveBtnStyle = { ...tBtnStyle, backgroundColor: '#334155', color: '#ffffff' };
const toolbarSelectStyle = { padding: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', borderRadius: '4px', fontSize: '13px' };
const toolbarColorStyle = { padding: '0', border: '1px solid #334155', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer', width: '32px', height: '32px' };
const pHeader = { margin: '0 0 15px 0', fontSize: '13px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' };
const btnSecondary = { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500', color: '#334155' };
const iconTab = { padding: '12px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', transition: '0.2s' };
const iconTabActive = { ...iconTab, backgroundColor: '#e2e8f0', color: '#0f172a' };
const itemCard = { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', gap: '10px', transition: '0.2s' };
const selectInput = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', color: '#0f172a' };
const toggleLabel = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#475569', marginBottom: '10px', cursor: 'pointer' };
const ctrlBtn = { padding: '10px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' };
