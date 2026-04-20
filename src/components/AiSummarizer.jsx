import { useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
// ✅ FIX: stable worker (Vite-safe)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

export default function AiSummarizer() {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 📄 Extract PDF text
  const extractText = async (file) => {
    try {
      const reader = new FileReader();

      reader.onload = async function () {
        const typedarray = new Uint8Array(this.result);

        const pdf = await pdfjsLib.getDocument(typedarray).promise;

        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();

          const strings = content.items.map((item) => item.str);
          fullText += strings.join(" ") + "\n";
        }

        setText(fullText);
      };

      reader.readAsArrayBuffer(file);
    } catch (err) {
      setError("PDF read error: " + err.message);
    }
  };

  // 📤 Upload handler
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    setText("");
    setSummary("");
    setError("");

    await extractText(file);
  };

  // 🧹 Clean text (IMPORTANT for API stability)
  const cleanText = (input) => {
    return input
      .replace(/\s+/g, " ")
      .replace(/[^a-zA-Z0-9.,!? \n]/g, "")
      .trim();
  };

  // 🤖 Summarize using Groq
  const summarize = async () => {
    setLoading(true);
    setError("");

    try {
      const cleaned = cleanText(text).slice(0, 6000);

      const res = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              {
                role: "user",
                content: `Summarize this document in clear bullet points and short conclusion:\n\n${cleaned}`,
              },
            ],
          }),
        }
      );

      const raw = await res.text();

      if (!res.ok) {
        throw new Error(raw);
      }

      const data = JSON.parse(raw);

      setSummary(
        data?.choices?.[0]?.message?.content || "No summary generated."
      );
    } catch (err) {
      setError(err.message || "Something went wrong");
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-6 md:p-10 text-white">

      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold">AI PDF Summarizer</h1>
        <p className="text-gray-400 text-sm mt-1">
          Upload PDF → Extract → Summarize with AI
        </p>
      </div>

      {/* UPLOAD */}
      <div className="bg-[#111827] border border-gray-800 rounded-xl p-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleUpload}
          className="text-sm"
        />

        {fileName && (
          <div className="mt-3 text-xs text-gray-400">
            Loaded: {fileName}
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-4 text-red-400 text-xs bg-red-950/30 p-3 rounded">
          {error}
        </div>
      )}

      {/* TEXT PREVIEW */}
      {text && (
        <div className="mt-6 bg-[#0b1220] border border-gray-800 rounded-lg p-4 max-h-52 overflow-auto text-xs text-gray-400">
          {text.slice(0, 1200)}...
        </div>
      )}

      {/* BUTTON */}
      {text && (
        <button
          onClick={summarize}
          disabled={loading}
          className="mt-6 bg-blue-600 hover:bg-blue-500 px-5 py-2.5 rounded-lg text-sm font-medium"
        >
          {loading ? "Summarizing..." : "Generate Summary"}
        </button>
      )}

      {/* SUMMARY */}
      {summary && (
        <div className="mt-8 bg-[#020617] border border-gray-800 rounded-xl p-6">
          <h2 className="text-sm font-semibold text-blue-400 mb-3">
            Summary
          </h2>

          <div className="text-gray-300 text-sm whitespace-pre-line">
            {summary}
          </div>
        </div>
      )}
    </div>
  );
}