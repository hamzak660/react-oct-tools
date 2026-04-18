import { LayoutGrid, Sparkles } from "lucide-react";

export default function TopNavbar({ activeTool }) {
  //const title = activeTool === "ai" ? "AI" : "Overview";
   const titles = {
     ai: "AI",
     compress: "File Compression",
      color: "Color Manager", // 
       notes: "Notes",
       planner: "Planner",
       mindmap: "Mindmap",
       video: "Video Editor",
   };

  const title = titles[activeTool] || "Overview";
  const Icon = activeTool === "ai" ? Sparkles : LayoutGrid;

  return (
    <header className="h-3 border-b border-gray-800 bg-[#161b22]/50 backdrop-blur-md flex items-center px-8 justify-between z-20 shrink-0">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <Icon className="w-4 h-4 text-blue-400" />
          </div>
          <span className="font-semibold text-white tracking-tight">
            {title}
          </span>
        </div>
      </div>
    </header>
  );
}