import { useState, useRef } from "react";
import { Plus, Download, TrendingDown, Zap, ImageIcon, CheckCircle2 } from "lucide-react";

export default function FileCompression() {
  const [files, setFiles] = useState([]);
  const [strength, setStrength] = useState(50);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef();

  const getLabel = () => {
    if (strength < 30) return { text: "Premium Quality", color: "quality", pct: strength };
    if (strength > 70) return { text: "Max Compression", color: "max", pct: strength };
    return { text: "Balanced", color: "balanced", pct: strength };
  };

  const handleFiles = (fileList) => {
    const newFiles = Array.from(fileList)
      .filter(f => f.type.startsWith("image/"))
      .map(file => ({
        id: Math.random().toString(36).slice(2),
        file,
        preview: URL.createObjectURL(file),
        status: "idle",
        progress: 0,
        result: null,
      }));
    setFiles(prev => [...newFiles, ...prev]);
  };

  const processImage = (id) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, status: "processing", progress: 0 } : f));
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      setFiles(prev => prev.map(f => f.id === id ? { ...f, progress: Math.min(progress, 90) } : f));
      if (progress >= 90) { clearInterval(interval); compress(id); }
    }, 80);
  };

  const compress = async (id) => {
    const fileObj = files.find(f => f.id === id);
    const img = new Image();
    img.src = fileObj.preview;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext("2d").drawImage(img, 0, 0);
    const quality = (100 - strength) / 100;
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      setFiles(prev => prev.map(f => f.id === id ? {
        ...f, status: "done", progress: 100,
        result: { url, size: blob.size, savings: Math.max(0, Math.round(((f.file.size - blob.size) / f.file.size) * 100)) }
      } : f));
    }, "image/jpeg", quality);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    const k = 1024, sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  };

  const label = getLabel();

  return (
    <div className="compressor-root">
      <div className="compressor-card">


        {/* Slider Section */}
        <div className="slider-section">
          <div className="slider-top">
            <span className="slider-label">Compression Strength</span>
            <span className={`slider-badge badge-${label.color}`}>{label.text}</span>
          </div>

          <div className="slider-track-wrap">
            <input
              type="range"
              min="5"
              max="95"
              value={strength}
              onChange={(e) => setStrength(Number(e.target.value))}
              className="compressor-slider"
              style={{ "--val": `${((strength - 5) / 90) * 100}%` }}
            />
            <div className="slider-labels">
              <span>High Quality</span>
              <span>{strength}%</span>
              <span>Max Compression</span>
            </div>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          className={`dropzone ${dragging ? "dropzone-active" : ""}`}
          onClick={() => inputRef.current.click()}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
        >
          <div className="dropzone-icon">
            <ImageIcon size={28} />
          </div>
          <p className="dropzone-heading">Drop images here</p>
          <p className="dropzone-sub">JPG · PNG · WebP · Click to browse</p>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        </div>

        {/* File Queue */}
        {files.length > 0 && (
          <div className="file-queue">
            {files.map(f => (
              <div key={f.id} className={`file-card ${f.status === "done" ? "file-card-done" : ""}`}>

                <img src={f.preview} className="file-thumb" alt={f.file.name} />

                <div className="file-info">
                  <p className="file-name">{f.file.name}</p>
                  <p className="file-size">
                    {formatBytes(f.file.size)}
                    {f.status === "done" && (
                      <span className="file-size-after"> → {formatBytes(f.result.size)}</span>
                    )}
                  </p>

                  {f.status === "processing" && (
                    <div className="progress-wrap">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: f.progress + "%" }} />
                      </div>
                      <span className="progress-pct">{Math.round(f.progress)}%</span>
                    </div>
                  )}

                  {f.status === "done" && (
                    <div className="savings-badge">
                      <TrendingDown size={12} />
                      <span>Saved {f.result.savings}%</span>
                    </div>
                  )}
                </div>

                <div className="file-action">
                  {f.status === "idle" && (
                    <button className="btn-optimize" onClick={() => processImage(f.id)}>
                      <Zap size={14} /> Optimize
                    </button>
                  )}
                  {f.status === "processing" && (
                    <div className="spinner" />
                  )}
                  {f.status === "done" && (
                    <a href={f.result.url} download={"optimized_" + f.file.name} className="btn-download">
                      <Download size={14} />
                    </a>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}