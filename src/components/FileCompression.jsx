import { useState, useRef } from "react";
import { Plus, Image as ImageIcon, Download, TrendingDown, Zap } from "lucide-react";

export default function FileCompression() {
  const [files, setFiles] = useState([]);
  const [strength, setStrength] = useState(50);
  const inputRef = useRef();

  const getLabel = () => {
    if (strength < 30) return { text: "PREMIUM QUALITY", color: "bg-emerald-600" };
    if (strength > 70) return { text: "MAX COMPRESSION", color: "bg-orange-600" };
    return { text: "BALANCED", color: "bg-blue-600" };
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
        result: null
      }));

    setFiles(prev => [...newFiles, ...prev]);
  };

  const processImage = (id) => {
    setFiles(prev =>
      prev.map(f =>
        f.id === id ? { ...f, status: "processing", progress: 0 } : f
      )
    );

    let progress = 0;

    const interval = setInterval(() => {
      progress += Math.random() * 20;

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? { ...f, progress: Math.min(progress, 90) }
            : f
        )
      );

      if (progress >= 90) {
        clearInterval(interval);
        compress(id);
      }
    }, 80);
  };

  const compress = async (id) => {
    const fileObj = files.find(f => f.id === id);
    const img = new Image();
    img.src = fileObj.preview;
    await img.decode();

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const quality = (100 - strength) / 100;

    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);

      setFiles(prev =>
        prev.map(f =>
          f.id === id
            ? {
                ...f,
                status: "done",
                progress: 100,
                result: {
                  url,
                  size: blob.size,
                  savings: Math.max(
                    0,
                    Math.round(((f.file.size - blob.size) / f.file.size) * 100)
                  )
                }
              }
            : f
        )
      );
    }, "image/jpeg", quality);
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
  };

  const label = getLabel();

  return (
    <div className="w-full h-full flex items-center justify-center p-4 mt-50">

      <div className="w-full max-w-2xl bg-[#1e293b] rounded-[2.5rem] shadow-2xl border border-slate-800 flex flex-col">

        <div className="p-6 md:p-8 space-y-8">

          {/* Slider */}
          <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-800 space-y-5 ">
            <div className="flex justify-between items-end">
              <div>
                <label className="text-sm font-extrabold text-slate-200 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Optimization Target
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  Balance quality and file size
                </p>
              </div>

              <div className={`${label.color} text-white text-[11px] font-black px-3 py-1 rounded-lg`}>
                {label.text} ({strength}%)
              </div>
            </div>

            <input
              type="range"
              min="5"
              max="95"
              value={strength}
              onChange={(e) => setStrength(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Drop Zone */}
          <div
            onClick={() => inputRef.current.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleFiles(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-700 bg-[#1e293b] rounded-[2rem] p-12 text-center cursor-pointer"
          >
            <Plus className="mx-auto mb-4" />
            <h2 className="text-xl font-bold">Drop your assets here</h2>
            <p className="text-slate-400 text-sm">
              Supports JPG, PNG, WebP
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Queue */}
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {files.map(f => (
              <div key={f.id} className="bg-slate-900/40 p-4 rounded-2xl border border-slate-800 flex flex-col gap-4 tw">

                <div className="flex justify-between items-center">
                  <div className="flex gap-3 items-center">
                    <img src={f.preview} className="w-12 h-12 object-cover rounded-xl" />
                    <div>
                      <h4 className="text-sm font-bold">{f.file.name}</h4>
                      <p className="text-xs text-gray-400">{formatBytes(f.file.size)}</p>
                    </div>
                  </div>

                  {f.status === "idle" && (
                    <button
                      onClick={() => processImage(f.id)}
                      className="bg-blue-600 px-4 py-2 rounded text-xs"
                    >
                      OPTIMIZE
                    </button>
                  )}

                  {f.status === "done" && (
                    <a
                      href={f.result.url}
                      download={"optimized_" + f.file.name}
                      className="mf bg-slate-800 px-4 py-2 rounded text-xs flex items-center gap-2"
                    >
                      <Download size={14} /> SAVE
                    </a>
                  )}
                </div>

                {f.status === "processing" && (
                  <div className="w-full bg-slate-800 h-2 rounded">
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: f.progress + "%" }}
                    />
                  </div>
                )}

                {f.status === "done" && (
                  <div className="text-xs text-emerald-400 flex items-center gap-2">
                    <TrendingDown size={14} /> -{f.result.savings}%
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}