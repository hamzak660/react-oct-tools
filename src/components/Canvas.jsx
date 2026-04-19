import { useState, useRef, useEffect, useCallback } from "react";
import {
  PenTool, Eraser, PaintBucket, Minus, Square, Circle,
  Eye, EyeOff, Trash2, Plus, Download, ImagePlus, Focus,
  ChevronDown, Layers, Pipette, Move, Type
} from "lucide-react";

/* ── CONSTANTS ── */
const PRESET_COLORS = [
  "#ef4444","#f97316","#eab308","#22c55e",
  "#06b6d4","#3b82f6","#8b5cf6","#ec4899",
  "#ffffff","#a3a3a3","#525252","#000000",
];

const TOOLS = [
  { id: "brush",  Icon: PenTool,     title: "Brush (B)" },
  { id: "eraser", Icon: Eraser,      title: "Eraser (E)" },
  { id: "bucket", Icon: PaintBucket, title: "Fill (F)" },
  { id: "move",   Icon: Move,        title: "Pan (Space)" },
  null,
  { id: "line",   Icon: Minus,       title: "Line (L)" },
  { id: "rect",   Icon: Square,      title: "Rectangle (R)" },
  { id: "circle", Icon: Circle,      title: "Circle (C)" },
];

const CANVAS_PRESETS = [
  { label: "800 × 600",  w: 800,  h: 600  },
  { label: "1920 × 1080",w: 1920, h: 1080 },
  { label: "1080 × 1080",w: 1080, h: 1080 },
  { label: "512 × 512",  w: 512,  h: 512  },
  { label: "375 × 812",  w: 375,  h: 812  },
];

/* ── HELPERS ── */
let _layerCounter = 0;
const newId = () => `layer-${Date.now()}-${++_layerCounter}`;

function parseHexColor(hex) {
  const h = hex.replace("#","");
  return [
    parseInt(h.slice(0,2),16),
    parseInt(h.slice(2,4),16),
    parseInt(h.slice(4,6),16),
    255,
  ];
}
function colorsMatch(a, b) {
  return a[0]===b[0] && a[1]===b[1] && a[2]===b[2] && Math.abs(a[3]-b[3])<5;
}
function floodFill(ctx, startX, startY, fillHex, w, h) {
  const imgData = ctx.getImageData(0,0,w,h);
  const data = imgData.data;
  const idx = (y,x) => (y*w+x)*4;
  const target = Array.from(data.slice(idx(startY,startX), idx(startY,startX)+4));
  const fill = parseHexColor(fillHex);
  if (colorsMatch(target, fill)) return;
  const stack = [[startX, startY]];
  const visited = new Uint8Array(w*h);
  while (stack.length) {
    const [x,y] = stack.pop();
    if (x<0||x>=w||y<0||y>=h) continue;
    const i = y*w+x;
    if (visited[i]) continue;
    visited[i]=1;
    const cur = Array.from(data.slice(i*4, i*4+4));
    if (!colorsMatch(cur, target)) continue;
    data[i*4]=fill[0]; data[i*4+1]=fill[1]; data[i*4+2]=fill[2]; data[i*4+3]=fill[3];
    stack.push([x+1,y],[x-1,y],[x,y+1],[x,y-1]);
  }
  ctx.putImageData(imgData,0,0);
}

/* ── STYLES ── */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

.cv-root {
  --bg0: #0a0a0c;
  --bg1: #0f0f12;
  --bg2: #161619;
  --bg3: #1e1e23;
  --bg4: #26262d;
  --bg5: #2e2e37;
  --line: rgba(255,255,255,0.055);
  --line2: rgba(255,255,255,0.10);
  --line3: rgba(255,255,255,0.16);
  --accent: #3b82f6;
  --accent-dim: rgba(59,130,246,0.12);
  --accent-glow: rgba(59,130,246,0.3);
  --text0: #e8e6e0;
  --text1: #8a8880;
  --text2: #4a4846;
  --red: #d95f5f;
  --font: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;
  --r: 5px;
  --r2: 8px;
  font-family: var(--font);
  background: var(--bg0);
  color: var(--text0);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  user-select: none;
}

/* TOPBAR */
.cv-topbar {
  height: 44px;
  background: var(--bg1);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 6px;
  flex-shrink: 0;
  z-index: 20;
}
.cv-logo {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; font-weight: 600; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text0); margin-right: 6px;
}
.cv-logo-mark {
  width: 8px; height: 8px; border-radius: 2px;
  background: var(--accent); flex-shrink: 0;
  box-shadow: 0 0 10px var(--accent-glow);
}
.cv-sep { width: 1px; height: 18px; background: var(--line2); margin: 0 4px; flex-shrink: 0; }
.cv-spacer { flex: 1; }
.cv-tbtn {
  height: 28px; padding: 0 10px; border-radius: var(--r);
  border: 1px solid var(--line2); background: transparent;
  color: var(--text1); font-size: 11px; font-family: var(--font);
  cursor: pointer; display: flex; align-items: center; gap: 5px;
  transition: all 0.15s; white-space: nowrap;
}
.cv-tbtn:hover { background: var(--bg3); color: var(--text0); border-color: var(--line3); }
.cv-tbtn.accent {
  background: var(--accent); border-color: var(--accent);
  color: #fff; font-weight: 500;
}
.cv-tbtn.accent:hover { background: #2563eb; }
.cv-tbtn svg { flex-shrink: 0; }

/* BODY */
.cv-body { display: flex; flex: 1; overflow: hidden; }

/* LEFT TOOL RAIL */
.cv-rail {
  width: 50px; background: var(--bg1); border-right: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0 10px; gap: 2px; flex-shrink: 0; z-index: 10;
}
.cv-rail-sep { width: 28px; height: 1px; background: var(--line); margin: 4px 0; }
.cv-tool {
  width: 36px; height: 36px; border-radius: var(--r);
  background: transparent; border: 1px solid transparent; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text2); transition: all 0.15s; position: relative;
}
.cv-tool:hover { background: var(--bg3); color: var(--text0); border-color: var(--line); }
.cv-tool.active {
  background: var(--accent-dim); color: var(--accent);
  border-color: rgba(59,130,246,0.3);
}
.cv-tool-tip {
  position: absolute; left: 44px; top: 50%; transform: translateY(-50%);
  background: var(--bg4); border: 1px solid var(--line2);
  color: var(--text0); font-size: 10px; padding: 3px 7px;
  border-radius: 4px; white-space: nowrap; pointer-events: none;
  opacity: 0; transition: opacity 0.15s; z-index: 100;
}
.cv-tool:hover .cv-tool-tip { opacity: 1; }

/* VIEWPORT */
.cv-viewport {
  flex: 1; background: var(--bg0); overflow: hidden;
  position: relative; min-width: 0;
}
.cv-checker {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(45deg,#161618 25%,transparent 25%,transparent 75%,#161618 75%),
    linear-gradient(45deg,#161618 25%,transparent 25%,transparent 75%,#161618 75%);
  background-size: 18px 18px;
  background-position: 0 0, 9px 9px;
  background-color: #111113;
}
.cv-canvas-wrap {
  position: absolute; transform-origin: 0 0;
  box-shadow: 0 0 0 1px rgba(255,255,255,0.08), 0 20px 60px rgba(0,0,0,0.7);
}

/* HUD */
.cv-hud {
  position: absolute; bottom: 14px; left: 14px;
  display: flex; align-items: center; gap: 10px;
  background: rgba(10,10,12,0.82); backdrop-filter: blur(8px);
  border: 1px solid var(--line2); border-radius: 20px;
  padding: 5px 12px; z-index: 30;
  font-size: 10px; font-family: var(--mono); color: var(--text1);
}
.cv-hud span { color: var(--accent); }
.cv-hud-sep { width: 1px; height: 10px; background: var(--line2); }

/* RIGHT PANEL */
.cv-panel {
  width: 220px; background: var(--bg1); border-left: 1px solid var(--line);
  display: flex; flex-direction: column; flex-shrink: 0;
  overflow-y: auto; overflow-x: hidden;
  scrollbar-width: thin; scrollbar-color: var(--bg4) transparent;
}
.cv-panel::-webkit-scrollbar { width: 3px; }
.cv-panel::-webkit-scrollbar-thumb { background: var(--bg4); }

.cv-section { border-bottom: 1px solid var(--line); padding: 12px; }
.cv-sec-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--text2); margin-bottom: 10px;
}

/* COLOR PICKER */
.cv-color-preview {
  width: 100%; height: 36px; border-radius: var(--r);
  border: 1px solid var(--line2); cursor: pointer;
  position: relative; overflow: hidden; margin-bottom: 8px;
}
.cv-color-preview input[type=color] {
  position: absolute; inset: -4px; width: calc(100%+8px);
  height: calc(100%+8px); border: none; cursor: pointer;
  opacity: 0;
}
.cv-hex-display {
  font-size: 10px; font-family: var(--mono); color: var(--text1);
  text-align: right; margin-bottom: 8px;
}
.cv-swatches { display: flex; flex-wrap: wrap; gap: 5px; }
.cv-swatch {
  width: 18px; height: 18px; border-radius: 3px; cursor: pointer;
  border: 1.5px solid transparent; transition: transform 0.1s, border-color 0.1s;
  flex-shrink: 0;
}
.cv-swatch:hover { transform: scale(1.2); }
.cv-swatch.sel { border-color: rgba(255,255,255,0.6); transform: scale(1.1); }

/* SLIDERS */
.cv-slider-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
.cv-slider-label { font-size: 10px; color: var(--text1); min-width: 32px; }
.cv-slider-val { font-size: 10px; font-family: var(--mono); color: var(--accent); min-width: 32px; text-align: right; }
.cv-range {
  flex: 1; -webkit-appearance: none; height: 3px;
  border-radius: 2px; background: var(--bg4); cursor: pointer; outline: none;
}
.cv-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px;
  border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 0 2px var(--bg1); cursor: pointer;
}
.cv-range::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: var(--accent); border: 2px solid var(--bg1);
}

/* CHECKBOX ROW */
.cv-check-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 6px; font-size: 11px; color: var(--text1);
}
.cv-toggle {
  width: 30px; height: 16px; border-radius: 8px;
  background: var(--bg4); border: 1px solid var(--line2);
  cursor: pointer; position: relative; transition: background 0.2s;
  flex-shrink: 0;
}
.cv-toggle.on { background: var(--accent); border-color: var(--accent); }
.cv-toggle::after {
  content: ""; position: absolute; top: 2px; left: 2px;
  width: 10px; height: 10px; border-radius: 50%;
  background: #fff; transition: transform 0.2s;
}
.cv-toggle.on::after { transform: translateX(14px); }

/* DIMENSION INPUTS */
.cv-dim-row { display: flex; gap: 6px; margin-bottom: 8px; }
.cv-dim-field { flex: 1; }
.cv-dim-label { font-size: 9px; color: var(--text2); margin-bottom: 3px; }
.cv-input {
  width: 100%; background: var(--bg3); border: 1px solid var(--line);
  border-radius: var(--r); color: var(--text0); font-size: 11px;
  font-family: var(--font); padding: 5px 7px; outline: none;
  transition: border-color 0.15s;
}
.cv-input:focus { border-color: var(--accent); }
.cv-select {
  width: 100%; background: var(--bg3); border: 1px solid var(--line);
  border-radius: var(--r); color: var(--text0); font-size: 11px;
  font-family: var(--font); padding: 5px 7px; outline: none;
  cursor: pointer; margin-bottom: 8px; appearance: none;
}

/* LAYERS */
.cv-layers-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 12px; border-bottom: 1px solid var(--line);
  background: rgba(0,0,0,0.2); flex-shrink: 0;
}
.cv-layers-list {
  flex: 1; overflow-y: auto; padding: 6px;
  scrollbar-width: thin; scrollbar-color: var(--bg4) transparent;
}
.cv-layers-list::-webkit-scrollbar { width: 3px; }
.cv-layers-list::-webkit-scrollbar-thumb { background: var(--bg4); }

.cv-layer-item {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 8px; border-radius: var(--r); cursor: pointer;
  border: 1px solid transparent; border-left: 2px solid transparent;
  transition: all 0.12s; margin-bottom: 3px;
}
.cv-layer-item:hover { background: var(--bg3); }
.cv-layer-item.active {
  background: var(--accent-dim);
  border-left-color: var(--accent);
  border-color: rgba(59,130,246,0.15);
}
.cv-layer-name {
  flex: 1; font-size: 11px; overflow: hidden;
  text-overflow: ellipsis; white-space: nowrap; color: var(--text0);
}
.cv-layer-name-edit {
  flex: 1; background: var(--bg3); border: 1px solid var(--accent);
  border-radius: 3px; color: var(--text0); font-size: 11px;
  font-family: var(--font); padding: 1px 4px; outline: none;
}
.cv-layer-thumb {
  width: 28px; height: 20px; border-radius: 2px;
  border: 1px solid var(--line); background: var(--bg3);
  overflow: hidden; flex-shrink: 0;
}
.cv-layer-thumb canvas { width: 100%; height: 100%; object-fit: cover; }
.cv-icon-btn {
  background: none; border: none; cursor: pointer;
  color: var(--text2); padding: 2px; display: flex;
  align-items: center; justify-content: center;
  border-radius: 3px; transition: color 0.12s, background 0.12s;
}
.cv-icon-btn:hover { color: var(--text0); background: var(--bg4); }
.cv-icon-btn.danger:hover { color: var(--red); }

/* BUTTONS */
.cv-btn {
  width: 100%; height: 30px; border-radius: var(--r);
  background: var(--bg3); border: 1px solid var(--line);
  color: var(--text0); font-size: 11px; font-family: var(--font);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 5px; transition: all 0.15s; margin-bottom: 5px;
}
.cv-btn:hover { background: var(--bg4); border-color: var(--line2); }
.cv-btn.primary { background: var(--accent); border-color: var(--accent); color: #fff; font-weight: 500; }
.cv-btn.primary:hover { background: #2563eb; }

/* OPACITY */
.cv-opacity-bar {
  height: 4px; background: var(--bg4); border-radius: 2px;
  margin-top: 4px; overflow: hidden;
}
.cv-opacity-fill {
  height: 100%; background: var(--accent); border-radius: 2px;
  transition: width 0.1s;
}
`;

/* ── LAYER THUMBNAIL ── */
function LayerThumbnail({ canvas }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !canvas) return;
    const ctx = ref.current.getContext("2d");
    ctx.clearRect(0, 0, 56, 40);
    ctx.drawImage(canvas, 0, 0, 56, 40);
  });
  return <canvas ref={ref} width={56} height={40} style={{ width: "100%", height: "100%" }} />;
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function Canvas() {
  const [tool, setTool] = useState("brush");
  const [color, setColor] = useState("#3b82f6");
  const [size, setSize] = useState(5);
  const [opacity, setOpacity] = useState(100);
  const [fillShapes, setFillShapes] = useState(false);
  const [layers, setLayers] = useState([]);
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [canvasW, setCanvasW] = useState(800);
  const [canvasH, setCanvasH] = useState(600);
  const [scale, setScale] = useState(0.8);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(80);
  const [editingLayerId, setEditingLayerId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [layerTick, setLayerTick] = useState(0); // force re-render for thumbnails

  const viewportRef = useRef(null);
  const containerRef = useRef(null);
  const tempCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const layerIdRef = useRef(0);
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const startCoord = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(0.8);
  const panRef = useRef({ x: 0, y: 0 });
  const layersRef = useRef([]);
  const activeLayerIdRef = useRef(null);
  const toolRef = useRef("brush");
  const colorRef = useRef("#3b82f6");
  const sizeRef = useRef(5);
  const opacityRef = useRef(100);
  const fillRef = useRef(false);
  const canvasWRef = useRef(800);
  const canvasHRef = useRef(600);

  // Keep refs in sync
  useEffect(() => { scaleRef.current = scale; }, [scale]);
  useEffect(() => { panRef.current = pan; }, [pan]);
  useEffect(() => { layersRef.current = layers; }, [layers]);
  useEffect(() => { activeLayerIdRef.current = activeLayerId; }, [activeLayerId]);
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);
  useEffect(() => { opacityRef.current = opacity; }, [opacity]);
  useEffect(() => { fillRef.current = fillShapes; }, [fillShapes]);
  useEffect(() => { canvasWRef.current = canvasW; }, [canvasW]);
  useEffect(() => { canvasHRef.current = canvasH; }, [canvasH]);

  /* ── Init ── */
  useEffect(() => {
    createLayer("Background");
    setTimeout(centerCanvas, 50);
  }, []);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === "INPUT") return;
      const map = { b:"brush", e:"eraser", f:"bucket", l:"line", r:"rect", c:"circle" };
      if (map[e.key]) setTool(map[e.key]);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  /* ── Create Layer ── */
  const createLayer = useCallback((name = null, image = null) => {
    const id = `layer-${Date.now()}-${++layerIdRef.current}`;
    const label = name || `Layer ${layerIdRef.current}`;
    const canvas = document.createElement("canvas");
    canvas.width = canvasWRef.current;
    canvas.height = canvasHRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.globalAlpha = 1;
    if (image) ctx.drawImage(image, 0, 0);
    const layer = { id, name: label, canvas, ctx, visible: true };
    setLayers(prev => {
      const next = [layer, ...prev];
      layersRef.current = next;
      return next;
    });
    setActiveLayerId(id);
    activeLayerIdRef.current = id;
    rebuildDOM();
  }, []);

  /* ── Rebuild canvas DOM ── */
  const rebuildDOM = useCallback(() => {
    setTimeout(() => {
      const container = containerRef.current;
      const tempCanvas = tempCanvasRef.current;
      if (!container || !tempCanvas) return;
      // Remove old canvases (keep tempCanvas)
      Array.from(container.children).forEach(el => {
        if (el !== tempCanvas) el.remove();
      });
      // Add layers bottom → top (reversed for z-order)
      const layers = layersRef.current;
      [...layers].reverse().forEach(layer => {
        layer.canvas.style.cssText = `
          position:absolute;top:0;left:0;
          pointer-events:none;
          visibility:${layer.visible?"visible":"hidden"};
        `;
        container.insertBefore(layer.canvas, tempCanvas);
      });
      setLayerTick(t => t + 1);
    }, 0);
  }, []);

  useEffect(() => { rebuildDOM(); }, [layers]);

  /* ── Get active layer ── */
  const getActiveLayer = useCallback(() => {
    return layersRef.current.find(l => l.id === activeLayerIdRef.current);
  }, []);

  /* ── Canvas coordinate ── */
  const getCoord = useCallback((clientX, clientY) => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    return {
      x: Math.floor((clientX - rect.left) / scaleRef.current),
      y: Math.floor((clientY - rect.top) / scaleRef.current),
    };
  }, []);

  /* ── Center canvas ── */
  const centerCanvas = useCallback(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const vRect = vp.getBoundingClientRect();
    const s = Math.min(0.85, (vRect.width - 60) / canvasWRef.current, (vRect.height - 60) / canvasHRef.current);
    const nx = (vRect.width - canvasWRef.current * s) / 2;
    const ny = (vRect.height - canvasHRef.current * s) / 2;
    scaleRef.current = s;
    panRef.current = { x: nx, y: ny };
    setScale(s);
    setPan({ x: nx, y: ny });
    setZoom(Math.round(s * 100));
    updateViewport();
  }, []);

  /* ── Update viewport transform ── */
  const updateViewport = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.transform = `translate(${panRef.current.x}px,${panRef.current.y}px) scale(${scaleRef.current})`;
  }, []);

  /* ── Mouse events ── */
  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;

    const onWheel = (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      const rect = vp.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const ns = Math.min(Math.max(scaleRef.current * factor, 0.05), 12);
      panRef.current = {
        x: mx - (mx - panRef.current.x) * (ns / scaleRef.current),
        y: my - (my - panRef.current.y) * (ns / scaleRef.current),
      };
      scaleRef.current = ns;
      setScale(ns);
      setPan({ ...panRef.current });
      setZoom(Math.round(ns * 100));
      updateViewport();
    };

    const onMouseDown = (e) => {
      if (e.button === 1 || toolRef.current === "move") {
        isPanning.current = true;
        return;
      }
      const active = getActiveLayer();
      if (!active || !active.visible) return;
      const coord = getCoord(e.clientX, e.clientY);
      if (coord.x < 0 || coord.x >= canvasWRef.current || coord.y < 0 || coord.y >= canvasHRef.current) return;

      if (toolRef.current === "bucket") {
        floodFill(active.ctx, coord.x, coord.y, colorRef.current, canvasWRef.current, canvasHRef.current);
        setLayerTick(t => t + 1);
        return;
      }

      isDrawing.current = true;
      startCoord.current = coord;

      if (toolRef.current === "brush" || toolRef.current === "eraser") {
        const ctx = active.ctx;
        ctx.globalAlpha = opacityRef.current / 100;
        ctx.globalCompositeOperation = toolRef.current === "eraser" ? "destination-out" : "source-over";
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = sizeRef.current;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(coord.x, coord.y);
        // Draw a dot on click
        ctx.arc(coord.x, coord.y, sizeRef.current / 2, 0, Math.PI * 2);
        ctx.fillStyle = colorRef.current;
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(coord.x, coord.y);
      }
    };

    const onMouseMove = (e) => {
      if (isPanning.current) {
        panRef.current = {
          x: panRef.current.x + e.movementX,
          y: panRef.current.y + e.movementY,
        };
        setPan({ ...panRef.current });
        updateViewport();
        return;
      }
      if (!isDrawing.current) return;

      const coord = getCoord(e.clientX, e.clientY);
      const tc = tempCanvasRef.current;
      const tempCtx = tc?.getContext("2d");
      const active = getActiveLayer();

      if (toolRef.current === "brush" || toolRef.current === "eraser") {
        if (!active) return;
        active.ctx.lineTo(coord.x, coord.y);
        active.ctx.stroke();
        active.ctx.beginPath();
        active.ctx.moveTo(coord.x, coord.y);
        setLayerTick(t => t + 1);
      } else if (tempCtx && tc) {
        tempCtx.clearRect(0, 0, canvasWRef.current, canvasHRef.current);
        tempCtx.globalAlpha = opacityRef.current / 100;
        tempCtx.lineWidth = sizeRef.current;
        tempCtx.strokeStyle = colorRef.current;
        tempCtx.fillStyle = colorRef.current;
        tempCtx.lineCap = "round";
        tempCtx.beginPath();
        const { x: sx, y: sy } = startCoord.current;

        if (toolRef.current === "line") {
          tempCtx.moveTo(sx, sy);
          tempCtx.lineTo(coord.x, coord.y);
          tempCtx.stroke();
        } else if (toolRef.current === "rect") {
          const rw = coord.x - sx, rh = coord.y - sy;
          if (fillRef.current) { tempCtx.fillRect(sx, sy, rw, rh); }
          else { tempCtx.strokeRect(sx, sy, rw, rh); }
        } else if (toolRef.current === "circle") {
          const r = Math.sqrt((coord.x-sx)**2 + (coord.y-sy)**2);
          tempCtx.arc(sx, sy, r, 0, Math.PI * 2);
          if (fillRef.current) tempCtx.fill();
          else tempCtx.stroke();
        }
      }
    };

    const onMouseUp = (e) => {
      if (isDrawing.current && !["brush","eraser","bucket"].includes(toolRef.current)) {
        const active = getActiveLayer();
        const tc = tempCanvasRef.current;
        if (active && tc) {
          active.ctx.globalAlpha = opacityRef.current / 100;
          active.ctx.globalCompositeOperation = "source-over";
          active.ctx.drawImage(tc, 0, 0);
          tc.getContext("2d").clearRect(0, 0, canvasWRef.current, canvasHRef.current);
        }
        setLayerTick(t => t + 1);
      }
      if (toolRef.current === "brush" || toolRef.current === "eraser") {
        const active = getActiveLayer();
        if (active) { active.ctx.globalAlpha = 1; active.ctx.globalCompositeOperation = "source-over"; }
      }
      isDrawing.current = false;
      isPanning.current = false;
    };

    vp.addEventListener("wheel", onWheel, { passive: false });
    vp.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      vp.removeEventListener("wheel", onWheel);
      vp.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  /* ── Dimension change ── */
  const applyDimensions = useCallback((w, h) => {
    canvasWRef.current = w;
    canvasHRef.current = h;
    setLayers(prev => {
      prev.forEach(layer => {
        const tmp = document.createElement("canvas");
        tmp.width = w; tmp.height = h;
        const tCtx = tmp.getContext("2d");
        tCtx.drawImage(layer.canvas, 0, 0);
        layer.canvas.width = w;
        layer.canvas.height = h;
        layer.ctx.drawImage(tmp, 0, 0);
      });
      return [...prev];
    });
    if (tempCanvasRef.current) {
      tempCanvasRef.current.width = w;
      tempCanvasRef.current.height = h;
    }
    if (containerRef.current) {
      containerRef.current.style.width = w + "px";
      containerRef.current.style.height = h + "px";
    }
  }, []);

  /* ── Export ── */
  const exportCanvas = useCallback(() => {
    const exp = document.createElement("canvas");
    exp.width = canvasWRef.current;
    exp.height = canvasHRef.current;
    const ctx = exp.getContext("2d");
    [...layersRef.current].reverse().forEach(l => { if (l.visible) ctx.drawImage(l.canvas, 0, 0); });
    const a = document.createElement("a");
    a.download = `canvas-${Date.now()}.png`;
    a.href = exp.toDataURL();
    a.click();
  }, []);

  /* ── Import image ── */
  const importImage = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => createLayer(file.name.replace(/\.[^.]+$/, ""), img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, [createLayer]);

  /* ── Delete layer ── */
  const deleteLayer = useCallback((id) => {
    setLayers(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(l => l.id !== id);
      layersRef.current = next;
      if (activeLayerIdRef.current === id) {
        setActiveLayerId(next[0].id);
        activeLayerIdRef.current = next[0].id;
      }
      return next;
    });
  }, []);

  /* ── Toggle visibility ── */
  const toggleVisible = useCallback((id) => {
    setLayers(prev => {
      const next = prev.map(l => {
        if (l.id === id) {
          l.canvas.style.visibility = l.visible ? "hidden" : "visible";
          return { ...l, visible: !l.visible };
        }
        return l;
      });
      layersRef.current = next;
      return next;
    });
  }, []);

  /* ── Cursor ── */
  const getCursor = () => {
    if (tool === "move") return "grab";
    if (tool === "bucket") return "crosshair";
    if (tool === "eraser") return "cell";
    return "crosshair";
  };

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <style>{STYLE}</style>
      <div className="cv-root">

        {/* TOP BAR */}
        <div className="cv-topbar">
          <div className="cv-logo">
            <div className="cv-logo-mark" />
            Canvas
          </div>
          <div className="cv-sep" />

          <button className="cv-tbtn" onClick={() => fileInputRef.current?.click()}>
            <ImagePlus size={12} /> Import
          </button>
          <input
            ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }}
            onChange={e => { importImage(e.target.files[0]); e.target.value = ""; }}
          />

          <button className="cv-tbtn" onClick={centerCanvas}>
            <Focus size={12} /> Center
          </button>

          <button className="cv-tbtn" onClick={() => {
            const active = getActiveLayer();
            if (active) active.ctx.clearRect(0, 0, canvasWRef.current, canvasHRef.current);
            setLayerTick(t => t + 1);
          }}>
            <Trash2 size={12} /> Clear
          </button>

          <div className="cv-spacer" />

          <span style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--mono)" }}>
            {canvasW} × {canvasH}
          </span>
          <div className="cv-sep" />

          <button className="cv-tbtn accent" onClick={exportCanvas}>
            <Download size={12} /> Export PNG
          </button>
        </div>

        {/* BODY */}
        <div className="cv-body">

          {/* TOOL RAIL */}
          <div className="cv-rail">
            {TOOLS.map((t, i) =>
              t === null ? <div key={i} className="cv-rail-sep" /> : (
                <button
                  key={t.id}
                  className={`cv-tool ${tool === t.id ? "active" : ""}`}
                  onClick={() => setTool(t.id)}
                >
                  <t.Icon size={15} />
                  <span className="cv-tool-tip">{t.title}</span>
                </button>
              )
            )}
          </div>

          {/* VIEWPORT */}
          <div
            ref={viewportRef}
            className="cv-viewport"
            style={{ cursor: getCursor() }}
          >
            <div className="cv-checker" />

            {/* Canvas container */}
            <div
              ref={containerRef}
              className="cv-canvas-wrap"
              style={{
                width: canvasW,
                height: canvasH,
                transformOrigin: "0 0",
                transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
              }}
            >
              {/* Temp canvas for shape preview */}
              <canvas
                ref={tempCanvasRef}
                width={canvasW}
                height={canvasH}
                style={{ position: "absolute", top: 0, left: 0, zIndex: 9999, pointerEvents: "none" }}
              />
            </div>

            {/* HUD */}
            <div className="cv-hud">
              <span>ZOOM</span>
              <span style={{ color: "var(--accent)" }}>{zoom}%</span>
              <div className="cv-hud-sep" />
              <span>W</span>
              <span style={{ color: "var(--text0)" }}>{canvasW}</span>
              <div className="cv-hud-sep" />
              <span>H</span>
              <span style={{ color: "var(--text0)" }}>{canvasH}</span>
              <div className="cv-hud-sep" />
              <span style={{ color: "var(--text2)" }}>Scroll to zoom · Middle drag to pan</span>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="cv-panel">

            {/* Color */}
            <div className="cv-section">
              <div className="cv-sec-label">Color</div>
              <div
                className="cv-color-preview"
                style={{ background: color }}
              >
                <input
                  type="color" value={color}
                  onChange={e => setColor(e.target.value)}
                />
              </div>
              <div className="cv-hex-display">{color.toUpperCase()}</div>
              <div className="cv-swatches">
                {PRESET_COLORS.map(c => (
                  <div
                    key={c}
                    className={`cv-swatch ${color === c ? "sel" : ""}`}
                    style={{
                      background: c,
                      border: c === "#ffffff" ? "1.5px solid rgba(255,255,255,0.2)" : undefined,
                    }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Brush */}
            <div className="cv-section">
              <div className="cv-sec-label">Brush</div>

              <div className="cv-slider-row">
                <span className="cv-slider-label">Size</span>
                <input
                  type="range" min="1" max="200" step="1" value={size}
                  className="cv-range"
                  onChange={e => setSize(+e.target.value)}
                />
                <span className="cv-slider-val">{size}px</span>
              </div>

              <div className="cv-slider-row">
                <span className="cv-slider-label">Opacity</span>
                <input
                  type="range" min="1" max="100" step="1" value={opacity}
                  className="cv-range"
                  onChange={e => setOpacity(+e.target.value)}
                />
                <span className="cv-slider-val">{opacity}%</span>
              </div>

              <div className="cv-check-row">
                <span>Fill shapes</span>
                <div
                  className={`cv-toggle ${fillShapes ? "on" : ""}`}
                  onClick={() => setFillShapes(f => !f)}
                />
              </div>
            </div>

            {/* Canvas size */}
            <div className="cv-section">
              <div className="cv-sec-label">Canvas</div>
              <select
                className="cv-select"
                onChange={e => {
                  const preset = CANVAS_PRESETS[+e.target.value];
                  if (preset) {
                    setCanvasW(preset.w);
                    setCanvasH(preset.h);
                    applyDimensions(preset.w, preset.h);
                    setTimeout(centerCanvas, 50);
                  }
                }}
                defaultValue=""
              >
                <option value="" disabled>Presets…</option>
                {CANVAS_PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>{p.label}</option>
                ))}
              </select>
              <div className="cv-dim-row">
                <div className="cv-dim-field">
                  <div className="cv-dim-label">W</div>
                  <input
                    type="number" className="cv-input" value={canvasW} min="50" max="4096"
                    onChange={e => setCanvasW(+e.target.value || 800)}
                    onBlur={e => applyDimensions(+e.target.value || 800, canvasH)}
                  />
                </div>
                <div className="cv-dim-field">
                  <div className="cv-dim-label">H</div>
                  <input
                    type="number" className="cv-input" value={canvasH} min="50" max="4096"
                    onChange={e => setCanvasH(+e.target.value || 600)}
                    onBlur={e => applyDimensions(canvasW, +e.target.value || 600)}
                  />
                </div>
              </div>
            </div>

            {/* Layers */}
            <div
              className="cv-layers-header"
              style={{ borderBottom: "1px solid var(--line)", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "space-between" }}
            >
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text2)" }}>
                Layers
              </span>
              <button className="cv-icon-btn" onClick={() => createLayer()}>
                <Plus size={14} />
              </button>
            </div>

            <div className="cv-layers-list" style={{ flex: 1 }}>
              {layers.map(layer => (
                <div
                  key={layer.id}
                  className={`cv-layer-item ${layer.id === activeLayerId ? "active" : ""}`}
                  onClick={() => { setActiveLayerId(layer.id); activeLayerIdRef.current = layer.id; }}
                >
                  <button
                    className="cv-icon-btn"
                    onClick={e => { e.stopPropagation(); toggleVisible(layer.id); }}
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} style={{ opacity: 0.4 }} />}
                  </button>

                  <div className="cv-layer-thumb">
                    <LayerThumbnail canvas={layer.canvas} key={`${layer.id}-${layerTick}`} />
                  </div>

                  {editingLayerId === layer.id ? (
                    <input
                      className="cv-layer-name-edit"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onBlur={() => {
                        setLayers(prev => prev.map(l =>
                          l.id === layer.id ? { ...l, name: editingName || l.name } : l
                        ));
                        setEditingLayerId(null);
                      }}
                      onKeyDown={e => { if (e.key === "Enter") e.target.blur(); }}
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="cv-layer-name"
                      onDoubleClick={e => {
                        e.stopPropagation();
                        setEditingLayerId(layer.id);
                        setEditingName(layer.name);
                      }}
                    >
                      {layer.name}
                    </span>
                  )}

                  {layers.length > 1 && (
                    <button
                      className="cv-icon-btn danger"
                      onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }}
                    >
                      <Trash2 size={11} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Export actions */}
            <div className="cv-section" style={{ marginTop: "auto" }}>
              <div className="cv-sec-label">Export</div>
              <button className="cv-btn primary" onClick={exportCanvas}>
                <Download size={12} /> Export as PNG
              </button>
              <button className="cv-btn" onClick={() => fileInputRef.current?.click()}>
                <ImagePlus size={12} /> Import image
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}