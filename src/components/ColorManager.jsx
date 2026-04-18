import { useState } from "react";
import {
  Shuffle,
  Save,
  Copy,
  ExternalLink,
  Heart,
  Zap,
} from "lucide-react";

export default function ColorManager() {
  const [creatorColors, setCreatorColors] = useState([
    "#58a6ff",
    "#1f6feb",
    "#238636",
    "#f85149",
    "#8b949e",
  ]);

  const [palettes, setPalettes] = useState([
    {
      name: "Deep Space",
      colors: ["#0d1117", "#161b22", "#30363d", "#58a6ff", "#1f6feb"],
    },
    {
      name: "Cyber Neon",
      colors: ["#0a0a0a", "#f032e6", "#bcfd4c", "#00ffff", "#ffffff"],
    },
  ]);

  const [toast, setToast] = useState("");

  const randomHex = () =>
    "#" + Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0");

  const updateColor = (i, color) => {
    const updated = [...creatorColors];
    updated[i] = color;
    setCreatorColors(updated);
  };

  const shuffle = () => {
    setCreatorColors(creatorColors.map(() => randomHex()));
  };

  const savePalette = () => {
    const name = prompt("Enter palette name") || "Untitled";
    setPalettes([{ name, colors: creatorColors }, ...palettes]);
    showToast("Palette saved!");
  };

  const loadPalette = (colors) => {
    setCreatorColors(colors);
    showToast("Loaded into workspace!");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePalettes = () => {
    const newOnes = Array.from({ length: 6 }).map(() => ({
      name: "Inspiration",
      colors: Array.from({ length: 5 }).map(() => randomHex()),
    }));

    setPalettes([...newOnes, ...palettes]);
  };

  const copy = (hex) => {
    navigator.clipboard.writeText(hex);
    showToast(`Copied ${hex}`);
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 md:p-12 relative">

      {/* Creator */}
      <section className="mb-12">
        <div className="flex justify-between mb-6">
          <h2 className="text-xs text-gray-500 uppercase tracking-widest">
            Editor Workspace
          </h2>

          <div className="flex gap-3">
            <button onClick={shuffle} className="text-blue-400 text-xs flex gap-1">
              <Shuffle className="w-4 h-4" /> Shuffle
            </button>

            <button
              onClick={savePalette}
              className="text-emerald-400 text-xs flex gap-1"
            >
              <Save className="w-4 h-4" /> Save
            </button>
          </div>
        </div>

        <div className="flex gap-3 h-56">
          {creatorColors.map((color, i) => (
            <div key={i} className="flex-1 flex flex-col gap-2">
              <div
                className="flex-1 rounded-xl relative"
                style={{ backgroundColor: color }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => updateColor(i, e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>

              <div className="flex justify-between text-xs text-gray-400">
                {color}
                <button onClick={() => copy(color)}>
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Actions */}
      <div className="flex justify-between mb-8">
        <button
          onClick={generatePalettes}
          className="bg-[#161b22] px-4 py-2 rounded-xl text-xs flex gap-2"
        >
          <Zap className="w-4 h-4" /> Generate
        </button>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {palettes.map((p, i) => (
          <div
            key={i}
            className="bg-[#161b22] border border-gray-800 p-4 rounded-xl"
          >
            <div className="flex justify-between mb-3">
              <h3 className="text-xs text-gray-400">{p.name}</h3>

              <div className="flex gap-2">
                <button onClick={() => loadPalette(p.colors)}>
                  <ExternalLink className="w-4 h-4" />
                </button>
                <Heart className="w-4 h-4" />
              </div>
            </div>

            <div className="flex h-20 rounded-lg overflow-hidden mb-3">
              {p.colors.map((c, i) => (
                <div
                  key={i}
                  onClick={() => copy(c)}
                  className="flex-1 cursor-pointer"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>

            <p className="text-[10px] text-gray-600">
              {p.colors.join(" ")}
            </p>
          </div>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-blue-600 px-6 py-2 rounded-full text-sm">
          {toast}
        </div>
      )}
    </div>
  );
}