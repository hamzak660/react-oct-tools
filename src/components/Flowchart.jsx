import { useState, useEffect, useRef } from "react";
import {
  PlayCircle,
  Square,
  Diamond,
  StopCircle,
  Trash2,
  Maximize,
  Download,
} from "lucide-react";

export default function Flowchart() {
  const [nodes, setNodes] = useState([
    { id: 1, type: "start", label: "Start Process", x: 300, y: 150 },
    { id: 2, type: "process", label: "Collect Data", x: 600, y: 150 },
    { id: 3, type: "decision", label: "Is Valid?", x: 900, y: 150 },
    { id: 4, type: "end", label: "Success", x: 1200, y: 150 },
  ]);

  const [connections] = useState([
    { from: 1, to: 2 },
    { from: 2, to: 3 },
    { from: 3, to: 4 },
  ]);

  const [dragging, setDragging] = useState(null);
  const offset = useRef({ x: 0, y: 0 });

  const colors = {
    start: "#238636",
    process: "#1f6feb",
    decision: "#9e6a03",
    end: "#da3633",
  };

  // ===== DRAG =====
  useEffect(() => {
    const move = (e) => {
      if (!dragging) return;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging.id
            ? {
                ...n,
                x: e.clientX - offset.current.x,
                y: e.clientY - offset.current.y,
              }
            : n
        )
      );
    };

    const up = () => setDragging(null);

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
  }, [dragging]);

  const addNode = (type) => {
    setNodes((prev) => [
      ...prev,
      {
        id: Date.now(),
        type,
        label: `New ${type}`,
        x: 500,
        y: 300,
      },
    ]);
  };

  const deleteNode = (id) => {
    setNodes((n) => n.filter((x) => x.id !== id));
  };

  const calcPath = (from, to) => {
    return `M ${from.x + 200} ${from.y + 40}
            C ${from.x + 300} ${from.y + 40},
              ${to.x - 100} ${to.y + 40},
              ${to.x} ${to.y + 40}`;
  };

  return (
    <div className="w-full h-screen bg-[#0d1117] text-[#c9d1d9] relative overflow-hidden">

      {/* GRID */}
      <div className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "30px 30px",
        }}
      />

      {/* ===== SIDEBAR (EXACT SAME STYLE) ===== */}
      <div className="fixed left-6 top-6 bottom-6 flex flex-col gap-4 z-50">

        {/* NODE TOOLS */}
        <div className="bg-[#161b22] border border-[#30363d] p-2 rounded-2xl flex flex-col gap-2">
          <button onClick={() => addNode("start")} className="p-3 hover:bg-green-900/20 text-green-500 rounded-xl">
            <PlayCircle />
          </button>

          <button onClick={() => addNode("process")} className="p-3 hover:bg-blue-900/20 text-blue-500 rounded-xl">
            <Square />
          </button>

          <button onClick={() => addNode("decision")} className="p-3 hover:bg-yellow-900/20 text-yellow-500 rounded-xl">
            <Diamond />
          </button>

          <button onClick={() => addNode("end")} className="p-3 hover:bg-red-900/20 text-red-500 rounded-xl">
            <StopCircle />
          </button>
        </div>

        {/* UTILS */}
        <div className="mt-auto bg-[#161b22] border border-[#30363d] p-2 rounded-2xl flex flex-col gap-2">

          <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl">
            <Maximize />
          </button>

          <button className="p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl">
            <Download />
          </button>

          <button className="p-3 text-red-500 hover:bg-red-900/20 rounded-xl">
            <Trash2 />
          </button>

        </div>
      </div>

      {/* ===== SVG CONNECTIONS ===== */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {connections.map((c, i) => {
          const from = nodes.find((n) => n.id === c.from);
          const to = nodes.find((n) => n.id === c.to);
          if (!from || !to) return null;

          return (
            <path
              key={i}
              d={calcPath(from, to)}
              stroke="#484f58"
              strokeWidth="3"
              fill="none"
            />
          );
        })}
      </svg>

      {/* ===== NODES ===== */}
      {nodes.map((node) => (
        <div
          key={node.id}
          onMouseDown={(e) => {
            offset.current = {
              x: e.clientX - node.x,
              y: e.clientY - node.y,
            };
            setDragging(node);
          }}
          className="absolute bg-[#161b22] border border-[#30363d] rounded-xl p-4 min-w-[200px] cursor-grab"
          style={{
            left: node.x,
            top: node.y,
            borderLeft: `5px solid ${colors[node.type]}`,
          }}
        >
          <input
            value={node.label}
            onChange={(e) =>
              setNodes((prev) =>
                prev.map((n) =>
                  n.id === node.id ? { ...n, label: e.target.value } : n
                )
              )
            }
            className="bg-transparent outline-none w-full text-white"
          />

          <button
            onClick={() => deleteNode(node.id)}
            className="absolute -top-2 -right-2 bg-red-600 p-1 rounded-full"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}