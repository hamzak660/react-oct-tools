// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import DefaultView from "./components/DefaultView";
import AI from "./components/AI";
import FileCompression from "./components/FileCompression";
import ColorManager from "./components/ColorManager";
import Notes from "./components/Notes";
import Planner from "./components/Planner";
import MindMap from "./components/Mindmap";
import LinkManager from "./components/LinkManager";
import Flowchart from "./components/Flowchart";
import Audioeditor from "./components/AudioEditor";
import Videoeditor from "./components/VideoEditor";
function App() {
  const [activeTool, setActiveTool] = useState(null);

  return (
    <div className="h-screen overflow-hidden flex bg-[#0d1117] text-white">
      <Sidebar setActiveTool={setActiveTool} activeTool={activeTool} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        <TopNavbar activeTool={activeTool} />

        <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

          <div className="relative w-full h-full p-6 overflow-auto">
            {!activeTool && <DefaultView />}
            {activeTool === "ai" && <AI setActiveTool={setActiveTool} />}
              {activeTool === "compress" && <FileCompression setActiveTool={setActiveTool} />}
                {activeTool === "color" && <ColorManager />}
                {activeTool === "notes" && <Notes />}
                {activeTool === "planner" && <Planner />}
                {activeTool === "mindmap" && <MindMap />}
                {activeTool === "shortener" && <LinkManager />}
                {activeTool === "flow" && <Flowchart />}
                {activeTool === "audio" && <Audioeditor />}
                {activeTool === "video" && <Videoeditor />}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;