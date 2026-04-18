import { useState, useEffect } from "react";
import {
  Scissors,
  QrCode,
  Copy,
  Sparkles,
  Link as LinkIcon,
  MousePointer2,
  Download,
} from "lucide-react";

export default function LinkManager() {
  const [tab, setTab] = useState("shortener");

  const [url, setUrl] = useState("");
  const [alias, setAlias] = useState("");
  const [links, setLinks] = useState([]);

  const [qrUrl, setQrUrl] = useState("");
  const [qrColor, setQrColor] = useState("#3b82f6");
  const [qrSize, setQrSize] = useState(400);
  const [qrSrc, setQrSrc] = useState("");

  // INIT SAMPLE
  useEffect(() => {
    setLinks([
      {
        short: "cloud.link/design-docs",
        long: "https://company.sharepoint.com/assets/2024",
        clicks: 128,
      },
    ]);
  }, []);

  // SHORTEN
  const shortenLink = () => {
    if (!url) return;

    const id = Math.random().toString(36).substring(2, 6);
    const short = `cloud.link/${alias || id}`;

    setLinks((prev) => [
      { short, long: url, clicks: 0, isNew: true },
      ...prev,
    ]);

    setUrl("");
    setAlias("");
  };

  // COPY
  const copyLink = (text) => {
    navigator.clipboard.writeText(text);
  };

  // OPEN QR
  const openQR = (link) => {
    setTab("qr");
    setQrUrl(link);
  };

  // QR GENERATION
  useEffect(() => {
    if (!qrUrl) {
      setQrSrc("");
      return;
    }

    const timeout = setTimeout(() => {
      const color = qrColor.replace("#", "");
      setQrSrc(
        `https://api.qrserver.com/v1/create-qr-code/?size=${qrSize}x${qrSize}&data=${encodeURIComponent(
          qrUrl
        )}&color=${color}`
      );
    }, 300);

    return () => clearTimeout(timeout);
  }, [qrUrl, qrColor, qrSize]);

  return (
    <div className="w-full h-full flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-[#1e293b] rounded-3xl border border-slate-800 overflow-hidden">

        {/* TABS */}
        <div className="px-8 pt-6 border-b border-slate-800 flex gap-8">
          <button
            onClick={() => setTab("shortener")}
            className={`pb-3 flex items-center gap-2 text-sm font-bold ${
              tab === "shortener"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-slate-500"
            }`}
          >
            <Scissors size={16} /> Shortener
          </button>

          <button
            onClick={() => setTab("qr")}
            className={`pb-3 flex items-center gap-2 text-sm font-bold ${
              tab === "qr"
                ? "text-blue-500 border-b-2 border-blue-500"
                : "text-slate-500"
            }`}
          >
            <QrCode size={16} /> QR Creator
          </button>
        </div>

        {/* SHORTENER */}
        {tab === "shortener" && (
          <div className="p-8 space-y-6">

            {/* INPUT */}
            <div className="space-y-4">
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste a long URL..."
                className="w-full px-4 py-4 bg-[#0f172a] border border-slate-700 rounded-2xl"
              />

              <div className="flex gap-3">
                <input
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="custom-alias"
                  className="flex-1 px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl"
                />

                <button
                  onClick={shortenLink}
                  className="bg-blue-600 px-6 rounded-xl"
                >
                  Shorten
                </button>
              </div>
            </div>

            {/* LIST */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {links.map((l, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-4 bg-[#0f172a] rounded-xl border border-slate-800"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-slate-800 flex items-center justify-center rounded-xl">
                      {l.isNew ? <Sparkles size={18} /> : <LinkIcon size={18} />}
                    </div>

                    <div>
                      <p className="text-blue-400 font-bold">{l.short}</p>
                      <p className="text-xs text-gray-500">{l.long}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-gray-400">
                    <span className="text-xs flex items-center gap-1">
                      <MousePointer2 size={12} /> {l.clicks}
                    </span>

                    <button onClick={() => copyLink(l.short)}>
                      <Copy size={16} />
                    </button>

                    <button onClick={() => openQR(l.long)}>
                      <QrCode size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QR */}
        {tab === "qr" && (
          <div className="p-8 grid md:grid-cols-2 gap-6">

            {/* CONTROLS */}
            <div className="space-y-4">
              <input
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 bg-[#0f172a] border border-slate-700 rounded-xl"
              />

              <input
                type="color"
                value={qrColor}
                onChange={(e) => setQrColor(e.target.value)}
                className="w-full h-10"
              />

              <select
                value={qrSize}
                onChange={(e) => setQrSize(e.target.value)}
                className="w-full px-3 py-2 bg-[#0f172a] border border-slate-700 rounded-lg"
              >
                <option value={200}>200</option>
                <option value={400}>400</option>
                <option value={800}>800</option>
              </select>

              <button
                onClick={() => window.open(qrSrc, "_blank")}
                className="w-full bg-blue-600 py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Download size={16} /> Download QR
              </button>
            </div>

            {/* PREVIEW */}
            <div className="flex items-center justify-center bg-[#0f172a] rounded-2xl min-h-[250px]">
              {!qrSrc ? (
                <div className="text-gray-600 flex flex-col items-center">
                  <QrCode size={40} />
                  <span className="text-xs">Enter URL</span>
                </div>
              ) : (
                <img
                  src={qrSrc}
                  alt="QR"
                  className="bg-white p-3 rounded-xl"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}