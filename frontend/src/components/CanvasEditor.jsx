import React, { useEffect, useRef, useState, useCallback } from 'react';
import { fabric } from 'fabric';
import { useCanvasStore } from '../store/useCanvasStore';
import { 
  Type, Square, Circle, Image as ImageIcon, Trash2, ArrowUp, ArrowDown, 
  Download, Bold, Italic, Underline, AlignCenter, AlignLeft, AlignRight, 
  LayoutGrid, Star, ZoomIn, ZoomOut, Maximize, Move, Monitor, Settings,
  Layers, Lock, Unlock, Eye, EyeOff, Copy, Folder, Sparkles, Wand2, Group, Ungroup,
  Smile, Shield, Grid, FileText, Compass, Award, Bookmark, Palette,
  Crop, FlipHorizontal, FlipVertical, Sliders, ImagePlus, Eraser, Scissors,
  PenTool, MousePointer2, Type as TypeIcon, Shirt, Coffee, ShoppingBag
} from 'lucide-react';

const APPAREL_CATALOG = {
  tshirts: {
    name: 'T-Shirts',
    icon: Shirt,
    items: [
      { id: 'ts1', brand: 'Gildan', name: 'Heavy Cotton T-Shirt', price: '$12.50', colors: ['#ffffff', '#0f172a', '#ef4444', '#3b82f6', '#10b981'], positions: ['front', 'back', 'left_sleeve', 'right_sleeve'] },
      { id: 'ts2', brand: 'Bella+Canvas', name: 'Premium Jersey', price: '$18.00', colors: ['#ffffff', '#1f2937', '#f43f5e', '#8b5cf6'], positions: ['front', 'back'] }
    ]
  },
  hoodies: {
    name: 'Hoodies & Sweatshirts',
    icon: Shirt,
    items: [
      { id: 'h1', brand: 'Champion', name: 'Reverse Weave Hoodie', price: '$35.00', colors: ['#f1f5f9', '#020617', '#b91c1c'], positions: ['front', 'back', 'hood', 'pocket'] },
      { id: 'h2', brand: 'Gildan', name: 'Blend Crewneck', price: '$22.00', colors: ['#ffffff', '#334155', '#4d7c0f'], positions: ['front', 'back'] }
    ]
  },
  polos: {
    name: 'Polo Shirts',
    icon: Shirt,
    items: [
      { id: 'p1', brand: 'Nike', name: 'Dri-FIT Polo', price: '$45.00', colors: ['#ffffff', '#000000', '#1d4ed8'], positions: ['front', 'back'] }
    ]
  },
  jerseys: {
    name: 'Jerseys & Tank Tops',
    icon: Shirt,
    items: [
      { id: 'j1', brand: 'SportTek', name: 'Mesh Reversible', price: '$28.00', colors: ['#ffffff', '#dc2626', '#2563eb'], positions: ['front', 'back'] },
      { id: 't1', brand: 'Next Level', name: 'Cotton Tank', price: '$14.00', colors: ['#ffffff', '#0f172a'], positions: ['front', 'back'] }
    ]
  },
  accessories: {
    name: 'Caps & Bags',
    icon: ShoppingBag,
    items: [
      { id: 'c1', brand: 'Yupoong', name: 'Classic Snapback', price: '$15.00', colors: ['#000000', '#1e3a8a', '#7f1d1d'], positions: ['front'] },
      { id: 'b1', brand: 'Port Authority', name: 'Tote Bag', price: '$9.00', colors: ['#fef3c7', '#000000'], positions: ['front', 'back'] }
    ]
  },
  drinkware: {
    name: 'Mugs & Tumblers',
    icon: Coffee,
    items: [
      { id: 'm1', brand: 'Generic', name: '11oz Ceramic Mug', price: '$8.00', colors: ['#ffffff', '#000000'], positions: ['front', 'back'] }
    ]
  }
};

const ARTBOARDS = {
  front: { name: 'Front Chest', width: 400, height: 500, safe: 20, bleed: 10 },
  back: { name: 'Full Back', width: 400, height: 550, safe: 20, bleed: 10 },
  left_sleeve: { name: 'Left Sleeve', width: 150, height: 150, safe: 10, bleed: 5 },
  right_sleeve: { name: 'Right Sleeve', width: 150, height: 150, safe: 10, bleed: 5 },
  hood: { name: 'Hood Outer', width: 200, height: 200, safe: 15, bleed: 10 },
  pocket: { name: 'Front Pocket', width: 100, height: 100, safe: 5, bleed: 5 },
  collar: { name: 'Inner Collar Tag', width: 80, height: 80, safe: 5, bleed: 2 }
};

const GRID_SIZE = 20;
const FONTS = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Montserrat', 'Oswald', 'Playfair Display', 'Pacifico', 'Bebas Neue', 'Cinzel'];
const BLEND_MODES = ['normal', 'multiply', 'screen', 'overlay', 'darken', 'lighten', 'color-dodge', 'color-burn', 'hard-light', 'difference'];

const DESIGN_ASSETS = {
  icons: [
    { name: 'Lightning', path: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', color: '#eab308' },
    { name: 'Heart', path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z', color: '#ef4444' }
  ],
  shapes: [
    { name: 'Rectangle', type: 'rect' },
    { name: 'Circle', type: 'circle' },
    { name: 'Triangle', type: 'triangle' }
  ],
  badges: [
    { name: 'Est. 2026', text: 'EST. 2026', font: 'Cinzel' },
    { name: 'Original', text: '100% ORIGINAL', font: 'Oswald' }
  ]
};

export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject } = useCanvasStore();
  
  // UI & Workspace State
  const [activeLeftPanel, setActiveLeftPanel] = useState('apparel');
  const [activeAssetTab, setActiveAssetTab] = useState('icons');
  const [activeRightPanel, setActiveRightPanel] = useState('layers'); 
  
  // Apparel & Artboard State
  const [activeCategory, setActiveCategory] = useState('tshirts');
  const [activeProduct, setActiveProduct] = useState(APPAREL_CATALOG.tshirts.items[0]);
  const [activeColor, setActiveColor] = useState(APPAREL_CATALOG.tshirts.items[0].colors[0]);
  const [activeArtboard, setActiveArtboard] = useState('front');
  
  // Canvas View & Drawing State
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [dimensions, setDimensions] = useState(null);
  const [layers, setLayers] = useState([]);
  const [layerSearch, setLayerSearch] = useState('');
  
  // Vector & Pen Tool State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(5);

  useEffect(() => {
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
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
      selection: true,
      isDrawingMode: false
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

    const bleedRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width, height: board.height,
      fill: 'transparent', stroke: '#ef4444', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'bleed_area'
    });

    const safeRect = new fabric.Rect({
      left: centerX, top: centerY, originX: 'center', originY: 'center',
      width: board.width - (board.safe * 2), height: board.height - (board.safe * 2),
      fill: 'transparent', stroke: '#10b981', strokeWidth: 1, strokeDashArray: [4, 4],
      selectable: false, evented: false, isWorkspaceLayer: true, name: 'safe_area'
    });

    canvas.add(bleedRect, safeRect);
    canvas.sendToBack(safeRect);
    canvas.sendToBack(bleedRect);

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

    canvas.requestRenderAll();
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
      if (!isDrawingMode) canvas.selection = true;
    });

    return () => {
      canvas.off('mouse:wheel'); canvas.off('mouse:down');
      canvas.off('mouse:move'); canvas.off('mouse:up');
    };
  }, [canvas, isPanning, isDrawingMode]);

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

  const toggleDrawMode = () => {
    const newMode = !isDrawingMode;
    setIsDrawingMode(newMode);
    canvas.isDrawingMode = newMode;
    if (newMode) {
      canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushSize;
    }
  };

  const updateBrush = (prop, val) => {
    if (prop === 'color') setBrushColor(val);
    if (prop === 'width') setBrushSize(val);
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = prop === 'color' ? val : brushColor;
      canvas.freeDrawingBrush.width = prop === 'width' ? val : brushSize;
    }
  };

  const addText = () => {
    const text = new fabric.IText('PRO DESIGN', {
      left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
      fontFamily: 'Montserrat', fill: '#0f172a', fontSize: 50, fontWeight: '900',
      name: `Text ${layers.length + 1}`
    });
    canvas.add(text);
    canvas.setActiveObject(text);
  };

  const textToOutlines = () => {
    if (!activeObject || activeObject.type !== 'i-text') return;
    // Simulates converting text to vector paths by rasterizing at high res 
    // ensuring it cannot be edited but perfectly preserves the font styling for print
    activeObject.cloneAsImage((clonedImg) => {
      clonedImg.set({
        left: activeObject.left, top: activeObject.top,
        originX: activeObject.originX, originY: activeObject.originY,
        name: `${activeObject.name} (Outlined)`
      });
      canvas.add(clonedImg);
      canvas.remove(activeObject);
      canvas.setActiveObject(clonedImg);
    }, { multiplier: 4 });
  };

  const addShape = (type) => {
    let obj;
    if (type === 'rect') obj = new fabric.Rect({ width: 150, height: 150, fill: '#3b82f6', rx: 10, ry: 10 });
    else if (type === 'circle') obj = new fabric.Circle({ radius: 75, fill: '#10b981' });
    else if (type === 'triangle') obj = new fabric.Triangle({ width: 150, height: 150, fill: '#f59e0b' });
    if (obj) {
      obj.set({ left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center', name: `Shape ${layers.length + 1}` });
      canvas.add(obj);
      canvas.setActiveObject(obj);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
      fabric.Image.fromURL(f.target.result, (img) => {
        img.scaleToWidth(300);
        img.set({ left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center', name: `Image ${layers.length + 1}` });
        canvas.add(img);
        canvas.setActiveObject(img);
      });
    };
    reader.readAsDataURL(file);
  };

  const applyImageFilter = (index, filterName, options) => {
    if (!activeObject || activeObject.type !== 'image') return;
    if (!activeObject.filters) activeObject.filters = [];
    if (!activeObject.filters[index]) {
      activeObject.filters[index] = new fabric.Image.filters[filterName](options);
    } else {
      activeObject.filters[index].setOptions(options);
    }
    activeObject.applyFilters();
    canvas.requestRenderAll();
  };

  const applyMagicErase = () => {
    if (!activeObject || activeObject.type !== 'image') return;
    if (!activeObject.filters) activeObject.filters = [];
    activeObject.filters[5] = new fabric.Image.filters.RemoveColor({ color: '#ffffff', distance: 0.2 });
    activeObject.applyFilters();
    canvas.requestRenderAll();
  };

  const toggleFlip = (axis) => {
    if (!activeObject) return;
    activeObject.set(`flip${axis}`, !activeObject[`flip${axis}`]);
    canvas.requestRenderAll();
  };

  const applyMask = (type) => {
    if (!activeObject || activeObject.type !== 'image') return;
    if (type === 'circle') {
      const radius = Math.min(activeObject.width, activeObject.height) / 2;
      const clipPath = new fabric.Circle({ radius, originX: 'center', originY: 'center', left: 0, top: 0 });
      activeObject.set({ clipPath });
    } else {
      activeObject.set({ clipPath: null });
    }
    canvas.requestRenderAll();
  };

  const injectAsset = (asset) => {
    if (asset.path) {
      const pathObj = new fabric.Path(asset.path, {
        left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
        fill: asset.color || '#3b82f6', scaleX: 2, scaleY: 2, name: `${asset.name}`
      });
      canvas.add(pathObj);
      canvas.setActiveObject(pathObj);
    } else if (asset.text) {
      const textObj = new fabric.IText(asset.text, {
        left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
        fontFamily: asset.font || 'Montserrat', fill: '#0f172a', fontSize: 40, fontWeight: 'bold', name: `${asset.name}`
      });
      canvas.add(textObj);
      canvas.setActiveObject(textObj);
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

  const toggleLayerLock = (obj) => { obj.set({ selectable: !obj.selectable, evented: !obj.evented }); canvas.renderAll(); syncLayers(); };
  const toggleLayerVisibility = (obj) => { obj.set({ visible: !obj.visible }); canvas.discardActiveObject(); canvas.renderAll(); syncLayers(); };
  const renameLayer = (obj, newName) => { obj.set('name', newName); syncLayers(); };
  const duplicateLayer = (obj) => {
    obj.clone((cloned) => {
      cloned.set({ left: obj.left + 20, top: obj.top + 20, name: `${obj.name || 'Layer'} (Copy)` });
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
    const bleedArea = canvas.getObjects().find(o => o.name === 'bleed_area');
    if (!bleedArea) return;
    
    // Hide guides
    const guides = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    guides.forEach(g => g.visible = false);
    
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 3,
      left: bleedArea.left - (bleedArea.width / 2), top: bleedArea.top - (bleedArea.height / 2),
      width: bleedArea.width, height: bleedArea.height
    });

    // Restore guides
    guides.forEach(g => g.visible = true);
    canvas.renderAll();
    
    const link = document.createElement('a');
    link.download = `${activeProduct.name}-${activeArtboard}-300DPI.png`;
    link.href = dataURL;
    link.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'system-ui', backgroundColor: '#f8fafc' }}>
      
      {/* HEADER / CONTEXT TOOLBAR */}
      <div style={{ display: 'flex', padding: '10px 20px', backgroundColor: '#0f172a', color: 'white', alignItems: 'center', height: '60px', borderBottom: '1px solid #1e293b' }}>
        <h1 style={{ fontSize: '16px', fontWeight: 'bold', marginRight: '30px', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShoppingBag size={18}/> PRO STUDIO
        </h1>
        
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
          <span style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Monitor size={14}/> {activeProduct.name} - {ARTBOARDS[activeArtboard].name}
          </span>
          <button onClick={exportDesign} style={{...tBtnStyle, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold'}}>
            <Download size={16} style={{marginRight: '8px'}}/> Download 300DPI
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR - APPAREL, ASSETS, DRAW */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex' }}>
          
          {/* Vertical Navigation */}
          <div style={{ width: '60px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', borderRight: '1px solid #e2e8f0' }}>
            <button onClick={() => {setActiveLeftPanel('apparel'); setIsDrawingMode(false); canvas.isDrawingMode=false;}} style={activeLeftPanel === 'apparel' ? iconTabActive : iconTab} title="Apparel & Products"><Shirt size={20}/></button>
            <button onClick={() => {setActiveLeftPanel('assets'); setIsDrawingMode(false); canvas.isDrawingMode=false;}} style={activeLeftPanel === 'assets' ? iconTabActive : iconTab} title="Design Assets Library"><Wand2 size={20}/></button>
            <button onClick={() => setActiveLeftPanel('draw')} style={activeLeftPanel === 'draw' ? iconTabActive : iconTab} title="Vector & Drawing Tools"><PenTool size={20}/></button>
            <button onClick={() => {setActiveLeftPanel('settings'); setIsDrawingMode(false); canvas.isDrawingMode=false;}} style={activeLeftPanel === 'settings' ? iconTabActive : iconTab} title="Workspace Settings"><Settings size={20}/></button>
          </div>

          <div style={{ flexGrow: 1, padding: '15px', overflowY: 'auto' }}>
            
            {/* APPAREL & PRODUCT CATALOG */}
            {activeLeftPanel === 'apparel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Apparel Library</h3>
                
                <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '5px' }}>
                  {Object.entries(APPAREL_CATALOG).map(([key, cat]) => (
                    <button key={key} onClick={() => { setActiveCategory(key); setActiveProduct(cat.items[0]); setActiveColor(cat.items[0].colors[0]); }} style={{ ...btnSecondary, padding: '6px', fontSize: '11px', flexShrink: 0, backgroundColor: activeCategory === key ? '#eff6ff' : '#fff', borderColor: activeCategory === key ? '#bfdbfe' : '#cbd5e1' }}>
                      <cat.icon size={14}/> {cat.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={labelTxt}>Select Product Model</label>
                  <select value={activeProduct.id} onChange={(e) => {
                    const prod = APPAREL_CATALOG[activeCategory].items.find(i => i.id === e.target.value);
                    setActiveProduct(prod);
                    setActiveColor(prod.colors[0]);
                    setActiveArtboard(prod.positions[0]);
                  }} style={selectInput}>
                    {APPAREL_CATALOG[activeCategory].items.map(item => (
                      <option key={item.id} value={item.id}>{item.brand} - {item.name} ({item.price})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={labelTxt}>Garment Color</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {activeProduct.colors.map(color => (
                      <button key={color} onClick={() => setActiveColor(color)} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: color, border: activeColor === color ? '2px solid #3b82f6' : '1px solid #cbd5e1', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={labelTxt}>Print Position</label>
                  <select value={activeArtboard} onChange={(e) => setActiveArtboard(e.target.value)} style={selectInput}>
                    {activeProduct.positions.map(pos => (
                      <option key={pos} value={pos}>{ARTBOARDS[pos].name}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* DESIGN ASSETS */}
            {activeLeftPanel === 'assets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={pHeader}>Design Assets Library</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                  {Object.keys(DESIGN_ASSETS).map((tab) => (
                    <button key={tab} onClick={() => setActiveAssetTab(tab)} style={{ padding: '6px 4px', fontSize: '11px', textTransform: 'capitalize', backgroundColor: activeAssetTab === tab ? '#3b82f6' : '#f1f5f9', color: activeAssetTab === tab ? '#ffffff' : '#475569', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>{tab}</button>
                  ))}
                </div>
                <hr style={divider} />
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <button onClick={addText} style={{...btnSecondary, flex: 1}}><TypeIcon size={14}/> Text</button>
                  <button onClick={() => addShape('rect')} style={{...btnSecondary, flex: 1}}><Square size={14}/> Box</button>
                  <button onClick={() => addShape('circle')} style={{...btnSecondary, flex: 1}}><Circle size={14}/> Dot</button>
                </div>
                <label style={{...btnSecondary, justifyContent: 'center', marginBottom: '15px', backgroundColor: '#eff6ff', color: '#3b82f6', borderColor: '#bfdbfe', cursor: 'pointer'}}>
                  <ImagePlus size={16}/> Upload Custom Image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {DESIGN_ASSETS[activeAssetTab]?.map((asset, idx) => (
                    <div key={idx} onClick={() => injectAsset(asset)} style={assetCardStyle}>
                      {asset.path ? <svg viewBox="0 0 24 24" width="24" height="24"><path d={asset.path} fill={asset.color || '#3b82f6'}/></svg> : <Star size={20} color="#3b82f6" />}
                      <span style={{ fontWeight: '500', color: '#334155' }}>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VECTOR & DRAWING TOOLS */}
            {activeLeftPanel === 'draw' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Vector & Drawing</h3>
                
                <button onClick={toggleDrawMode} style={{...btnSecondary, justifyContent: 'center', backgroundColor: isDrawingMode ? '#3b82f6' : '#ffffff', color: isDrawingMode ? '#ffffff' : '#334155'}}>
                  {isDrawingMode ? <MousePointer2 size={16}/> : <PenTool size={16}/>}
                  {isDrawingMode ? 'Exit Drawing Mode' : 'Freehand Pen Tool'}
                </button>

                {isDrawingMode && (
                  <div style={{ padding: '15px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                    <div style={propRow}>
                      <span style={labelTxt}>Brush Color</span>
                      <input type="color" value={brushColor} onChange={(e) => updateBrush('color', e.target.value)} style={{ width: '40px', height: '30px', padding: 0, border: 'none' }} />
                    </div>
                    <div style={propRow}>
                      <span style={labelTxt}>Brush Size ({brushSize}px)</span>
                      <input type="range" min="1" max="50" value={brushSize} onChange={(e) => updateBrush('width', parseInt(e.target.value))} style={{ width: '100px' }} />
                    </div>
                  </div>
                )}

                <hr style={divider} />
                <h4 style={subHeader}>Vector Operations</h4>
                <button onClick={textToOutlines} style={btnSecondary} title="Rasterize text into high-res uneditable vector-like paths for print preservation">
                  <TypeIcon size={14}/> Convert Text to Outlines
                </button>
                <button style={{...btnSecondary, opacity: 0.5, cursor: 'not-allowed'}} title="Advanced Boolean Operations (Pro Feature)">
                  <Layers size={14}/> Shape Builder / Boolean
                </button>
              </div>
            )}

            {/* SETTINGS */}
            {activeLeftPanel === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <h3 style={pHeader}>Precision Grid</h3>
                <label style={toggleLabel}><input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Show Visual Grid</label>
                <label style={toggleLabel}><input type="checkbox" checked={snapToGrid} onChange={e => setSnapToGrid(e.target.checked)} /> Snap Objects to Grid</label>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE - WORKSPACE & CANVAS */}
        <div ref={wrapperRef} style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Simulated Garment Background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: activeColor, mixBlendMode: 'multiply', opacity: 0.2, pointerEvents: 'none', zIndex: 0 }}></div>

          <div style={{ position: 'absolute', top: 0, left: '25px', right: 0, height: '25px', backgroundColor: '#f8fafc', borderBottom: '1px solid #94a3b8', zIndex: 10, backgroundSize: '100px 100%', backgroundImage: 'repeating-linear-gradient(to right, #64748b 0, #64748b 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>
          <div style={{ position: 'absolute', top: '25px', left: 0, bottom: 0, width: '25px', backgroundColor: '#f8fafc', borderRight: '1px solid #94a3b8', zIndex: 10, backgroundSize: '100% 100px', backgroundImage: 'repeating-linear-gradient(to bottom, #64748b 0, #64748b 1px, transparent 1px, transparent 10px, #cbd5e1 10px, #cbd5e1 11px, transparent 11px, transparent 100px)' }}></div>

          <canvas ref={canvasRef} style={{ zIndex: 1 }} />

          {dimensions && (
            <div style={{ position: 'absolute', top: '35px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e293b', color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', zIndex: 20, fontWeight: 'bold', letterSpacing: '1px' }}>
              W: {dimensions.w}px &nbsp;|&nbsp; H: {dimensions.h}px
            </div>
          )}

          {/* Viewport Controls */}
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
            
            {/* LAYER PANEL */}
            {activeRightPanel === 'layers' && (
              <div style={{ padding: '15px' }}>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                  <input type="text" placeholder="Search layers..." value={layerSearch} onChange={(e) => setLayerSearch(e.target.value)} style={{...selectInput, flexGrow: 1}} />
                  <button onClick={groupSelection} style={iconBtn} title="Group Selection"><Folder size={16}/></button>
                  <button onClick={ungroupSelection} style={iconBtn} title="Ungroup"><Group size={16}/></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {layers.filter(l => (l.name || l.type).toLowerCase().includes(layerSearch.toLowerCase())).map((layer, index) => (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: activeObject === layer ? '#eff6ff' : '#f8fafc', border: `1px solid ${activeObject === layer ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '6px' }}>
                      <div onClick={() => canvas.setActiveObject(layer) || canvas.renderAll()} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flexGrow: 1, overflow: 'hidden' }}>
                        {layer.type === 'i-text' ? <TypeIcon size={14} color="#64748b" style={{marginRight:'8px'}}/> : 
                         layer.type === 'group' ? <Folder size={14} color="#64748b" style={{marginRight:'8px'}}/> :
                         layer.type === 'path' ? <PenTool size={14} color="#64748b" style={{marginRight:'8px'}}/> :
                         <Layers size={14} color="#64748b" style={{marginRight:'8px'}}/>}
                        <input value={layer.name || layer.type} onChange={(e) => renameLayer(layer, e.target.value)} style={{ border: 'none', background: 'transparent', fontSize: '12px', color: '#334155', width: '100%', outline: 'none' }} />
                      </div>
                      
                      <button onClick={() => toggleLayerVisibility(layer)} style={layerActionBtn}>{layer.visible ? <Eye size={14}/> : <EyeOff size={14} color="#cbd5e1"/>}</button>
                      <button onClick={() => toggleLayerLock(layer)} style={layerActionBtn}>{layer.selectable ? <Unlock size={14}/> : <Lock size={14} color="#cbd5e1"/>}</button>
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

            {/* PROPERTIES PANEL */}
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
                            <button onClick={() => applyTextEffect('vintage')} style={effectBtn}><TypeIcon size={14}/> Vintage</button>
                            <button onClick={() => applyTextEffect('glow')} style={effectBtn}><Wand2 size={14}/> Neon Glow</button>
                            <button onClick={() => applyTextEffect('outline')} style={effectBtn}><TypeIcon size={14}/> Hollow</button>
                          </div>
                        </div>
                      </>
                    )}

                    {activeObject.type === 'image' && (
                      <>
                        <hr style={divider} />
                        <div>
                          <h4 style={subHeader}><Sliders size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/> Image Adjustments</h4>
                          <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                            <button onClick={() => toggleFlip('X')} style={effectBtn} title="Flip Horizontal"><FlipHorizontal size={14}/></button>
                            <button onClick={() => toggleFlip('Y')} style={effectBtn} title="Flip Vertical"><FlipVertical size={14}/></button>
                            <button onClick={applyMagicErase} style={{...effectBtn, color: '#ec4899', borderColor: '#fbcfe8', backgroundColor: '#fdf2f8'}} title="Magic Erase (Remove White)"><Eraser size={14}/></button>
                          </div>
                          <div style={propRow}><span style={labelTxt}>Brightness</span><input type="range" min="-1" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(0, 'Brightness', { brightness: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                          <div style={propRow}><span style={labelTxt}>Contrast</span><input type="range" min="-1" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(1, 'Contrast', { contrast: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                          <div style={propRow}><span style={labelTxt}>Saturation</span><input type="range" min="-1" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(2, 'Saturation', { saturation: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                          <div style={propRow}><span style={labelTxt}>Blur</span><input type="range" min="0" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(3, 'Blur', { blur: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                        </div>
                        <hr style={divider} />
                        <div>
                          <h4 style={subHeader}><Scissors size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/> Mask & Crop</h4>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                            <button onClick={() => applyMask('circle')} style={effectBtn}><Circle size={14}/> Circle Mask</button>
                            <button onClick={() => applyMask('none')} style={effectBtn}><Crop size={14}/> Remove Mask</button>
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
const assetCardStyle = { padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transition: '0.2s' };
