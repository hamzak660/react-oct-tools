import { useEffect, useRef, useState, useCallback } from "react";

/* ─────────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────────── */
const PALETTE = [
  "#ffffff","#f5f0e8","#ff6b6b","#ffd93d",
  "#6bcb77","#4d96ff","#d4a5ff","#ff9f1c",
  "#2ec4b6","#e71d36","#1a1a2e","#000000",
];

const FONT_OPTIONS = [
  { label: "DM Sans",     value: "DM Sans, sans-serif" },
  { label: "Georgia",     value: "Georgia, serif" },
  { label: "Courier",     value: "Courier New, monospace" },
  { label: "Impact",      value: "Impact, sans-serif" },
  { label: "Trebuchet",   value: "Trebuchet MS, sans-serif" },
];

const EFFECT_LIST = [
  { id: "grayscale",  label: "Grayscale",  filter: "grayscale(1)" },
  { id: "sepia",      label: "Sepia",      filter: "sepia(0.9)" },
  { id: "invert",     label: "Invert",     filter: "invert(1)" },
  { id: "blur",       label: "Blur",       filter: "blur(3px)" },
  { id: "brightness", label: "Brighten",   filter: "brightness(1.5)" },
  { id: "contrast",   label: "Contrast",   filter: "contrast(1.6)" },
  { id: "saturate",   label: "Saturate",   filter: "saturate(2)" },
];

/* ─────────────────────────────────────────────
   STYLES
───────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.ge-root {
  --bg0: #080809;
  --bg1: #0f0f12;
  --bg2: #161619;
  --bg3: #1e1e23;
  --bg4: #26262d;
  --bg5: #2e2e37;
  --line: rgba(255,255,255,0.055);
  --line2: rgba(255,255,255,0.10);
  --line3: rgba(255,255,255,0.16);
  --accent: #d4a843;
  --accent-dim: rgba(212,168,67,0.14);
  --accent-glow: 0 0 0 1px rgba(212,168,67,0.35);
  --text0: #ede9e0;
  --text1: #8c8880;
  --text2: #4e4c48;
  --red: #d95f5f;
  --green: #4e9d6f;
  --font: 'DM Sans', sans-serif;
  --mono: 'DM Mono', monospace;
  --r: 5px;
  --r2: 8px;
  font-family: var(--font);
  background: var(--bg0);
  color: var(--text0);
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 640px;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── TOPBAR ── */
.ge-topbar {
  height: 44px;
  background: var(--bg1);
  border-bottom: 1px solid var(--line);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 6px;
  flex-shrink: 0;
  z-index: 10;
}
.ge-logo {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.06em;
  text-transform: uppercase; color: var(--text0); margin-right: 8px;
}
.ge-logo-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--accent); flex-shrink: 0;
  box-shadow: 0 0 8px rgba(212,168,67,0.6);
}
.ge-sep { width: 1px; height: 18px; background: var(--line2); margin: 0 4px; flex-shrink: 0; }
.ge-spacer { flex: 1; }

/* ── TOPBAR BUTTONS ── */
.ge-tbtn {
  height: 28px; padding: 0 10px; border-radius: var(--r);
  border: 1px solid var(--line2); background: transparent;
  color: var(--text1); font-size: 11px; font-family: var(--font);
  cursor: pointer; display: flex; align-items: center; gap: 5px;
  transition: all 0.15s; white-space: nowrap;
}
.ge-tbtn:hover { background: var(--bg3); color: var(--text0); border-color: var(--line3); }
.ge-tbtn.accent {
  background: var(--accent); border-color: var(--accent);
  color: #0a0a0c; font-weight: 600;
}
.ge-tbtn.accent:hover { background: #c49830; border-color: #c49830; }
.ge-tbtn.ghost { border-color: transparent; }
.ge-tbtn.ghost:hover { background: var(--bg3); border-color: var(--line); }
.ge-tbtn svg { flex-shrink: 0; }

/* ── BODY LAYOUT ── */
.ge-body { display: flex; flex: 1; overflow: hidden; }

/* ── LEFT SIDEBAR ── */
.ge-left {
  width: 52px; background: var(--bg1); border-right: 1px solid var(--line);
  display: flex; flex-direction: column; align-items: center;
  padding: 10px 0; gap: 4px; flex-shrink: 0;
}
.ge-sidetool {
  width: 36px; height: 36px; border-radius: var(--r);
  background: transparent; border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: var(--text2); transition: all 0.15s; font-size: 16px;
}
.ge-sidetool:hover { background: var(--bg3); color: var(--text0); }
.ge-sidetool.active { background: var(--accent-dim); color: var(--accent); }

/* ── MAIN AREA ── */
.ge-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }

/* ── PREVIEW AREA ── */
.ge-preview-wrap {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: var(--bg0); position: relative; overflow: hidden; min-height: 0;
}
.ge-checker {
  position: absolute; inset: 0;
  background-image: linear-gradient(45deg, #111 25%, transparent 25%),
    linear-gradient(-45deg, #111 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #111 75%),
    linear-gradient(-45deg, transparent 75%, #111 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  opacity: 0.25;
}
.ge-canvas-container {
  position: relative; display: inline-flex;
  box-shadow: 0 0 0 1px var(--line2), 0 8px 40px rgba(0,0,0,0.6);
  border-radius: 3px; overflow: hidden;
}
.ge-canvas-container canvas { display: block; }

.ge-frame-info {
  position: absolute; top: 8px; left: 8px;
  background: rgba(0,0,0,0.72); color: var(--text0);
  font-size: 10px; font-family: var(--mono); padding: 3px 7px;
  border-radius: 3px; pointer-events: none;
}
.ge-play-badge {
  position: absolute; top: 8px; right: 8px;
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--red); transition: background 0.2s;
}
.ge-play-badge.playing { background: var(--green); animation: pulse 1s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* ── DROP ZONE OVERLAY ── */
.ge-dropzone {
  position: absolute; inset: 0; border: 2px dashed var(--accent);
  border-radius: 4px; background: rgba(212,168,67,0.06);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 10px; z-index: 5; pointer-events: none; opacity: 0; transition: opacity 0.2s;
}
.ge-dropzone.active { opacity: 1; pointer-events: all; }
.ge-dropzone-text { font-size: 14px; font-weight: 500; color: var(--accent); }
.ge-dropzone-sub { font-size: 11px; color: var(--text1); }

/* ── EMPTY STATE ── */
.ge-empty {
  display: flex; flex-direction: column; align-items: center;
  justify-content: center; gap: 14px; padding: 40px;
  text-align: center; pointer-events: none;
}
.ge-empty-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: var(--bg3); display: flex; align-items: center; justify-content: center;
  border: 1px dashed var(--line3);
}
.ge-empty-title { font-size: 14px; font-weight: 500; color: var(--text0); }
.ge-empty-sub { font-size: 12px; color: var(--text1); line-height: 1.6; max-width: 200px; }
.ge-empty-btn {
  pointer-events: all; height: 32px; padding: 0 14px;
  background: var(--accent); border: none; border-radius: var(--r);
  color: #080809; font-size: 12px; font-weight: 600;
  font-family: var(--font); cursor: pointer; transition: background 0.15s;
}
.ge-empty-btn:hover { background: #c49830; }

/* ── TRANSPORT / CONTROLS ── */
.ge-transport {
  height: 54px; background: var(--bg1); border-top: 1px solid var(--line);
  display: flex; align-items: center; padding: 0 16px; gap: 8px; flex-shrink: 0;
}
.ge-xbtn {
  width: 32px; height: 32px; border-radius: var(--r);
  background: transparent; border: 1px solid var(--line2);
  color: var(--text1); cursor: pointer; display: flex; align-items: center;
  justify-content: center; transition: all 0.15s;
}
.ge-xbtn:hover { background: var(--bg3); color: var(--text0); border-color: var(--line3); }
.ge-xbtn.play-btn {
  width: 38px; height: 38px;
  background: var(--accent); border-color: var(--accent); color: #080809;
  border-radius: 50%;
}
.ge-xbtn.play-btn:hover { background: #c49830; }
.ge-fps-group { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.ge-fps-label { font-size: 10px; color: var(--text2); font-family: var(--mono); }
.ge-fps-val { font-size: 11px; font-family: var(--mono); color: var(--accent); min-width: 26px; }
.ge-range {
  -webkit-appearance: none; height: 3px; border-radius: 2px;
  background: var(--bg4); cursor: pointer; outline: none;
}
.ge-range::-webkit-slider-thumb {
  -webkit-appearance: none; width: 13px; height: 13px;
  border-radius: 50%; background: var(--accent);
  box-shadow: 0 0 0 2px var(--bg1);
}
.ge-range::-moz-range-thumb {
  width: 13px; height: 13px; border-radius: 50%;
  background: var(--accent); border: 2px solid var(--bg1); cursor: pointer;
}

/* ── TIMELINE ── */
.ge-timeline {
  height: 96px; background: var(--bg1); border-top: 1px solid var(--line);
  display: flex; align-items: center; padding: 0 10px; gap: 5px;
  overflow-x: auto; overflow-y: hidden; flex-shrink: 0;
  scrollbar-width: thin; scrollbar-color: var(--bg4) transparent;
}
.ge-timeline::-webkit-scrollbar { height: 3px; }
.ge-timeline::-webkit-scrollbar-track { background: transparent; }
.ge-timeline::-webkit-scrollbar-thumb { background: var(--bg4); border-radius: 2px; }

.ge-frame-thumb {
  width: 68px; height: 68px; flex-shrink: 0; border-radius: var(--r);
  overflow: hidden; cursor: pointer; position: relative;
  border: 2px solid transparent; transition: border-color 0.12s;
}
.ge-frame-thumb:hover { border-color: var(--line3); }
.ge-frame-thumb.active { border-color: var(--accent); }
.ge-frame-thumb img, .ge-frame-thumb canvas { width: 100%; height: 100%; object-fit: cover; display: block; }
.ge-frame-del {
  position: absolute; top: 2px; right: 2px;
  width: 16px; height: 16px; border-radius: 3px;
  background: rgba(217,95,95,0.9); border: none; cursor: pointer;
  color: #fff; font-size: 9px; display: none;
  align-items: center; justify-content: center; line-height: 1;
}
.ge-frame-thumb:hover .ge-frame-del { display: flex; }
.ge-frame-num {
  position: absolute; bottom: 2px; left: 3px;
  font-size: 8px; font-family: var(--mono); color: rgba(255,255,255,0.6);
  pointer-events: none;
}
.ge-add-frame {
  width: 68px; height: 68px; flex-shrink: 0; border-radius: var(--r);
  border: 1px dashed var(--line3); background: transparent; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; color: var(--text2); font-size: 10px; transition: all 0.15s;
}
.ge-add-frame:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-dim); }

/* ── RIGHT PANEL ── */
.ge-right {
  width: 224px; background: var(--bg1); border-left: 1px solid var(--line);
  display: flex; flex-direction: column; flex-shrink: 0; overflow: hidden;
}
.ge-panel-tabs {
  display: flex; border-bottom: 1px solid var(--line); flex-shrink: 0;
}
.ge-ptab {
  flex: 1; height: 36px; background: transparent; border: none;
  color: var(--text2); font-size: 10px; font-family: var(--font);
  font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: all 0.15s;
}
.ge-ptab:hover { color: var(--text1); }
.ge-ptab.active { color: var(--accent); border-bottom-color: var(--accent); }
.ge-panel-body { flex: 1; overflow-y: auto; padding: 12px; scrollbar-width: thin; }
.ge-panel-body::-webkit-scrollbar { width: 3px; }
.ge-panel-body::-webkit-scrollbar-thumb { background: var(--bg4); }

/* ── PANEL SECTIONS ── */
.ge-section { margin-bottom: 18px; }
.ge-section-label {
  font-size: 9px; font-weight: 600; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--text2); margin-bottom: 9px;
}
.ge-field { margin-bottom: 8px; }
.ge-field-label { font-size: 10px; color: var(--text1); margin-bottom: 4px; display: block; }
.ge-input {
  width: 100%; background: var(--bg3); border: 1px solid var(--line);
  border-radius: var(--r); color: var(--text0); font-size: 11px;
  font-family: var(--font); padding: 6px 8px; outline: none; transition: border 0.15s;
}
.ge-input:focus { border-color: var(--accent); }
.ge-input::placeholder { color: var(--text2); }
.ge-select {
  width: 100%; background: var(--bg3); border: 1px solid var(--line);
  border-radius: var(--r); color: var(--text0); font-size: 11px;
  font-family: var(--font); padding: 5px 8px; outline: none; cursor: pointer;
  appearance: none;
}
.ge-row { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
.ge-row .ge-row-label { font-size: 10px; color: var(--text1); min-width: 30px; }
.ge-row .ge-row-val { font-size: 10px; font-family: var(--mono); color: var(--accent); min-width: 28px; text-align: right; }
.ge-row .ge-range { flex: 1; width: auto; }

/* ── COLOR SWATCHES ── */
.ge-swatches { display: flex; flex-wrap: wrap; gap: 5px; margin-bottom: 8px; }
.ge-swatch {
  width: 20px; height: 20px; border-radius: 3px; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.1s, border-color 0.1s;
  flex-shrink: 0;
}
.ge-swatch:hover { transform: scale(1.15); }
.ge-swatch.selected { border-color: rgba(255,255,255,0.7); transform: scale(1.1); }

/* ── BUTTONS ── */
.ge-btn {
  width: 100%; height: 30px; border-radius: var(--r);
  background: var(--bg3); border: 1px solid var(--line);
  color: var(--text0); font-size: 11px; font-family: var(--font);
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  gap: 5px; transition: all 0.15s; margin-bottom: 5px;
}
.ge-btn:hover { background: var(--bg4); border-color: var(--line2); }
.ge-btn.primary {
  background: var(--accent); border-color: var(--accent);
  color: #080809; font-weight: 600;
}
.ge-btn.primary:hover { background: #c49830; }
.ge-btn.danger { border-color: rgba(217,95,95,0.3); color: var(--red); }
.ge-btn.danger:hover { background: rgba(217,95,95,0.1); }

/* ── EFFECT CHIPS ── */
.ge-effects-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.ge-effect-chip {
  height: 28px; border-radius: var(--r); background: var(--bg3);
  border: 1px solid var(--line); color: var(--text1);
  font-size: 10px; font-family: var(--font); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.ge-effect-chip:hover { background: var(--bg4); color: var(--text0); border-color: var(--line2); }
.ge-effect-chip.active { background: var(--accent-dim); border-color: var(--accent); color: var(--accent); }

/* ── TOAST ── */
.ge-toast {
  position: fixed; bottom: 22px; left: 50%; transform: translateX(-50%) translateY(10px);
  background: var(--bg3); border: 1px solid var(--line3);
  color: var(--text0); font-size: 12px; padding: 8px 16px;
  border-radius: 20px; z-index: 100; opacity: 0;
  transition: opacity 0.2s, transform 0.2s; pointer-events: none; white-space: nowrap;
}
.ge-toast.visible { opacity: 1; transform: translateX(-50%) translateY(0); }
.ge-toast.success { border-color: rgba(78,157,111,0.5); color: var(--green); }
.ge-toast.error { border-color: rgba(217,95,95,0.5); color: var(--red); }

/* ── EXPORT MODAL OVERLAY ── */
.ge-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 50; backdrop-filter: blur(4px);
}
.ge-modal {
  background: var(--bg2); border: 1px solid var(--line2);
  border-radius: 10px; padding: 24px; width: 320px;
  display: flex; flex-direction: column; gap: 14px;
}
.ge-modal-title { font-size: 14px; font-weight: 600; }
.ge-modal-sub { font-size: 11px; color: var(--text1); line-height: 1.6; }
.ge-progress-bar {
  height: 4px; background: var(--bg4); border-radius: 2px; overflow: hidden;
}
.ge-progress-fill {
  height: 100%; background: var(--accent); border-radius: 2px;
  transition: width 0.2s;
}
.ge-modal-actions { display: flex; gap: 8px; }
`;

/* ─────────────────────────────────────────────
   ICON COMPONENTS
───────────────────────────────────────────── */
const Icon = {
  Play: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  ),
  Pause: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  ),
  SkipBack: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
    </svg>
  ),
  SkipFwd: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
    </svg>
  ),
  StepBack: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M15 18l-6-6 6-6v12z" />
    </svg>
  ),
  StepFwd: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <path d="M10 6l6 6-6 6V6z" />
    </svg>
  ),
  Upload: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
    </svg>
  ),
  Download: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  ),
  Text: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  ),
  Layers: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
    </svg>
  ),
  Fx: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zM8 12h8M12 8v8" />
    </svg>
  ),
  Settings: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  Plus: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Gif: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="3" />
      <path d="M7 12h3v2H7v-4h3M13 8v8M17 8v4h-2M17 14v2" />
    </svg>
  ),
  Trash: () => (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M3 6h18M8 6V4h8v2M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" />
    </svg>
  ),
  Image: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function getFilterString(effectIds) {
  return effectIds
    .map((id) => EFFECT_LIST.find((e) => e.id === id)?.filter || "")
    .filter(Boolean)
    .join(" ");
}

function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function GifEditor() {
  /* ── State ── */
  const [frames, setFrames] = useState([]); // [{id, src, delay}]
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(10);
  const [frameEffects, setFrameEffects] = useState({}); // {frameId: [effectId]}
  const [textLayers, setTextLayers] = useState([]); // [{id, text, x, y, size, color, font, bold, shadow, scope}]
  const [dragging, setDragging] = useState(false);
  const [activePanel, setActivePanel] = useState("text"); // text | effects | settings
  const [toast, setToast] = useState({ msg: "", type: "", visible: false });
  const [exportModal, setExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exporting, setExporting] = useState(false);

  /* Text controls */
  const [textVal, setTextVal] = useState("");
  const [textX, setTextX] = useState(50);
  const [textY, setTextY] = useState(50);
  const [textSize, setTextSize] = useState(32);
  const [textColor, setTextColor] = useState("#ffffff");
  const [textFont, setTextFont] = useState(FONT_OPTIONS[0].value);
  const [textBold, setTextBold] = useState(true);
  const [textShadow, setTextShadow] = useState(4);
  const [textScope, setTextScope] = useState("current"); // "current" | "all"
  const [textAlign, setTextAlign] = useState("center");

  /* Canvas settings */
  const [canvasW, setCanvasW] = useState(400);
  const [canvasH, setCanvasH] = useState(400);

  /* Refs */
  const playRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const toastTimerRef = useRef(null);
  const frameIdRef = useRef(0);

  /* ── Toast helper ── */
  const showToast = useCallback((msg, type = "default") => {
    setToast({ msg, type, visible: true });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(
      () => setToast((t) => ({ ...t, visible: false })),
      2600
    );
  }, []);

  /* ── Frame ID generator ── */
  const newId = () => ++frameIdRef.current;

  /* ── Upload handler ── */
  const handleFiles = useCallback(
    (files) => {
      const imageFiles = Array.from(files).filter((f) =>
        f.type.startsWith("image/")
      );
      if (!imageFiles.length) {
        showToast("Only image files are supported", "error");
        return;
      }
      imageFiles.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFrames((prev) => [
            ...prev,
            { id: newId(), src: e.target.result, delay: Math.round(1000 / fps) },
          ]);
        };
        reader.readAsDataURL(file);
      });
      showToast(`Added ${imageFiles.length} frame(s)`, "success");
    },
    [fps, showToast]
  );

  const handleFileInput = (e) => {
    handleFiles(e.target.files);
    e.target.value = "";
  };

  /* ── Drag & drop ── */
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };
  const handleDragLeave = () => setDragging(false);
  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  /* ── Playback ── */
  useEffect(() => {
    if (!playing || frames.length === 0) {
      clearInterval(playRef.current);
      return;
    }
    clearInterval(playRef.current);
    playRef.current = setInterval(() => {
      setCurrent((c) => (c + 1) % frames.length);
    }, 1000 / fps);
    return () => clearInterval(playRef.current);
  }, [playing, fps, frames.length]);

  const togglePlay = () => {
    if (frames.length === 0) return;
    setPlaying((p) => !p);
  };
  const goFrame = (idx) => {
    if (frames.length === 0) return;
    setPlaying(false);
    setCurrent(((idx % frames.length) + frames.length) % frames.length);
  };

  /* ── Delete frame ── */
  const deleteFrame = (idx) => {
    setFrames((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (current >= next.length) setCurrent(Math.max(0, next.length - 1));
      return next;
    });
    showToast("Frame removed");
  };

  /* ── Effects ── */
  const toggleEffect = (effectId) => {
    if (frames.length === 0) return;
    const frameId = frames[current]?.id;
    setFrameEffects((prev) => {
      const cur = prev[frameId] || [];
      return {
        ...prev,
        [frameId]: cur.includes(effectId)
          ? cur.filter((e) => e !== effectId)
          : [...cur, effectId],
      };
    });
  };

  const clearEffects = () => {
    if (frames.length === 0) return;
    const frameId = frames[current]?.id;
    setFrameEffects((prev) => ({ ...prev, [frameId]: [] }));
  };

  /* ── Text layers ── */
  const addText = () => {
    if (!textVal.trim()) { showToast("Enter text first", "error"); return; }
    if (frames.length === 0) { showToast("Add frames first", "error"); return; }
    const layer = {
      id: newId(),
      text: textVal.trim(),
      x: textX,
      y: textY,
      size: textSize,
      color: textColor,
      font: textFont,
      bold: textBold,
      shadow: textShadow,
      align: textAlign,
      scope: textScope === "all" ? "all" : [frames[current].id],
    };
    setTextLayers((prev) => [...prev, layer]);
    showToast(textScope === "all" ? "Text added to all frames" : `Text added to frame ${current + 1}`, "success");
  };

  const removeTextLayer = (id) => {
    setTextLayers((prev) => prev.filter((l) => l.id !== id));
  };

  /* ── Canvas rendering ── */
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || frames.length === 0) return;
    const ctx = canvas.getContext("2d");
    const frame = frames[current];
    if (!frame) return;

    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      canvas.width = canvasW;
      canvas.height = canvasH;
      ctx.clearRect(0, 0, canvasW, canvasH);

      // apply css filter via offscreen (simplified: draw direct, filter applied via canvas style)
      const effects = frameEffects[frame.id] || [];
      canvas.style.filter = getFilterString(effects);

      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      // Draw text layers
      const applicable = textLayers.filter(
        (l) => l.scope === "all" || (Array.isArray(l.scope) && l.scope.includes(frame.id))
      );
      applicable.forEach((l) => {
        const px = (l.x / 100) * canvasW;
        const py = (l.y / 100) * canvasH;
        ctx.font = `${l.bold ? "bold " : ""}${l.size}px ${l.font}`;
        ctx.textAlign = l.align || "center";
        ctx.textBaseline = "middle";
        if (l.shadow > 0) {
          ctx.shadowColor = "rgba(0,0,0,0.85)";
          ctx.shadowBlur = l.shadow * 2;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
        } else {
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }
        ctx.fillStyle = l.color;
        ctx.fillText(l.text, px, py);
        ctx.shadowBlur = 0;
      });
    };
    img.src = frame.src;
  }, [current, frames, frameEffects, textLayers, canvasW, canvasH]);

  /* ── GIF Export via gif.js (CDN) ── */
  const exportGIF = async () => {
    if (frames.length === 0) { showToast("No frames to export", "error"); return; }
    setExportModal(true);
    setExporting(true);
    setExportProgress(0);

    try {
      // Dynamically load gif.js
      await new Promise((res, rej) => {
        if (window.GIF) { res(); return; }
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });

      const gif = new window.GIF({
        workers: 2,
        quality: 8,
        width: canvasW,
        height: canvasH,
        workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
      });

      const offscreen = document.createElement("canvas");
      offscreen.width = canvasW;
      offscreen.height = canvasH;
      const ctx = offscreen.getContext("2d");

      for (let i = 0; i < frames.length; i++) {
        setExportProgress(Math.round((i / frames.length) * 70));
        const frame = frames[i];
        const img = await loadImage(frame.src).catch(() => null);
        if (!img) continue;
        ctx.clearRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        // Draw text
        const applicable = textLayers.filter(
          (l) => l.scope === "all" || (Array.isArray(l.scope) && l.scope.includes(frame.id))
        );
        applicable.forEach((l) => {
          const px = (l.x / 100) * canvasW;
          const py = (l.y / 100) * canvasH;
          ctx.font = `${l.bold ? "bold " : ""}${l.size}px ${l.font}`;
          ctx.textAlign = l.align || "center";
          ctx.textBaseline = "middle";
          if (l.shadow > 0) {
            ctx.shadowColor = "rgba(0,0,0,0.85)";
            ctx.shadowBlur = l.shadow * 2;
          }
          ctx.fillStyle = l.color;
          ctx.fillText(l.text, px, py);
          ctx.shadowBlur = 0;
        });

        gif.addFrame(offscreen, { delay: frame.delay, copy: true });
      }

      gif.on("progress", (p) => setExportProgress(70 + Math.round(p * 28)));

      gif.on("finished", (blob) => {
        setExportProgress(100);
        setTimeout(() => {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "animation.gif";
          a.click();
          URL.revokeObjectURL(url);
          setExporting(false);
          setExportModal(false);
          showToast("GIF exported successfully!", "success");
        }, 400);
      });

      gif.render();
    } catch (err) {
      console.error(err);
      setExporting(false);
      setExportModal(false);
      showToast("Export failed. Check console.", "error");
    }
  };

  /* ── Timeline effects: reverse / bounce / loop ── */
  const applyTimeline = (type) => {
    if (frames.length === 0) return;
    if (type === "reverse") {
      setFrames((p) => [...p].reverse());
      showToast("Frames reversed");
    } else if (type === "bounce") {
      setFrames((p) => [...p, ...[...p].reverse().slice(1)]);
      showToast("Bounce applied");
    } else if (type === "loop") {
      setFrames((p) => [...p, ...p]);
      showToast("Frames doubled");
    }
  };

  /* ── Current frame's active effects ── */
  const currentEffects = frameEffects[frames[current]?.id] || [];
  const currentTextLayers = textLayers.filter(
    (l) =>
      l.scope === "all" ||
      (Array.isArray(l.scope) && l.scope.includes(frames[current]?.id))
  );

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <>
      <style>{GLOBAL_CSS}</style>

      <div
        className="ge-root"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* ── TOP BAR ── */}
        <div className="ge-topbar">
       

          <button className="ge-tbtn ghost" onClick={() => applyTimeline("reverse")}>
            Reverse
          </button>
          <button className="ge-tbtn ghost" onClick={() => applyTimeline("bounce")}>
            Bounce
          </button>
          <button className="ge-tbtn ghost" onClick={() => applyTimeline("loop")}>
            Loop ×2
          </button>

          <div className="ge-sep" />

          <button className="ge-tbtn ghost" onClick={() => fileInputRef.current?.click()}>
            <Icon.Upload /> Upload
          </button>

          <div className="ge-spacer" />

          <span style={{ fontSize: 10, color: "var(--text2)", fontFamily: "var(--mono)" }}>
            {frames.length} frame{frames.length !== 1 ? "s" : ""}
          </span>

          <div className="ge-sep" />

          <button className="ge-tbtn accent" onClick={exportGIF} disabled={frames.length === 0}>
            <Icon.Download /> Export GIF
          </button>
        </div>

        {/* ── BODY ── */}
        <div className="ge-body">
          {/* ── LEFT SIDEBAR TOOLS ── */}
          <div className="ge-left">
            {[
              { id: "text", icon: <Icon.Text /> },
              { id: "effects", icon: <Icon.Fx /> },
              { id: "settings", icon: <Icon.Settings /> },
            ].map((t) => (
              <button
                key={t.id}
                className={`ge-sidetool ${activePanel === t.id ? "active" : ""}`}
                onClick={() => setActivePanel(t.id)}
                title={t.id}
              >
                {t.icon}
              </button>
            ))}
          </div>

          {/* ── MAIN CENTER ── */}
          <div className="ge-main">
            {/* Preview */}
            <div className="ge-preview-wrap">
              <div className="ge-checker" />

              {/* Drop overlay */}
              <div className={`ge-dropzone ${dragging ? "active" : ""}`}>
                <Icon.Image />
                <div className="ge-dropzone-text">Drop images here</div>
                <div className="ge-dropzone-sub">PNG, JPG, GIF, WebP</div>
              </div>

              {frames.length === 0 ? (
                <div className="ge-empty">
                  <div className="ge-empty-icon">
                    <Icon.Image />
                  </div>
                  <div className="ge-empty-title">No frames yet</div>
                  <div className="ge-empty-sub">
                    Upload images or drag & drop them here to start building your GIF
                  </div>
                  <button
                    className="ge-empty-btn"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Upload images
                  </button>
                </div>
              ) : (
                <div className="ge-canvas-container">
                  <canvas
                    ref={previewCanvasRef}
                    width={canvasW}
                    height={canvasH}
                    style={{ maxWidth: "min(480px, calc(100vw - 340px))", maxHeight: "calc(100vh - 280px)", objectFit: "contain" }}
                  />
                  <div className="ge-frame-info">
                    {current + 1} / {frames.length} &nbsp;·&nbsp; {fps} fps
                  </div>
                  <div className={`ge-play-badge ${playing ? "playing" : ""}`} />
                </div>
              )}
            </div>

            {/* Transport */}
            <div className="ge-transport">
              <button className="ge-xbtn" onClick={() => goFrame(0)} title="First frame">
                <Icon.SkipBack />
              </button>
              <button className="ge-xbtn" onClick={() => goFrame(current - 1)} title="Previous">
                <Icon.StepBack />
              </button>
              <button className="ge-xbtn play-btn" onClick={togglePlay}>
                {playing ? <Icon.Pause /> : <Icon.Play />}
              </button>
              <button className="ge-xbtn" onClick={() => goFrame(current + 1)} title="Next">
                <Icon.StepFwd />
              </button>
              <button className="ge-xbtn" onClick={() => goFrame(frames.length - 1)} title="Last frame">
                <Icon.SkipFwd />
              </button>

              <div className="ge-fps-group">
                <span className="ge-fps-label">FPS</span>
                <input
                  type="range" min="1" max="30" step="1" value={fps}
                  className="ge-range" style={{ width: 80 }}
                  onChange={(e) => setFps(+e.target.value)}
                />
                <span className="ge-fps-val">{fps}</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="ge-timeline">
              {frames.map((frame, i) => (
                <div
                  key={frame.id}
                  className={`ge-frame-thumb ${i === current ? "active" : ""}`}
                  onClick={() => { setPlaying(false); setCurrent(i); }}
                >
                  <img src={frame.src} alt={`frame ${i + 1}`} />
                  <span className="ge-frame-num">{i + 1}</span>
                  {frames.length > 1 && (
                    <button
                      className="ge-frame-del"
                      onClick={(e) => { e.stopPropagation(); deleteFrame(i); }}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button
                className="ge-add-frame"
                onClick={() => fileInputRef.current?.click()}
                title="Add frames"
              >
                <Icon.Plus />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="ge-right">
            <div className="ge-panel-tabs">
              {["text", "effects", "settings"].map((tab) => (
                <button
                  key={tab}
                  className={`ge-ptab ${activePanel === tab ? "active" : ""}`}
                  onClick={() => setActivePanel(tab)}
                >
                  {tab === "text" ? "Text" : tab === "effects" ? "FX" : "Settings"}
                </button>
              ))}
            </div>

            <div className="ge-panel-body">

              {/* ── TEXT PANEL ── */}
              {activePanel === "text" && (
                <>
                  <div className="ge-section">
                    <div className="ge-section-label">Add text</div>
                    <div className="ge-field">
                      <input
                        className="ge-input"
                        placeholder="Type something..."
                        value={textVal}
                        onChange={(e) => setTextVal(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addText()}
                      />
                    </div>

                    <div className="ge-row">
                      <span className="ge-row-label">Size</span>
                      <input type="range" min="8" max="120" step="1" value={textSize}
                        className="ge-range" style={{ flex: 1 }}
                        onChange={(e) => setTextSize(+e.target.value)} />
                      <span className="ge-row-val">{textSize}</span>
                    </div>
                    <div className="ge-row">
                      <span className="ge-row-label">X %</span>
                      <input type="range" min="0" max="100" step="1" value={textX}
                        className="ge-range" style={{ flex: 1 }}
                        onChange={(e) => setTextX(+e.target.value)} />
                      <span className="ge-row-val">{textX}</span>
                    </div>
                    <div className="ge-row">
                      <span className="ge-row-label">Y %</span>
                      <input type="range" min="0" max="100" step="1" value={textY}
                        className="ge-range" style={{ flex: 1 }}
                        onChange={(e) => setTextY(+e.target.value)} />
                      <span className="ge-row-val">{textY}</span>
                    </div>
                    <div className="ge-row">
                      <span className="ge-row-label">Shadow</span>
                      <input type="range" min="0" max="20" step="1" value={textShadow}
                        className="ge-range" style={{ flex: 1 }}
                        onChange={(e) => setTextShadow(+e.target.value)} />
                      <span className="ge-row-val">{textShadow}</span>
                    </div>

                    <div className="ge-field">
                      <label className="ge-field-label">Font</label>
                      <select className="ge-select" value={textFont}
                        onChange={(e) => setTextFont(e.target.value)}>
                        {FONT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="ge-field">
                      <label className="ge-field-label">Align</label>
                      <select className="ge-select" value={textAlign}
                        onChange={(e) => setTextAlign(e.target.value)}>
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Color</div>
                    <div className="ge-swatches">
                      {PALETTE.map((c) => (
                        <div
                          key={c}
                          className={`ge-swatch ${textColor === c ? "selected" : ""}`}
                          style={{
                            background: c,
                            border: c === "#ffffff" ? "2px solid rgba(255,255,255,0.25)" : undefined,
                          }}
                          onClick={() => setTextColor(c)}
                        />
                      ))}
                    </div>
                    <div className="ge-row">
                      <span className="ge-row-label">Custom</span>
                      <input type="color" value={textColor}
                        style={{ background: "none", border: "none", cursor: "pointer", width: 32, height: 24 }}
                        onChange={(e) => setTextColor(e.target.value)} />
                    </div>
                    <div className="ge-row">
                      <span className="ge-row-label">Bold</span>
                      <input type="checkbox" checked={textBold}
                        onChange={(e) => setTextBold(e.target.checked)} />
                    </div>
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Apply to</div>
                    <div style={{ display: "flex", gap: 5, marginBottom: 8 }}>
                      {["current", "all"].map((s) => (
                        <button
                          key={s}
                          className="ge-btn"
                          style={textScope === s ? { borderColor: "var(--accent)", color: "var(--accent)", background: "var(--accent-dim)" } : {}}
                          onClick={() => setTextScope(s)}
                        >
                          {s === "current" ? "This frame" : "All frames"}
                        </button>
                      ))}
                    </div>
                    <button className="ge-btn primary" onClick={addText}>
                      <Icon.Plus /> Add text
                    </button>
                  </div>

                  {currentTextLayers.length > 0 && (
                    <div className="ge-section">
                      <div className="ge-section-label">Layers on this frame</div>
                      {currentTextLayers.map((l) => (
                        <div key={l.id}
                          style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5,
                            background: "var(--bg3)", border: "1px solid var(--line)",
                            borderRadius: "var(--r)", padding: "5px 8px" }}>
                          <span style={{ width: 10, height: 10, borderRadius: 2, background: l.color, flexShrink: 0, border: "1px solid rgba(255,255,255,0.15)" }} />
                          <span style={{ flex: 1, fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--text0)" }}>
                            {l.text}
                          </span>
                          <span style={{ fontSize: 9, color: "var(--text2)", fontFamily: "var(--mono)", marginRight: 4 }}>
                            {l.scope === "all" ? "all" : "frame"}
                          </span>
                          <button onClick={() => removeTextLayer(l.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--red)", padding: 2, display: "flex" }}>
                            <Icon.Trash />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* ── EFFECTS PANEL ── */}
              {activePanel === "effects" && (
                <>
                  <div className="ge-section">
                    <div className="ge-section-label">Frame filters</div>
                    <div style={{ fontSize: 10, color: "var(--text2)", marginBottom: 10, lineHeight: 1.6 }}>
                      Applied to frame {current + 1}. Toggle to stack filters.
                    </div>
                    <div className="ge-effects-grid">
                      {EFFECT_LIST.map((ef) => (
                        <button
                          key={ef.id}
                          className={`ge-effect-chip ${currentEffects.includes(ef.id) ? "active" : ""}`}
                          onClick={() => toggleEffect(ef.id)}
                        >
                          {ef.label}
                        </button>
                      ))}
                    </div>
                    <button className="ge-btn danger" style={{ marginTop: 8 }} onClick={clearEffects}>
                      Clear filters
                    </button>
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Timeline operations</div>
                    <button className="ge-btn" onClick={() => applyTimeline("reverse")}>Reverse all frames</button>
                    <button className="ge-btn" onClick={() => applyTimeline("bounce")}>Bounce (ping-pong)</button>
                    <button className="ge-btn" onClick={() => applyTimeline("loop")}>Duplicate frames</button>
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Frame delay</div>
                    <div className="ge-row">
                      <span className="ge-row-label">ms</span>
                      <input type="range" min="20" max="2000" step="10"
                        value={Math.round(1000 / fps)}
                        className="ge-range" style={{ flex: 1 }}
                        onChange={(e) => setFps(Math.round(1000 / +e.target.value))} />
                      <span className="ge-row-val">{Math.round(1000 / fps)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── SETTINGS PANEL ── */}
              {activePanel === "settings" && (
                <>
                  <div className="ge-section">
                    <div className="ge-section-label">Canvas size</div>
                    <div className="ge-field">
                      <label className="ge-field-label">Width (px)</label>
                      <input className="ge-input" type="number" min="50" max="1200"
                        value={canvasW} onChange={(e) => setCanvasW(+e.target.value || 400)} />
                    </div>
                    <div className="ge-field">
                      <label className="ge-field-label">Height (px)</label>
                      <input className="ge-input" type="number" min="50" max="1200"
                        value={canvasH} onChange={(e) => setCanvasH(+e.target.value || 400)} />
                    </div>
                    {[
                      { label: "Square 400×400", w: 400, h: 400 },
                      { label: "Square 600×600", w: 600, h: 600 },
                      { label: "Wide 640×360", w: 640, h: 360 },
                      { label: "Portrait 360×640", w: 360, h: 640 },
                    ].map((p) => (
                      <button key={p.label} className="ge-btn"
                        onClick={() => { setCanvasW(p.w); setCanvasH(p.h); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Export</div>
                    <button className="ge-btn primary" onClick={exportGIF} disabled={frames.length === 0}>
                      <Icon.Download /> Export as GIF
                    </button>
                    <div style={{ fontSize: 10, color: "var(--text2)", lineHeight: 1.6, marginTop: 6 }}>
                      All frames + text overlays are baked into the exported GIF. Filters are composited via canvas.
                    </div>
                  </div>

                  <div className="ge-section">
                    <div className="ge-section-label">Project</div>
                    <button className="ge-btn danger" onClick={() => {
                      if (window.confirm("Clear all frames?")) {
                        setFrames([]); setTextLayers([]); setFrameEffects({});
                        setCurrent(0); setPlaying(false);
                        showToast("Project cleared");
                      }
                    }}>
                      Clear all frames
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── HIDDEN FILE INPUT ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={handleFileInput}
        />

        {/* ── TOAST ── */}
        <div className={`ge-toast ${toast.type} ${toast.visible ? "visible" : ""}`}>
          {toast.msg}
        </div>

        {/* ── EXPORT MODAL ── */}
        {exportModal && (
          <div className="ge-overlay">
            <div className="ge-modal">
              <div className="ge-modal-title">
                {exporting ? "Exporting GIF…" : "Export complete"}
              </div>
              <div className="ge-modal-sub">
                {exporting
                  ? `Processing ${frames.length} frame${frames.length !== 1 ? "s" : ""}. This may take a moment…`
                  : "Your GIF has been downloaded."}
              </div>
              <div className="ge-progress-bar">
                <div className="ge-progress-fill" style={{ width: `${exportProgress}%` }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--text1)", fontFamily: "var(--mono)" }}>
                {exportProgress}%
              </div>
              {!exporting && (
                <div className="ge-modal-actions">
                  <button className="ge-btn primary" onClick={() => setExportModal(false)}>
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}