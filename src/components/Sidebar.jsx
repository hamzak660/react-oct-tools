// src/components/Sidebar.jsx
import { useState, useRef, useEffect } from "react";
import { tools } from "../data/tools";
import { Search, ChevronLeft, ChevronRight, Star } from "lucide-react";

function TooltipPortal({ label, anchorRef, visible }) {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (visible && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
    }
  }, [visible, anchorRef]);

  if (!visible) return null;

  return (
    <div style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateY(-50%)", zIndex: 9999, pointerEvents: "none" }}>
      <div className="bg-[#1e2530] border border-gray-700 text-gray-200 text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-xl">
        {label}
        <span style={{ position: "absolute", right: "100%", top: "50%", transform: "translateY(-50%)", width: 0, height: 0, borderTop: "4px solid transparent", borderBottom: "4px solid transparent", borderRight: "5px solid #374151" }} />
      </div>
    </div>
  );
}

function NavItem({ tool, isActive, collapsed, onClick, isFav, onToggleFav }) {
  const [hovered, setHovered] = useState(false);
  const btnRef = useRef(null);
  const Icon = tool.icon;

  return (
    <>
      <div
        className="relative group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <button
          ref={btnRef}
          onClick={() => onClick(tool.id)}
          className={`
            relative w-full flex items-center text-sm transition-all border-l-2
            ${collapsed ? "justify-center px-0 py-3" : "px-6 py-4 gap-3"}
            ${isActive
              ? "bg-blue-500/10 border-blue-500 text-white"
              : "border-transparent text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"}
          `}
        >
          {Icon && (
            <span className={`flex-shrink-0 transition-colors ${isActive ? "text-blue-400" : "text-gray-500"}`}>
              <Icon size={16} strokeWidth={1.8} />
            </span>
          )}
          {!collapsed && <span className="truncate flex-1 text-left">{tool.label}</span>}
        </button>

        {/* ⭐ Star button — only in expanded mode */}
        {!collapsed && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFav(tool.id); }}
            className={`
              absolute right-3 top-1/2 -translate-y-1/2
              p-1.5 rounded-md transition-all duration-150
              hover:bg-gray-700
              ${isFav
                ? "text-yellow-400 opacity-100"
                : "text-gray-600 opacity-0 group-hover:opacity-100"}
            `}
          >
            <Star size={14} fill={isFav ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      {collapsed && (
        <TooltipPortal label={tool.label} anchorRef={btnRef} visible={hovered} />
      )}
    </>
  );
}

export default function Sidebar({ setActiveTool, activeTool }) {
  const [search, setSearch] = useState("");
  const [collapsed, setCollapsed] = useState(false);
  const [favorites, setFavorites] = useState(() =>
    JSON.parse(localStorage.getItem("dashboard-favorites") || "[]")
  );

  const toggleFav = (id) => {
    setFavorites(prev => {
      const updated = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem("dashboard-favorites", JSON.stringify(updated));
      return updated;
    });
  };

  const filtered = tools
    .filter(t => t.label.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      return 0;
    });

  return (
    <aside className={`flex flex-col border-r border-gray-800 bg-[#161b22] h-full z-30 transition-all duration-200 ease-in-out flex-shrink-0 ${collapsed ? "w-14" : "w-72"}`}>
      
      {/* Header */}
      <div className={`border-b border-gray-800 flex-shrink-0 ${collapsed ? "p-3 flex flex-col items-center" : "p-6"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between mb-4"}`}>
          {!collapsed && (
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              tools
            </h1>
          )}
          <button
            onClick={() => { setCollapsed(c => !c); setSearch(""); }}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-gray-700 bg-[#1e2530] text-gray-500 hover:text-gray-200 hover:bg-[#263044] hover:border-gray-600 transition-all duration-150 flex-shrink-0"
          >
            {collapsed ? <ChevronRight size={13} strokeWidth={2.2} /> : <ChevronLeft size={13} strokeWidth={2.2} />}
          </button>
        </div>

        {!collapsed && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search AI tools..."
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-gray-200 placeholder-gray-600"
            />
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 [scrollbar-width:thin] [scrollbar-color:#2d3748_transparent]">
        {!collapsed && favorites.length > 0 && (
          <p className="px-6 pt-2 pb-1 text-[10px] text-yellow-500/60 font-mono tracking-widest uppercase">Favourites</p>
        )}

        {!collapsed && filtered.length === 0 && (
          <p className="text-xs text-gray-600 text-center px-4 py-5">No tools match "{search}"</p>
        )}

        {filtered.map(tool => (
          <NavItem
            key={tool.id}
            tool={tool}
            isActive={activeTool === tool.id}
            collapsed={collapsed}
            onClick={setActiveTool}
            isFav={favorites.includes(tool.id)}
            onToggleFav={toggleFav}
          />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="border-t border-gray-800 px-6 py-2.5 flex-shrink-0">
          <span className="text-[10px] text-gray-700 font-mono tracking-wider">
            {filtered.length} / {tools.length} tools
          </span>
        </div>
      )}
    </aside>
  );
}