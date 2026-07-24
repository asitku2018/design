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
  PenTool, MousePointer2, Type as TypeIcon, Shirt, Coffee, ShoppingBag,
  Box, Smartphone, User, Play, X
} from 'lucide-react';

const APPAREL_CATALOG = {
  tshirts: {
    name: 'T-Shirts', icon: Shirt,
    items: [
      { id: 'ts1', brand: 'Gildan', name: 'Heavy Cotton T-Shirt', price: '$12.50', colors: ['#ffffff', '#0f172a', '#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'], positions: ['front', 'back', 'left_sleeve', 'right_sleeve'] },
      { id: 'ts2', brand: 'Bella+Canvas', name: 'Premium Jersey', price: '$18.00', colors: ['#ffffff', '#1f2937', '#f43f5e', '#8b5cf6'], positions: ['front', 'back'] }
    ]
  },
  hoodies: {
    name: 'Hoodies', icon: Shirt,
    items: [
      { id: 'h1', brand: 'Champion', name: 'Reverse Weave Hoodie', price: '$35.00', colors: ['#f1f5f9', '#020617', '#b91c1c'], positions: ['front', 'back', 'hood', 'pocket'] }
    ]
  },
  accessories: {
    name: 'Bags & Caps', icon: ShoppingBag,
    items: [
      { id: 'b1', brand: 'Port Authority', name: 'Tote Bag', price: '$9.00', colors: ['#fef3c7', '#000000'], positions: ['front', 'back'] }
    ]
  }
};

const ARTBOARDS = {
  front: { name: 'Front Chest', width: 400, height: 500, safe: 20, bleed: 10 },
  back: { name: 'Full Back', width: 400, height: 550, safe: 20, bleed: 10 },
  left_sleeve: { name: 'Left Sleeve', width: 150, height: 150, safe: 10, bleed: 5 },
  right_sleeve: { name: 'Right Sleeve', width: 150, height: 150, safe: 10, bleed: 5 },
  hood: { name: 'Hood Outer', width: 200, height: 200, safe: 15, bleed: 10 },
  pocket: { name: 'Front Pocket', width: 100, height: 100, safe: 5, bleed: 5 }
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
  ]
};

export default function CanvasEditor() {
  const canvasRef = useRef(null);
  const wrapperRef = useRef(null);
  const { canvas, setCanvas, activeObject, setActiveObject } = useCanvasStore();
  
  // UI & Workspace State
  const [activeLeftPanel, setActiveLeftPanel] = useState('apparel');
  const [activeAssetTab, setActiveAssetTab] = useState('icons');
  const [activeRightPanel, setActiveRightPanel] = useState('properties'); 
  
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
  
  // Vector Tool State
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [brushColor, setBrushColor] = useState('#0f172a');
  const [brushSize, setBrushSize] = useState(5);

  // Mockup & Preview State
  const [showMockupModal, setShowMockupModal] = useState(false);
  const [mockupMode, setMockupMode] = useState('studio'); // studio, flatlay, lifestyle, 3d, mobile, transparent
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@400;700&family=Montserrat:wght@400;700;900&family=Oswald:wght@400;700&family=Pacifico&family=Playfair+Display:wght@400;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes spin3d { from { transform: rotateY(0deg); } to { transform: rotateY(360deg); } }
      .spin-animation { animation: spin3d 8s linear infinite; transform-style: preserve-3d; }
    `;
    document.head.appendChild(style);

    return () => { document.head.removeChild(link); document.head.removeChild(style); };
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

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ensure we don't delete if user is typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const activeObj = canvas?.getActiveObject();
        if (activeObj && !activeObj.isEditing) {
          canvas.remove(activeObj);
          canvas.discardActiveObject();
          setActiveObject(null);
          syncLayers();
          canvas.requestRenderAll();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canvas, setActiveObject, syncLayers]);

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
    canvas.on('selection:cleared', () => { setActiveObject(null); setDimensions(null); setActiveRightPanel('properties'); });

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

  const addText = () => {
    const text = new fabric.IText('PRO DESIGN', {
      left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
      fontFamily: 'Montserrat', fill: '#0f172a', fontSize: 50, fontWeight: '900',
      name: `Text ${layers.length + 1}`
    });
    canvas.add(text);
    canvas.setActiveObject(text);
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

  const injectAsset = (asset) => {
    if (asset.path) {
      const pathObj = new fabric.Path(asset.path, {
        left: canvas.getWidth() / 2, top: canvas.getHeight() / 2, originX: 'center', originY: 'center',
        fill: asset.color || '#3b82f6', scaleX: 2, scaleY: 2, name: `${asset.name}`
      });
      canvas.add(pathObj);
      canvas.setActiveObject(pathObj);
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

  const exportDesign = () => {
    const bleedArea = canvas.getObjects().find(o => o.name === 'bleed_area');
    if (!bleedArea) return;
    const guides = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    guides.forEach(g => g.visible = false);
    
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 3,
      left: bleedArea.left - (bleedArea.width / 2), top: bleedArea.top - (bleedArea.height / 2),
      width: bleedArea.width, height: bleedArea.height
    });

    guides.forEach(g => g.visible = true);
    canvas.renderAll();
    
    const link = document.createElement('a');
    link.download = `${activeProduct.name}-${activeArtboard}-300DPI.png`;
    link.href = dataURL;
    link.click();
  };

  const openMockupPreview = () => {
    // Extract current design without guides
    const bleedArea = canvas.getObjects().find(o => o.name === 'bleed_area');
    if (!bleedArea) return;
    const guides = canvas.getObjects().filter(o => o.isWorkspaceLayer);
    guides.forEach(g => g.visible = false);
    
    const dataURL = canvas.toDataURL({
      format: 'png', multiplier: 2, // High enough for preview
      left: bleedArea.left - (bleedArea.width / 2), top: bleedArea.top - (bleedArea.height / 2),
      width: bleedArea.width, height: bleedArea.height
    });

    guides.forEach(g => g.visible = true);
    canvas.renderAll();
    
    setPreviewImage(dataURL);
    setShowMockupModal(true);
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
          <button onClick={openMockupPreview} style={{...tBtnStyle, backgroundColor: '#4f46e5', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold'}}>
            <Play size={16} style={{marginRight: '8px'}}/> Preview & Mockups
          </button>
          <button onClick={exportDesign} style={{...tBtnStyle, backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 16px', fontWeight: 'bold'}}>
            <Download size={16} style={{marginRight: '8px'}}/> Download 300DPI
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
        
        {/* LEFT SIDEBAR - APPAREL, ASSETS, DRAW */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderRight: '1px solid #e2e8f0', display: 'flex' }}>
          
          <div style={{ width: '60px', backgroundColor: '#f1f5f9', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '15px 0', gap: '15px', borderRight: '1px solid #e2e8f0' }}>
            <button onClick={() => {setActiveLeftPanel('apparel'); setIsDrawingMode(false); canvas.isDrawingMode=false;}} style={activeLeftPanel === 'apparel' ? iconTabActive : iconTab} title="Apparel & Products"><Shirt size={20}/></button>
            <button onClick={() => {setActiveLeftPanel('assets'); setIsDrawingMode(false); canvas.isDrawingMode=false;}} style={activeLeftPanel === 'assets' ? iconTabActive : iconTab} title="Design Assets Library"><Wand2 size={20}/></button>
            <button onClick={() => setActiveLeftPanel('draw')} style={activeLeftPanel === 'draw' ? iconTabActive : iconTab} title="Vector & Drawing Tools"><PenTool size={20}/></button>
          </div>

          <div style={{ flexGrow: 1, padding: '15px', overflowY: 'auto' }}>
            
            {/* APPAREL CATALOG */}
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
                  <label style={labelTxt}>Garment Color (Click to Apply)</label>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    {activeProduct.colors.map(color => (
                      <button key={color} onClick={() => setActiveColor(color)} style={{ width: '30px', height: '30px', borderRadius: '50%', backgroundColor: color, border: activeColor === color ? '2px solid #3b82f6' : '1px solid #cbd5e1', cursor: 'pointer' }} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* DESIGN ASSETS */}
            {activeLeftPanel === 'assets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <h3 style={pHeader}>Design Assets Library</h3>
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
                  {DESIGN_ASSETS.icons.map((asset, idx) => (
                    <div key={idx} onClick={() => injectAsset(asset)} style={assetCardStyle}>
                      <svg viewBox="0 0 24 24" width="24" height="24"><path d={asset.path} fill={asset.color || '#3b82f6'}/></svg>
                      <span style={{ fontWeight: '500', color: '#334155' }}>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE - WORKSPACE & CANVAS */}
        <div ref={wrapperRef} onClick={(e) => { if (e.target === wrapperRef.current) canvas.discardActiveObject(); canvas.requestRenderAll(); }} style={{ flexGrow: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#cbd5e1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Simulated Garment Background */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: activeColor, mixBlendMode: 'multiply', opacity: 0.2, pointerEvents: 'none', zIndex: 0 }}></div>

          <canvas ref={canvasRef} style={{ zIndex: 1 }} />

          {/* Viewport Controls */}
          <div style={{ position: 'absolute', bottom: '20px', left: '45px', backgroundColor: '#ffffff', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', display: 'flex', border: '1px solid #e2e8f0', zIndex: 20 }}>
            <button onClick={() => setZoom(z => Math.max(0.1, z - 0.1))} style={ctrlBtn} title="Zoom Out"><ZoomOut size={16}/></button>
            <div style={{ padding: '0 15px', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 'bold', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', color: '#334155' }}>
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={() => setZoom(z => Math.min(5, z + 0.1))} style={ctrlBtn} title="Zoom In"><ZoomIn size={16}/></button>
            <button onClick={() => { canvas.setZoom(1); setZoom(1); canvas.viewportTransform[4]=0; canvas.viewportTransform[5]=0; canvas.requestRenderAll(); }} style={{...ctrlBtn, borderLeft: '1px solid #e2e8f0'}} title="Reset View"><Maximize size={16}/></button>
          </div>
        </div>

        {/* RIGHT SIDEBAR - PROPERTIES & LAYERS */}
        <div style={{ width: '320px', backgroundColor: '#ffffff', borderLeft: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <button onClick={() => setActiveRightPanel('properties')} style={activeRightPanel === 'properties' ? rightTabActive : rightTab}><Settings size={16} /> Properties</button>
            <button onClick={() => setActiveRightPanel('layers')} style={activeRightPanel === 'layers' ? rightTabActive : rightTab}><Layers size={16} /> Layers</button>
          </div>

          <div style={{ flexGrow: 1, overflowY: 'auto', padding: '15px' }}>
            
            {/* PROPERTIES PANEL */}
            {activeRightPanel === 'properties' && (
              <div>
                {!activeObject ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', textAlign: 'center' }}>
                      <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>No object selected.</p>
                      <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>Select an object to edit properties, or press <b>Delete / Backspace</b> to remove it.</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={subHeader}>Global Garment Color</h4>
                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        {activeProduct.colors.map(color => (
                          <button key={color} onClick={() => setActiveColor(color)} style={{ width: '35px', height: '35px', borderRadius: '8px', backgroundColor: color, border: activeColor === color ? '2px solid #3b82f6' : '1px solid #cbd5e1', cursor: 'pointer' }} />
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                      <h4 style={subHeader}>Layer Blend & Opacity</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <span style={labelTxt}>Opacity</span>
                        <input type="range" min="0" max="1" step="0.05" value={activeObject.opacity} onChange={(e) => updateActiveProp('opacity', parseFloat(e.target.value))} style={{ flexGrow: 1 }} />
                      </div>
                    </div>

                    {activeObject.type === 'image' && (
                      <div>
                        <h4 style={subHeader}><Sliders size={12} style={{marginRight: '4px', verticalAlign: 'middle'}}/> Image Adjustments</h4>
                        <div style={propRow}><span style={labelTxt}>Brightness</span><input type="range" min="-1" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(0, 'Brightness', { brightness: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                        <div style={propRow}><span style={labelTxt}>Contrast</span><input type="range" min="-1" max="1" step="0.05" defaultValue="0" onChange={(e) => applyImageFilter(1, 'Contrast', { contrast: parseFloat(e.target.value) })} style={{ width: '100px' }} /></div>
                      </div>
                    )}
                    <hr style={divider} />
                    <button onClick={() => { canvas.remove(activeObject); setActiveObject(null); syncLayers(); }} style={{...btnSecondary, color: '#ef4444', borderColor: '#fecaca', backgroundColor: '#fef2f2', justifyContent: 'center' }}>
                      <Trash2 size={16}/> Delete Layer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* LAYERS PANEL */}
            {activeRightPanel === 'layers' && (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
               {layers.map((layer, index) => (
                 <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: activeObject === layer ? '#eff6ff' : '#f8fafc', border: `1px solid ${activeObject === layer ? '#bfdbfe' : '#e2e8f0'}`, borderRadius: '6px' }}>
                   <div onClick={() => canvas.setActiveObject(layer) || canvas.renderAll()} style={{ cursor: 'pointer', flexGrow: 1, fontSize: '12px' }}>
                     {layer.name || layer.type}
                   </div>
                   <button onClick={() => handleLayerOrder('up', layer)} style={layerActionBtn}><ArrowUp size={14}/></button>
                   <button onClick={() => handleLayerOrder('down', layer)} style={layerActionBtn}><ArrowDown size={14}/></button>
                   <button onClick={() => { canvas.remove(layer); syncLayers(); }} style={{...layerActionBtn, color: '#ef4444'}}><Trash2 size={14}/></button>
                 </div>
               ))}
             </div>
            )}
          </div>
        </div>
      </div>

      {}
      {showMockupModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          
          <div style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}><Play size={20}/> 3D & Mockup Generator</h2>
            <button onClick={() => setShowMockupModal(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24}/></button>
          </div>

          <div style={{ display: 'flex', flexGrow: 1 }}>
            
            {/* Mockup Tools Sidebar */}
            <div style={{ width: '250px', backgroundColor: '#1e293b', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <h3 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Environment</h3>
              
              <button onClick={() => setMockupMode('studio')} style={mockupMode === 'studio' ? mockupBtnActive : mockupBtn}><Monitor size={16}/> Studio Render</button>
              <button onClick={() => setMockupMode('3d')} style={mockupMode === '3d' ? mockupBtnActive : mockupBtn}><Box size={16}/> 3D 360° Rotate</button>
              <button onClick={() => setMockupMode('lifestyle')} style={mockupMode === 'lifestyle' ? mockupBtnActive : mockupBtn}><User size={16}/> Lifestyle Scene</button>
              <button onClick={() => setMockupMode('flatlay')} style={mockupMode === 'flatlay' ? mockupBtnActive : mockupBtn}><Layers size={16}/> Flat Lay Wood</button>
              <button onClick={() => setMockupMode('transparent')} style={mockupMode === 'transparent' ? mockupBtnActive : mockupBtn}><Grid size={16}/> Transparent PNG</button>
              <button onClick={() => setMockupMode('mobile')} style={mockupMode === 'mobile' ? mockupBtnActive : mockupBtn}><Smartphone size={16}/> Mobile Preview</button>
            </div>

            {/* Mockup Rendering Viewport */}
            <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', ...getMockupBackground(mockupMode) }}>
              
              {/* Dynamic Mockup Container */}
              <div className={mockupMode === '3d' ? 'spin-animation' : ''} style={getMockupContainerStyle(mockupMode, activeColor)}>
                
                {/* T-Shirt Silhouette / Mask */}
                <div style={{ position: 'absolute', top: '10%', left: '15%', right: '15%', bottom: '10%', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '40px 40px 10px 10px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.2)' }}>
                   {/* Simulating shirt collar */}
                   <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translate(-50%, -50%)', width: '120px', height: '40px', backgroundColor: mockupMode === 'transparent' ? 'transparent' : '#fff', borderRadius: '50%', opacity: 0.1 }}></div>
                </div>

                {/* The Extracted Design Overlay */}
                {previewImage && (
                  <img src={previewImage} alt="Design Preview" style={{ position: 'absolute', top: '25%', left: '50%', transform: 'translateX(-50%)', width: '40%', height: 'auto', mixBlendMode: 'multiply' }} />
                )}

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

const getMockupBackground = (mode) => {
  if (mode === 'lifestyle') return { background: 'linear-gradient(to bottom, #87CEEB, #e0f6ff)' }; // Sky gradient
  if (mode === 'flatlay') return { background: 'linear-gradient(45deg, #d2b48c, #deb887)' }; // Wood color
  if (mode === 'transparent') return { backgroundImage: 'repeating-linear-gradient(45deg, #334155 25%, transparent 25%, transparent 75%, #334155 75%, #334155), repeating-linear-gradient(45deg, #334155 25%, #1e293b 25%, #1e293b 75%, #334155 75%, #334155)', backgroundPosition: '0 0, 15px 15px', backgroundSize: '30px 30px' };
  return { backgroundColor: '#cbd5e1' }; // Studio default
};

const getMockupContainerStyle = (mode, color) => {
  const base = { position: 'relative', width: '400px', height: '500px', backgroundColor: color, borderRadius: '20px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', transition: 'all 0.5s ease' };
  if (mode === 'mobile') return { ...base, width: '300px', height: '600px', borderRadius: '40px', border: '12px solid #0f172a' };
  if (mode === 'flatlay') return { ...base, boxShadow: '10px 10px 30px rgba(0,0,0,0.5)', transform: 'rotate(-5deg)' };
  if (mode === 'transparent') return { ...base, boxShadow: 'none' };
  return base;
};

const tBtnStyle = { padding: '6px', backgroundColor: 'transparent', border: 'none', borderRadius: '4px', cursor: 'pointer', color: '#94a3b8', display: 'flex', alignItems: 'center', transition: '0.2s' };
const tActiveBtnStyle = { ...tBtnStyle, backgroundColor: '#334155', color: '#ffffff' };
const toolbarSelectStyle = { padding: '4px 8px', backgroundColor: '#1e293b', color: 'white', border: '1px solid #334155', borderRadius: '4px', fontSize: '13px' };
const toolbarColorStyle = { padding: '0', border: '1px solid #334155', borderRadius: '4px', backgroundColor: 'transparent', cursor: 'pointer', width: '28px', height: '28px' };
const pHeader = { margin: '0 0 10px 0', fontSize: '12px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' };
const subHeader = { margin: '0 0 10px 0', fontSize: '11px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' };
const btnSecondary = { display: 'flex', gap: '8px', alignItems: 'center', padding: '10px', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '500', color: '#334155', transition: '0.2s' };
const iconTab = { padding: '12px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#94a3b8', transition: '0.2s' };
const iconTabActive = { ...iconTab, backgroundColor: '#e2e8f0', color: '#0f172a' };
const rightTab = { flexGrow: 1, padding: '12px', backgroundColor: '#f8fafc', border: 'none', borderBottom: '2px solid transparent', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' };
const rightTabActive = { ...rightTab, backgroundColor: '#ffffff', borderBottom: '2px solid #3b82f6', color: '#0f172a' };
const selectInput = { width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', color: '#0f172a' };
const ctrlBtn = { padding: '8px 12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', color: '#64748b', display: 'flex', justifyContent: 'center', alignItems: 'center', transition: '0.2s' };
const layerActionBtn = { background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', color: '#64748b', display: 'flex' };
const divider = { borderTop: '1px solid #e2e8f0', margin: '15px 0', borderBottom: 'none' };
const propRow = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' };
const labelTxt = { fontSize: '12px', color: '#475569' };
const assetCardStyle = { padding: '12px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', textAlign: 'center', cursor: 'pointer', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' };
const mockupBtn = { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', backgroundColor: 'transparent', border: '1px solid transparent', borderRadius: '6px', color: '#cbd5e1', cursor: 'pointer', fontSize: '13px' };
const mockupBtnActive = { ...mockupBtn, backgroundColor: '#334155', border: '1px solid #475569', color: '#ffffff' };
