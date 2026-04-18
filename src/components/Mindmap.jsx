import { useState, useRef, useEffect } from "react";
import {
  LayoutTemplate,
  GitBranch,
  Leaf,
  Shrink,
  Save,
  RefreshCcw,
  Plus,
  X,
} from "lucide-react";

export default function MindMap() {
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);

  const [dragging, setDragging] = useState(null);
  const [connecting, setConnecting] = useState(null);

  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const offset = useRef({ x: 0, y: 0 });

  // INIT
  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    setNodes([
      { id: 1, type: "root", label: "Central Idea", x: w / 2 - 80, y: h / 2 },
      { id: 2, type: "branch", label: "Strategy", x: w / 2 - 300, y: h / 2 },
      { id: 3, type: "branch", label: "Growth", x: w / 2 + 150, y: h / 2 },
    ]);

    setConnections([
      { from: 1, to: 2 },
      { from: 1, to: 3 },
    ]);
  }, []);

  // DRAGGING
  useEffect(() => {
    const handleMove = (e) => {
      if (dragging) {
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
      }
    };

    const handleUp = () => {
      setDragging(null);
      setConnecting(null);
    };

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleUp);

    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleUp);
    };
  }, [dragging, connecting]);

  // ADD NODE
  const addNode = (type) => {
    const newNode = {
      id: Date.now(),
      type,
      label: type === "root" ? "New Topic" : "New Idea",
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };
    setNodes((prev) => [...prev, newNode]);
  };

  // DELETE
  const deleteNode = (id) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setConnections((prev) =>
      prev.filter((c) => c.from !== id && c.to !== id)
    );
  };

  // CONNECT
  const handleConnect = (toId) => {
    if (!connecting || connecting === toId) return;

    const exists = connections.some(
      (c) =>
        (c.from === connecting && c.to === toId) ||
        (c.from === toId && c.to === connecting)
    );

    if (!exists) {
      setConnections((prev) => [...prev, { from: connecting, to: toId }]);
    }

    setConnecting(null);
  };

  // DRAW LINES
  const renderLines = () => {
    return connections.map((c, i) => {
      const from = nodes.find((n) => n.id === c.from);
      const to = nodes.find((n) => n.id === c.to);
      if (!from || !to) return null;

      return (
        <line
          key={i}
          x1={from.x + 80}
          y1={from.y + 40}
          x2={to.x + 80}
          y2={to.y + 40}
          stroke="#475569"
          strokeWidth="2"
          onClick={() =>
            setConnections((prev) => prev.filter((_, idx) => idx !== i))
          }
        />
      );
    });
  };

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#0f172a] text-white">

      {/* Sidebar */}
      <div className="absolute left-6 top-6 flex flex-col gap-4 z-50">

        <div className="bg-[#1e293b]/80 p-2 rounded-3xl flex flex-col gap-2">
          <button onClick={() => addNode("root")} className="p-3 text-indigo-400">
            <LayoutTemplate />
          </button>
          <button onClick={() => addNode("branch")} className="p-3 text-pink-400">
            <GitBranch />
          </button>
          <button onClick={() => addNode("leaf")} className="p-3 text-green-400">
            <Leaf />
          </button>
        </div>

        <div className="bg-[#1e293b]/80 p-2 rounded-3xl flex flex-col gap-2">
          <button className="p-3">
            <Shrink />
          </button>
          <button
            onClick={() => {
              const data = { nodes, connections };
              const blob = new Blob([JSON.stringify(data)], {
                type: "application/json",
              });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = "mindmap.json";
              a.click();
            }}
            className="p-3"
          >
            <Save />
          </button>
          <button
            onClick={() => {
              setNodes([]);
              setConnections([]);
            }}
            className="p-3 text-red-400"
          >
            <RefreshCcw />
          </button>
        </div>
      </div>

      {/* SVG LINES */}
      <svg ref={svgRef} className="absolute inset-0 w-full h-full z-0">
        {renderLines()}
      </svg>

      {/* NODES */}
      <div ref={canvasRef} className="w-full h-full relative z-10">
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
            onMouseUp={() => handleConnect(node.id)}
            style={{
              left: node.x,
              top: node.y,
              position: "absolute",
            }}
            className="bg-[#1e293b] border border-[#334155] rounded-2xl px-4 py-3 min-w-[160px] cursor-grab"
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
              className="bg-transparent text-center w-full outline-none"
            />

            {/* CONNECT PORT */}
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                setConnecting(node.id);
              }}
              className="w-5 h-5 bg-indigo-500 rounded-full mx-auto mt-2 flex items-center justify-center cursor-crosshair"
            >
              <Plus size={12} />
            </div>

            {/* DELETE */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteNode(node.id);
              }}
              className="absolute -top-2 -right-2 bg-gray-800 rounded-full p-1"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}