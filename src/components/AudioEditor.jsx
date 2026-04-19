import { useState, useRef, useEffect, useCallback } from "react";

const fmt = (s) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, "0")}:${sec < 10 ? "0" : ""}${sec.toFixed(2)}`;
};

const BASE_BINS = 2200;

const FX_DEFS = [
  { id: "eq", name: "Equalizer", tag: "EQ", active: false, params: [
    { k: "low",  label: "Low",  v: 0,   min: -12, max: 12,   unit: " dB" },
    { k: "mid",  label: "Mid",  v: 0,   min: -12, max: 12,   unit: " dB" },
    { k: "high", label: "High", v: 0,   min: -12, max: 12,   unit: " dB" },
  ]},
  { id: "comp", name: "Compressor", tag: "DYN", active: false, params: [
    { k: "threshold", label: "Threshold", v: -24, min: -60, max: 0,    unit: " dB" },
    { k: "ratio",     label: "Ratio",     v: 4,   min: 1,   max: 20,   unit: ":1" },
    { k: "attack",    label: "Attack",    v: 10,  min: 0,   max: 200,  unit: " ms" },
    { k: "release",   label: "Release",   v: 100, min: 10,  max: 1000, unit: " ms" },
  ]},
  { id: "noise", name: "Noise Reduction", tag: "REPAIR", active: false, params: [
    { k: "amount", label: "Amount",    v: 50, min: 0, max: 100, unit: "%" },
    { k: "smooth", label: "Smoothing", v: 3,  min: 0, max: 10,  unit: "" },
  ]},
  { id: "reverb", name: "Reverb", tag: "SPACE", active: false, params: [
    { k: "decay", label: "Decay", v: 15, min: 1,  max: 80,  unit: "" },
    { k: "wet",   label: "Wet",   v: 30, min: 0,  max: 100, unit: "%" },
  ]},
  { id: "norm", name: "Normalize", tag: "UTIL", active: false, params: [
    { k: "ceiling", label: "Ceiling", v: -1, min: -12, max: 0, unit: " dB" },
  ]},
];

export default function AudioEditor() {
  const audioCtxRef  = useRef(null);
  const gainNodeRef  = useRef(null);
  const sourceRef    = useRef(null);
  const rafRef       = useRef(null);
  const startRefVal  = useRef(0);
  const pauseOffRef  = useRef(0);
  const bufferRef    = useRef(null);
  const peaksRef     = useRef(null);
  const rulerRef     = useRef(null);
  const waveRef      = useRef(null);
  const dragRef      = useRef({ on: false, t0: 0 });

  const [fileName, setFileName]     = useState("");
  const [fileInfo, setFileInfo]     = useState(null);
  const [zoom, setZoomState]        = useState(100);
  const [volume, setVolumeState]    = useState(80);
  const [tool, setToolState]        = useState("select");
  const [isPlaying, setIsPlaying]   = useState(false);
  const [currentTime, setCurrentTimeState] = useState(0);
  const [selection, setSelection]   = useState({ start: null, end: null });
  const [mutedRegions, setMutedRegions]    = useState([]);
  const [noiseRegion, setNoiseRegion]      = useState(null);
  const [trimRegion, setTrimRegion]        = useState(null);
  const [effects, setEffects]       = useState(JSON.parse(JSON.stringify(FX_DEFS)));
  const [fxOpen, setFxOpen]         = useState({});
  const [status, setStatus]         = useState("Ready");
  const [exporting, setExporting]   = useState(false);
  const [exportInfo, setExportInfo] = useState("");

  // Keep mutable refs in sync for use in draw callbacks
  const zoomRef          = useRef(100);
  const selectionRef     = useRef({ start: null, end: null });
  const currentTimeRef   = useRef(0);
  const mutedRef         = useRef([]);
  const noiseRef         = useRef(null);
  const trimRef          = useRef(null);
  const effectsRef       = useRef(effects);

  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { selectionRef.current = selection; }, [selection]);
  useEffect(() => { currentTimeRef.current = currentTime; }, [currentTime]);
  useEffect(() => { mutedRef.current = mutedRegions; }, [mutedRegions]);
  useEffect(() => { noiseRef.current = noiseRegion; }, [noiseRegion]);
  useEffect(() => { trimRef.current = trimRegion; }, [trimRegion]);
  useEffect(() => { effectsRef.current = effects; }, [effects]);

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      gainNodeRef.current = audioCtxRef.current.createGain();
      gainNodeRef.current.gain.value = volume / 100;
      gainNodeRef.current.connect(audioCtxRef.current.destination);
    }
    return audioCtxRef.current;
  }, [volume]);

  const getW = () => Math.round(900 * (zoomRef.current / 100));

  const buildPeaks = (buf, bins) => {
    const data = buf.getChannelData(0);
    const bs = Math.max(1, Math.floor(data.length / bins));
    const p = new Float32Array(bins);
    for (let i = 0; i < bins; i++) {
      let mx = 0, o = i * bs;
      for (let j = 0; j < bs && o + j < data.length; j++) {
        const v = Math.abs(data[o + j]); if (v > mx) mx = v;
      }
      p[i] = mx;
    }
    return p;
  };

  const drawAll = useCallback(() => {
    const buf = bufferRef.current;
    const peaks = peaksRef.current;
    const duration = buf ? buf.duration : 0;
    const W = getW();

    // Ruler
    const rc = rulerRef.current;
    if (rc) {
      rc.width = W; rc.style.width = W + "px";
      const ctx = rc.getContext("2d");
      ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, W, 24);
      if (buf && duration > 0) {
        const pxps = W / duration;
        let step = 1;
        if (pxps < 6) step = 60; else if (pxps < 14) step = 30;
        else if (pxps < 30) step = 10; else if (pxps < 80) step = 5;
        else if (pxps < 160) step = 2;
        ctx.fillStyle = "rgba(77,158,247,0.5)";
        ctx.strokeStyle = "rgba(77,158,247,0.15)";
        ctx.font = "9px 'SF Mono','Courier New',monospace";
        ctx.lineWidth = 1;
        for (let t = 0; t <= duration + 0.001; t += step) {
          const x = (t / duration) * W;
          ctx.beginPath(); ctx.moveTo(x, 16); ctx.lineTo(x, 24); ctx.stroke();
          if (t < duration) ctx.fillText(fmt(t), x + 2, 13);
        }
        ctx.strokeStyle = "rgba(77,158,247,0.06)";
        const minor = step / 4;
        if (minor >= 0.1) {
          for (let t = 0; t <= duration; t += minor) {
            const x = (t / duration) * W;
            ctx.beginPath(); ctx.moveTo(x, 20); ctx.lineTo(x, 24); ctx.stroke();
          }
        }
      }
    }

    // Waveform
    const wc = waveRef.current;
    if (!wc) return;
    const H = 120;
    wc.width = W; wc.style.width = W + "px";
    const ctx = wc.getContext("2d");
    ctx.fillStyle = "#0f0f15"; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = "rgba(255,255,255,0.03)"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();

    if (!peaks || duration <= 0) return;

    const sel = selectionRef.current;
    const hasSel = sel.start !== null && sel.end !== null && Math.abs(sel.end - sel.start) > 0.01;
    const selS = hasSel ? Math.min(sel.start, sel.end) : 0;
    const selE = hasSel ? Math.max(sel.start, sel.end) : 0;
    const trim = trimRef.current;
    const muted = mutedRef.current;
    const noise = noiseRef.current;
    const ct = currentTimeRef.current;

    if (trim) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, (trim.start / duration) * W, H);
      ctx.fillRect((trim.end / duration) * W, 0, W, H);
    }
    muted.forEach(r => {
      ctx.fillStyle = "rgba(239,68,68,0.07)";
      ctx.fillRect((r.start / duration) * W, 0, ((r.end - r.start) / duration) * W, H);
    });
    if (noise) {
      ctx.fillStyle = "rgba(251,191,36,0.07)";
      ctx.fillRect((noise.start / duration) * W, 0, ((noise.end - noise.start) / duration) * W, H);
    }
    if (hasSel) {
      ctx.fillStyle = "rgba(77,158,247,0.09)";
      ctx.fillRect((selS / duration) * W, 0, ((selE - selS) / duration) * W, H);
    }

    const bw = Math.max(1, W / peaks.length), cy = H / 2;
    for (let i = 0; i < peaks.length; i++) {
      const x = i * bw, tSec = (i / peaks.length) * duration;
      const amp = peaks[i], bh = Math.max(1, amp * (H * 0.86));
      const isMuted = muted.some(r => tSec >= r.start && tSec <= r.end);
      const inSel = hasSel && tSec >= selS && tSec <= selE;
      const isPast = tSec < ct;
      ctx.fillStyle = isMuted
        ? "rgba(100,20,20,0.9)"
        : inSel ? (isPast ? "#5a9fd4" : "#3a7eb8") : (isPast ? "#163560" : "#0e2540");
      ctx.fillRect(x, cy - bh / 2, Math.max(1, bw - 0.5), bh);
    }

    if (hasSel) {
      ctx.strokeStyle = "rgba(77,158,247,0.6)"; ctx.lineWidth = 1.5;
      [selS, selE].forEach(t => {
        const x = (t / duration) * W;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      });
    }
    if (noise) {
      ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      [noise.start, noise.end].forEach(t => {
        const x = (t / duration) * W;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      });
      ctx.setLineDash([]);
    }
    if (trim) {
      ctx.strokeStyle = "rgba(52,211,153,0.4)"; ctx.lineWidth = 1; ctx.setLineDash([4, 4]);
      [trim.start, trim.end].forEach(t => {
        const x = (t / duration) * W;
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    const px = (ct / duration) * W;
    ctx.strokeStyle = "rgba(77,158,247,0.9)"; ctx.lineWidth = 1.5; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    ctx.fillStyle = "#4d9ef7";
    ctx.beginPath(); ctx.moveTo(px - 4, 0); ctx.lineTo(px + 4, 0); ctx.lineTo(px, 7); ctx.closePath(); ctx.fill();
  }, []);

  useEffect(() => { drawAll(); }, [zoom, selection, mutedRegions, noiseRegion, trimRegion, currentTime, drawAll]);

  const loadFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("audio/")) return;
    setStatus("Loading...");
    const ctx = getCtx();
    const ab = await file.arrayBuffer();
    try {
      const buf = await ctx.decodeAudioData(ab);
      if (sourceRef.current) { try { sourceRef.current.stop(); } catch (_) {} sourceRef.current = null; }
      cancelAnimationFrame(rafRef.current);
      bufferRef.current = buf;
      peaksRef.current = buildPeaks(buf, BASE_BINS);
      pauseOffRef.current = 0;
      currentTimeRef.current = 0;
      setFileName(file.name);
      setFileInfo({
        dur: fmt(buf.duration),
        rate: buf.sampleRate.toLocaleString() + " Hz",
        ch: buf.numberOfChannels === 1 ? "Mono" : "Stereo",
      });
      setSelection({ start: null, end: null });
      setMutedRegions([]);
      setNoiseRegion(null);
      setTrimRegion(null);
      setCurrentTimeState(0);
      setIsPlaying(false);
      setStatus("Ready — " + file.name);
      setTimeout(drawAll, 50);
    } catch (e) {
      setStatus("Error decoding: " + e.message);
    }
  }, [getCtx, drawAll]);

  // Canvas coordinate → time (fix: use canvas getBoundingClientRect and scale by zoom)
  const timeAt = useCallback((e) => {
    const cv = waveRef.current;
    if (!cv || !bufferRef.current) return 0;
    const rect = cv.getBoundingClientRect();
    const W = getW();
    // Scale mouse position from display pixels to canvas pixels
    const scaleX = W / rect.width;
    const x = Math.max(0, Math.min((e.clientX - rect.left) * scaleX, W));
    return (x / W) * bufferRef.current.duration;
  }, []);

  const wvDown = useCallback((e) => {
    if (!bufferRef.current) return;
    const t = timeAt(e);
    dragRef.current = { on: true, t0: t };
    selectionRef.current = { start: t, end: t };
    setSelection({ start: t, end: t });
  }, [timeAt]);

  const wvMove = useCallback((e) => {
    if (!dragRef.current.on) return;
    const t = timeAt(e);
    selectionRef.current = { start: dragRef.current.t0, end: t };
    setSelection({ start: dragRef.current.t0, end: t });
  }, [timeAt]);

  const wvUp = useCallback((e) => {
    if (!dragRef.current.on) return;
    const t = timeAt(e);
    dragRef.current.on = false;
    if (Math.abs(t - dragRef.current.t0) < 0.04) {
      // Click → seek
      const seekT = Math.max(0, Math.min(t, bufferRef.current?.duration || 0));
      pauseOffRef.current = seekT;
      currentTimeRef.current = seekT;
      setCurrentTimeState(seekT);
      selectionRef.current = { start: null, end: null };
      setSelection({ start: null, end: null });
      if (sourceRef.current) {
        // restart from new position if playing
        const ctx = audioCtxRef.current;
        if (ctx) {
          try { sourceRef.current.stop(); } catch (_) {}
          sourceRef.current = null;
        }
        startPlayFrom(seekT);
      }
    }
  }, [timeAt]);

  const startPlayFrom = useCallback((offset) => {
    const buf = bufferRef.current;
    if (!buf) return;
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch (_) {} }
    cancelAnimationFrame(rafRef.current);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(gainNodeRef.current);
    const off = Math.min(offset, buf.duration);
    startRefVal.current = ctx.currentTime - off;
    src.start(0, off);
    sourceRef.current = src;
    pauseOffRef.current = off;
    setIsPlaying(true);
    const tick = () => {
      const t = ctx.currentTime - startRefVal.current;
      if (t >= buf.duration) {
        currentTimeRef.current = 0; pauseOffRef.current = 0;
        setCurrentTimeState(0); setIsPlaying(false);
        sourceRef.current = null;
        drawAll(); return;
      }
      currentTimeRef.current = t;
      setCurrentTimeState(t);
      drawAll();
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [getCtx, drawAll]);

  const togglePlay = useCallback(() => {
    if (!bufferRef.current) return;
    if (isPlaying) {
      pauseOffRef.current = currentTimeRef.current;
      if (sourceRef.current) { try { sourceRef.current.stop(); } catch (_) {} sourceRef.current = null; }
      cancelAnimationFrame(rafRef.current);
      setIsPlaying(false);
    } else {
      startPlayFrom(pauseOffRef.current);
    }
  }, [isPlaying, startPlayFrom]);

  const stop = useCallback(() => {
    if (sourceRef.current) { try { sourceRef.current.stop(); } catch (_) {} sourceRef.current = null; }
    cancelAnimationFrame(rafRef.current);
    pauseOffRef.current = 0; currentTimeRef.current = 0;
    setCurrentTimeState(0); setIsPlaying(false);
    drawAll();
  }, [drawAll]);

  const hasSel = () => {
    const s = selectionRef.current;
    return s.start !== null && s.end !== null && Math.abs(s.end - s.start) > 0.02;
  };
  const selRange = () => ({
    s: Math.min(selectionRef.current.start, selectionRef.current.end),
    e: Math.max(selectionRef.current.start, selectionRef.current.end),
  });

  const clearSel = () => {
    selectionRef.current = { start: null, end: null };
    setSelection({ start: null, end: null });
  };

  const applyMute = () => {
    if (!hasSel()) return;
    const { s, e } = selRange();
    setMutedRegions(prev => [...prev, { start: s, end: e }]);
    clearSel();
  };

  const applyTrim = () => {
    if (!hasSel()) return;
    const { s, e } = selRange();
    setTrimRegion({ start: s, end: e });
    clearSel();
  };

  const applyNoise = () => {
    if (!hasSel()) return;
    const { s, e } = selRange();
    setNoiseRegion({ start: s, end: e });
    setEffects(prev => prev.map(f => f.id === "noise" ? { ...f, active: true } : f));
    clearSel();
  };

  const adjZoom = (d) => {
    const nz = Math.max(50, Math.min(800, zoomRef.current + d));
    zoomRef.current = nz;
    setZoomState(nz);
  };

  const setVol = (v) => {
    setVolumeState(v);
    if (gainNodeRef.current) gainNodeRef.current.gain.value = v / 100;
  };

  // ─── REAL EFFECTS PROCESSING WITH SELECTION SUPPORT ─────────────────────────
  const processAudio = async (selStart, selEnd) => {
    const audioBuffer = bufferRef.current;
    if (!audioBuffer) return null;
    const ctx = getCtx();
    const nc = audioBuffer.numberOfChannels;
    const sr = audioBuffer.sampleRate;
    const fxList = effectsRef.current;
    const muted = mutedRef.current;
    const trim = trimRef.current;
    const noise = noiseRef.current;

    // Determine the range to process (trim takes precedence for full export)
    let startSample = 0, endSample = audioBuffer.length;
    if (trim) {
      startSample = Math.floor(trim.start * sr);
      endSample = Math.ceil(trim.end * sr);
    }
    const len = endSample - startSample;

    // Determine which samples are "in selection" for selective FX
    const hasSelection = selStart !== null && selEnd !== null;
    const selStartSample = hasSelection ? Math.floor(selStart * sr) - startSample : 0;
    const selEndSample = hasSelection ? Math.ceil(selEnd * sr) - startSample : len;

    const offCtx = new OfflineAudioContext(nc, len, sr);
    const src = offCtx.createBufferSource();

    // Build sliced buffer with muting applied
    const slicedBuf = offCtx.createBuffer(nc, len, sr);
    for (let c = 0; c < nc; c++) {
      const inData = audioBuffer.getChannelData(c);
      const outData = slicedBuf.getChannelData(c);
      for (let i = 0; i < len; i++) outData[i] = inData[startSample + i];
      muted.forEach(r => {
        const ms = Math.max(0, Math.floor(r.start * sr) - startSample);
        const me = Math.min(len, Math.ceil(r.end * sr) - startSample);
        for (let i = ms; i < me; i++) outData[i] = 0;
      });
    }
    src.buffer = slicedBuf;

    // If we have a selection, we need to render with FX applied only to the selection
    // Strategy: render full audio normally, render selection with FX, then splice
    if (hasSelection) {
      // First: render original (muted applied, no FX) for out-of-selection parts
      const fullOffCtx = new OfflineAudioContext(nc, len, sr);
      const fullSrc = fullOffCtx.createBufferSource();
      fullSrc.buffer = slicedBuf;
      fullSrc.connect(fullOffCtx.destination);
      fullSrc.start(0);
      const fullRendered = await fullOffCtx.startRendering();

      // Second: render selection portion with FX applied
      const selLen = Math.max(0, Math.min(selEndSample, len) - Math.max(0, selStartSample));
      if (selLen <= 0) return fullRendered;

      const selBuf = new OfflineAudioContext(nc, selLen, sr).createBuffer ? null : null;
      const selOffCtx = new OfflineAudioContext(nc, selLen, sr);
      const selSrc = selOffCtx.createBufferSource();
      const selSlice = selOffCtx.createBuffer(nc, selLen, sr);
      const selAbsStart = Math.max(0, selStartSample);

      for (let c = 0; c < nc; c++) {
        const inD = slicedBuf.getChannelData(c);
        const outD = selSlice.getChannelData(c);
        for (let i = 0; i < selLen; i++) outD[i] = inD[selAbsStart + i];
      }
      selSrc.buffer = selSlice;
      let node = selSrc;

      // Apply EQ
      const eqFx = fxList.find(f => f.id === "eq");
      if (eqFx && eqFx.active) {
        const low = selOffCtx.createBiquadFilter(); low.type = "lowshelf"; low.frequency.value = 250; low.gain.value = eqFx.params.find(p => p.k === "low").v;
        const mid = selOffCtx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = eqFx.params.find(p => p.k === "mid").v;
        const high = selOffCtx.createBiquadFilter(); high.type = "highshelf"; high.frequency.value = 8000; high.gain.value = eqFx.params.find(p => p.k === "high").v;
        node.connect(low); low.connect(mid); mid.connect(high); node = high;
      }
      // Compressor
      const compFx = fxList.find(f => f.id === "comp");
      if (compFx && compFx.active) {
        const comp = selOffCtx.createDynamicsCompressor();
        comp.threshold.value = compFx.params.find(p => p.k === "threshold").v;
        comp.ratio.value = compFx.params.find(p => p.k === "ratio").v;
        comp.attack.value = compFx.params.find(p => p.k === "attack").v / 1000;
        comp.release.value = compFx.params.find(p => p.k === "release").v / 1000;
        comp.knee.value = 3;
        node.connect(comp); node = comp;
      }
      // Noise Reduction
      const noiseFx = fxList.find(f => f.id === "noise");
      if (noiseFx && noiseFx.active) {
        const amount = noiseFx.params.find(p => p.k === "amount").v / 100;
        const smooth = noiseFx.params.find(p => p.k === "smooth").v;
        const fq = selOffCtx.createBiquadFilter();
        fq.type = "lowpass"; fq.frequency.value = Math.max(1000, sr / 2 * (1 - amount * 0.6)); fq.Q.value = Math.max(0.1, smooth * 0.3);
        node.connect(fq); node = fq;
      }
      // Reverb
      const revFx = fxList.find(f => f.id === "reverb");
      if (revFx && revFx.active) {
        const wet = revFx.params.find(p => p.k === "wet").v / 100;
        const decay = revFx.params.find(p => p.k === "decay").v;
        const convLen = Math.floor(sr * decay * 0.05);
        const irBuf = selOffCtx.createBuffer(2, convLen, sr);
        for (let c = 0; c < 2; c++) { const d = irBuf.getChannelData(c); for (let i = 0; i < convLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / convLen, 2); }
        const conv = selOffCtx.createConvolver(); conv.buffer = irBuf;
        const dry = selOffCtx.createGain(); dry.gain.value = 1 - wet * 0.5;
        const wetG = selOffCtx.createGain(); wetG.gain.value = wet;
        const merge = selOffCtx.createGain();
        node.connect(dry); dry.connect(merge);
        node.connect(conv); conv.connect(wetG); wetG.connect(merge);
        node = merge;
      }
      // Normalize (apply to the selection segment)
      const normFx = fxList.find(f => f.id === "norm");
      if (normFx && normFx.active) {
        const ceiling = normFx.params.find(p => p.k === "ceiling").v;
        const targetLinear = Math.pow(10, ceiling / 20);
        let peak = 0;
        for (let c = 0; c < nc; c++) { const d = selSlice.getChannelData(c); for (let i = 0; i < selLen; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
        if (peak > 0) { const ng = selOffCtx.createGain(); ng.gain.value = targetLinear / peak; node.connect(ng); node = ng; }
      }

      node.connect(selOffCtx.destination);
      selSrc.start(0);
      const selRendered = await selOffCtx.startRendering();

      // Splice: copy full rendered, then overwrite selection with FX-processed selection
      const finalBuf = new OfflineAudioContext(nc, len, sr).createBuffer ? null : null;
      const finalCtx2 = new OfflineAudioContext(nc, len, sr);
      const finalBuf2 = finalCtx2.createBuffer(nc, len, sr);
      for (let c = 0; c < nc; c++) {
        const outD = finalBuf2.getChannelData(c);
        const fullD = fullRendered.getChannelData(c);
        const selD = selRendered.getChannelData(c);
        // copy full
        for (let i = 0; i < len; i++) outD[i] = fullD[i];
        // overwrite selection with processed
        const writeStart = Math.max(0, selAbsStart);
        const writeEnd = Math.min(len, selAbsStart + selLen);
        for (let i = writeStart; i < writeEnd; i++) outD[i] = selD[i - writeStart];
      }
      const finalSrc2 = finalCtx2.createBufferSource();
      finalSrc2.buffer = finalBuf2;
      finalSrc2.connect(finalCtx2.destination);
      finalSrc2.start(0);
      return await finalCtx2.startRendering();
    }

    // No selection → apply FX to full clip
    src.buffer = slicedBuf;
    let node = src;

    const eqFx = fxList.find(f => f.id === "eq");
    if (eqFx && eqFx.active) {
      const low = offCtx.createBiquadFilter(); low.type = "lowshelf"; low.frequency.value = 250; low.gain.value = eqFx.params.find(p => p.k === "low").v;
      const mid = offCtx.createBiquadFilter(); mid.type = "peaking"; mid.frequency.value = 1000; mid.Q.value = 1; mid.gain.value = eqFx.params.find(p => p.k === "mid").v;
      const high = offCtx.createBiquadFilter(); high.type = "highshelf"; high.frequency.value = 8000; high.gain.value = eqFx.params.find(p => p.k === "high").v;
      node.connect(low); low.connect(mid); mid.connect(high); node = high;
    }
    const compFx = fxList.find(f => f.id === "comp");
    if (compFx && compFx.active) {
      const comp = offCtx.createDynamicsCompressor();
      comp.threshold.value = compFx.params.find(p => p.k === "threshold").v;
      comp.ratio.value = compFx.params.find(p => p.k === "ratio").v;
      comp.attack.value = compFx.params.find(p => p.k === "attack").v / 1000;
      comp.release.value = compFx.params.find(p => p.k === "release").v / 1000;
      comp.knee.value = 3;
      node.connect(comp); node = comp;
    }
    const noiseFx = fxList.find(f => f.id === "noise");
    if (noiseFx && noiseFx.active) {
      const amount = noiseFx.params.find(p => p.k === "amount").v / 100;
      const smooth = noiseFx.params.find(p => p.k === "smooth").v;
      const fq = offCtx.createBiquadFilter();
      fq.type = "lowpass"; fq.frequency.value = Math.max(1000, bufferRef.current.sampleRate / 2 * (1 - amount * 0.6)); fq.Q.value = Math.max(0.1, smooth * 0.3);
      node.connect(fq); node = fq;
    }
    const revFx = fxList.find(f => f.id === "reverb");
    if (revFx && revFx.active) {
      const wet = revFx.params.find(p => p.k === "wet").v / 100;
      const decay = revFx.params.find(p => p.k === "decay").v;
      const convLen = Math.floor(sr * decay * 0.05);
      const irBuf = offCtx.createBuffer(2, convLen, sr);
      for (let c = 0; c < 2; c++) { const d = irBuf.getChannelData(c); for (let i = 0; i < convLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / convLen, 2); }
      const conv = offCtx.createConvolver(); conv.buffer = irBuf;
      const dry = offCtx.createGain(); dry.gain.value = 1 - wet * 0.5;
      const wetG = offCtx.createGain(); wetG.gain.value = wet;
      const merge = offCtx.createGain();
      node.connect(dry); dry.connect(merge);
      node.connect(conv); conv.connect(wetG); wetG.connect(merge);
      node = merge;
    }
    const normFx = fxList.find(f => f.id === "norm");
    if (normFx && normFx.active) {
      const ceiling = normFx.params.find(p => p.k === "ceiling").v;
      const targetLinear = Math.pow(10, ceiling / 20);
      let peak = 0;
      for (let c = 0; c < nc; c++) { const d = slicedBuf.getChannelData(c); for (let i = 0; i < len; i++) { const a = Math.abs(d[i]); if (a > peak) peak = a; } }
      if (peak > 0) { const ng = offCtx.createGain(); ng.gain.value = targetLinear / peak; node.connect(ng); node = ng; }
    }

    node.connect(offCtx.destination);
    src.start(0);
    return await offCtx.startRendering();
  };

  const exportMp3 = async () => {
    if (!bufferRef.current || typeof window.lamejs === "undefined") {
      setStatus("lamejs not loaded"); return;
    }
    setExporting(true);
    setExportInfo("Processing…");
    setStatus("Applying effects…");

    // Determine if we export with selection-specific FX or full
    const sel = selectionRef.current;
    const hasSel2 = sel.start !== null && sel.end !== null && Math.abs(sel.end - sel.start) > 0.02;
    const selS2 = hasSel2 ? Math.min(sel.start, sel.end) : null;
    const selE2 = hasSel2 ? Math.max(sel.start, sel.end) : null;

    try {
      const processed = await processAudio(selS2, selE2);
      const sr = processed.sampleRate;
      const nc = Math.min(processed.numberOfChannels, 2);
      const len = processed.length;

      setStatus("Encoding MP3…");
      await new Promise(r => setTimeout(r, 10));

      const mp3enc = nc === 2 ? new window.lamejs.Mp3Encoder(2, sr, 192) : new window.lamejs.Mp3Encoder(1, sr, 192);
      const SAMPLES = 1152;
      const mp3Data = [];
      const l = processed.getChannelData(0);
      const r2 = nc === 2 ? processed.getChannelData(1) : null;
      const toShort = f => Math.max(-32768, Math.min(32767, Math.round(f * (f < 0 ? 32768 : 32767))));

      for (let i = 0; i < len; i += SAMPLES) {
        const sz = Math.min(SAMPLES, len - i);
        const lChunk = new Int16Array(sz);
        for (let j = 0; j < sz; j++) lChunk[j] = toShort(l[i + j]);
        let buf;
        if (nc === 2) {
          const rChunk = new Int16Array(sz);
          for (let j = 0; j < sz; j++) rChunk[j] = toShort((r2 || l)[i + j]);
          buf = mp3enc.encodeBuffer(lChunk, rChunk);
        } else {
          buf = mp3enc.encodeBuffer(lChunk);
        }
        if (buf.length > 0) mp3Data.push(new Int8Array(buf));
      }
      const fin = mp3enc.flush();
      if (fin.length > 0) mp3Data.push(new Int8Array(fin));

      const blob = new Blob(mp3Data, { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = (fileName || "audio").replace(/\.[^.]+$/, "") + "_edited.mp3";
      a.click(); URL.revokeObjectURL(url);
      setStatus("Exported successfully ✓");
      setExportInfo("Exported " + Math.round(blob.size / 1024) + " KB MP3");
    } catch (e) {
      setStatus("Export error: " + e.message);
      console.error(e);
    }
    setExporting(false);
  };

  const toggleFx = (id) => {
    setEffects(prev => prev.map(f => f.id === id ? { ...f, active: !f.active } : f));
  };

  const updateParam = (fxId, k, v) => {
    setEffects(prev => prev.map(f => f.id === fxId
      ? { ...f, params: f.params.map(p => p.k === k ? { ...p, v: +v } : p) }
      : f
    ));
  };

  const activeFxCount = effects.filter(f => f.active).length;
  const hasSel2 = selection.start !== null && selection.end !== null && Math.abs(selection.end - selection.start) > 0.02;
  const selS2 = hasSel2 ? Math.min(selection.start, selection.end) : 0;
  const selE2 = hasSel2 ? Math.max(selection.start, selection.end) : 0;

  const regions = [];
  if (noiseRegion) regions.push({ type: "noise", label: "⚡ Noise Profile", times: `${fmt(noiseRegion.start)}→${fmt(noiseRegion.end)}`, onClear: () => { setNoiseRegion(null); setEffects(prev => prev.map(f => f.id === "noise" ? { ...f, active: false } : f)); } });
  if (mutedRegions.length > 0) regions.push({ type: "mute", label: `🔇 ${mutedRegions.length} muted region${mutedRegions.length > 1 ? "s" : ""}`, times: "", onClear: () => setMutedRegions([]) });
  if (trimRegion) regions.push({ type: "trim", label: "✂ Trim region", times: `${fmt(trimRegion.start)}→${fmt(trimRegion.end)}`, onClear: () => setTrimRegion(null) });

  // Inject lamejs script
  useEffect(() => {
    if (!document.getElementById("lamejs-script")) {
      const s = document.createElement("script");
      s.id = "lamejs-script";
      s.src = "https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.0/lame.min.js";
      document.head.appendChild(s);
    }
  }, []);

  const CSS = `
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#1a1a1f}
    ::-webkit-scrollbar{width:6px;height:6px}
    ::-webkit-scrollbar-track{background:#111115}
    ::-webkit-scrollbar-thumb{background:#333340;border-radius:3px}
    input[type=range]{cursor:pointer;accent-color:#4d9ef7}
  `;

  return (
    <>
      <style>{CSS}</style>
      <div style={{ background: "#1a1a1f", color: "#c8cdd6", fontFamily: "'Segoe UI',system-ui,sans-serif", fontSize: 12, height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Top bar */}
        <div style={{ height: 36, background: "#111115", borderBottom: "1px solid #2a2a35", display: "flex", alignItems: "center", padding: "0 12px", gap: 2, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#4d9ef7", letterSpacing: ".08em", marginRight: 12 }}>WAVEFORM</span>
          {["File","Edit","Effects"].map(l => (
            <button key={l} style={{ padding: "4px 10px", borderRadius: 3, fontSize: 11, color: l === "File" ? "#4d9ef7" : "#8891a0", border: "1px solid " + (l === "File" ? "#2a3550" : "transparent"), background: l === "File" ? "#1e1e28" : "none", cursor: "pointer" }}>{l}</button>
          ))}
          <div style={{ flex: 1 }} />
          <span style={{ fontSize: 10, color: "#2a3040" }}>{fileName || "No file loaded"}</span>
        </div>

        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* Sidebar */}
          <div style={{ width: 220, background: "#111115", borderRight: "1px solid #2a2a35", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden" }}>

            {/* Upload */}
            <div style={{ padding: 10, borderBottom: "1px solid #1e1e28" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#464d5c", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 7 }}>Source</div>
              <div
                style={{ border: "1.5px dashed #2a3550", borderRadius: 5, padding: "16px 10px", textAlign: "center", cursor: "pointer" }}
                onClick={() => document.getElementById("ae-file-input").click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); loadFile(e.dataTransfer.files[0]); }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2a4570" strokeWidth="1.5" strokeLinecap="round" style={{ display: "block", margin: "0 auto 8px" }}>
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <div style={{ fontSize: 11, color: "#5a6475", marginBottom: 3 }}>Drop audio or click</div>
                <div style={{ fontSize: 10, color: "#343b48" }}>MP3 · WAV · OGG · FLAC</div>
                <input id="ae-file-input" type="file" accept="audio/*" style={{ display: "none" }} onChange={e => loadFile(e.target.files[0])} />
              </div>
              {fileInfo && (
                <div style={{ fontSize: 10, lineHeight: 2, color: "#464d5c", marginTop: 8 }}>
                  <div><span style={{ color: "#667282" }}>{fileInfo.dur}</span> Duration</div>
                  <div><span style={{ color: "#667282" }}>{fileInfo.rate}</span> Sample rate</div>
                  <div><span style={{ color: "#667282" }}>{fileInfo.ch}</span> Channels</div>
                </div>
              )}
            </div>

            {/* Regions */}
            {regions.length > 0 && (
              <div style={{ padding: 10, borderBottom: "1px solid #1e1e28" }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: "#464d5c", letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 7 }}>Regions</div>
                {regions.map((r, i) => {
                  const colors = { noise: "#fbbf24", mute: "#ef4444", trim: "#34d399" };
                  const c = colors[r.type];
                  return (
                    <div key={i} style={{ borderRadius: 4, padding: "5px 8px", fontSize: 9, marginBottom: 4, background: `rgba(${r.type==="noise"?"251,191,36":r.type==="mute"?"239,68,68":"52,211,153"},.05)`, border: `1px solid ${c}30`, color: c }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>{r.label}</span>
                        <button onClick={r.onClear} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: c, opacity: .7 }}>✕</button>
                      </div>
                      {r.times && <div style={{ color: "#343b48", fontSize: 9, marginTop: 2 }}>{r.times}</div>}
                    </div>
                  );
                })}
              </div>
            )}

            {/* FX Rack */}
            <div style={{ padding: "10px 10px 4px", borderBottom: "1px solid #1e1e28" }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: "#464d5c", letterSpacing: ".1em", textTransform: "uppercase" }}>Effects Rack</div>
            </div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {effects.map(fx => (
                <div key={fx.id} style={{ borderRadius: 4, border: `1px solid ${fx.active ? "#2a3550" : "#1e1e28"}`, background: fx.active ? "#0f1220" : "#0d0d12", marginBottom: 4, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, padding: "7px 9px", cursor: "pointer" }} onClick={() => setFxOpen(p => ({ ...p, [fx.id]: !p[fx.id] }))}>
                    <div
                      style={{ width: 24, height: 13, borderRadius: 6, background: fx.active ? "#1a3a5c" : "#1e1e28", position: "relative", flexShrink: 0, transition: ".2s" }}
                      onClick={e => { e.stopPropagation(); toggleFx(fx.id); }}
                    >
                      <div style={{ position: "absolute", top: 2, left: fx.active ? 13 : 2, width: 9, height: 9, borderRadius: "50%", background: fx.active ? "#4d9ef7" : "#3a3a4a", transition: ".2s" }} />
                    </div>
                    <span style={{ flex: 1, fontSize: 10, fontWeight: 600, color: fx.active ? "#8891a0" : "#3d4455", letterSpacing: ".03em" }}>{fx.name}</span>
                    <span style={{ fontSize: 9, color: fx.active ? "#2a4570" : "#2a3550" }}>{fx.tag}</span>
                    <span style={{ fontSize: 8, color: "#2a2a35" }}>{fxOpen[fx.id] ? "▲" : "▼"}</span>
                  </div>
                  {fxOpen[fx.id] && (
                    <div style={{ padding: "6px 10px 9px", borderTop: "1px solid #0e0e18" }}>
                      {fx.params.map(p => (
                        <div key={p.k} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                          <span style={{ width: 62, fontSize: 10, color: "#343b48", flexShrink: 0 }}>{p.label}</span>
                          <input type="range" min={p.min} max={p.max} step={(p.max - p.min) < 5 ? 0.1 : 1} value={p.v} style={{ flex: 1, height: 3 }} onChange={e => updateParam(fx.id, p.k, e.target.value)} />
                          <span style={{ width: 36, fontSize: 10, color: "#4d9ef7", textAlign: "right", flexShrink: 0 }}>{p.v}{p.unit}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {exporting && <div style={{ fontSize: 10, color: "#4d9ef7", padding: "0 10px 8px", textAlign: "center" }}>Encoding MP3…</div>}
            <button
              disabled={!fileInfo || exporting}
              onClick={exportMp3}
              style={{ margin: 10, padding: 9, borderRadius: 4, background: "linear-gradient(135deg,#1a3a6c,#153055)", border: "1px solid #2a4570", color: "#7ab8f5", fontSize: 11, fontWeight: 600, letterSpacing: ".05em", display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: fileInfo && !exporting ? "pointer" : "not-allowed", opacity: fileInfo && !exporting ? 1 : 0.35, width: "calc(100% - 20px)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export MP3
            </button>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#14141a" }}>

            {/* Toolbar */}
            <div style={{ height: 38, background: "#0e0e14", borderBottom: "1px solid #1e1e28", display: "flex", alignItems: "center", padding: "0 12px", gap: 6, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 6px", borderRight: "1px solid #1e1e28" }}>
                {[
                  { id: "select", label: "Select" },
                  { id: "trim",   label: "Trim" },
                  { id: "noise",  label: "Noise Profile" },
                ].map(t => (
                  <button key={t.id} onClick={() => setToolState(t.id)} style={{ display: "flex", alignItems: "center", gap: 5, padding: "4px 9px", borderRadius: 3, fontSize: 11, color: tool === t.id ? "#4d9ef7" : "#4a5260", border: `1px solid ${tool === t.id ? "#1e3050" : "transparent"}`, background: tool === t.id ? "#101825" : "none", cursor: "pointer", letterSpacing: ".02em" }}>
                    {t.label}
                  </button>
                ))}
              </div>

              {hasSel2 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 6px", borderRight: "1px solid #1e1e28" }}>
                  <span style={{ fontSize: 10, color: "#3a4455", fontFamily: "'SF Mono',monospace" }}>
                    {fmt(selS2)}→{fmt(selE2)} ({(selE2 - selS2).toFixed(2)}s)
                  </span>
                  {tool === "select" && (
                    <button onClick={applyMute} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 3, fontSize: 10, color: "#ef4444", border: "1px solid rgba(239,68,68,.3)", background: "rgba(239,68,68,.06)", cursor: "pointer" }}>🔇 Mute</button>
                  )}
                  {tool === "trim" && (
                    <button onClick={applyTrim} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 3, fontSize: 10, color: "#34d399", border: "1px solid rgba(52,211,153,.3)", background: "rgba(52,211,153,.06)", cursor: "pointer" }}>✂ Set Trim</button>
                  )}
                  {tool === "noise" && (
                    <button onClick={applyNoise} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 3, fontSize: 10, color: "#fbbf24", border: "1px solid rgba(251,191,36,.3)", background: "rgba(251,191,36,.06)", cursor: "pointer" }}>⚡ Capture</button>
                  )}
                  <button onClick={clearSel} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 22, height: 22, borderRadius: 3, border: "1px solid #1e1e28", color: "#3a4455", background: "none", cursor: "pointer" }}>✕</button>
                </div>
              )}

              <div style={{ flex: 1 }} />

              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ fontSize: 10, color: "#3a4455" }}>Zoom</span>
                <button onClick={() => adjZoom(-25)} style={{ width: 22, height: 22, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", color: "#3a4455", border: "1px solid #1a1a22", background: "none", cursor: "pointer", fontSize: 14 }}>−</button>
                <input type="range" min={50} max={800} value={zoom} style={{ width: 70 }} onChange={e => { zoomRef.current = +e.target.value; setZoomState(+e.target.value); }} />
                <button onClick={() => adjZoom(25)} style={{ width: 22, height: 22, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center", color: "#3a4455", border: "1px solid #1a1a22", background: "none", cursor: "pointer", fontSize: 14 }}>+</button>
                <span style={{ fontSize: 10, color: "#4d9ef7", fontFamily: "'SF Mono',monospace", minWidth: 38, textAlign: "right" }}>{zoom}%</span>
              </div>
            </div>

            {/* Track area */}
            <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
              <div style={{ width: 48, flexShrink: 0, background: "#0e0e14", borderRight: "1px solid #1e1e28", display: "flex", flexDirection: "column" }}>
                <div style={{ height: 24, borderBottom: "1px solid #1e1e28" }} />
                {fileInfo && (
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2a3550" strokeWidth="1.5" strokeLinecap="round">
                      <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
                    </svg>
                    <span style={{ fontSize: 9, color: "#2a3040", letterSpacing: ".08em" }}>AUDIO</span>
                    <span style={{ fontSize: 9, color: "#1e2530" }}>01</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowX: "auto", overflowY: "hidden", display: "flex", flexDirection: "column", cursor: "crosshair" }}>
                <canvas ref={rulerRef} height={24} style={{ display: "block", flexShrink: 0 }} />
                <canvas
                  ref={waveRef} height={120}
                  style={{ display: "block", flexShrink: 0, cursor: "crosshair" }}
                  onMouseDown={wvDown}
                  onMouseMove={wvMove}
                  onMouseUp={wvUp}
                  onMouseLeave={() => { dragRef.current.on = false; }}
                />
                {!fileInfo && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#2a3040" }}>
                    <div style={{ textAlign: "center" }}>
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1.2" strokeLinecap="round" style={{ display: "block", margin: "0 auto 10px" }}>
                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                      Upload an audio file to begin editing
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Transport */}
            <div style={{ height: 56, background: "#0e0e14", borderTop: "1px solid #1e1e28", display: "flex", alignItems: "center", padding: "0 14px", gap: 16, flexShrink: 0 }}>
              <button disabled={!fileInfo} onClick={stop} style={{ width: 28, height: 28, borderRadius: 3, background: "#111118", border: "1px solid #1e1e28", display: "flex", alignItems: "center", justifyContent: "center", color: "#4a5260", cursor: fileInfo ? "pointer" : "not-allowed", opacity: fileInfo ? 1 : 0.3 }}>
                <svg width="10" height="10" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/></svg>
              </button>
              <button disabled={!fileInfo} onClick={togglePlay} style={{ width: 38, height: 38, borderRadius: "50%", background: "#1a3050", border: "1px solid #2a4570", display: "flex", alignItems: "center", justifyContent: "center", color: "#7ab8f5", cursor: fileInfo ? "pointer" : "not-allowed", opacity: fileInfo ? 1 : 0.3, flexShrink: 0 }}>
                {isPlaying
                  ? <svg width="14" height="14" viewBox="0 0 24 24"><rect x="5" y="4" width="5" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="5" height="16" rx="1" fill="currentColor"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24"><polygon points="6,4 20,12 6,20" fill="currentColor"/></svg>
                }
              </button>
              <div>
                <div style={{ fontFamily: "'SF Mono','Courier New',monospace", fontSize: 18, color: "#4d9ef7", letterSpacing: ".06em" }}>{fmt(currentTime)}</div>
                <div style={{ fontSize: 10, color: "#2a3040", marginTop: 2 }}>/ {fileInfo ? fileInfo.dur : "00:00.00"}</div>
              </div>
              <div style={{ width: 1, height: 32, background: "#1e1e28" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3a4455" strokeWidth="2" strokeLinecap="round">
                  <polygon points="11,5 6,9 2,9 2,15 6,15 11,19"/><path d="M15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14"/>
                </svg>
                <span style={{ fontSize: 10, color: "#3a4455" }}>Vol</span>
                <input type="range" min={0} max={100} value={volume} style={{ width: 80 }} onChange={e => setVol(+e.target.value)} />
                <span style={{ fontSize: 10, color: "#4d9ef7", fontFamily: "'SF Mono',monospace", minWidth: 32 }}>{volume}%</span>
              </div>
              <div style={{ width: 1, height: 32, background: "#1e1e28" }} />
              <div>
                <div style={{ fontSize: 10, color: activeFxCount > 0 ? "#4d9ef7" : "#2a3040", fontFamily: "'SF Mono',monospace" }}>{activeFxCount}/{effects.length} FX</div>
                <div style={{ fontSize: 9, color: "#1e2530", marginTop: 2 }}>active effects</div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 10, color: "#2a3040" }}>{exportInfo}</div>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div style={{ height: 20, background: "#0a0a0f", borderTop: "1px solid #111118", display: "flex", alignItems: "center", padding: "0 12px", gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "#2a3040" }}>{status}</span>
          {fileInfo && <span style={{ fontSize: 10, color: "#2a4570" }}>{fileInfo.rate} · {fileInfo.ch}</span>}
          {activeFxCount > 0 && <span style={{ fontSize: 10, color: "#2a6040" }}>{activeFxCount} effect{activeFxCount > 1 ? "s" : ""} active</span>}
        </div>
      </div>
    </>
  );
}