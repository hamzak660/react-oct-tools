import React, { useRef, useState, useEffect, useCallback, useMemo } from "react";

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({ d, size = 14, color = "currentColor", fill = "none", sw = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  Play:      () => <Icon fill="currentColor" stroke="none" d="M5 3l14 9-14 9V3z" />,
  Pause:     () => <Icon fill="currentColor" stroke="none" d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />,
  SkipBack:  () => <Icon d="M19 20L9 12l10-8v16zM5 4h2v16H5V4z" />,
  SkipFwd:   () => <Icon d="M5 4l10 8-10 8V4zm14 0h-2v16h2V4z" />,
  Film:      () => <Icon d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4M4 4h16a1 1 0 011 1v14a1 1 0 01-1 1H4a1 1 0 01-1-1V5a1 1 0 011-1z" />,
  Music:     () => <Icon d="M9 18V5l12-2v13M9 18a3 3 0 11-6 0 3 3 0 016 0zm12-2a3 3 0 11-6 0 3 3 0 016 0z" />,
  Text:      () => <Icon d="M4 7V4h16v3M9 20h6M12 4v16" />,
  Scissors:  () => <Icon d="M6 3a3 3 0 110 6 3 3 0 010-6zm12 0a3 3 0 110 6 3 3 0 010-6zM20 16a3 3 0 11-6 0 3 3 0 016 0zM6 9l12 6M6 15l12-6" />,
  Upload:    () => <Icon d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  Export:    () => <Icon d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />,
  Eye:       () => <Icon d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z" />,
  EyeOff:    () => <Icon d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" />,
  Lock:      () => <Icon d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4" />,
  Plus:      () => <Icon d="M12 5v14M5 12h14" />,
  Trash:     () => <Icon d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />,
  ZoomIn:    () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />,
  ZoomOut:   () => <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />,
  Bolt:      () => <Icon d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />,
  Layers:    () => <Icon d="M12 2l9 4.5-9 4.5L3 6.5 12 2zM3 12l9 4.5 9-4.5M3 17l9 4.5 9-4.5" />,
  X:         () => <Icon d="M18 6L6 18M6 6l12 12" />,
  Split:     () => <Icon d="M12 3v18M3 9l4-4 4 4M3 15l4 4 4-4M17 9l4-4M17 15l4 4" />,
  Fx:        () => <Icon d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />,
  Mask:      () => <Icon d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />,
  Crop:      () => <Icon d="M6 2v14h14M2 6h14v14" />,
  Wand:      () => <Icon d="M15 4l5 5-10 10-5-5L15 4zM2 22l4-4" />,
  Palette:   () => <Icon d="M12 2a10 10 0 00-7.07 17.07C7 21 9 22 12 22a4 4 0 004-4v-1h1a3 3 0 003-3 9 9 0 00-8-8.9V2z" />,
  Vignette:  () => <Icon d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 16a6 6 0 110-12 6 6 0 010 12z" />,
};

// ─── Utils ────────────────────────────────────────────────────────────────────
function formatTC(s) {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), f = Math.floor((s % 1) * 30);
  return `${p2(h)}:${p2(m)}:${p2(sec)}:${p2(f)}`;
}
function formatShort(s) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${p2(sec)}`;
}
function p2(n) { return String(Math.max(0, Math.floor(n))).padStart(2, "0"); }
function uid() { return Math.random().toString(36).slice(2, 9); }

const SNAP_PX = 8;
const FPS = 30;
const W = 1280, H = 720;

// ─── Extended FX Catalog ─────────────────────────────────────────────────────
const FX_CATALOG = [
  // Color
  { id: "brightness",  label: "Brightness",    group: "Color",     params: [{ key: "value",    label: "Amount",    min: -100, max: 100,  def: 0   }] },
  { id: "contrast",    label: "Contrast",      group: "Color",     params: [{ key: "value",    label: "Amount",    min: -100, max: 100,  def: 0   }] },
  { id: "saturate",    label: "Saturation",    group: "Color",     params: [{ key: "value",    label: "Amount",    min: -100, max: 100,  def: 0   }] },
  { id: "hueRotate",   label: "Hue Rotate",    group: "Color",     params: [{ key: "degrees",  label: "Degrees",   min: 0,    max: 360,  def: 0   }] },
  { id: "temperature", label: "Temperature",   group: "Color",     params: [{ key: "value",    label: "Warm/Cool", min: -100, max: 100,  def: 0   }] },
  { id: "tint",        label: "Tint",          group: "Color",     params: [{ key: "value",    label: "Green/Mag", min: -100, max: 100,  def: 0   }] },
  { id: "exposure",    label: "Exposure",      group: "Color",     params: [{ key: "value",    label: "Stops",     min: -3,   max: 3,    def: 0   }] },
  { id: "highlights",  label: "Highlights",    group: "Color",     params: [{ key: "value",    label: "Amount",    min: -100, max: 100,  def: 0   }] },
  { id: "shadows",     label: "Shadows",       group: "Color",     params: [{ key: "value",    label: "Amount",    min: -100, max: 100,  def: 0   }] },
  // Style
  { id: "blur",        label: "Blur",          group: "Style",     params: [{ key: "radius",   label: "Radius px", min: 0,    max: 40,   def: 0   }] },
  { id: "grayscale",   label: "Grayscale",     group: "Style",     params: [{ key: "amount",   label: "Amount %",  min: 0,    max: 100,  def: 100 }] },
  { id: "sepia",       label: "Sepia",         group: "Style",     params: [{ key: "amount",   label: "Amount %",  min: 0,    max: 100,  def: 100 }] },
  { id: "invert",      label: "Invert",        group: "Style",     params: [{ key: "amount",   label: "Amount %",  min: 0,    max: 100,  def: 100 }] },
  { id: "pixelate",    label: "Pixelate",      group: "Style",     params: [{ key: "size",     label: "Block px",  min: 1,    max: 64,   def: 8   }] },
  { id: "sharpen",     label: "Sharpen",       group: "Style",     params: [{ key: "amount",   label: "Amount",    min: 0,    max: 5,    def: 1   }] },
  { id: "vignette",    label: "Vignette",      group: "Style",     params: [{ key: "size",     label: "Size",      min: 0,    max: 100,  def: 50  }, { key: "opacity", label: "Opacity", min: 0, max: 100, def: 80 }] },
  { id: "noise",       label: "Noise / Grain", group: "Style",     params: [{ key: "amount",   label: "Amount %",  min: 0,    max: 100,  def: 20  }] },
  { id: "chromatic",   label: "Chromatic Ab.", group: "Style",     params: [{ key: "amount",   label: "Offset px", min: 0,    max: 20,   def: 4   }] },
  { id: "scanlines",   label: "Scanlines",     group: "Style",     params: [{ key: "opacity",  label: "Opacity %", min: 0,    max: 100,  def: 40  }] },
  { id: "glow",        label: "Glow",          group: "Style",     params: [{ key: "radius",   label: "Radius",    min: 0,    max: 30,   def: 8   }, { key: "opacity", label: "Opacity", min: 0, max: 100, def: 60 }] },
  // Transform
  { id: "flipH",       label: "Flip Horizontal", group: "Transform", params: [] },
  { id: "flipV",       label: "Flip Vertical",   group: "Transform", params: [] },
  { id: "rotate",      label: "Rotate",          group: "Transform", params: [{ key: "degrees", label: "Degrees", min: -180, max: 180, def: 0 }] },
  // Mask
  { id: "maskCircle",  label: "Mask: Circle",   group: "Mask",     params: [{ key: "size",     label: "Size %",    min: 10,   max: 100,  def: 80  }] },
  { id: "maskBlurEdge",label: "Mask: Blur Edge", group: "Mask",    params: [{ key: "radius",   label: "Blur px",   min: 0,    max: 60,   def: 20  }] },
  { id: "maskRect",    label: "Mask: Rectangle", group: "Mask",    params: [{ key: "x", label: "X %", min: 0, max: 100, def: 10 }, { key: "y", label: "Y %", min: 0, max: 100, def: 10 }, { key: "w", label: "W %", min: 1, max: 100, def: 80 }, { key: "h", label: "H %", min: 1, max: 100, def: 80 }] },
  { id: "maskGradH",   label: "Mask: Grad H",   group: "Mask",     params: [{ key: "start",    label: "Start %",   min: 0,    max: 100,  def: 20  }, { key: "end", label: "End %", min: 0, max: 100, def: 80 }] },
  { id: "maskGradV",   label: "Mask: Grad V",   group: "Mask",     params: [{ key: "start",    label: "Start %",   min: 0,    max: 100,  def: 20  }, { key: "end", label: "End %", min: 0, max: 100, def: 80 }] },
];

const FX_GROUPS = ["Color", "Style", "Transform", "Mask"];

const TC = {
  video:  { bg: "rgba(56,121,217,0.15)",  border: "#3879d9", accent: "#5b9ef7", glow: "rgba(56,121,217,0.4)" },
  audio:  { bg: "rgba(16,185,129,0.13)",  border: "#0fa870", accent: "#34d399", glow: "rgba(16,185,129,0.35)" },
  text:   { bg: "rgba(167,84,230,0.13)",  border: "#a754e6", accent: "#c084fc", glow: "rgba(167,84,230,0.35)" },
  effect: { bg: "rgba(251,146,60,0.13)",  border: "#f97316", accent: "#fb923c", glow: "rgba(251,146,60,0.35)" },
};

// ─── Build CSS filter string ──────────────────────────────────────────────────
function buildFilter(effects = []) {
  const parts = [];
  effects.forEach(ef => {
    if (ef.id === "brightness")  parts.push(`brightness(${1 + (ef.params.value || 0) / 100})`);
    if (ef.id === "contrast")    parts.push(`contrast(${1 + (ef.params.value || 0) / 100})`);
    if (ef.id === "saturate")    parts.push(`saturate(${1 + (ef.params.value || 0) / 100})`);
    if (ef.id === "hueRotate")   parts.push(`hue-rotate(${ef.params.degrees || 0}deg)`);
    if (ef.id === "exposure")    parts.push(`brightness(${Math.pow(2, ef.params.value || 0).toFixed(3)})`);
    if (ef.id === "blur")        parts.push(`blur(${ef.params.radius || 0}px)`);
    if (ef.id === "grayscale")   parts.push(`grayscale(${(ef.params.amount || 0) / 100})`);
    if (ef.id === "sepia")       parts.push(`sepia(${(ef.params.amount || 0) / 100})`);
    if (ef.id === "invert")      parts.push(`invert(${(ef.params.amount || 0) / 100})`);
    if (ef.id === "sharpen")     parts.push(`contrast(${1 + (ef.params.amount || 0) * 0.1}) saturate(${1 + (ef.params.amount || 0) * 0.05})`);
    // temperature/tint approximated via hue + saturate combos
    if (ef.id === "temperature") {
      const v = (ef.params.value || 0) / 100;
      parts.push(`sepia(${Math.abs(v) * 0.3}) ${v > 0 ? `hue-rotate(-10deg) saturate(1.2)` : `hue-rotate(20deg) saturate(0.9)`}`);
    }
    if (ef.id === "highlights") {
      const v = (ef.params.value || 0) / 200;
      parts.push(`brightness(${1 + v})`);
    }
    if (ef.id === "shadows") {
      const v = (ef.params.value || 0) / 400;
      parts.push(`brightness(${1 + v}) contrast(${1 - Math.abs(v) * 0.2})`);
    }
    if (ef.id === "rotate") parts.push(`/* rotate handled in transform */`);
  });
  return parts.filter(p => !p.startsWith("/*")).join(" ") || "none";
}

// ─── Canvas-based overlay effects (vignette, noise, scanlines, chromatic, pixelate, glow, masks) ─────
function drawOverlayEffects(ctx, effects, w, h) {
  effects.forEach(ef => {
    ctx.save();
    if (ef.id === "vignette") {
      const size = (ef.params.size ?? 50) / 100;
      const opacity = (ef.params.opacity ?? 80) / 100;
      const gradient = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * size * 0.4, w / 2, h / 2, Math.min(w, h) * 0.9);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, `rgba(0,0,0,${opacity})`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    if (ef.id === "noise") {
      const amount = (ef.params.amount ?? 20) / 100;
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      for (let i = 0; i < data.length; i += 4) {
        const noise = (Math.random() - 0.5) * amount * 255;
        data[i] = Math.max(0, Math.min(255, data[i] + noise));
        data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
        data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
      }
      ctx.putImageData(imageData, 0, 0);
    }
    if (ef.id === "scanlines") {
      const opacity = (ef.params.opacity ?? 40) / 100;
      ctx.globalAlpha = opacity;
      ctx.fillStyle = "#000";
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (ef.id === "chromatic") {
      const off = ef.params.amount ?? 4;
      const imageData = ctx.getImageData(0, 0, w, h);
      const orig = new Uint8ClampedArray(imageData.data);
      const data = imageData.data;
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4;
          const ri = (y * w + Math.min(w - 1, x + off)) * 4;
          const bi = (y * w + Math.max(0, x - off)) * 4;
          data[i]     = orig[ri];
          data[i + 2] = orig[bi + 2];
        }
      }
      ctx.putImageData(imageData, 0, 0);
    }
    if (ef.id === "pixelate") {
      const size = Math.max(1, ef.params.size ?? 8);
      const offCanvas = document.createElement("canvas");
      offCanvas.width = Math.max(1, Math.floor(w / size));
      offCanvas.height = Math.max(1, Math.floor(h / size));
      const offCtx = offCanvas.getContext("2d");
      offCtx.drawImage(ctx.canvas, 0, 0, offCanvas.width, offCanvas.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offCanvas, 0, 0, w, h);
      ctx.imageSmoothingEnabled = true;
    }
    if (ef.id === "glow") {
      const radius = ef.params.radius ?? 8;
      const opacity = (ef.params.opacity ?? 60) / 100;
      ctx.globalAlpha = opacity * 0.5;
      ctx.filter = `blur(${radius}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = "none";
      ctx.globalAlpha = 1;
    }
    // Masks
    if (ef.id === "maskCircle") {
      const size = (ef.params.size ?? 80) / 100;
      const rx = w / 2, ry = h / 2;
      const rad = Math.min(w, h) * size * 0.5;
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w; maskCanvas.height = h;
      const mCtx = maskCanvas.getContext("2d");
      mCtx.fillStyle = "#000";
      mCtx.fillRect(0, 0, w, h);
      mCtx.globalCompositeOperation = "destination-out";
      mCtx.beginPath();
      mCtx.ellipse(rx, ry, rad, rad, 0, 0, Math.PI * 2);
      mCtx.fill();
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(maskCanvas, 0, 0);
      ctx.globalCompositeOperation = "source-over";
    }
    if (ef.id === "maskBlurEdge") {
      const radius = ef.params.radius ?? 20;
      ctx.filter = `blur(${radius}px)`;
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w; maskCanvas.height = h;
      const mCtx = maskCanvas.getContext("2d");
      const gradient = mCtx.createRadialGradient(w/2,h/2, Math.min(w,h)*0.3, w/2,h/2, Math.min(w,h)*0.6);
      gradient.addColorStop(0, "rgba(0,0,0,0)");
      gradient.addColorStop(1, "rgba(0,0,0,1)");
      mCtx.fillStyle = gradient;
      mCtx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation = "destination-out";
      ctx.filter = "none";
      ctx.drawImage(maskCanvas, 0,0);
      ctx.globalCompositeOperation = "source-over";
    }
    if (ef.id === "maskRect") {
      const mx = (ef.params.x ?? 10) / 100 * w;
      const my = (ef.params.y ?? 10) / 100 * h;
      const mw = (ef.params.w ?? 80) / 100 * w;
      const mh = (ef.params.h ?? 80) / 100 * h;
      ctx.globalCompositeOperation = "destination-in";
      ctx.fillStyle = "#fff";
      ctx.fillRect(mx, my, mw, mh);
      ctx.globalCompositeOperation = "source-over";
    }
    if (ef.id === "maskGradH") {
      const start = (ef.params.start ?? 20) / 100;
      const end = (ef.params.end ?? 80) / 100;
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(start, "rgba(0,0,0,0)");
      grad.addColorStop(end, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
    if (ef.id === "maskGradV") {
      const start = (ef.params.start ?? 20) / 100;
      const end = (ef.params.end ?? 80) / 100;
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(start, "rgba(0,0,0,0)");
      grad.addColorStop(end, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,1)");
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "source-over";
    }
    ctx.restore();
  });
}

// ─── WaveformCanvas ───────────────────────────────────────────────────────────
const WaveformCanvas = React.memo(function WaveformCanvas({ audioBuffer, width, height, color }) {
  const ref = useRef();
  useEffect(() => {
    if (!ref.current || !audioBuffer || !width || width < 1) return;
    const c = ref.current; c.width = width; c.height = height;
    const ctx = c.getContext("2d");
    const data = audioBuffer.getChannelData(0);
    const step = Math.max(1, Math.ceil(data.length / width));
    const amp = height / 2;
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = color + "cc"; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
      let mn = 1, mx = -1;
      for (let j = 0; j < step; j++) { const v = data[i * step + j] || 0; if (v < mn) mn = v; if (v > mx) mx = v; }
      ctx.moveTo(i, amp + mn * amp); ctx.lineTo(i, amp + mx * amp);
    }
    ctx.stroke();
  }, [audioBuffer, width, height, color]);
  return <canvas ref={ref} style={{ width: "100%", height: "100%", opacity: 0.85 }} />;
});

// ─── TimelineRuler ────────────────────────────────────────────────────────────
const TimelineRuler = React.memo(function TimelineRuler({ duration, zoom }) {
  const totalW = Math.max(duration * zoom + 300, 900);
  let major;
  if (zoom >= 200) major = 1;
  else if (zoom >= 80) major = 2;
  else if (zoom >= 40) major = 5;
  else if (zoom >= 20) major = 10;
  else major = 30;
  const minor = 4;
  const mStep = major / (minor + 1);
  const ticks = [];
  for (let t = 0; t <= duration + 0.001; t = Math.round((t + mStep) * 1000) / 1000) {
    ticks.push({ t, isMajor: Math.abs(Math.round(t / major) * major - t) < 0.001 });
  }
  return (
    <div style={{ position: "relative", height: 28, width: totalW, background: "#0c0c0f", borderBottom: "1px solid #1e1e26", flexShrink: 0, overflow: "hidden" }}>
      {ticks.map(({ t, isMajor }) => (
        <React.Fragment key={t}>
          <div style={{ position: "absolute", left: t * zoom, bottom: 0, width: 1, height: isMajor ? "60%" : "35%", background: isMajor ? "#4a4a5a" : "rgba(255,255,255,0.12)", transform: "translateX(-50%)" }} />
          {isMajor && (
            <span style={{ position: "absolute", left: t * zoom + 4, top: 5, fontSize: 10, color: "#6a6a82", fontFamily: "monospace", whiteSpace: "nowrap", pointerEvents: "none", fontWeight: 500 }}>
              {formatShort(t)}
            </span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
});

// ─── ClipBlock ────────────────────────────────────────────────────────────────
const ClipBlock = React.memo(function ClipBlock({ clip, zoom, trackH, tracks, selected, onSelect, onMove, onResize, allClips }) {
  const col = TC[clip.type] || TC.video;
  const w = Math.max(4, clip.duration * zoom);
  const x = clip.start * zoom;

  const handleDrag = useCallback((e) => {
    if (e.target.dataset.resizeHandle) return;
    e.stopPropagation();
    onSelect(clip.id);
    const sx = e.clientX, sl = clip.start;
    const onM = (me) => {
      let ns = Math.max(0, sl + (me.clientX - sx) / zoom);
      for (const c of allClips) {
        if (c.id === clip.id) continue;
        for (const sp of [c.start, c.start + c.duration]) {
          if (Math.abs(ns * zoom - sp * zoom) < SNAP_PX) { ns = sp; break; }
          if (Math.abs((ns + clip.duration) * zoom - sp * zoom) < SNAP_PX) { ns = sp - clip.duration; break; }
        }
      }
      let nt = clip.trackId;
      document.querySelectorAll("[data-track-id]").forEach(el => {
        const r = el.getBoundingClientRect();
        if (me.clientY >= r.top && me.clientY <= r.bottom) {
          const tid = el.getAttribute("data-track-id");
          const tr = tracks.find(t => t.id === tid);
          if (tr && tr.type === clip.type) nt = tid;
        }
      });
      onMove(clip.id, Math.max(0, ns), nt);
    };
    const onU = () => { document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU); };
    document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
  }, [clip, zoom, onSelect, onMove, allClips, tracks]);

  const handleResize = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const sx = e.clientX, sd = clip.duration;
    const onM = (me) => onResize(clip.id, Math.max(0.1, sd + (me.clientX - sx) / zoom));
    const onU = () => { document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU); };
    document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
  }, [clip, zoom, onResize]);

  return (
    <div
      onMouseDown={handleDrag}
      onClick={e => { e.stopPropagation(); onSelect(clip.id); }}
      style={{
        position: "absolute", left: x, top: 3, width: w, height: trackH - 6,
        background: col.bg,
        border: `1px solid ${selected ? col.accent : col.border}`,
        borderLeft: `3px solid ${col.accent}`,
        borderRadius: 5, cursor: "grab", display: "flex", alignItems: "center",
        overflow: "hidden", boxSizing: "border-box",
        boxShadow: selected ? `0 0 0 1.5px ${col.glow}, inset 0 0 0 1px ${col.accent}22` : "none",
        userSelect: "none",
      }}
    >
      {clip.type === "audio" && clip.audioBuffer && (
        <div style={{ position: "absolute", inset: 0 }}>
          <WaveformCanvas audioBuffer={clip.audioBuffer} width={Math.max(1, Math.floor(w))} height={trackH - 6} color={col.accent} />
        </div>
      )}
      {clip.type === "effect" && (
        <div style={{ position: "absolute", inset: 0, background: `repeating-linear-gradient(45deg, transparent, transparent 4px, ${col.accent}18 4px, ${col.accent}18 8px)` }} />
      )}
      <span style={{ position: "relative", zIndex: 2, paddingLeft: 8, fontSize: 10, color: col.accent, fontFamily: "monospace", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: w - 30, fontWeight: 600, letterSpacing: "0.02em" }}>
        {clip.name}
      </span>
      {clip.type === "effect" && clip.fxName && (
        <span style={{ position: "absolute", right: 14, fontSize: 8, color: col.accent + "cc", fontFamily: "monospace" }}>{clip.fxName}</span>
      )}
      <div
        data-resize-handle="1"
        onMouseDown={handleResize}
        style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: 8, cursor: "ew-resize", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        <div style={{ width: 2, height: 14, borderRadius: 1, background: col.accent + "99" }} />
      </div>
    </div>
  );
});

// ─── Export Dialog ────────────────────────────────────────────────────────────
function ExportDialog({ onConfirm, onCancel }) {
  const [name, setName] = useState(`flux-export-${Date.now()}`);
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#111118", border: "1px solid #2a2a38", borderRadius: 10, padding: 28, width: 380, display: "flex", flexDirection: "column", gap: 18, boxShadow: "0 24px 80px rgba(0,0,0,0.8)" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#e2e8f0", fontFamily: "monospace", letterSpacing: "0.08em" }}>EXPORT VIDEO</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 10, color: "#5a5a72", fontFamily: "monospace", letterSpacing: "0.06em" }}>FILE NAME</span>
          <input
            autoFocus value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") onConfirm(name); if (e.key === "Escape") onCancel(); }}
            style={{ background: "#0f0f15", border: "1px solid #2a2a3a", borderRadius: 5, padding: "8px 12px", fontSize: 12, color: "#a0c4ff", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" }}
          />
          <span style={{ fontSize: 9, color: "#3a3a50", fontFamily: "monospace" }}>.mp4 will be appended</span>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "9px 0", background: "transparent", border: "1px solid #2a2a38", borderRadius: 5, color: "#5a5a72", fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>CANCEL</button>
          <button onClick={() => onConfirm(name)} style={{ flex: 2, padding: "9px 0", background: "#1a3060", border: "1px solid #3879d9", borderRadius: 5, color: "#5b9ef7", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.06em" }}>EXPORT →</button>
        </div>
      </div>
    </div>
  );
}

// ─── MP4 Export Engine ────────────────────────────────────────────────────────
async function exportVideo({ clips, tracks, duration, filename, effectClips, onProgress, onDone, onError }) {
  try {
    const totalFrames = Math.ceil(duration * FPS);
    if (typeof VideoEncoder === "undefined") throw new Error("WebCodecs not supported. Use Chrome 94+.");

    onProgress(2, "Loading mp4-muxer…");
    if (!window.__mp4MuxerLoaded) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/mp4-muxer@5/build/mp4-muxer.js";
        s.onload = res; s.onerror = () => rej(new Error("Failed to load mp4-muxer"));
        document.head.appendChild(s);
      });
      window.__mp4MuxerLoaded = true;
    }

    const canvas = document.createElement("canvas");
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    onProgress(5, "Setting up muxer…");
    const { Muxer, ArrayBufferTarget } = Mp4Muxer;
    const target = new ArrayBufferTarget();
    const muxer = new Muxer({ target, video: { codec: "avc", width: W, height: H }, audio: { codec: "aac", sampleRate: 44100, numberOfChannels: 2 }, fastStart: "in-memory" });

    let videoEncoderError = null;
    const videoEncoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { videoEncoderError = e; } });
    videoEncoder.configure({ codec: "avc1.42001f", width: W, height: H, bitrate: 2_000_000, framerate: FPS, latencyMode: "realtime" });

    onProgress(8, "Mixing audio…");
    const ac = new OfflineAudioContext(2, Math.ceil(duration * 44100), 44100);
    const audioClips = clips.filter(c => c.type === "audio" && c.audioBuffer);
    for (const clip of audioClips) {
      const node = ac.createBufferSource(); node.buffer = clip.audioBuffer;
      const gain = ac.createGain(); gain.gain.value = clip.volume ?? 1;
      node.connect(gain); gain.connect(ac.destination);
      node.start(clip.start, 0, clip.duration);
    }
    const audioRender = await ac.startRendering();
    let audioEncoderError = null;
    const audioEncoder = new AudioEncoder({ output: (chunk, meta) => muxer.addAudioChunk(chunk, meta), error: e => { audioEncoderError = e; } });
    audioEncoder.configure({ codec: "mp4a.40.2", sampleRate: 44100, numberOfChannels: 2, bitrate: 128_000 });
    const ACHUNK = 4096;
    const totalSamples = audioRender.length;
    const ch0 = audioRender.getChannelData(0), ch1 = audioRender.getChannelData(1);
    for (let offset = 0; offset < totalSamples; offset += ACHUNK) {
      if (audioEncoderError) throw audioEncoderError;
      const len = Math.min(ACHUNK, totalSamples - offset);
      const fd = new Float32Array(len * 2);
      for (let i = 0; i < len; i++) { fd[i * 2] = ch0[offset + i] || 0; fd[i * 2 + 1] = ch1[offset + i] || 0; }
      const af = new AudioData({ format: "f32", sampleRate: 44100, numberOfFrames: len, numberOfChannels: 2, timestamp: Math.round((offset / 44100) * 1e6), data: fd });
      audioEncoder.encode(af); af.close();
    }
    if (audioEncoder.state === "configured") await audioEncoder.flush();
    audioEncoder.close();

    onProgress(15, "Loading video assets…");
    const videoClips = clips.filter(c => c.type === "video" && c.url).sort((a, b) => tracks.findIndex(t => t.id === a.trackId) - tracks.findIndex(t => t.id === b.trackId));
    const videoEls = {};
    for (const clip of videoClips) {
      const v = document.createElement("video");
      v.src = clip.url; v.crossOrigin = "anonymous"; v.preload = "auto"; v.muted = true;
      await new Promise(res => { v.oncanplaythrough = res; v.onerror = res; setTimeout(res, 5000); v.load(); });
      v.currentTime = 0;
      await new Promise(res => { v.onseeked = res; setTimeout(res, 300); });
      videoEls[clip.id] = v;
    }
    const textClips = clips.filter(c => c.type === "text");
    onProgress(20, "Rendering frames…");

    for (let frame = 0; frame < totalFrames; frame++) {
      if (videoEncoderError) throw videoEncoderError;
      if (videoEncoder.state === "closed") throw new Error("VideoEncoder closed unexpectedly.");
      while (videoEncoder.encodeQueueSize > 8) await new Promise(r => setTimeout(r, 4));
      const t = frame / FPS;
      const timestampUs = Math.round(t * 1e6);
      const durationUs = Math.round((1 / FPS) * 1e6);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      const activeEffects = (effectClips || []).filter(ec => t >= ec.start && t < ec.start + ec.duration);
      for (const clip of videoClips) {
        if (t < clip.start || t >= clip.start + clip.duration) continue;
        const el = videoEls[clip.id]; if (!el) continue;
        const clipTime = t - clip.start;
        if (Math.abs(el.currentTime - clipTime) > 0.1) { el.currentTime = clipTime; await new Promise(res => { el.onseeked = res; setTimeout(res, 80); }); }
        ctx.save();
        const fxForThisClip = activeEffects.filter(ec => ec.targetTrackId === clip.trackId);
        const allFx = [...(clip.effects || []), ...fxForThisClip.map(ec => ({ id: ec.fxId, params: ec.params }))];
        const filterStr = buildFilter(allFx);
        if (filterStr !== "none") ctx.filter = filterStr;
        ctx.globalAlpha = clip.opacity ?? 1;
        const scale = clip.scale ?? 1;
        const dw = W * scale, dh = H * scale;
        const dx = (W - dw) / 2, dy = (H - dh) / 2;
        const flipH = allFx.some(ef => ef.id === "flipH");
        const flipV = allFx.some(ef => ef.id === "flipV");
        const rotEf = allFx.find(ef => ef.id === "rotate");
        if (flipH || flipV || rotEf) {
          ctx.translate(W / 2, H / 2);
          if (rotEf) ctx.rotate((rotEf.params.degrees || 0) * Math.PI / 180);
          if (flipH) ctx.scale(-1, 1);
          if (flipV) ctx.scale(1, -1);
          ctx.translate(-W / 2, -H / 2);
        }
        ctx.drawImage(el, dx, dy, dw, dh);
        ctx.filter = "none";
        drawOverlayEffects(ctx, allFx, W, H);
        ctx.restore();
      }
      for (const clip of textClips) {
        if (t < clip.start || t >= clip.start + clip.duration) continue;
        ctx.save();
        const fontSize = Math.round((clip.fontSize || 32) * (H / 480));
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.shadowColor = "rgba(0,0,0,0.95)"; ctx.shadowBlur = 16;
        ctx.fillStyle = clip.color || "#fff";
        ctx.fillText(clip.text || "", (clip.posX ?? 50) / 100 * W, (clip.posY ?? 88) / 100 * H);
        ctx.restore();
      }
      const vf = new VideoFrame(canvas, { timestamp: timestampUs, duration: durationUs });
      if (videoEncoder.state === "configured") videoEncoder.encode(vf, { keyFrame: frame % (FPS * 2) === 0 });
      vf.close();
      if (frame % 6 === 0) { onProgress(20 + Math.round((frame / totalFrames) * 72), frame < totalFrames * 0.5 ? "Encoding…" : "Finishing…"); await new Promise(r => setTimeout(r, 0)); }
    }

    onProgress(93, "Flushing…");
    if (videoEncoder.state === "configured") await videoEncoder.flush();
    videoEncoder.close();
    onProgress(96, "Packaging MP4…");
    muxer.finalize();
    const { buffer } = target;
    if (!buffer || buffer.byteLength < 100) throw new Error("MP4 output empty.");
    const blob = new Blob([buffer], { type: "video/mp4" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}.mp4`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 15000);
    onProgress(100, `✓ Exported ${(blob.size / 1024 / 1024).toFixed(1)} MB`);
    onDone();
  } catch (err) {
    console.error("[Export]", err);
    onError(err.message || String(err));
  }
}

// ─── Inspector Panel ──────────────────────────────────────────────────────────
function Inspector({ clip, allClips, tracks, update, del, tab, setTab }) {
  const [newFxId, setNewFxId] = useState(FX_CATALOG[0].id);
  const [fxGroup, setFxGroup] = useState("Color");
  const ef = clip?.effects || [];

  if (!clip) return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
      <div style={{ opacity: 0.07, transform: "scale(1.8)" }}><Icons.Layers /></div>
      <span style={{ fontSize: 10, color: "#252535", textAlign: "center", lineHeight: 1.8, marginTop: 8 }}>Select a clip<br />to inspect</span>
    </div>
  );

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ display: "flex", borderBottom: "1px solid #1e1e25" }}>
        {["Props", "Effects"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "8px 0", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.1em", background: "transparent", border: "none", cursor: "pointer", color: tab === t ? "#e2e8f0" : "#333342", borderBottom: tab === t ? "2px solid #3879d9" : "2px solid transparent" }}>{t.toUpperCase()}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
        {tab === "Props" && <>
          <div style={{ fontSize: 11, color: "#c4c4d0", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{clip.name}</div>
          <div style={{ fontSize: 9, color: TC[clip.type]?.accent || "#5b9ef7", fontFamily: "monospace", letterSpacing: "0.06em" }}>{clip.type.toUpperCase()} · {formatShort(clip.duration)}</div>
          {[["Start (s)", "start", 0.01], ["Duration (s)", "duration", 0.01]].map(([l, k, s]) => (
            <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={SS.lbl}>{l}</span>
              <input style={SS.inp} type="number" step={s} value={Number(clip[k]).toFixed(2)} onChange={e => update(clip.id, k, parseFloat(e.target.value))} />
            </div>
          ))}
          {clip.type === "text" && <>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={SS.lbl}>CONTENT</span>
              <input style={SS.inp} value={clip.text || ""} onChange={e => update(clip.id, "text", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={SS.lbl}>FONT SIZE</span>
                <input style={SS.inp} type="number" min={10} max={200} value={clip.fontSize || 32} onChange={e => update(clip.id, "fontSize", parseInt(e.target.value))} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={SS.lbl}>COLOR</span>
                <input type="color" value={clip.color || "#ffffff"} onChange={e => update(clip.id, "color", e.target.value)} style={{ width: "100%", height: 28, borderRadius: 4, border: "1px solid #2a2a35", cursor: "pointer" }} />
              </div>
            </div>
            <div style={{ borderTop: "1px solid #1a1a22", paddingTop: 8 }}>
              <span style={{ ...SS.lbl, display: "block", marginBottom: 6 }}>POSITION (X / Y %)</span>
              <div style={{ display: "flex", gap: 6 }}>
                {[["X","posX",50],["Y","posY",88]].map(([l,k,d]) => (
                  <div key={k} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                    <span style={SS.lbl}>{l}</span>
                    <input style={SS.inp} type="number" min={0} max={100} step={1} value={Math.round(clip[k] ?? d)} onChange={e => update(clip.id, k, parseFloat(e.target.value))} />
                  </div>
                ))}
              </div>
              <div
                style={{ marginTop: 8, width: "100%", height: 80, background: "#0e0e14", border: "1px solid #2a2a38", borderRadius: 6, position: "relative", cursor: "crosshair" }}
                onMouseDown={e => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const move = me => { update(clip.id, "posX", Math.round(Math.max(0, Math.min(100, (me.clientX - rect.left) / rect.width * 100)))); update(clip.id, "posY", Math.round(Math.max(0, Math.min(100, (me.clientY - rect.top) / rect.height * 100)))); };
                  const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
                  move(e); document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
                }}
              >
                <div style={{ position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, background: "#1e1e2a" }} />
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "#1e1e2a" }} />
                <div style={{ position: "absolute", left: `${clip.posX ?? 50}%`, top: `${clip.posY ?? 88}%`, width: 8, height: 8, borderRadius: "50%", background: clip.color || "#fff", border: "2px solid rgba(255,255,255,0.6)", transform: "translate(-50%,-50%)", pointerEvents: "none", boxShadow: "0 0 6px rgba(255,255,255,0.4)" }} />
              </div>
            </div>
          </>}
          {clip.type === "video" && <>
            {[["Opacity","opacity",0,1,"#5b9ef7"],["Scale","scale",0.1,3,"#5b9ef7"]].map(([l,k,mn,mx,ac]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span style={SS.lbl}>{l}</span><span style={{ fontSize: 9, color: ac, fontFamily: "monospace" }}>{Math.round((clip[k] ?? 1) * 100)}%</span></div>
                <input type="range" min={mn} max={mx} step={0.01} value={clip[k] ?? 1} onChange={e => update(clip.id, k, parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#3879d9" }} />
              </div>
            ))}
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={SS.lbl}>VOLUME</span><span style={{ fontSize: 9, color: "#34d399", fontFamily: "monospace" }}>{Math.round((clip.volume ?? 1) * 100)}%</span></div>
              <input type="range" min={0} max={2} step={0.01} value={clip.volume ?? 1} onChange={e => update(clip.id, "volume", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#10b981" }} />
            </div>
          </>}
          {clip.type === "audio" && <>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={SS.lbl}>VOLUME</span><span style={{ fontSize: 9, color: "#34d399", fontFamily: "monospace" }}>{Math.round((clip.volume ?? 1) * 100)}%</span></div>
              <input type="range" min={0} max={2} step={0.01} value={clip.volume ?? 1} onChange={e => update(clip.id, "volume", parseFloat(e.target.value))} style={{ width: "100%", accentColor: "#10b981" }} />
            </div>
            {[["Fade In (s)","fadeIn"],["Fade Out (s)","fadeOut"]].map(([l,k]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <span style={SS.lbl}>{l}</span>
                <input style={SS.inp} type="number" min={0} max={clip.duration} step={0.1} value={clip[k] || 0} onChange={e => update(clip.id, k, parseFloat(e.target.value))} />
              </div>
            ))}
          </>}
          {clip.type === "effect" && <>
            <div style={{ fontSize: 9, color: "#fb923c", fontFamily: "monospace", marginBottom: 4 }}>EFFECT CLIP · targets: {clip.targetTrackId || "v1"}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={SS.lbl}>EFFECT GROUP</span>
              <select value={fxGroup} onChange={e => setFxGroup(e.target.value)} style={SS.sel}>
                {FX_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={SS.lbl}>EFFECT</span>
              <select value={clip.fxId || "brightness"} onChange={e => {
                const cat = FX_CATALOG.find(c => c.id === e.target.value);
                const params = {}; cat.params.forEach(p => { params[p.key] = p.def; });
                update(clip.id, "fxId", e.target.value);
                update(clip.id, "fxName", cat.label);
                update(clip.id, "params", params);
              }} style={SS.sel}>
                {FX_CATALOG.filter(e => e.group === fxGroup).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
              </select>
            </div>
            {(() => {
              const cat = FX_CATALOG.find(c => c.id === clip.fxId);
              return cat?.params.map(p => (
                <div key={p.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={SS.lbl}>{p.label.toUpperCase()}</span>
                    <span style={{ fontSize: 9, color: "#fb923c", fontFamily: "monospace" }}>{(clip.params?.[p.key] ?? p.def).toFixed(1)}</span>
                  </div>
                  <input type="range" min={p.min} max={p.max} step={(p.max - p.min) / 200} value={clip.params?.[p.key] ?? p.def}
                    onChange={ev => update(clip.id, "params", { ...(clip.params || {}), [p.key]: parseFloat(ev.target.value) })}
                    style={{ width: "100%", accentColor: "#f97316" }} />
                </div>
              ));
            })()}
          </>}
          <button onClick={() => del(clip.id)} style={SS.dangerBtn}><Icons.Trash /> Delete Clip</button>
        </>}

        {tab === "Effects" && clip.type !== "effect" && <>
          <div style={{ fontSize: 9, color: "#3a3a50", fontFamily: "monospace", letterSpacing: "0.1em" }}>PERMANENT EFFECTS ({ef.length})</div>
          {ef.length === 0 && <div style={{ fontSize: 10, color: "#252535", textAlign: "center", padding: "12px 0" }}>No effects applied</div>}
          {ef.map((e, i) => {
            const cat = FX_CATALOG.find(c => c.id === e.id); if (!cat) return null;
            return (
              <div key={i} style={{ background: "#131318", border: "1px solid #222230", borderRadius: 6, padding: "8px 10px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: cat.params.length ? 8 : 0 }}>
                  <div>
                    <span style={{ fontSize: 10, color: "#c4c4d0", fontWeight: 600 }}>{cat.label}</span>
                    <span style={{ fontSize: 8, color: "#3a3a50", fontFamily: "monospace", marginLeft: 6 }}>{cat.group}</span>
                  </div>
                  <button onClick={() => update(clip.id, "effects", ef.filter((_, j) => j !== i))} style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "2px 4px" }}><Icons.X /></button>
                </div>
                {cat.params.map(p => (
                  <div key={p.key} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={SS.lbl}>{p.label}</span>
                      <span style={{ fontSize: 9, color: "#5b9ef7", fontFamily: "monospace" }}>{(e.params[p.key] ?? p.def).toFixed(1)}</span>
                    </div>
                    <input type="range" min={p.min} max={p.max} step={(p.max - p.min) / 200} value={e.params[p.key] ?? p.def}
                      onChange={ev => { const n = [...ef]; n[i] = { ...n[i], params: { ...n[i].params, [p.key]: parseFloat(ev.target.value) } }; update(clip.id, "effects", n); }}
                      style={{ width: "100%", accentColor: "#3879d9" }} />
                  </div>
                ))}
              </div>
            );
          })}
          <div style={{ borderTop: "1px solid #1a1a22", paddingTop: 10, display: "flex", flexDirection: "column", gap: 6 }}>
            <span style={SS.lbl}>EFFECT GROUP</span>
            <select value={fxGroup} onChange={e => setFxGroup(e.target.value)} style={SS.sel}>
              {FX_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <span style={SS.lbl}>ADD EFFECT</span>
            <select value={newFxId} onChange={e => setNewFxId(e.target.value)} style={SS.sel}>
              {FX_CATALOG.filter(e => e.group === fxGroup).map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
            <button onClick={() => {
              const cat = FX_CATALOG.find(c => c.id === newFxId);
              const params = {}; cat.params.forEach(p => { params[p.key] = p.def; });
              update(clip.id, "effects", [...ef, { id: newFxId, params }]);
            }} style={SS.addBtn}><Icons.Plus /> Apply to Full Clip</button>
          </div>
        </>}

        {tab === "Effects" && clip.type === "effect" && (
          <div style={{ fontSize: 10, color: "#5a5a72", textAlign: "center", padding: "20px 0", lineHeight: 1.8 }}>
            Effect clip properties<br />are in the Props tab.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function VideoEditor() {
  const rootRef        = useRef(null);
  const tlScrollRef    = useRef(null);   // horizontal scroll
  const tlYScrollRef   = useRef(null);   // vertical scroll (track area)
  const labelScrollRef = useRef(null);   // track labels — synced with tlYScrollRef
  const rafRef         = useRef(null);
  const acRef          = useRef(null);
  const videoRefsMap   = useRef({});

  const [timelineH,    setTimelineH]    = useState(240);
  const [playing,      setPlaying]      = useState(false);
  const [currentTime,  setCt]           = useState(0);
  const [manualDuration, setManualDuration] = useState(60);
  const [zoom,         setZoom]         = useState(22);
  const [ghostT,       setGhostT]       = useState(null);
  const [iTab,         setITab]         = useState("Props");
  const [sideTab,      setSideTab]      = useState("media");
  const [trackVis,     setTrackVis]     = useState({});
  const [trackLock,    setTrackLock]    = useState({});
  const [selectedClip, setSelectedClip] = useState(null);
  const [textInput,    setTextInput]    = useState("");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exp, setExp]     = useState({ active: false, progress: 0, msg: "", error: "" });
  const [splitMode, setSplitMode] = useState(false);

  const [tracks, setTracks] = useState([
    { id: "v1",   label: "VIDEO 1", type: "video" },
    { id: "v2",   label: "VIDEO 2", type: "video" },
    { id: "a1",   label: "AUDIO 1", type: "audio" },
    { id: "a2",   label: "AUDIO 2", type: "audio" },
    { id: "txt1", label: "TEXT",    type: "text" },
    { id: "fx1",  label: "EFFECTS", type: "effect" },
  ]);
  const [clips, setClips] = useState([]);

  const TLW = 172, TH = 52;

  const selClip     = useMemo(() => clips.find(c => c.id === selectedClip), [clips, selectedClip]);
  const effectClips = useMemo(() => clips.filter(c => c.type === "effect"), [clips]);

  // ── Derived duration ────────────────────────────────────────────────────────
  const duration = useMemo(() => {
    if (clips.length === 0) return manualDuration;
    const maxEnd = Math.max(...clips.map(c => c.start + c.duration));
    return Math.max(maxEnd, 1);
  }, [clips, manualDuration]);

  const totalW = Math.max(duration * zoom + 300, 900);

  // ── Sync label scroll with track body scroll (Y only) ──────────────────────
  const onTrackBodyScroll = useCallback(() => {
    if (labelScrollRef.current && tlYScrollRef.current) {
      labelScrollRef.current.scrollTop = tlYScrollRef.current.scrollTop;
    }
  }, []);

  // ── Playback ────────────────────────────────────────────────────────────────
  const playingRef    = useRef(false);
  const startTimeRef  = useRef(0);
  const startCtRef    = useRef(0);
  playingRef.current  = playing;

  useEffect(() => {
    const tick = (now) => {
      if (playingRef.current) {
        const elapsed = (now - startTimeRef.current) / 1000;
        const t = Math.min(startCtRef.current + elapsed, duration);
        setCt(t);
        Object.entries(videoRefsMap.current).forEach(([clipId, el]) => {
          const clip = clips.find(c => c.id === clipId);
          if (!clip || !el) return;
          if (t >= clip.start && t < clip.start + clip.duration) {
            const target = t - clip.start;
            if (el.paused) el.play().catch(() => {});
            if (Math.abs(el.currentTime - target) > 0.3) el.currentTime = target;
          } else { if (!el.paused) el.pause(); }
        });
        if (t >= duration) { setPlaying(false); setCt(duration); return; }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [clips, duration]);

  const togglePlay = useCallback(() => {
    setPlaying(p => {
      if (!p) { startTimeRef.current = performance.now(); startCtRef.current = currentTime; }
      else { Object.values(videoRefsMap.current).forEach(el => { try { el.pause(); } catch (_) {} }); }
      return !p;
    });
  }, [currentTime]);

  useEffect(() => {
    const h = e => { if (e.code === "Space" && e.target.tagName !== "INPUT") { e.preventDefault(); togglePlay(); } };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [togglePlay]);

  // ── File Import ─────────────────────────────────────────────────────────────
  const importFile = useCallback(async (file) => {
    const url = URL.createObjectURL(file);
    if (file.type.startsWith("video/")) {
      const v = document.createElement("video"); v.src = url; v.preload = "metadata";
      v.onloadedmetadata = () => {
        const dur = v.duration || 10;
        setManualDuration(d => Math.max(d, Math.ceil(dur) + 2));
        const newClip = { id: uid(), name: file.name, type: "video", trackId: "v1", start: 0, duration: dur, url, opacity: 1, scale: 1, volume: 1, effects: [] };
        setClips(prev => {
          const vTracks = tracks.filter(t => t.type === "video");
          for (const tr of vTracks) {
            if (prev.filter(c => c.trackId === tr.id).length === 0) return [...prev, { ...newClip, trackId: tr.id }];
          }
          return [...prev, newClip];
        });
      };
    } else if (file.type.startsWith("audio/")) {
      if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
      try {
        const ab = await file.arrayBuffer();
        const buf = await acRef.current.decodeAudioData(ab);
        setManualDuration(d => Math.max(d, Math.ceil(buf.duration) + 2));
        setClips(prev => [...prev, { id: uid(), name: file.name, type: "audio", trackId: "a1", start: 0, duration: buf.duration, url, audioBuffer: buf, volume: 1, fadeIn: 0, fadeOut: 0, effects: [] }]);
      } catch (e) { console.error("Audio decode error:", e); }
    }
  }, [tracks]);

  const onFileInput = useCallback(e => { Array.from(e.target.files).forEach(importFile); e.target.value = ""; }, [importFile]);
  const onDrop = useCallback(e => { e.preventDefault(); Array.from(e.dataTransfer.files).forEach(importFile); }, [importFile]);

  // ── Clip Operations ─────────────────────────────────────────────────────────
  const moveClip   = useCallback((id, ns, nt) => setClips(p => p.map(c => c.id === id ? { ...c, start: Math.max(0, ns), trackId: nt || c.trackId } : c)), []);
  const resizeClip = useCallback((id, nd) => setClips(p => p.map(c => c.id === id ? { ...c, duration: Math.max(0.1, nd) } : c)), []);
  const updateProp = useCallback((id, k, v) => setClips(p => p.map(c => c.id === id ? { ...c, [k]: v } : c)), []);
  const delClip    = useCallback(id => { setClips(p => p.filter(c => c.id !== id)); if (selectedClip === id) setSelectedClip(null); }, [selectedClip]);

  const splitClipAtPlayhead = useCallback((clipId) => {
    const clip = clips.find(c => c.id === clipId); if (!clip) return;
    const sp = currentTime;
    if (sp <= clip.start || sp >= clip.start + clip.duration) return;
    const left  = { ...clip, id: uid(), duration: sp - clip.start };
    const right = { ...clip, id: uid(), start: sp, duration: clip.duration - (sp - clip.start) };
    setClips(p => p.filter(c => c.id !== clipId).concat([left, right]));
    setSelectedClip(null);
  }, [clips, currentTime]);

  const addTextClip = useCallback(() => {
    if (!textInput.trim()) return;
    setClips(p => [...p, { id: uid(), name: textInput, type: "text", trackId: "txt1", start: currentTime, duration: 5, text: textInput, fontSize: 32, color: "#ffffff", posX: 50, posY: 88, effects: [] }]);
    setTextInput("");
  }, [textInput, currentTime]);

  const addEffectClip = useCallback((fxId = "brightness", targetTrackId = "v1") => {
    const cat = FX_CATALOG.find(c => c.id === fxId);
    const params = {}; cat.params.forEach(p => { params[p.key] = p.def; });
    setClips(p => [...p, { id: uid(), name: `FX: ${cat.label}`, type: "effect", trackId: "fx1", fxId, fxName: cat.label, targetTrackId, params, start: currentTime, duration: 3, effects: [] }]);
  }, [currentTime]);

  // ── Scrub ───────────────────────────────────────────────────────────────────
  const scrub = useCallback(e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (tlScrollRef.current?.scrollLeft || 0);
    const t = Math.max(0, Math.min(duration, x / zoom));
    setCt(t); startCtRef.current = t; startTimeRef.current = performance.now();
    Object.entries(videoRefsMap.current).forEach(([clipId, el]) => {
      const clip = clips.find(c => c.id === clipId);
      if (!clip || !el) return; el.currentTime = Math.max(0, t - clip.start);
    });
  }, [duration, zoom, clips]);

  const onTLMove = useCallback(e => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (tlScrollRef.current?.scrollLeft || 0);
    setGhostT(Math.max(0, Math.min(duration, x / zoom)));
  }, [duration, zoom]);

  // ── Splitter drag ───────────────────────────────────────────────────────────
  const onSplitter = useCallback(e => {
    e.preventDefault();
    const onM = me => { const r = rootRef.current?.getBoundingClientRect(); if (r) setTimelineH(Math.max(120, Math.min(r.height - 220, r.bottom - me.clientY))); };
    const onU = () => { document.removeEventListener("mousemove", onM); document.removeEventListener("mouseup", onU); };
    document.addEventListener("mousemove", onM); document.addEventListener("mouseup", onU);
  }, []);

  // ── Export ──────────────────────────────────────────────────────────────────
  const handleExportConfirm = async (filename) => {
    setShowExportDialog(false);
    setExp({ active: true, progress: 0, msg: "Starting…", error: "" });
    const exportClips = clips.filter(c => !trackVis[c.trackId]);
    await exportVideo({ clips: exportClips, tracks, duration, filename, effectClips,
      onProgress: (p, msg) => setExp(s => ({ ...s, progress: p, msg })),
      onDone: () => setTimeout(() => setExp(s => ({ ...s, active: false })), 3000),
      onError: err => setExp({ active: false, progress: 0, msg: "", error: err }),
    });
  };

  // ── Active clips for preview ────────────────────────────────────────────────
  const activeTexts = useMemo(() => clips.filter(c =>
    c.type === "text" && currentTime >= c.start && currentTime < c.start + c.duration && !trackVis[c.trackId]
  ), [clips, currentTime, trackVis]);

  const activeEffectsNow = useMemo(() => effectClips.filter(ec =>
    currentTime >= ec.start && currentTime < ec.start + ec.duration && !trackVis[ec.trackId]
  ), [effectClips, currentTime, trackVis]);

  // Compute preview canvas effect overlays for the preview (SVG-based, no canvas needed here)
  const getVideoStyle = (c) => {
    const fxForThis = activeEffectsNow.filter(ec => ec.targetTrackId === c.trackId);
    const allFx = [...(c.effects || []), ...fxForThis.map(ec => ({ id: ec.fxId, params: ec.params }))];
    const filterStr = buildFilter(allFx);
    const flipH = allFx.some(ef => ef.id === "flipH");
    const flipV = allFx.some(ef => ef.id === "flipV");
    const rotEf = allFx.find(ef => ef.id === "rotate");
    const transforms = [];
    if (flipH) transforms.push("scaleX(-1)");
    if (flipV) transforms.push("scaleY(-1)");
    if (rotEf) transforms.push(`rotate(${rotEf.params.degrees || 0}deg)`);
    const scale = c.scale ?? 1;
    if (scale !== 1) transforms.push(`scale(${scale})`);
    return { filter: filterStr, transform: transforms.join(" ") || undefined, opacity: c.opacity ?? 1 };
  };

  // Vignette overlay for preview
  const getVignetteStyle = (c) => {
    const fxForThis = activeEffectsNow.filter(ec => ec.targetTrackId === c.trackId);
    const allFx = [...(c.effects || []), ...fxForThis.map(ec => ({ id: ec.fxId, params: ec.params }))];
    const vg = allFx.find(ef => ef.id === "vignette");
    if (!vg) return null;
    const size = (vg.params.size ?? 50) / 100;
    const opacity = (vg.params.opacity ?? 80) / 100;
    return `radial-gradient(ellipse ${size * 100}% ${size * 100}% at center, transparent 30%, rgba(0,0,0,${opacity}) 100%)`;
  };

  const getScanlineStyle = (c) => {
    const fxForThis = activeEffectsNow.filter(ec => ec.targetTrackId === c.trackId);
    const allFx = [...(c.effects || []), ...fxForThis.map(ec => ({ id: ec.fxId, params: ec.params }))];
    const sl = allFx.find(ef => ef.id === "scanlines");
    if (!sl) return null;
    const op = (sl.params.opacity ?? 40) / 100;
    return `repeating-linear-gradient(0deg, rgba(0,0,0,${op}) 0px, rgba(0,0,0,${op}) 2px, transparent 2px, transparent 4px)`;
  };

  // Mask clip paths for preview
  const getMaskStyle = (c) => {
    const fxForThis = activeEffectsNow.filter(ec => ec.targetTrackId === c.trackId);
    const allFx = [...(c.effects || []), ...fxForThis.map(ec => ({ id: ec.fxId, params: ec.params }))];
    const circle = allFx.find(ef => ef.id === "maskCircle");
    const rect = allFx.find(ef => ef.id === "maskRect");
    const gradH = allFx.find(ef => ef.id === "maskGradH");
    const gradV = allFx.find(ef => ef.id === "maskGradV");
    if (circle) {
      const s = (circle.params.size ?? 80) / 2;
      return `circle(${s}% at center)`;
    }
    if (rect) {
      const x1 = rect.params.x ?? 10, y1 = rect.params.y ?? 10;
      const x2 = x1 + (rect.params.w ?? 80), y2 = y1 + (rect.params.h ?? 80);
      return `inset(${y1}% ${100-x2}% ${100-y2}% ${x1}%)`;
    }
    if (gradH) {
      return null; // handled via gradient overlay
    }
    if (gradV) {
      return null;
    }
    return null;
  };

  return (
    <div ref={rootRef} style={S.root}>
      {showExportDialog && <ExportDialog onConfirm={handleExportConfirm} onCancel={() => setShowExportDialog(false)} />}

      {/* TOPBAR */}
      <div style={S.topbar}>

        <label style={S.tbBtn}>
          <Icons.Upload /><span>Import</span>
          <input type="file" multiple accept="video/*,audio/*" style={{ display: "none" }} onChange={onFileInput} />
        </label>
        <button style={{ ...S.tbBtn, ...(splitMode ? { color: "#f97316", borderColor: "#7c3a1a" } : {}) }} onClick={() => setSplitMode(s => !s)}>
          <Icons.Split /><span>{splitMode ? "Splitting" : "Split"}</span>
        </button>
        <button style={{ ...S.tbBtn, ...(exp.active ? { color: "#5b9ef7", borderColor: "#1d3a5f" } : {}) }} onClick={() => { if (!exp.active) setShowExportDialog(true); }} disabled={exp.active}>
          <Icons.Export /><span>{exp.active ? `${exp.progress}%` : "Export .mp4"}</span>
        </button>
        {exp.error && <span style={{ fontSize: 10, color: "#ef4444", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>⚠ {exp.error}</span>}
        {!exp.active && exp.progress === 100 && <span style={{ fontSize: 10, color: "#22c55e", fontFamily: "monospace" }}>{exp.msg}</span>}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#3a3a50", fontFamily: "monospace" }}>{formatTC(currentTime)} / {formatTC(duration)}</span>
      </div>

      {/* EXPORT PROGRESS */}
      {exp.active && (
        <div style={{ height: 34, background: "#0b0b10", borderBottom: "1px solid #1e1e28", display: "flex", alignItems: "center", gap: 12, padding: "0 16px", flexShrink: 0 }}>
          <div style={{ flex: 1, height: 3, background: "#1a1a22", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${exp.progress}%`, background: "linear-gradient(90deg,#3879d9,#5b9ef7)", transition: "width 0.3s ease", borderRadius: 2 }} />
          </div>
          <span style={{ fontSize: 10, color: "#5b9ef7", fontFamily: "monospace", whiteSpace: "nowrap" }}>{exp.msg}</span>
          <span style={{ fontSize: 10, color: "#3a3a50", fontFamily: "monospace" }}>{exp.progress}%</span>
        </div>
      )}

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div style={S.left}>
          <div style={{ display: "flex", borderBottom: "1px solid #1a1a22" }}>
            {[["media","MEDIA"],["text","TEXT"],["fx","FX"],["tracks","TRACKS"]].map(([id, lbl]) => (
              <button key={id} onClick={() => setSideTab(id)} style={{ flex: 1, padding: "7px 0", fontSize: 8, fontFamily: "monospace", letterSpacing: "0.06em", background: "transparent", border: "none", cursor: "pointer", color: sideTab === id ? "#e2e8f0" : "#333342", borderBottom: sideTab === id ? "2px solid #3879d9" : "2px solid transparent" }}>{lbl}</button>
            ))}
          </div>

          {sideTab === "media" && <>
            <div style={S.dropzone} onDragOver={e => e.preventDefault()} onDrop={onDrop} onClick={() => document.getElementById("fi2").click()}>
              <input id="fi2" type="file" multiple accept="video/*,audio/*" style={{ display: "none" }} onChange={onFileInput} />
              <div style={{ opacity: 0.2, marginBottom: 6, transform: "scale(1.3)" }}><Icons.Upload /></div>
              <span style={{ fontSize: 10, color: "#3a3a50", textAlign: "center", lineHeight: 1.7 }}>Drop video / audio<br />or click to browse</span>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {clips.length === 0 && <div style={{ padding: 16, fontSize: 10, color: "#1e1e28", textAlign: "center" }}>No clips yet</div>}
              {clips.map(c => (
                <div key={c.id} onClick={() => setSelectedClip(c.id)} style={{ padding: "7px 10px", display: "flex", alignItems: "center", gap: 6, cursor: "pointer", background: selectedClip === c.id ? "#111820" : "transparent", borderLeft: selectedClip === c.id ? "2px solid #3879d9" : "2px solid transparent", borderBottom: "1px solid #111118" }}>
                  <span style={{ color: TC[c.type]?.accent || "#fff", flexShrink: 0 }}>{c.type === "video" ? <Icons.Film /> : c.type === "audio" ? <Icons.Music /> : c.type === "effect" ? <Icons.Fx /> : <Icons.Text />}</span>
                  <span style={{ fontSize: 10, color: "#7a7a8a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>{c.name}</span>
                  <span style={{ fontSize: 8, color: "#3a3a50", fontFamily: "monospace", flexShrink: 0 }}>{formatShort(c.duration)}</span>
                </div>
              ))}
            </div>
          </>}

          {sideTab === "text" && (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
              <span style={SS.lbl}>TEXT CONTENT</span>
              <input style={{ ...SS.inp, padding: "7px 9px", fontSize: 11 }} placeholder="Enter overlay text…" value={textInput} onChange={e => setTextInput(e.target.value)} onKeyDown={e => e.key === "Enter" && addTextClip()} />
              <button style={SS.addBtn} onClick={addTextClip}><Icons.Plus /> Add to Timeline</button>
              <div style={{ borderTop: "1px solid #1a1a22", paddingTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
                <span style={SS.lbl}>QUICK INSERT</span>
                {["Lower Third","Title Card","End Credits","Caption","Subtitle"].map(p => (
                  <button key={p} onClick={() => setTextInput(p)} style={{ padding: "6px 10px", background: "#131318", border: "1px solid #1e1e28", borderRadius: 4, color: "#6a6a7a", fontSize: 10, cursor: "pointer", textAlign: "left" }}>{p}</button>
                ))}
              </div>
            </div>
          )}

          {sideTab === "fx" && (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              <span style={SS.lbl}>EFFECT GROUPS</span>
              {FX_GROUPS.map(group => (
                <div key={group}>
                  <div style={{ fontSize: 9, color: "#fb923c", fontFamily: "monospace", letterSpacing: "0.08em", marginBottom: 4, marginTop: 6 }}>{group.toUpperCase()}</div>
                  {FX_CATALOG.filter(fx => fx.group === group).map(fx => (
                    <button key={fx.id} onClick={() => addEffectClip(fx.id, "v1")} style={{ width: "100%", marginBottom: 3, padding: "6px 10px", background: "rgba(251,146,60,0.06)", border: "1px solid #f9731618", borderRadius: 4, color: "#fb923c", fontSize: 9, cursor: "pointer", textAlign: "left", fontFamily: "monospace" }}>
                      {fx.label}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}

          {sideTab === "tracks" && (
            <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
              <span style={SS.lbl}>TRACK LIST</span>
              {tracks.map(tr => (
                <div key={tr.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "#131318", borderRadius: 4, border: "1px solid #1e1e26" }}>
                  <span style={{ color: TC[tr.type]?.accent, flexShrink: 0 }}>{tr.type === "video" ? <Icons.Film /> : tr.type === "audio" ? <Icons.Music /> : tr.type === "effect" ? <Icons.Fx /> : <Icons.Text />}</span>
                  <span style={{ flex: 1, fontSize: 9, color: "#6a6a7a", fontFamily: "monospace" }}>{tr.label}</span>
                  <button onClick={() => setTrackVis(p => ({ ...p, [tr.id]: !p[tr.id] }))} style={{ background: "transparent", border: "none", cursor: "pointer", color: trackVis[tr.id] ? "#ef4444" : "#3a3a4a", padding: 2 }}>{trackVis[tr.id] ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                  <button onClick={() => setTrackLock(p => ({ ...p, [tr.id]: !p[tr.id] }))} style={{ background: "transparent", border: "none", cursor: "pointer", color: trackLock[tr.id] ? "#f59e0b" : "#3a3a4a", padding: 2 }}><Icons.Lock /></button>
                </div>
              ))}
              <div style={{ borderTop: "1px solid #1a1a22", paddingTop: 10 }}>
                <span style={SS.lbl}>ADD TRACK</span>
                <div style={{ display: "flex", gap: 5, marginTop: 8, flexWrap: "wrap" }}>
                  {["video","audio","text","effect"].map(t => (
                    <button key={t} onClick={() => {
                      const n = tracks.filter(tr => tr.type === t).length + 1;
                      setTracks(p => [...p, { id: uid(), label: `${t.toUpperCase()} ${n}`, type: t }]);
                    }} style={{ padding: "5px 8px", background: "#131318", border: `1px solid ${TC[t]?.border}33`, borderRadius: 4, color: TC[t]?.accent, fontSize: 9, fontFamily: "monospace", cursor: "pointer" }}>+ {t.slice(0,3).toUpperCase()}</button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── CENTER ─────────────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* ── PREVIEW ── fixed 16:9, never distorted, letterboxed ──────── */}
          <div style={S.previewOuter}>
            {/* This wrapper fills available space and centers the 16:9 box */}
            <div style={S.previewFill}>
              {/* Letterbox container: always 16:9 via aspect-ratio + max constraints */}
              <div style={S.prevBox}>
                {/* Checkerboard bg */}
                <div style={S.checker} />

                {/* Video layers */}
                {clips.filter(c => c.type === "video" && c.url && !trackVis[c.trackId]).map((c, i) => {
                  const isActive = currentTime >= c.start && currentTime < c.start + c.duration;
                  const vstyle = getVideoStyle(c);
                  const vigGrad = getVignetteStyle(c);
                  const scanGrad = getScanlineStyle(c);
                  const maskClip = getMaskStyle(c);
                  return (
                    <React.Fragment key={c.id}>
                      <video
                        ref={el => { if (el) videoRefsMap.current[c.id] = el; else delete videoRefsMap.current[c.id]; }}
                        src={c.url} muted playsInline
                        style={{
                          position: "absolute", inset: 0, width: "100%", height: "100%",
                          objectFit: "contain",   // ← key: never stretch
                          opacity: isActive ? vstyle.opacity : 0,
                          transform: vstyle.transform,
                          filter: vstyle.filter,
                          clipPath: maskClip || undefined,
                          zIndex: i + 1,
                          pointerEvents: "none",
                          transition: "opacity 0.05s",
                        }}
                      />
                      {/* Vignette overlay */}
                      {isActive && vigGrad && (
                        <div style={{ position: "absolute", inset: 0, background: vigGrad, zIndex: i + 2, pointerEvents: "none" }} />
                      )}
                      {/* Scanlines overlay */}
                      {isActive && scanGrad && (
                        <div style={{ position: "absolute", inset: 0, background: scanGrad, zIndex: i + 2, pointerEvents: "none" }} />
                      )}
                    </React.Fragment>
                  );
                })}

                {/* Text overlays */}
                {activeTexts.map(t => (
                  <div key={t.id} style={{ position: "absolute", left: `${t.posX ?? 50}%`, top: `${t.posY ?? 88}%`, transform: "translate(-50%,-50%)", color: t.color || "#fff", fontSize: (t.fontSize || 32) + "px", fontWeight: 700, textShadow: "0 2px 12px rgba(0,0,0,0.95)", whiteSpace: "nowrap", pointerEvents: "none", zIndex: 50 }}>{t.text}</div>
                ))}

                {/* Timecode */}
                <div style={S.timecode}>{formatTC(currentTime)}</div>
                {/* Safe area guide */}
                <div style={{ position: "absolute", inset: "5%", border: "1px solid rgba(255,255,255,0.03)", pointerEvents: "none", zIndex: 60 }} />
                {/* Split mode badge */}
                {splitMode && (
                  <div style={{ position: "absolute", top: 8, right: 8, background: "rgba(249,115,22,0.9)", padding: "3px 8px", borderRadius: 4, fontSize: 9, color: "#fff", fontFamily: "monospace", fontWeight: 700, zIndex: 70 }}>✂ SPLIT MODE</div>
                )}
              </div>
            </div>

            {/* Feature strip */}
            <div style={{ padding: "3px 14px", background: "#0a0a0d", borderTop: "1px solid #131318", display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
              {[["✓ H.264 export","#5b9ef7"],["✓ Masks","#c084fc"],["✓ Noise/Grain","#34d399"],["✓ Vignette","#fb923c"],["✓ Chromatic Ab.","#f43f5e"]].map(([l, c]) => (
                <span key={l} style={{ fontSize: 8, color: c, fontFamily: "monospace", opacity: 0.7 }}>{l}</span>
              ))}
            </div>

            {/* Transport */}
            <div style={S.transport}>
              <button style={S.tBtn} onClick={() => { setCt(0); startCtRef.current = 0; startTimeRef.current = performance.now(); Object.values(videoRefsMap.current).forEach(el => { el.pause(); el.currentTime = 0; }); }}><Icons.SkipBack /></button>
              <button style={S.playBtn} onClick={togglePlay}>{playing ? <Icons.Pause /> : <Icons.Play />}</button>
              <button style={S.tBtn}><Icons.SkipFwd /></button>
              <div style={S.div} />
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 4 }}>
                <Icons.ZoomOut />
                <input type="range" min={4} max={150} value={zoom} step={1} onChange={e => setZoom(Number(e.target.value))} style={{ width: 88, accentColor: "#3879d9" }} />
                <Icons.ZoomIn />
                <span style={{ fontSize: 9, color: "#3a3a50", fontFamily: "monospace", minWidth: 44 }}>{zoom}px/s</span>
              </div>
            </div>
          </div>

          {/* SPLITTER */}
          <div style={S.splitter} onMouseDown={onSplitter}>
            {[0,1,2].map(i => <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#252530" }} />)}
          </div>

          {/* ── TIMELINE ── Y-scrollable tracks ─────────────────────────── */}
          <div style={{ height: timelineH, display: "flex", flexDirection: "column", background: "#0c0c0f", borderTop: "1px solid #1a1a22", flexShrink: 0 }}>
            {/* Toolbar */}
            <div style={S.tlBar}>
              <button style={{ ...S.tlBtn, ...(splitMode ? { color: "#f97316" } : {}) }} onClick={() => setSplitMode(s => !s)}><Icons.Scissors /></button>
              <button style={S.tlBtn} onClick={() => addEffectClip()}><Icons.Fx /></button>
              <div style={S.div} />
              {selectedClip && <>
                <button style={{ ...S.tlBtn, color: "#f97316" }} onClick={() => splitClipAtPlayhead(selectedClip)}><Icons.Split /></button>
                <button style={{ ...S.tlBtn, color: "#ef4444" }} onClick={() => delClip(selectedClip)}><Icons.Trash /></button>
              </>}
              <div style={{ flex: 1 }} />
              <span style={{ fontSize: 9, color: "#2a2a38", fontFamily: "monospace" }}>SNAP · {clips.length} clips · {tracks.length} tracks · {formatTC(currentTime)}</span>
            </div>

            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

              {/* Track labels — scrolls Y in sync, no X scroll */}
              <div
                ref={labelScrollRef}
                style={{ width: TLW, flexShrink: 0, background: "#0e0e12", borderRight: "1px solid #1a1a22", overflowY: "hidden", overflowX: "hidden" }}
              >
                {/* Ruler spacer */}
                <div style={{ height: 28, background: "#0c0c0f", borderBottom: "1px solid #1a1a22", flexShrink: 0 }} />
                {/* Track label rows */}
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {tracks.map(tr => (
                    <div key={tr.id} style={{ height: TH, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", borderBottom: "1px solid #141418", opacity: trackVis[tr.id] ? 0.3 : 1, flexShrink: 0 }}>
                      <span style={{ color: TC[tr.type]?.accent, flexShrink: 0 }}>{tr.type === "video" ? <Icons.Film /> : tr.type === "audio" ? <Icons.Music /> : tr.type === "effect" ? <Icons.Fx /> : <Icons.Text />}</span>
                      <span style={{ fontSize: 9, color: trackLock[tr.id] ? "#f59e0b" : "#5a5a6a", fontFamily: "monospace", flex: 1, letterSpacing: "0.03em", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tr.label}</span>
                      <button onClick={() => setTrackVis(p => ({ ...p, [tr.id]: !p[tr.id] }))} style={{ background: "transparent", border: "none", cursor: "pointer", color: trackVis[tr.id] ? "#ef4444" : "#2a2a38", padding: 2 }}>{trackVis[tr.id] ? <Icons.EyeOff /> : <Icons.Eye />}</button>
                      <button onClick={() => setTrackLock(p => ({ ...p, [tr.id]: !p[tr.id] }))} style={{ background: "transparent", border: "none", cursor: "pointer", color: trackLock[tr.id] ? "#f59e0b" : "#2a2a38", padding: 2 }}><Icons.Lock /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable track area — BOTH X and Y */}
              <div
                ref={node => {
                  tlScrollRef.current = node;
                  tlYScrollRef.current = node;
                }}
                onScroll={onTrackBodyScroll}
                style={{ flex: 1, overflowX: "auto", overflowY: "auto", position: "relative" }}
              >
                <div style={{ width: totalW, position: "relative", cursor: splitMode ? "crosshair" : "default" }} onClick={scrub} onMouseMove={onTLMove} onMouseLeave={() => setGhostT(null)}>
                  {/* Sticky ruler */}
                  <div style={{ position: "sticky", top: 0, zIndex: 30, background: "#0c0c0f" }}>
                    <TimelineRuler duration={duration} zoom={zoom} />
                  </div>

                  {/* Ghost playhead */}
                  {ghostT !== null && (
                    <div style={{ position: "absolute", top: 0, left: ghostT * zoom, width: 1, bottom: 0, background: "rgba(255,255,255,0.1)", zIndex: 19, pointerEvents: "none" }}>
                      <div style={{ position: "absolute", top: 30, left: 4, background: "rgba(10,10,16,0.92)", border: "1px solid #2a2a3a", borderRadius: 3, padding: "2px 6px", fontSize: 9, color: "#6a6a82", fontFamily: "monospace", whiteSpace: "nowrap" }}>{formatTC(ghostT)}</div>
                    </div>
                  )}

                  {/* Playhead */}
                  <div style={{ position: "absolute", top: 0, left: currentTime * zoom, width: 2, bottom: 0, background: "#ef4444", zIndex: 22, pointerEvents: "none", boxShadow: "0 0 8px rgba(239,68,68,0.5)" }}>
                    <div style={{ position: "absolute", top: 0, left: -5, borderLeft: "5px solid transparent", borderRight: "5px solid transparent", borderTop: "8px solid #ef4444" }} />
                    <div style={{ position: "absolute", top: 10, left: -24, background: "rgba(239,68,68,0.95)", borderRadius: 3, padding: "1px 6px", fontSize: 9, color: "#fff", fontFamily: "monospace", whiteSpace: "nowrap", fontWeight: 600 }}>{formatTC(currentTime)}</div>
                  </div>

                  {/* Track rows */}
                  {tracks.map(tr => (
                    <div
                      key={tr.id}
                      data-track-id={tr.id}
                      style={{ height: TH, borderBottom: "1px solid #141418", position: "relative", background: trackLock[tr.id] ? "rgba(245,158,11,0.02)" : tr.type === "effect" ? "rgba(251,146,60,0.03)" : "transparent", opacity: trackVis[tr.id] ? 0.25 : 1 }}
                    >
                      <div style={{ position: "absolute", left: 0, right: 0, top: "50%", height: 1, background: "rgba(255,255,255,0.02)", pointerEvents: "none" }} />
                      {clips.filter(c => c.trackId === tr.id).map(clip => (
                        <ClipBlock
                          key={clip.id}
                          clip={clip} zoom={zoom} trackH={TH} tracks={tracks}
                          selected={selectedClip === clip.id}
                          onSelect={id => {
                            if (splitMode) { splitClipAtPlayhead(id); setSplitMode(false); return; }
                            if (!trackLock[tr.id]) setSelectedClip(id);
                          }}
                          onMove={(id, ns, nt) => { if (!trackLock[tr.id]) moveClip(id, ns, nt); }}
                          onResize={(id, nd) => { if (!trackLock[tr.id]) resizeClip(id, nd); }}
                          allClips={clips}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Inspector ──────────────────────────────────────────── */}
        <div style={S.right}>
          <div style={{ padding: "9px 12px 6px", borderBottom: "1px solid #1a1a22", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "#2d2d3a", fontFamily: "monospace", letterSpacing: "0.12em" }}>INSPECTOR</span>
            {selClip && <span style={{ fontSize: 8, color: TC[selClip.type]?.accent, fontFamily: "monospace", letterSpacing: "0.06em" }}>{selClip.type.toUpperCase()}</span>}
          </div>
          <Inspector clip={selClip} allClips={clips} tracks={tracks} update={updateProp} del={delClip} tab={iTab} setTab={setITab} />
        </div>
      </div>

      {/* STATUS BAR */}
      <div style={S.status}>
        <div style={{ width: 5, height: 5, borderRadius: "50%", background: playing ? "#10b981" : exp.active ? "#f59e0b" : "#3879d9", flexShrink: 0 }} />
        <span>{playing ? "PLAYING" : exp.active ? "EXPORTING" : "READY"}</span>
        <div style={S.div} />
        <span>{clips.length} clips · {tracks.length} tracks · {formatShort(duration)} total</span>
        <div style={{ flex: 1 }} />
        <span style={{ color: "#1a1a28" }}>FLUX EDIT 2.2</span>
      </div>
    </div>
  );
}

// ─── Shared Styles ────────────────────────────────────────────────────────────
const SS = {
  lbl: { fontSize: 9, color: "#3a3a52", letterSpacing: "0.07em", fontFamily: "monospace" },
  inp: { background: "#131318", border: "1px solid #222230", borderRadius: 4, padding: "5px 8px", fontSize: 10, color: "#7ab5f5", fontFamily: "monospace", outline: "none", width: "100%", boxSizing: "border-box" },
  sel: { background: "#131318", border: "1px solid #2a2a35", borderRadius: 4, padding: "5px 8px", fontSize: 11, color: "#c4c4d0", fontFamily: "inherit", outline: "none", cursor: "pointer", width: "100%" },
  addBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 12px", background: "#0e2040", border: "1px solid #1d3a5f", borderRadius: 4, color: "#5b9ef7", fontSize: 10, cursor: "pointer", fontFamily: "inherit" },
  dangerBtn: { display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px 12px", background: "#1a0808", border: "1px solid #3a1515", borderRadius: 4, color: "#ef4444", fontSize: 10, cursor: "pointer", fontFamily: "inherit" },
};

const S = {
  root:        { display: "flex", flexDirection: "column", height: "100vh", width: "100%", background: "#0a0a0d", color: "#d1d5db", fontFamily: "'Inter','Helvetica Neue',system-ui,sans-serif", overflow: "hidden", userSelect: "none" },
  topbar:      { height: 42, display: "flex", alignItems: "center", gap: 8, padding: "0 14px", background: "#0f0f13", borderBottom: "1px solid #1a1a22", flexShrink: 0 },
  logo:        { fontFamily: "monospace", fontWeight: 700, fontSize: 14, color: "#e5e7eb", letterSpacing: "0.12em", marginRight: 4 },
  tbBtn:       { display: "flex", alignItems: "center", gap: 5, padding: "4px 11px", background: "#161620", border: "1px solid #252530", borderRadius: 4, color: "#7a7a8a", fontSize: 11, cursor: "pointer", fontFamily: "inherit", flexShrink: 0 },
  div:         { width: 1, height: 16, background: "#1f1f28", margin: "0 2px", flexShrink: 0 },
  left:        { width: 192, background: "#0c0c10", borderRight: "1px solid #1a1a22", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" },
  right:       { width: 242, background: "#0c0c10", borderLeft: "1px solid #1a1a22", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" },
  dropzone:    { margin: "10px 10px 6px", padding: "16px 8px", border: "1px dashed #252530", borderRadius: 6, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", minHeight: 72 },

  // ── Preview: outer fills flex space, inner centers a 16:9 box ──────────────
  previewOuter: { flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0, background: "#08080b" },
  previewFill:  {
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: 10,
    backgroundImage: "linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)",
    backgroundSize: "28px 28px",
  },
  prevBox: {
    // Always 16:9, letterboxed inside available space
    aspectRatio: "16 / 9",
    width: "100%",
    maxWidth: "100%",
    maxHeight: "100%",
    // Trick: use width:100% + maxHeight to letterbox correctly
    // The box will shrink to fit the height when the container is short
    background: "#000",
    border: "1px solid #1e1e26",
    borderRadius: 6,
    position: "relative",
    overflow: "hidden",
    boxShadow: "0 8px 40px rgba(0,0,0,0.7)",
    // Letterbox by constraining to whichever dimension is tighter
    alignSelf: "center",
    flexShrink: 1,
    objectFit: "contain",
  },

  checker:     { position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-conic-gradient(#bbb 0% 25%,transparent 0% 50%)", backgroundSize: "18px 18px" },
  timecode:    { position: "absolute", top: 8, left: 8, background: "rgba(0,0,0,0.75)", padding: "2px 8px", borderRadius: 3, fontSize: 10, fontFamily: "monospace", color: "#5b9ef7", pointerEvents: "none", zIndex: 60, letterSpacing: "0.04em" },
  transport:   { height: 44, display: "flex", alignItems: "center", padding: "0 12px", gap: 6, background: "#0f0f13", borderTop: "1px solid #1a1a22", flexShrink: 0 },
  tBtn:        { padding: "5px 7px", background: "transparent", border: "none", color: "#4a4a5a", cursor: "pointer", display: "flex", alignItems: "center", borderRadius: 4 },
  playBtn:     { width: 34, height: 34, borderRadius: "50%", background: "#fff", border: "none", color: "#111", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  splitter:    { height: 7, cursor: "ns-resize", background: "#0d0d10", display: "flex", alignItems: "center", justifyContent: "center", gap: 3, borderTop: "1px solid #1a1a22", flexShrink: 0 },
  tlBar:       { height: 34, display: "flex", alignItems: "center", padding: "0 6px", gap: 2, background: "#0f0f13", borderBottom: "1px solid #1a1a22", flexShrink: 0 },
  tlBtn:       { padding: "5px 6px", background: "transparent", border: "none", color: "#3a3a4a", cursor: "pointer", borderRadius: 4, display: "flex", alignItems: "center" },
  status:      { height: 22, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", background: "#09090c", borderTop: "1px solid #131318", fontSize: 9, color: "#2d2d3a", fontFamily: "monospace", letterSpacing: "0.06em", flexShrink: 0 },
};
