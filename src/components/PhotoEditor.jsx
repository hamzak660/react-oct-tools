import { useState, useRef, useEffect, useCallback, useMemo } from "react";

/* ─── constants ─── */
const FILTERS = [
  { id:"brightness", label:"Brightness", min:-100, max:100, v:0, unit:"" },
  { id:"contrast",   label:"Contrast",   min:-100, max:100, v:0, unit:"" },
  { id:"saturation", label:"Saturation", min:-100, max:100, v:0, unit:"" },
  { id:"hue",        label:"Hue Rotate", min:0,    max:360, v:0, unit:"°" },
  { id:"blur",       label:"Blur",       min:0,    max:20,  v:0, unit:"px" },
  { id:"sharpen",    label:"Sharpen",    min:0,    max:10,  v:0, unit:"" },
  { id:"vignette",   label:"Vignette",   min:0,    max:100, v:0, unit:"%" },
  { id:"grain",      label:"Film Grain", min:0,    max:100, v:0, unit:"%" },
];

const PRESETS = [
  { name:"Original",  vals:{brightness:0,contrast:0,saturation:0,hue:0,blur:0,sharpen:0,vignette:0,grain:0}},
  { name:"Vivid",     vals:{brightness:10,contrast:30,saturation:60,hue:0,blur:0,sharpen:2,vignette:0,grain:0}},
  { name:"Noir",      vals:{brightness:-10,contrast:40,saturation:-100,hue:0,blur:0,sharpen:3,vignette:50,grain:30}},
  { name:"Fade",      vals:{brightness:20,contrast:-20,saturation:-30,hue:0,blur:0,sharpen:0,vignette:0,grain:15}},
  { name:"Warm",      vals:{brightness:5,contrast:10,saturation:20,hue:15,blur:0,sharpen:0,vignette:20,grain:0}},
  { name:"Cold",      vals:{brightness:0,contrast:10,saturation:10,hue:200,blur:0,sharpen:0,vignette:20,grain:0}},
  { name:"Dreamy",    vals:{brightness:15,contrast:-10,saturation:20,hue:0,blur:2,sharpen:0,vignette:0,grain:5}},
  { name:"Dramatic",  vals:{brightness:-15,contrast:60,saturation:20,hue:0,blur:0,sharpen:5,vignette:70,grain:20}},
];

const FONTS = ["Georgia","'Courier New'","Impact","'Trebuchet MS'","Palatino","'Arial Black'","'Times New Roman'","Verdana","'Comic Sans MS'","Garamond"];
const FONT_LABELS = ["Georgia","Courier New","Impact","Trebuchet MS","Palatino","Arial Black","Times New Roman","Verdana","Comic Sans MS","Garamond"];
const BLEND_MODES = ["normal","multiply","screen","overlay","soft-light","hard-light","color-dodge","color-burn","difference","luminosity"];

/* ─── helpers ─── */
function clamp(v,mn,mx){return Math.max(mn,Math.min(mx,v));}

function applyConvolution(ctx, w, h, kernel, divisor=1) {
  const src = ctx.getImageData(0,0,w,h);
  const dst = ctx.createImageData(w,h);
  const s=src.data, d=dst.data;
  const kSize=Math.sqrt(kernel.length), half=Math.floor(kSize/2);
  for(let y=0;y<h;y++) for(let x=0;x<w;x++){
    let r=0,g=0,b=0;
    for(let ky=0;ky<kSize;ky++) for(let kx=0;kx<kSize;kx++){
      const px=clamp(x+kx-half,0,w-1), py=clamp(y+ky-half,0,h-1);
      const idx=(py*w+px)*4;
      const k=kernel[ky*kSize+kx];
      r+=s[idx]*k; g+=s[idx+1]*k; b+=s[idx+2]*k;
    }
    const i=(y*w+x)*4;
    d[i]=clamp(r/divisor,0,255); d[i+1]=clamp(g/divisor,0,255); d[i+2]=clamp(b/divisor,0,255); d[i+3]=s[i+3];
  }
  ctx.putImageData(dst,0,0);
}

function applySharpen(ctx, w, h, amount) {
  if(amount<=0) return;
  const k=[-1,-1,-1,-1,9,-1,-1,-1,-1];
  // blend between original and sharpened
  const orig = ctx.getImageData(0,0,w,h);
  applyConvolution(ctx,w,h,k);
  const sharp = ctx.getImageData(0,0,w,h);
  const blend = ctx.createImageData(w,h);
  const t = Math.min(amount/10,1);
  for(let i=0;i<orig.data.length;i+=4){
    blend.data[i]  =clamp(orig.data[i]  *(1-t)+sharp.data[i]  *t,0,255);
    blend.data[i+1]=clamp(orig.data[i+1]*(1-t)+sharp.data[i+1]*t,0,255);
    blend.data[i+2]=clamp(orig.data[i+2]*(1-t)+sharp.data[i+2]*t,0,255);
    blend.data[i+3]=orig.data[i+3];
  }
  ctx.putImageData(blend,0,0);
}

function applyColorAdjust(ctx, w, h, brightness, contrast, saturation) {
  const img = ctx.getImageData(0,0,w,h);
  const d = img.data;
  const br = brightness/100, co = (contrast+100)/100, sat = (saturation+100)/100;
  for(let i=0;i<d.length;i+=4){
    let r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255;
    // brightness
    r+=br; g+=br; b+=br;
    // contrast
    r=(r-0.5)*co+0.5; g=(g-0.5)*co+0.5; b=(b-0.5)*co+0.5;
    // saturation
    const gray=0.299*r+0.587*g+0.114*b;
    r=gray+(r-gray)*sat; g=gray+(g-gray)*sat; b=gray+(b-gray)*sat;
    d[i]=clamp(r*255,0,255); d[i+1]=clamp(g*255,0,255); d[i+2]=clamp(b*255,0,255);
  }
  ctx.putImageData(img,0,0);
}

function applyHueRotate(ctx, w, h, deg) {
  if(deg===0) return;
  const img=ctx.getImageData(0,0,w,h), d=img.data;
  const rad=deg*Math.PI/180, cos=Math.cos(rad), sin=Math.sin(rad);
  for(let i=0;i<d.length;i+=4){
    const r=d[i]/255, g=d[i+1]/255, b=d[i+2]/255;
    const nr=r*(cos+0.213*(1-cos))+g*(0.715*(1-cos)-0.715*sin)+b*(0.072*(1-cos)+0.928*sin);
    const ng=r*(0.213*(1-cos)+0.143*sin)+g*(cos+0.715*(1-cos))+b*(0.072*(1-cos)-0.140*sin);
    const nb=r*(0.213*(1-cos)-0.213*sin)+g*(0.715*(1-cos)+0.140*sin)+b*(cos+0.072*(1-cos));
    d[i]=clamp(nr*255,0,255); d[i+1]=clamp(ng*255,0,255); d[i+2]=clamp(nb*255,0,255);
  }
  ctx.putImageData(img,0,0);
}

function addGrain(ctx, w, h, amount) {
  if(amount<=0) return;
  const img=ctx.getImageData(0,0,w,h), d=img.data;
  const strength=(amount/100)*80;
  for(let i=0;i<d.length;i+=4){
    const n=(Math.random()-0.5)*strength;
    d[i]=clamp(d[i]+n,0,255); d[i+1]=clamp(d[i+1]+n,0,255); d[i+2]=clamp(d[i+2]+n,0,255);
  }
  ctx.putImageData(img,0,0);
}

function addVignette(ctx, w, h, amount) {
  if(amount<=0) return;
  const cx=w/2, cy=h/2, r=Math.sqrt(cx*cx+cy*cy);
  const grd=ctx.createRadialGradient(cx,cy,r*(1-amount/150),cx,cy,r);
  grd.addColorStop(0,"rgba(0,0,0,0)");
  grd.addColorStop(1,`rgba(0,0,0,${amount/120})`);
  ctx.fillStyle=grd; ctx.fillRect(0,0,w,h);
}

/* ─── render full canvas ─── */
function renderToCanvas(offscreen, imgEl, filters, texts, crop) {
  if(!imgEl||!offscreen) return;
  const {brightness,contrast,saturation,hue,blur,sharpen,vignette,grain} = filters;
  const ctx = offscreen.getContext("2d");
  const W=offscreen.width, H=offscreen.height;

  // Draw image with CSS blur (blur via filter before pixel ops)
  ctx.clearRect(0,0,W,H);
  if(blur>0){
    ctx.filter=`blur(${blur}px)`;
  } else {
    ctx.filter="none";
  }
  ctx.drawImage(imgEl,0,0,W,H);
  ctx.filter="none";

  // Pixel-level adjustments
  applyColorAdjust(ctx,W,H,brightness,contrast,saturation);
  applyHueRotate(ctx,W,H,hue);
  applySharpen(ctx,W,H,sharpen);
  addGrain(ctx,W,H,grain);
  addVignette(ctx,W,H,vignette);

  // Draw text layers
  texts.forEach(t=>{
    ctx.save();
    const x=(t.x/100)*W, y=(t.y/100)*H;
    ctx.translate(x,y);
    ctx.rotate((t.rotate||0)*Math.PI/180);
    ctx.font=`${t.bold?"bold ":""}${t.italic?"italic ":""}${t.size}px ${t.font}`;
    ctx.globalAlpha=t.opacity/100;
    ctx.globalCompositeOperation=t.blend||"normal";
    if(t.shadow){
      ctx.shadowColor="rgba(0,0,0,0.6)";
      ctx.shadowBlur=8; ctx.shadowOffsetX=2; ctx.shadowOffsetY=2;
    }
    if(t.stroke){
      ctx.strokeStyle=t.strokeColor||"#000000";
      ctx.lineWidth=t.size/12;
      ctx.strokeText(t.text,0,0);
    }
    ctx.fillStyle=t.color;
    ctx.fillText(t.text,0,0);
    ctx.restore();
  });
}

/* ════════════════════════════════════════════════════════════
   COMPONENT
════════════════════════════════════════════════════════════ */
export default function PhotoEditor() {
  const fileInputRef   = useRef(null);
  const canvasRef      = useRef(null);   // preview canvas
  const offscreenRef   = useRef(null);   // offscreen for rendering
  const imgRef         = useRef(null);   // loaded HTMLImageElement
  const animRef        = useRef(null);
  const isDraggingText = useRef(false);
  const dragTextId     = useRef(null);
  const dragOffset     = useRef({x:0,y:0});

  const [imgLoaded, setImgLoaded]   = useState(false);
  const [imgName,   setImgName]     = useState("");
  const [imgSize,   setImgSize]     = useState({w:0,h:0});
  const [zoom,      setZoom]        = useState(100);
  const [filters,   setFilters]     = useState(
    Object.fromEntries(FILTERS.map(f=>[f.id,f.v]))
  );
  const [texts,     setTexts]       = useState([]);
  const [selText,   setSelText]     = useState(null); // id
  const [panel,     setPanel]       = useState("adjust"); // adjust|text|presets|crop
  const [showExport,setShowExport]  = useState(false);
  const [status,    setStatus]      = useState("Drop an image to begin");
  const [dirty,     setDirty]       = useState(false);

  // new text form
  const [newText,   setNewText]     = useState({
    text:"Your Text", font:FONTS[0], size:48, color:"#ffffff",
    bold:false, italic:false, shadow:true, stroke:false, strokeColor:"#000000",
    opacity:100, blend:"normal", rotate:0, x:50, y:50
  });

  /* ─── build offscreen when image loads ─── */
  useEffect(()=>{
    if(!imgLoaded) return;
    const img=imgRef.current;
    const off=document.createElement("canvas");
    off.width=img.naturalWidth; off.height=img.naturalHeight;
    offscreenRef.current=off;
    setDirty(true);
  },[imgLoaded]);

  /* ─── redraw whenever anything changes ─── */
  useEffect(()=>{
    if(!dirty||!imgLoaded) return;
    const off=offscreenRef.current;
    const img=imgRef.current;
    if(!off||!img) return;
    renderToCanvas(off, img, filters, texts);
    // copy to preview canvas
    const cv=canvasRef.current;
    if(!cv) return;
    const ctx=cv.getContext("2d");
    const scale=zoom/100;
    cv.width=off.width*scale; cv.height=off.height*scale;
    ctx.clearRect(0,0,cv.width,cv.height);
    ctx.drawImage(off,0,0,cv.width,cv.height);
    // draw selection handles
    const sel=texts.find(t=>t.id===selText);
    if(sel){
      const x=(sel.x/100)*cv.width, y=(sel.y/100)*cv.height;
      ctx.save();
      ctx.translate(x,y);
      ctx.rotate((sel.rotate||0)*Math.PI/180);
      ctx.strokeStyle="#4d9ef7"; ctx.lineWidth=1.5; ctx.setLineDash([4,3]);
      const approxW=sel.text.length*sel.size*0.6*(zoom/100), approxH=sel.size*(zoom/100);
      ctx.strokeRect(-4,-approxH,approxW+8,approxH+4);
      ctx.setLineDash([]);
      ctx.fillStyle="#4d9ef7";
      [[0,0],[-4,-approxH],[approxW+4,-approxH],[approxW+4,4],[-4,4]].forEach(([dx,dy])=>{
        ctx.beginPath(); ctx.arc(dx,dy,4,0,Math.PI*2); ctx.fill();
      });
      ctx.restore();
    }
    setDirty(false);
  },[dirty, imgLoaded, filters, texts, selText, zoom]);

  const triggerRedraw = useCallback(()=>setDirty(true),[]);

  /* ─── load file ─── */
  const loadFile = useCallback((file)=>{
    if(!file||!file.type.startsWith("image/")) return;
    setStatus("Loading…");
    const reader=new FileReader();
    reader.onload=e=>{
      const img=new Image();
      img.onload=()=>{
        imgRef.current=img;
        setImgSize({w:img.naturalWidth,h:img.naturalHeight});
        setImgName(file.name);
        setImgLoaded(true);
        setFilters(Object.fromEntries(FILTERS.map(f=>[f.id,f.v])));
        setTexts([]); setSelText(null);
        setStatus(`${file.name} — ${img.naturalWidth}×${img.naturalHeight}px`);
        setDirty(true);
      };
      img.src=e.target.result;
    };
    reader.readAsDataURL(file);
  },[]);

  /* ─── canvas mouse for text drag ─── */
  const canvasMouseDown=useCallback((e)=>{
    if(!imgLoaded||!canvasRef.current) return;
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=(e.clientX-rect.left)/canvasRef.current.width*100;
    const my=(e.clientY-rect.top)/canvasRef.current.height*100;
    // hit-test texts (last first)
    let hit=null;
    for(let i=texts.length-1;i>=0;i--){
      const t=texts[i];
      const approxW=t.text.length*t.size*0.6*(zoom/100)/canvasRef.current.width*100;
      const approxH=t.size*(zoom/100)/canvasRef.current.height*100;
      if(mx>=t.x-2&&mx<=t.x+approxW+2&&my>=t.y-approxH-2&&my<=t.y+2){hit=t;break;}
    }
    if(hit){
      setSelText(hit.id);
      isDraggingText.current=true;
      dragTextId.current=hit.id;
      dragOffset.current={x:mx-hit.x,y:my-hit.y};
    } else {
      setSelText(null);
    }
  },[texts,imgLoaded,zoom]);

  const canvasMouseMove=useCallback((e)=>{
    if(!isDraggingText.current||!canvasRef.current) return;
    const rect=canvasRef.current.getBoundingClientRect();
    const mx=clamp((e.clientX-rect.left)/canvasRef.current.width*100,0,100);
    const my=clamp((e.clientY-rect.top)/canvasRef.current.height*100,0,100);
    setTexts(prev=>prev.map(t=>t.id===dragTextId.current?{...t,x:mx-dragOffset.current.x,y:my-dragOffset.current.y}:t));
    setDirty(true);
  },[]);

  const canvasMouseUp=useCallback(()=>{ isDraggingText.current=false; },[]);

  /* ─── filter change ─── */
  const setFilter=(id,v)=>{
    setFilters(p=>({...p,[id]:+v}));
    setDirty(true);
  };

  /* ─── preset apply ─── */
  const applyPreset=(p)=>{
    setFilters({...p.vals});
    setDirty(true);
  };

  /* ─── text ops ─── */
  const addText=()=>{
    const id=Date.now().toString();
    setTexts(p=>[...p,{...newText,id,x:50,y:50}]);
    setSelText(id); setDirty(true);
  };
  const deleteText=(id)=>{setTexts(p=>p.filter(t=>t.id!==id));if(selText===id)setSelText(null);setDirty(true);};
  const updateText=(id,k,v)=>{setTexts(p=>p.map(t=>t.id===id?{...t,[k]:v}:t));setDirty(true);};

  /* ─── export ─── */
  const doExport=async(fmt2)=>{
    setShowExport(false);
    if(!imgLoaded){setStatus("No image loaded");return;}
    setStatus(`Exporting ${fmt2.toUpperCase()}…`);
    // render fresh offscreen at full res
    const off=document.createElement("canvas");
    const img=imgRef.current;
    off.width=img.naturalWidth; off.height=img.naturalHeight;
    renderToCanvas(off,img,filters,texts);
    const quality=fmt2==="jpg"?0.92:1;
    const mime=fmt2==="jpg"?"image/jpeg":"image/png";
    off.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download=(imgName||"photo").replace(/\.[^.]+$/,"")+`_edited.${fmt2}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setStatus(`Exported ${Math.round(blob.size/1024)} KB ${fmt2.toUpperCase()} ✓`);
    },mime,quality);
  };

  const resetFilters=()=>{setFilters(Object.fromEntries(FILTERS.map(f=>[f.id,f.v])));setDirty(true);};
  const selTextObj=texts.find(t=>t.id===selText)||null;
  const activeFx=FILTERS.filter(f=>filters[f.id]!==0).length;

  /* ─────────────────────────────── RENDER ─────────────────────────────── */
  return (
    <div style={{
      background:"#1a1a1f",color:"#c8cdd6",
      fontFamily:"'Segoe UI',system-ui,sans-serif",fontSize:12,
      height:"100vh",display:"flex",flexDirection:"column",overflow:"hidden"
    }}>

      {/* ── Top bar ── */}
      <div style={{height:36,background:"#111115",borderBottom:"1px solid #2a2a35",display:"flex",alignItems:"center",padding:"0 12px",gap:2,flexShrink:0}}>
        <span style={{fontSize:11,fontWeight:700,color:"#e8704a",letterSpacing:".1em",marginRight:12}}>PHOTON</span>
        {["File","Edit","Image","Filters"].map(l=>(
          <button key={l} style={{padding:"4px 10px",borderRadius:3,fontSize:11,color:l==="File"?"#e8704a":"#8891a0",border:`1px solid ${l==="File"?"#50301a":"transparent"}`,background:l==="File"?"#1e1410":"none",cursor:"pointer"}}>{l}</button>
        ))}
        <div style={{flex:1}}/>
        {dirty&&<span style={{fontSize:10,color:"#fbbf24",marginRight:8}}>⚙ Rendering…</span>}
        <span style={{fontSize:10,color:"#2a3040"}}>{imgName||"No image loaded"}</span>
      </div>

      <div style={{flex:1,display:"flex",overflow:"hidden"}}>

        {/* ── Sidebar ── */}
        <div style={{width:232,background:"#111115",borderRight:"1px solid #2a2a35",display:"flex",flexDirection:"column",flexShrink:0,overflow:"hidden"}}>

          {/* Upload */}
          <div style={{padding:10,borderBottom:"1px solid #1e1e28"}}>
            <div style={{fontSize:10,fontWeight:600,color:"#464d5c",letterSpacing:".1em",textTransform:"uppercase",marginBottom:7}}>Source</div>
            <div
              style={{border:"1.5px dashed #3a2518",borderRadius:5,padding:"14px 10px",textAlign:"center",cursor:"pointer",background:imgLoaded?"#110d0a":"transparent",transition:".2s"}}
              onClick={()=>fileInputRef.current?.click()}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{e.preventDefault();loadFile(e.dataTransfer.files[0]);}}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={imgLoaded?"#e8704a":"#3a2a1a"} strokeWidth="1.5" strokeLinecap="round" style={{display:"block",margin:"0 auto 6px"}}>
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
              </svg>
              <div style={{fontSize:11,color:imgLoaded?"#c8904a":"#5a6475",marginBottom:2}}>{imgLoaded?"Change Image":"Drop image or click"}</div>
              <div style={{fontSize:10,color:"#343b48"}}>PNG · JPG · WEBP · GIF</div>
              <input ref={fileInputRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>loadFile(e.target.files[0])}/>
            </div>
            {imgLoaded&&(
              <div style={{fontSize:10,lineHeight:2,color:"#464d5c",marginTop:8}}>
                <div><span style={{color:"#667282"}}>{imgSize.w}×{imgSize.h}</span> px</div>
                <div><span style={{color:"#667282"}}>{activeFx}</span> filters active</div>
                <div><span style={{color:"#667282"}}>{texts.length}</span> text layer{texts.length!==1?"s":""}</div>
              </div>
            )}
          </div>

          {/* Panel tabs */}
          <div style={{display:"flex",borderBottom:"1px solid #1e1e28",flexShrink:0}}>
            {[["adjust","⚡ Adjust"],["presets","★ Presets"],["text","T Text"]].map(([id,label])=>(
              <button key={id} onClick={()=>setPanel(id)} style={{flex:1,padding:"8px 4px",fontSize:10,fontWeight:600,color:panel===id?"#e8704a":"#3a4455",background:panel===id?"#150e08":"transparent",borderBottom:panel===id?"2px solid #e8704a":"2px solid transparent",border:"none",cursor:"pointer",letterSpacing:".04em"}}>
                {label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div style={{flex:1,overflowY:"auto",padding:8}}>

            {/* ── Adjust panel ── */}
            {panel==="adjust"&&(
              <>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8,padding:"0 2px"}}>
                  <span style={{fontSize:10,fontWeight:600,color:"#464d5c",letterSpacing:".08em",textTransform:"uppercase"}}>Adjustments</span>
                  <button onClick={resetFilters} style={{fontSize:9,color:"#ef4444",border:"1px solid rgba(239,68,68,.25)",background:"rgba(239,68,68,.05)",borderRadius:3,padding:"2px 7px",cursor:"pointer"}}>Reset</button>
                </div>
                {FILTERS.map(f=>(
                  <div key={f.id} style={{marginBottom:8,background:"#0d0d12",borderRadius:4,padding:"7px 9px",border:`1px solid ${filters[f.id]!==0?"#2a2040":"#1a1a22"}`}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                      <span style={{fontSize:10,color:filters[f.id]!==0?"#a890c8":"#3d4455",fontWeight:600}}>{f.label}</span>
                      <span style={{fontSize:10,color:"#e8704a",fontFamily:"'SF Mono',monospace"}}>{filters[f.id]}{f.unit}</span>
                    </div>
                    <input type="range" min={f.min} max={f.max} value={filters[f.id]}
                      style={{width:"100%",accentColor:"#e8704a",height:3}}
                      onChange={e=>setFilter(f.id,e.target.value)}
                    />
                  </div>
                ))}
              </>
            )}

            {/* ── Presets panel ── */}
            {panel==="presets"&&(
              <>
                <div style={{fontSize:10,fontWeight:600,color:"#464d5c",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8,padding:"0 2px"}}>Presets</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
                  {PRESETS.map(p=>(
                    <button key={p.name} onClick={()=>applyPreset(p)}
                      style={{borderRadius:5,border:"1px solid #1e1e28",background:"#0d0d12",padding:"10px 6px",cursor:"pointer",color:"#8891a0",fontSize:10,fontWeight:600,letterSpacing:".05em",transition:".15s",textAlign:"center"}}
                      onMouseEnter={e=>e.currentTarget.style.borderColor="#e8704a"}
                      onMouseLeave={e=>e.currentTarget.style.borderColor="#1e1e28"}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Text panel ── */}
            {panel==="text"&&(
              <>
                <div style={{fontSize:10,fontWeight:600,color:"#464d5c",letterSpacing:".08em",textTransform:"uppercase",marginBottom:8,padding:"0 2px"}}>Add Text Layer</div>

                {/* new text form */}
                <div style={{background:"#0d0d12",borderRadius:5,border:"1px solid #1e1e28",padding:"9px",marginBottom:8}}>
                  <textarea
                    value={newText.text}
                    onChange={e=>setNewText(p=>({...p,text:e.target.value}))}
                    rows={2}
                    style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#c8cdd6",fontSize:11,padding:"6px 8px",resize:"none",outline:"none",marginBottom:6,fontFamily:"inherit"}}
                  />

                  {/* font */}
                  <div style={{marginBottom:5}}>
                    <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>FONT</div>
                    <select value={newText.font} onChange={e=>setNewText(p=>({...p,font:e.target.value}))}
                      style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#c8cdd6",fontSize:10,padding:"4px 6px",outline:"none"}}>
                      {FONTS.map((f,i)=><option key={f} value={f}>{FONT_LABELS[i]}</option>)}
                    </select>
                  </div>

                  {/* size + color */}
                  <div style={{display:"flex",gap:6,marginBottom:5}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>SIZE</div>
                      <input type="number" min={8} max={300} value={newText.size}
                        onChange={e=>setNewText(p=>({...p,size:+e.target.value}))}
                        style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#e8704a",fontSize:11,padding:"4px 6px",outline:"none",fontFamily:"'SF Mono',monospace"}}
                      />
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>COLOR</div>
                      <div style={{display:"flex",alignItems:"center",gap:4}}>
                        <input type="color" value={newText.color} onChange={e=>setNewText(p=>({...p,color:e.target.value}))}
                          style={{width:28,height:28,border:"1px solid #2a2a35",borderRadius:3,background:"none",cursor:"pointer",padding:2}}/>
                        <input value={newText.color} onChange={e=>setNewText(p=>({...p,color:e.target.value}))}
                          style={{flex:1,background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#c8cdd6",fontSize:10,padding:"4px 5px",outline:"none"}}/>
                      </div>
                    </div>
                  </div>

                  {/* opacity + rotate */}
                  <div style={{display:"flex",gap:6,marginBottom:5}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>OPACITY {newText.opacity}%</div>
                      <input type="range" min={0} max={100} value={newText.opacity}
                        onChange={e=>setNewText(p=>({...p,opacity:+e.target.value}))}
                        style={{width:"100%",accentColor:"#e8704a",height:3}}/>
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>ROTATE {newText.rotate}°</div>
                      <input type="range" min={-180} max={180} value={newText.rotate}
                        onChange={e=>setNewText(p=>({...p,rotate:+e.target.value}))}
                        style={{width:"100%",accentColor:"#e8704a",height:3}}/>
                    </div>
                  </div>

                  {/* blend mode */}
                  <div style={{marginBottom:6}}>
                    <div style={{fontSize:9,color:"#3a4455",marginBottom:3}}>BLEND MODE</div>
                    <select value={newText.blend} onChange={e=>setNewText(p=>({...p,blend:e.target.value}))}
                      style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#c8cdd6",fontSize:10,padding:"4px 6px",outline:"none"}}>
                      {BLEND_MODES.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>

                  {/* toggles */}
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:6}}>
                    {[["bold","B"],["italic","I"],["shadow","Shadow"],["stroke","Stroke"]].map(([k,label])=>(
                      <button key={k} onClick={()=>setNewText(p=>({...p,[k]:!p[k]}))}
                        style={{padding:"3px 8px",borderRadius:3,fontSize:10,fontWeight:k==="bold"?"700":"400",fontStyle:k==="italic"?"italic":"normal",border:`1px solid ${newText[k]?"#e8704a":"#2a2a35"}`,color:newText[k]?"#e8704a":"#4a5260",background:newText[k]?"rgba(232,112,74,.1)":"none",cursor:"pointer"}}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {newText.stroke&&(
                    <div style={{marginBottom:6,display:"flex",alignItems:"center",gap:6}}>
                      <span style={{fontSize:9,color:"#3a4455"}}>STROKE COLOR</span>
                      <input type="color" value={newText.strokeColor} onChange={e=>setNewText(p=>({...p,strokeColor:e.target.value}))}
                        style={{width:24,height:24,border:"1px solid #2a2a35",borderRadius:3,cursor:"pointer",padding:2}}/>
                    </div>
                  )}

                  <button onClick={addText} style={{width:"100%",padding:"8px",borderRadius:4,background:"linear-gradient(135deg,#3a1a08,#2a1205)",border:"1px solid #60301a",color:"#e8a080",fontSize:11,fontWeight:600,cursor:"pointer",letterSpacing:".04em"}}>
                    + Add Text Layer
                  </button>
                </div>

                {/* text layers list */}
                {texts.length>0&&(
                  <>
                    <div style={{fontSize:10,fontWeight:600,color:"#464d5c",letterSpacing:".08em",textTransform:"uppercase",marginBottom:6,padding:"0 2px"}}>Layers</div>
                    {[...texts].reverse().map(t=>(
                      <div key={t.id}
                        onClick={()=>setSelText(t.id)}
                        style={{borderRadius:4,border:`1px solid ${selText===t.id?"#e8704a":"#1e1e28"}`,background:selText===t.id?"#150e08":"#0d0d12",padding:"7px 9px",marginBottom:4,cursor:"pointer",display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:6,height:6,borderRadius:"50%",background:"#e8704a",flexShrink:0}}/>
                        <div style={{flex:1,overflow:"hidden"}}>
                          <div style={{fontSize:10,color:"#8891a0",fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{t.text}</div>
                          <div style={{fontSize:9,color:"#343b48",marginTop:2}}>{t.size}px · {t.blend}</div>
                        </div>
                        {selText===t.id&&(
                          <button onClick={e=>{e.stopPropagation();deleteText(t.id);}}
                            style={{background:"none",border:"none",cursor:"pointer",color:"#ef4444",fontSize:13,opacity:.7,flexShrink:0}}>✕</button>
                        )}
                      </div>
                    ))}

                    {/* selected text edit */}
                    {selTextObj&&(
                      <div style={{background:"#0d0d12",borderRadius:5,border:"1px solid #2a1a10",padding:9,marginTop:4}}>
                        <div style={{fontSize:9,fontWeight:600,color:"#e8704a",letterSpacing:".08em",marginBottom:7}}>EDIT SELECTED LAYER</div>
                        <textarea value={selTextObj.text} onChange={e=>updateText(selText,"text",e.target.value)}
                          rows={2} style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#c8cdd6",fontSize:11,padding:"5px 7px",resize:"none",outline:"none",marginBottom:5,fontFamily:"inherit"}}/>
                        <div style={{display:"flex",gap:5,marginBottom:5}}>
                          <div style={{flex:1}}>
                            <div style={{fontSize:9,color:"#3a4455",marginBottom:2}}>SIZE</div>
                            <input type="number" min={8} max={300} value={selTextObj.size}
                              onChange={e=>updateText(selText,"size",+e.target.value)}
                              style={{width:"100%",background:"#0a0a0f",border:"1px solid #2a2a35",borderRadius:3,color:"#e8704a",fontSize:10,padding:"3px 5px",outline:"none"}}/>
                          </div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:9,color:"#3a4455",marginBottom:2}}>COLOR</div>
                            <input type="color" value={selTextObj.color} onChange={e=>updateText(selText,"color",e.target.value)}
                              style={{width:"100%",height:26,border:"1px solid #2a2a35",borderRadius:3,cursor:"pointer",padding:2}}/>
                          </div>
                        </div>
                        <div style={{marginBottom:5}}>
                          <div style={{fontSize:9,color:"#3a4455",marginBottom:2}}>OPACITY {selTextObj.opacity}%</div>
                          <input type="range" min={0} max={100} value={selTextObj.opacity}
                            onChange={e=>updateText(selText,"opacity",+e.target.value)}
                            style={{width:"100%",accentColor:"#e8704a",height:3}}/>
                        </div>
                        <div style={{marginBottom:5}}>
                          <div style={{fontSize:9,color:"#3a4455",marginBottom:2}}>ROTATE {selTextObj.rotate}°</div>
                          <input type="range" min={-180} max={180} value={selTextObj.rotate}
                            onChange={e=>updateText(selText,"rotate",+e.target.value)}
                            style={{width:"100%",accentColor:"#e8704a",height:3}}/>
                        </div>
                        <div style={{marginBottom:5}}>
                          <div style={{fontSize:9,color:"#3a4455",marginBottom:2}}>POSITION X {selTextObj.x.toFixed(0)}% / Y {selTextObj.y.toFixed(0)}%</div>
                          <div style={{display:"flex",gap:5}}>
                            <input type="range" min={0} max={100} value={selTextObj.x} onChange={e=>updateText(selText,"x",+e.target.value)} style={{flex:1,accentColor:"#e8704a",height:3}}/>
                            <input type="range" min={0} max={100} value={selTextObj.y} onChange={e=>updateText(selText,"y",+e.target.value)} style={{flex:1,accentColor:"#e8704a",height:3}}/>
                          </div>
                        </div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                          {[["bold","B"],["italic","I"],["shadow","Shadow"],["stroke","Stroke"]].map(([k,label])=>(
                            <button key={k} onClick={()=>updateText(selText,k,!selTextObj[k])}
                              style={{padding:"3px 8px",borderRadius:3,fontSize:10,fontWeight:k==="bold"?"700":"400",fontStyle:k==="italic"?"italic":"normal",border:`1px solid ${selTextObj[k]?"#e8704a":"#2a2a35"}`,color:selTextObj[k]?"#e8704a":"#4a5260",background:selTextObj[k]?"rgba(232,112,74,.1)":"none",cursor:"pointer"}}>
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Export button */}
          <div style={{padding:10,borderTop:"1px solid #1e1e28",position:"relative"}}>
            <button
              disabled={!imgLoaded}
              onClick={()=>setShowExport(p=>!p)}
              style={{width:"100%",padding:"9px",borderRadius:4,background:"linear-gradient(135deg,#3a1a08,#2a1205)",border:"1px solid #60301a",color:"#e8a080",fontSize:11,fontWeight:600,letterSpacing:".05em",display:"flex",alignItems:"center",justifyContent:"center",gap:8,cursor:imgLoaded?"pointer":"not-allowed",opacity:imgLoaded?1:.35}}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export ▾
            </button>
            {showExport&&(
              <div style={{position:"absolute",bottom:"calc(100% - 4px)",left:10,right:10,background:"#0d0d12",border:"1px solid #2a2035",borderRadius:5,overflow:"hidden",zIndex:100,boxShadow:"0 -8px 24px rgba(0,0,0,.5)"}}>
                {[["png","PNG — Full quality, transparency"],["jpg","JPG — Smaller file, no alpha"],["webp","WebP — Best compression"]].map(([fmt2,desc])=>(
                  <button key={fmt2} onClick={()=>doExport(fmt2)}
                    style={{width:"100%",padding:"10px 12px",background:"none",border:"none",borderBottom:"1px solid #1a1a22",cursor:"pointer",textAlign:"left",color:"#c8cdd6",display:"flex",flexDirection:"column",gap:2}}
                    onMouseEnter={e=>e.currentTarget.style.background="#1a1a22"}
                    onMouseLeave={e=>e.currentTarget.style.background="none"}>
                    <span style={{fontSize:11,fontWeight:700,color:"#e8a080",letterSpacing:".05em"}}>{fmt2.toUpperCase()}</span>
                    <span style={{fontSize:9,color:"#3a4455"}}>{desc}</span>
                  </button>
                ))}
                <button onClick={()=>setShowExport(false)} style={{width:"100%",padding:"7px",background:"none",border:"none",cursor:"pointer",fontSize:10,color:"#3a4455"}}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        {/* ── Main canvas area ── */}
        <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",background:"#14141a"}}>

          {/* Toolbar */}
          <div style={{height:38,background:"#0e0e14",borderBottom:"1px solid #1e1e28",display:"flex",alignItems:"center",padding:"0 12px",gap:8,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 6px",borderRight:"1px solid #1e1e28"}}>
              {[
                {icon:"↩",title:"Undo (coming soon)",action:()=>{}},
                {icon:"↪",title:"Redo (coming soon)",action:()=>{}},
              ].map(b=>(
                <button key={b.icon} title={b.title} onClick={b.action}
                  style={{width:28,height:28,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"#3a4455",border:"1px solid #1a1a22",background:"none",cursor:"pointer"}}>
                  {b.icon}
                </button>
              ))}
            </div>
            <div style={{display:"flex",alignItems:"center",gap:4,padding:"0 6px",borderRight:"1px solid #1e1e28"}}>
              {panel==="text"&&texts.length>0&&selText&&(
                <button onClick={()=>deleteText(selText)}
                  style={{display:"flex",alignItems:"center",gap:4,padding:"4px 9px",borderRadius:3,fontSize:10,color:"#ef4444",border:"1px solid rgba(239,68,68,.25)",background:"rgba(239,68,68,.06)",cursor:"pointer"}}>
                  🗑 Delete Layer
                </button>
              )}
              {imgLoaded&&<span style={{fontSize:10,color:"#3a4455",fontFamily:"'SF Mono',monospace"}}>{imgSize.w}×{imgSize.h}px</span>}
            </div>
            <div style={{flex:1}}/>
            <div style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{fontSize:10,color:"#3a4455"}}>Zoom</span>
              <button onClick={()=>{setZoom(p=>Math.max(20,p-20));setDirty(true);}}
                style={{width:22,height:22,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",color:"#3a4455",border:"1px solid #1a1a22",background:"none",cursor:"pointer",fontSize:14,lineHeight:1}}>−</button>
              <input type="range" min={20} max={300} value={zoom} style={{width:70,accentColor:"#e8704a"}}
                onChange={e=>{setZoom(+e.target.value);setDirty(true);}}/>
              <button onClick={()=>{setZoom(p=>Math.min(300,p+20));setDirty(true);}}
                style={{width:22,height:22,borderRadius:3,display:"flex",alignItems:"center",justifyContent:"center",color:"#3a4455",border:"1px solid #1a1a22",background:"none",cursor:"pointer",fontSize:14,lineHeight:1}}>+</button>
              <span style={{fontSize:10,color:"#e8704a",fontFamily:"'SF Mono',monospace",minWidth:36,textAlign:"right"}}>{zoom}%</span>
            </div>
            <div style={{width:1,height:24,background:"#1e1e28",marginLeft:4}}/>
            <button onClick={()=>{setZoom(100);setDirty(true);}} style={{fontSize:10,color:"#3a4455",border:"1px solid #1a1a22",background:"none",borderRadius:3,padding:"3px 8px",cursor:"pointer"}}>Fit</button>
          </div>

          {/* Canvas workspace */}
          <div style={{flex:1,overflow:"auto",display:"flex",alignItems:"center",justifyContent:"center",background:"#0c0c11",position:"relative"}}
            onClick={()=>setShowExport(false)}>

            {!imgLoaded?(
              <div style={{textAlign:"center",color:"#2a3040"}}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#1e2a38" strokeWidth="1" strokeLinecap="round" style={{display:"block",margin:"0 auto 12px"}}>
                  <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
                </svg>
                <div style={{fontSize:13,marginBottom:4}}>Drop an image to start editing</div>
                <div style={{fontSize:11,color:"#1a2030"}}>PNG, JPG, WEBP supported</div>
              </div>
            ):(
              <div style={{position:"relative",display:"inline-block",boxShadow:"0 8px 48px rgba(0,0,0,.7)"}}>
                <canvas
                  ref={canvasRef}
                  style={{display:"block",cursor:panel==="text"?"crosshair":"default"}}
                  onMouseDown={canvasMouseDown}
                  onMouseMove={canvasMouseMove}
                  onMouseUp={canvasMouseUp}
                  onMouseLeave={canvasMouseUp}
                />
              </div>
            )}
          </div>

          {/* Transport/status bar */}
          <div style={{height:50,background:"#0e0e14",borderTop:"1px solid #1e1e28",display:"flex",alignItems:"center",padding:"0 14px",gap:14,flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:imgLoaded?"#e8704a":"#2a3040"}}/>
              <span style={{fontSize:11,fontFamily:"'SF Mono',monospace",color:imgLoaded?"#c8904a":"#2a3040"}}>{imgLoaded?`${imgSize.w} × ${imgSize.h}`:"—"}</span>
            </div>
            <div style={{width:1,height:28,background:"#1e1e28"}}/>
            <div>
              <div style={{fontSize:10,color:activeFx>0?"#e8704a":"#2a3040",fontFamily:"'SF Mono',monospace"}}>{activeFx}/8 FX</div>
              <div style={{fontSize:9,color:"#1e2530"}}>active adjustments</div>
            </div>
            <div style={{width:1,height:28,background:"#1e1e28"}}/>
            <div>
              <div style={{fontSize:10,color:texts.length>0?"#8891a0":"#2a3040",fontFamily:"'SF Mono',monospace"}}>{texts.length} layer{texts.length!==1?"s":""}</div>
              <div style={{fontSize:9,color:"#1e2530"}}>text overlays</div>
            </div>
            <div style={{flex:1}}/>
            <span style={{fontSize:10,color:"#2a3040"}}>{status}</span>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div style={{height:20,background:"#0a0a0f",borderTop:"1px solid #111118",display:"flex",alignItems:"center",padding:"0 12px",gap:16,flexShrink:0}}>
        <span style={{fontSize:10,color:"#2a3040"}}>{status}</span>
        {imgLoaded&&<span style={{fontSize:10,color:"#2a4060"}}>Canvas: {Math.round(imgSize.w*(zoom/100))}×{Math.round(imgSize.h*(zoom/100))}px @ {zoom}%</span>}
        {activeFx>0&&<span style={{fontSize:10,color:"#4a3020"}}>{activeFx} adjustments applied</span>}
      </div>
    </div>
  );
}