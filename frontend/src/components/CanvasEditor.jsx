import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { 
  Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, 
  Download, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, 
  LayoutGrid, Star, ZoomIn, ZoomOut, Maximize, Move, Monitor, Settings,
  Layers, Lock, Unlock, Eye, EyeOff, Copy, Folder, Sparkles, Wand2, Group, Ungroup,
  Smile, Shield, Grid, Image, FileText, Compass, Award, Bookmark, Palette
} from 'lucide-react';

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

const FONTS = [
  'Arial', 'Helvetica', 'Times New Roman', 'Courier New', 
  'Montserrat', 'Oswald', 'Playfair Display', 'Pacifico', 'Bebas Neue', 'Cinzel'
];

const BLEND_MODES = [
  'normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 
  'color-dodge', 'color-burn', 'hard-light', 'soft-light', 'difference', 'exclusion'
];

// Comprehensive Design Assets Library Catalogs
const DESIGN_ASSETS = {
  icons: [
    { name: 'Lightning', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', color: '#eab308' },
    { name: 'Heart', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', color: '#ef4444' },
    { name: 'Flame', path: 'M12 23c-4.97 0-9-3.58-9-8 0-4.14 3.33-7.59 7.23-8.47.41-.09.84.09 1.05.46.21.37.17.84-.11 1.16C9.69 9.38 9 10.63 9 12c0 2.21 1.79 4 4 4s4-1.79 4-4c0-.75-.21-1.45-.58-2.06-.21-.35-.15-.8.08-1.09.23-.29.65-.37.98-.19C19.86 10.12 21 12.4 21 15c0 4.42-4.03 8-9 8z', color: '#f97316' }
  ],
  stickers: [
    { name: 'Smile Badge', type: 'circle', fill: '#facc15', text: 'GOOD VIBES' },
    { name: 'Danger Tag', type: 'rect', fill: '#0f172a', text: 'RESTRICTED' }
  ],
  illustrations: [
    { name: 'Mountain Peak', path: 'M2 20L12 4l10 16H2zm10-11.5L4.5 18h15L12 8.5z', color: '#334155' },
    { name: 'Palm Tree', path: 'M12 22v-8m0 0C9.5 14 7 11.5 7 9c0-2.5 2.5-5 5-5s5 2.5 5 5c0 2.5-2.5 5-5 5z', color: '#10b981' }
  ],
  clipart: [
    { name: 'Star Burst', path: 'M12 2l2.4 7.4h7.6l-6.2 4.5 2.4 7.4-6.2-4.5-6.2 4.5 2.4-7.4-6.2-4.5h7.6z', color: '#3b82f6' }
  ],
  frames: [
    { name: 'Square Border', stroke: '#0f172a', width: 200, height: 200 },
    { name: 'Circular Border', stroke: '#3b82f6', radius: 100 }
  ],
  badges: [
    { name: 'Est. 2026', text: 'EST. 2026', font: 'Cinzel' },
    { name: 'Original', text: '100% ORIGINAL', font: 'Oswald' }
  ],
  patterns: [
    { name: 'Polka Dots', type: 'dots' },
    { name: 'Stripes', type: 'stripes' }
  ],
  textures: [
    { name: 'Distress Grunge', opacity: 0.15 },
    { name: 'Vintage Wash', opacity: 0.25 }
  ],
  backgrounds: [
    { name: 'Solid White', color: '#ffffff' },
    { name: 'Dark Slate', color: '#0f172a' },
    { name: 'Sunset Gradient', gradient: ['#f97316', '#db2777'] }
  ],
  templates: [
    { name: 'Urban Streetwear', text: 'METROPOLIS', sub: 'NYC // 2026' },
    { name: 'Athletic Club', text: 'VARSITY', sub: 'CHAMPIONS' }
  ],
  logos: [
    { name: 'Minimal Crest', text: 'ATELIER', shape: 'circle' }
  ],
  shapes: [
    { name: 'Rectangle', type: 'rect' },
    { name: 'Circle', type: 'circle' },
    { name: 'Triangle', type: 'triangle' }
  ]
};

export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject } = useCanvasStore();
  
  // UI & Workspace State
  const [activeLeftPanel, setActiveLeftPanel] = useState('assets');
  const [activeAssetTab, setActiveAssetTab] = useState('icons');
  const [activeRightPanel, setActiveRightPanel] = useState('layers'); 
  const [activeArtboard, setActiveArtboard] = useState('front');
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  
  // Advanced Layer & Text State
  const [layers, setLayers] = useState([]);
  const [layerSearch, setLayerSearch] = useState('');

  useEffect(() => {
    // Inject Google Fonts for typography
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700&family=Montserrat:wght@400;700;900&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => document.head.removeChild(link);
  }, []);

  const syncLayers = useCallback(() => {
    if (!canvas) return;
    const allObjects = canvas.getObjects();
    const userLayers = allObjects.filter(o => !o.isWorkspaceLayer);
    setLayers([...userLayers].reverse());
  }, [canvas]);

  useEffect(() => {
    const initCanvas = new fabric.Canvas(canvasRef.current, {
      backgroundColor: '#e2e8f0',
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
    
    setTimeout(handleResize, 100); 
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      initCanvas.dispose();
    };
  }, [setCanvas]);

  const renderArtboard = useCallback(() => {
    if (!canvas) return;

    const objectsToRemove = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    objectsToRemove.forEach(o => canvas.remove(o));

    const board = ARTBOARDS[activeArtboard];
    const centerX = canvas.getWidth() / 2 || 450;
    const centerY = canvas.getHeight() / 2 || 350;

    const boardRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width, height: board.height, fill: board.defaultColor,
      shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.1)', blur: 20, offsetX: 0, offsetY: 10 }),
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'garment_board'
    });

    const bleedRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width - (board.bleed * 2), height: board.height - (board.bleed * 2),
      fill: 'transparent', stroke: '#ef4444', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'bleed_area'
    });

    const safeRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width - (board.safe * 2), height: board.height - (board.safe * 2),
      fill: 'transparent', stroke: '#10b981', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'safe_area'
    });

    canvas.add(boardRect, bleedRect, safeRect);
    canvas.sendToBack(boardRect);

    if (showGrid) {
      for (let i = 0; i < board.width; i += GRID_SIZE) {
        canvas.add(new fabric.Line([centerX - board.width/2 + i, centerY - board.height/2, centerX - board.width/2 + i, centerY + board.height/2], {
          stroke: '#cbd5e1', strokeWidth: 0.5, selectable: false, evented: false, isWorkspaceLayer: true
        }));
      }
      for (let i = 0; i < board.height; i += GRID_SIZE) {
        canvas.add(new fabric.Line([centerX - board.width/2, centerY - board.height/2 + i, centerX + board.width/2, centerY - board.height/2 + i], {
          stroke: '#cbd5e1', strokeWidth: 0.5, selectable: false, evented: false, isWorkspaceLayer: true
        }));
      }
    }

    canvas.setZoom(1);
    canvas.viewportTransform[4] = 0; canvas.viewportTransform[5] = 0; 
    canvas.requestRenderAll();
    setZoom(1);
    syncLayers();
  }, [canvas, activeArtboard, showGrid, syncLayers]);

  useEffect(() => { renderArtboard(); }, [renderArtboard]);

  useEffect(() => {
    if (!canvas) return;

    canvas.on('mouse:wheel', function(opt) {
      let delta = opt.e.deltaY;
      let newZoom = canvas.getZoom() * (0.999 ** delta);
      if (newZoom > 5) newZoom = 5;      
      if (newZoom < 0.1) newZoom = 0.1;  
      canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, newZoom);
      setZoom(newZoom);
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });

    let isDragging = false, lastPosX, lastPosY;
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
        canvas.viewportTransform[4] += e.clientX - lastPosX;
        canvas.viewportTransform[5] += e.clientY - lastPosY;
        canvas.requestRenderAll();
        lastPosX = e.clientX; lastPosY = e.clientY;
      }
    });

    canvas.on('mouse:up', function() {
      canvas.setViewportTransform(canvas.viewportTransform);
      isDragging = false;
      canvas.selection = true;
    });

    return () => {
      canvas.off('mouse:wheel'); canvas.off('mouse:down');
      canvas.off('mouse:move'); canvas.off('mouse:up');
    };
  }, [canvas, isPanning]);

  useEffect(() => {
    if (!canvas) return;

    const updateLiveDimensions = (obj) => {
      if (!obj) { setDimensions(null); return; }
      setDimensions({ w: obj.getScaledWidth().toFixed(0), h: obj.getScaledHeight().toFixed(0) });
    };

    canvas.on('object:moving', (options) => {
      const obj = options.target;
      if (snapToGrid) {
        obj.set({ left: Math.round(obj.left / GRID_SIZE) * GRID_SIZE, top: Math.round(obj.top / GRID_SIZE) * GRID_SIZE });
      }
      const centerX = canvas.getWidth() / 2, centerY = canvas.getHeight() / 2, snapZone = 10;
      if (Math.abs(obj.left - centerX) < snapZone) obj.set({ left: centerX });
      if (Math.abs(obj.top - centerY) < snapZone) obj.set({ top: centerY });
      updateLiveDimensions(obj);
    });

    canvas.on('object:scaling', (e) => updateLiveDimensions(e.target));
    canvas.on('selection:created', (e) => { setActiveObject(e.selected[0]); updateLiveDimensions(e.selected[0]); setActiveRightPanel('properties'); });
    canvas.on('selection:updated', (e) => { setActiveObject(e.selected[0]); updateLiveDimensions(e.selected[0]); });
    canvas.on('selection:cleared', () => { setActiveObject(null); setDimensions(null); setActiveRightPanel('layers'); });

    canvas.on('object:added', syncLayers);
    canvas.on('object:removed', syncLayers);
    canvas.on('object:modified', syncLayers);

  }, [canvas, snapToGrid, setActiveObject, syncLayers]);

  const addText = () => {
    const text = new fabric.IText('PRO DESIGN', {
      left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
      fontFamily: 'Montserrat', fill: '#0f172a', fontSize: 50, fontWeight: '900',
      name: `Text Layer ${layers.length + 1}`
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const addShape = (type) => {
    let obj;
    if (type === 'rect') {
      obj = new fabric.Rect({ width: 150, height: 150, fill: '#3b82f6', rx: 10, ry: 10 });
    } else if (type === 'circle') {
      obj = new fabric.Circle({ radius: 75, fill: '#10b981' });
    } else if (type === 'triangle') {
      obj = new fabric.Triangle({ width: 150, height: 150, fill: '#f59e0b' });
    }
    if (obj) {
      obj.set({ left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center', name: `Shape ${layers.length + 1}` });
      canvas.add(obj);
      canvas.setActiveObject(obj);
    }
  };

  const injectAsset = (asset) => {
    if (asset.path) {
      const pathObj = new fabric.Path(asset.path, {
        left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
        fill: asset.color || '#3b82f6', scaleX: 2, scaleY: 2, name: `${asset.name} Asset`
      });
      canvas.add(pathObj);
      canvas.setActiveObject(pathObj);
    } else if (asset.text) {
      const textObj = new fabric.IText(asset.text, {
        left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
        fontFamily: asset.font || 'Montserrat', fill: '#0f172a', fontSize: 40, fontWeight: 'bold', name: `${asset.name} Badge`
      });
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
    } else if (asset.color) {
      const board = canvas.getObjects().find(o => o.name === 'garment_board');
      if (board) board.set('fill', asset.color);
      canvas.requestRenderAll();
    }
  };

  const applyTextEffect = (effectType) => {
    if (!activeObject || activeObject.type !== 'i-text') return;

    if (effectType === 'metallic') {
      const gradient = new fabric.Gradient({
        type: 'linear', coords: { x1: 0, y1: 0, x2: 0, y2: activeObject.height },
        colorStops: [ { offset: 0, color: '#f8fafc' }, { offset: 0.5, color: '#94a3b8' }, { offset: 1, color: '#334155' } ]
      });
      activeObject.set('fill', gradient);
      activeObject.set('shadow', new fabric.Shadow({ color: 'rgba(255,255,255,0.5)', blur: 2, offsetX: 1, offsetY: 1 }));
    } 
    else if (effectType === 'vintage') {
      activeObject.set('fontFamily', 'Playfair Display');
      activeObject.set('fill', '#d97706');
      activeObject.set('opacity', 0.85);
      activeObject.set('shadow', new fabric.Shadow({ color: '#78350f', blur: 0, offsetX: 4, offsetY: 4 }));
    }
    else if (effectType === 'glow') {
      activeObject.set('shadow', new fabric.Shadow({ color: '#ec4899', blur: 20, offsetX: 0, offsetY: 0 }));
    }
    else if (effectType === 'outline') {
      activeObject.set('stroke', '#0f172a');
      activeObject.set('strokeWidth', 2);
      activeObject.set('fill', 'transparent');
    }
    canvas.renderAll();
  };

  const updateActiveProp = (prop, value) => {
    if (activeObject) {
      activeObject.set(prop, prop === 'charSpacing' ? parseInt(value) : value);
      canvas.renderAll();
      syncLayers();
    }
  };

  const handleLayerOrder = (direction, targetObj = activeObject) => {
    if (!targetObj) return;
    if (direction === 'up') canvas.bringForward(targetObj);
    if (direction === 'down') canvas.sendBackwards(targetObj);
    
    const workspaceLayers = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    workspaceLayers.forEach(o => canvas.sendToBack(o));
    syncLayers();
  };

  const toggleLayerLock = (obj) => {
    obj.set({ selectable: !obj.selectable, evented: !obj.evented });
    canvas.renderAll();
    syncLayers();
  };

  const toggleLayerVisibility = (obj) => {
    obj.set({ visible: !obj.visible });
    canvas.discardActiveObject();
    canvas.renderAll();
    syncLayers();
  };

  const renameLayer = (obj, newName) => {
    obj.set('name', newName);
    syncLayers();
  };

  const duplicateLayer = (obj) => {
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20, name: `${obj.name} (Copy)` });
      canvas.add(cloned);
      canvas.setActiveObject(cloned);
    });
  };

  const groupSelection = () => {
    if (!canvas.getActiveObject()) return;
    if (canvas.getActiveObject().type === 'activeSelection') {
      canvas.getActiveObject().toGroup().set({ name: 'Layer Group' });
      canvas.requestRenderAll();
      syncLayers();
    }
  };

  const ungroupSelection = () => {
    if (!activeObject || activeObject.type !== 'group') return;
    activeObject.toActiveSelection();
    canvas.requestRenderAll();
    syncLayers();
  };

  const exportDesign = () => {
    const board = canvas.getObjects().find(o => o.name === 'garment_board');
    if (!board) return;
    const guides = canvas.getObjects().filter(o => o.name === 'bleed_area' || o.name === 'safe_area' || o.name === 'grid_line');
    guides.forEach(g => g.visible = false);
    
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 3,
      left: board.left - (board.width / 2), top: board.top - (board.height / 2),
      width: board.width, height: board.height
    });

    guides.forEach(g => g.visible = true);
    canvas.renderAll();
    const link = document.createElement('a');
    link.download = `PrintFile-${activeArtboard}-${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', backgroundColor: '#f8fafc' }}>
      
      {/* HEADER / CONTEXT TOOLBAR */}
      <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', alignItems: 'center', height: '60px', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '30px', letterSpacing: '1px' }}>ENTERPRISE DESIGNER</h1>
        
        {activeObject?.type === 'i-text' && (
          <div style={{ display: 'flex', gap: '5px', alignItems: 'center', borderLeft: '1px solid #334155', paddingLeft: '20px' }}>
             <select onChange={(e) => updateActiveProp('fontFamily', e.target.value)} value={activeObject.fontFamily} style={toolbarSelectStyle}>
              {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
            <input type="number" onChange={(e) => updateActiveProp('fontSize', parseInt(e.target.value))} value={activeObject.fontSize} style={{...toolbarSelectStyle, width: '60px'}} />
            <button onClick={() => updateActiveProp('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold')} style={activeObject.fontWeight === 'bold' ? tActiveBtnStyle : tBtnStyle}><Bold size={16}/></button>
            <button onClick={() => updateActiveProp('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic')} style={activeObject.fontStyle === 'italic' ? tActiveBtnStyle : tBtnStyle}><Italic size={16}/></button>
            <input type="color" onChange={(e) => updateActiveProp('fill', e.target.value)} value={activeObject.fill || '#000000'} style={toolbarColorStyle} title="Color" />
          </div>
        )}

        <div style={{ flexGrow: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}><Monitor size={14}/> {ARTBOARDS[activeArtboard].name}</span>
          <button onClick={exportDesign} style={{...tBtnStyle, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold'}}>
            <Download size={16} style={{marginRight: '8px'}}/> Generate 300DPI
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR - DESIGN ASSETS & SETTINGS */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex' }}>
          <div style={{ width: '60px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', borderRight: '1px solid #e2e8f0' }}>
            <button onClick={() => setActiveLeftPanel('settings')} style={activeLeftPanel === 'settings' ? iconTabActive : iconTab} title="Artboard Setup"><Settings size={20}/></button>
            <button onClick={() => setActiveLeftPanel('assets')} style={activeLeftPanel === 'assets' ? iconTabActive : iconTab} title="Design Assets Library"><Wand2 size={20}/></button>
          </div>

          <div style={{ flexGrow: 1, padding: '15px', overflowY: 'auto' }}>
            {activeLeftPanel === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Print Artboard</h3>
                <select value={activeArtboard} onChange={(e) => setActiveArtboard(e.target.value)} style={selectInput}>
                  {Object.entries(ARTBOARDS).map(([key, board]) => (
                    <option key={key} value={key}>{board.name} ({board.width}x{board.height})</option>
                  ))}
                </select>
                <hr style={divider} />
                <h3 style={pHeader}>Precision Grid</h3>
                <label style={toggleLabel}><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Show Visual Grid</label>
                <label style={toggleLabel}><input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} /> Snap Objects to Grid</label>
              </div>
            )}

            {activeLeftPanel === 'assets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={pHeader}>Design Assets Library</h3>
                
                {/* Asset Sub-Category Tabs */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                  {Object.keys(DESIGN_ASSETS).map((tab) => (
                    <button 
                      key={tab} 
                      onClick={() => setActiveAssetTab(tab)} 
                      style={{ 
                        padding: '6px 4px', fontSize: '11px', textTransform: 'capitalize', 
                        backgroundColor: activeAssetTab === tab ? '#3b82f6' : '#f1f5f9',
                        color: activeAssetTab === tab ? '#ffffff' : '#475569',
                        border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
                      }}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <hr style={divider} />

                {/* Quick Add Custom Elements */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={addText} style={{...btnSecondary, flex: 1}}><Type size={14}/> Text</button>
                  <button onClick={() => addShape('rect')} style={{...btnSecondary, flex: 1}}><Square size={14}/> Box</button>
                  <button onClick={() => addShape('circle')} style={{...btnSecondary, flex: 1}}><Circle size={14}/> Dot</button>
                </div>

                {/* Active Asset Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {DESIGN_ASSETS[activeAssetTab]?.map((asset, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => injectAsset(asset)}
                      style={{ 
                        padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', 
                        borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '12px',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                        transition: '0.2s'
                      }}
                    >
                      {asset.path ? (
                        <svg viewBox="0 0 24 24" width="24" height="24"><path d={asset.path} fill={asset.color || '#3b82f6'}/></svg>
                      ) : (
                        <Star size={20} color="#3b82f6" />
                      )}
                      <span style={{ fontWeight: '500', color: '#334155' }}>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE - WORKSPACE & CANVAS */}
        <div ref={wrapperRef} style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#cbd5e1' }}>
          <div style={{ position: 'absolute', top: 0, left: '25px', right: 0, height: '25px', backgroundColor: '#f8fafc', borderBottom: '1px solid #94a3b8', zIndex: 10, backgroundSize: '100px 100%', backgroundImage: 'repeating-linear-gradient(to right, #64748b 0, #64748b 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>
          <div style={{ position: 'absolute', top: '25px', left: 0, bottom: 0, width: '25px', backgroundColor: '#f8fafc', borderRight: '1px solid #94a3b8', zIndex: 10, backgroundSize: '100% 100px', backgroundImage: 'repeating-linear-gradient(to bottom, #64748b 0, #64748b 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '25px', height: '25px', backgroundColor: '#e2e8f0', borderRight: '1px solid #94a3b8', borderBottom: '1px solid #94a3b8', zIndex: 11 }}></div>

          <canvas ref={canvasRef} style={{ zIndex: 1 }} />

          {dimensions && (
            <div style={{ position: 'absolute', top: '35px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', zIndex: 20, fontWeight: 'bold', letterSpacing: '1px' }}>
              W: {dimensions.w}px &nbsp;|&nbsp; H: {dimensions.h}px
            </div>
          )}

          <div style={{ position: 'absolute', bottom: '20px', left: '45px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', border: '1px solid #e2e8f0', zIndex: 20 }}>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} style={ctrlBtn} title="Zoom Out"><ZoomOut size={16}/></button>
            <div style={{ padding: '0 15px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#334155' }}>
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} style={ctrlBtn} title="Zoom In"><ZoomIn size={16}/></button>
            <button onClick={() => { canvas.setZoom(1); setZoom(1); canvas.viewportTransform[4]=0; canvas.viewportTransform[5]=0; canvas.requestRenderAll(); }} style={{...ctrlBtn, borderLeft: '1px solid #e2e8f0'}} title="Reset View"><Maximize size={16}/></button>
            <button onClick={() => setIsPanning(!isPanning)} style={{...ctrlBtn, borderLeft: '1px solid #e2e8f0', backgroundColor: isPanning ? '#eff6ff' : 'transparent', color: isPanning ? '#3b82f6' : '#64748b'}} title="Pan Tool"><Move size={16}/></button>
          </div>
        </div>

        {/* RIGHT SIDEBAR - LAYERS & PROPERTIES */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={() => setActiveRightPanel('layers')} style={activeRightPanel === 'layers' ? rightTabActive : rightTab}>
              <Layers size={16} /> Layers
            </button>
            <button onClick={() => setActiveRightPanel('properties')} style={activeRightPanel === 'properties' ? rightTabActive : rightTab}>
              <Settings size={16} /> Properties
            </button>
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto' }}>
            
            {activeRightPanel === 'layers' && (
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                  <input type="text" placeholder="Search layers..." value={layerSearch} onChange={(e) => setLayerSearch(e.target.value)} style={{...selectInput, flexGrow: 1}} />
                  <button onClick={groupSelection} style={iconBtn} title="Group Selection"><Folder size={16}/></button>
                  <button onClick={ungroupSelection} style={iconBtn} title="Ungroup"><Group size={16}/></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {layers
                    .filter(l => (l.name || l.type).toLowerCase().includes(layerSearch.toLowerCase()))
                    .map((layer, index) => (
                    <div key={index} style={{ 
                      display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', 
                      backgroundColor: activeObject === layer ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${activeObject === layer ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '6px'
                    }}>
                      <div onClick={() => canvas.setActiveObject(layer) || canvas.renderAll()} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                        {layer.type === 'i-text' ? <Type size={14} color="#64748b" style={{marginRight:'8px'}}/> : 
                         layer.type === 'group' ? <Folder size={14} color="#64748b" style={{marginRight:'8px'}}/> :
                         <Layers size={14} color="#64748b" style={{marginRight:'8px'}}/>}
                        <input 
                          value={layer.name || layer.type} 
                          onChange={(e) => renameLayer(layer, e.target.value)} 
                          style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#334155', width: '100%', outline: 'none' }}
                        />
                      </div>
                      
                      <button onClick={() => toggleLayerVisibility(layer)} style={layerActionBtn}>
                        {layer.visible ? <Eye size={14}/> : <EyeOff size={14} color="#cbd5e1"/>}
                      </button>
                      <button onClick={() => toggleLayerLock(layer)} style={layerActionBtn}>
                        {layer.selectable ? <Unlock size={14}/> : <Lock size={14} color="#cbd5e1"/>}
                      </button>
                      <button onClick={() => duplicateLayer(layer)} style={layerActionBtn}><Copy size={14}/></button>
                      
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <button onClick={() => handleLayerOrder('up', layer)} style={{...layerActionBtn, padding: 0}}><ArrowUp size={12}/></button>
                        <button onClick={() => handleLayerOrder('down', layer)} style={{...layerActionBtn, padding: 0}}><ArrowDown size={12}/></button>
                      </div>
                    </div>
                  ))}
                  {layers.length === 0 && <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>Workspace is empty.</div>}
                </div>
              </div>
            )}

            {activeRightPanel === 'properties' && (
              <div style={{ padding: '15px' }}>
                {!activeObject ? (
                   <div style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', padding: '20px' }}>Select a layer on the canvas to view properties.</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={subHeader}>Layer Blend & Opacity</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={labelTxt}>Opacity</span>
                        <input type="range" min="0" max="1" step="0.05" value={activeObject.opacity} onChange={(e) => updateActiveProp('opacity', parseFloat(e.target.value))} style={{ flexGrow: 1 }} />
                      </div>
                      <select value={activeObject.globalCompositeOperation || 'source-over'} onChange={(e) => updateActiveProp('globalCompositeOperation', e.target.value)} style={selectInput}>
                         <option value="source-over">Normal (Default)</option>
                         {BLEND_MODES.filter(m => m !== 'normal').map(mode => <option key={mode} value={mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)}</option>)}
                      </select>
                    </div>

                    {activeObject.type === 'i-text' && (
                      <>
                        <hr style={divider} />
                        <div>
                          <h4 style={subHeader}>Advanced Typography</h4>
                          <div style={propRow}>
                            <span style={labelTxt}>Letter Spacing</span>
                            <input type="number" value={activeObject.charSpacing || 0} onChange={(e) => updateActiveProp('charSpacing', e.target.value)} style={numInput} />
                          </div>
                          <div style={propRow}>
                            <span style={labelTxt}>Line Height</span>
                            <input type="number" step="0.1" value={activeObject.lineHeight || 1.16} onChange={(e) => updateActiveProp('lineHeight', parseFloat(e.target.value))} style={numInput} />
                          </div>
                        </div>

                        <hr style={divider} />
                        <div>
                          <h4 style={subHeader}>Text Effects & Presets</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => applyTextEffect('metallic')} style={effectBtn}><Sparkles size={14}/> Metallic</button>
                            <button onClick={() => applyTextEffect('vintage')} style={effectBtn}><Type size={14}/> Vintage</button>
                            <button onClick={() => applyTextEffect('glow')} style={effectBtn}><Wand2 size={14}/> Neon Glow</button>
                            <button onClick={() => applyTextEffect('outline')} style={effectBtn}><Type size={14}/> Hollow</button>
                          </div>
                        </div>
                      </>
                    )}

                    <hr style={divider} />
                    <button onClick={() => { canvas.remove(activeObject); setActiveObject(null); syncLayers(); }} style={{...btnSecondary, color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2', justifyContent: 'center' }}>
                      <Trash2 size={16}/> Delete Layer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const tBtnStyle = { padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', transition: '0.2s' };
const tActiveBtnStyle = { ...tBtnStyle, backgroundColor: '#334155', color: '#ffffff' };
const toolbarSelectStyle = { padding: '4px 8px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px', fontSize: '13px' };
const toolbarColorStyle = { padding: '0', border: '1px solid #334155', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer', width: '28px', height: '28px' };
const pHeader = { margin: '0 0 10px 0', fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' };
const subHeader = { margin: '0 0 10px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' };
const btnSecondary = { display: 'flex', gap: '8px', alignItems: 'center', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#334155', transition: '0.2s' };
const effectBtn = { ...btnSecondary, padding: '6px 8px', fontSize: '12px', justifyContent: 'center', backgroundColor: '#f8fafc' };
const iconTab = { padding: '12px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', transition: '0.2s' };
const iconTabActive = { ...iconTab, backgroundColor: '#e2e8f0', color: '#0f172a' };
const rightTab = { flexGrow: 1, padding: '12px', backgroundColor: '#f8fafc', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const rightTabActive = { ...rightTab, backgroundColor: '#ffffff', borderBottom: '2px solid #3b82f6', color: '#0f172a' };
const selectInput = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a' };
const toggleLabel = { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#475569', marginBottom: '8px', cursor: 'pointer' };
const ctrlBtn = { padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' };
const layerActionBtn = { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748b', display: 'flex' };
const iconBtn = { padding: '6px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', color: '#475569' };
const divider = { borderTop: '1px solid #e2e8f0', margin: '15px 0', borderBottom: 'none' };
const propRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' };
const labelTxt = { fontSize: '12px', color: '#475569' };
const numInput = { width: '70px', padding: '4px', border: '1px solid #cbd5e1', borderRadius: '4px', fontSize: '12px', textAlign: 'right' };
