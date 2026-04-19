// src/App.jsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import TopNavbar from "./components/TopNavbar";
import DefaultView from "./components/DefaultView";
import AI from "./components/AI";
import CanvasEditor  from "./components/Canvas";
import FileCompression from "./components/FileCompression";
import ColorManager from "./components/ColorManager";
import Notes from "./components/Notes";
import Planner from "./components/Planner";
import Photoeditor from "./components/PhotoEditor";
import MindMap from "./components/Mindmap";
import LinkManager from "./components/LinkManager";
import Flowchart from "./components/Flowchart";
import Audioeditor from "./components/AudioEditor";
import Videoeditor from "./components/VideoEditor";
import Aisummarizer from "./components/AiSummarizer";
/*import Imggen from "./components/ImgGen";
import Audiogen from "./components/AudioGen";
import AiNoiseremover from "./components/AiNoiseRemover";*/
import Gifeditor from "./components/GifEditor";

function App() {
  const [activeTool, setActiveTool] = useState(null);

  return (
    <div className="h-screen overflow-hidden flex bg-[#0d1117] text-white">
      <Sidebar setActiveTool={setActiveTool} activeTool={activeTool} />

      <div className="flex-1 flex flex-col min-w-0 bg-[#0d1117] relative">
        <TopNavbar activeTool={activeTool} />

        <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] bg-[size:30px_30px]" />

          <div className="relative w-full h-full overflow-auto">
            {!activeTool && <DefaultView />}
            {activeTool === "ai" && <AI setActiveTool={setActiveTool} />}
              {activeTool === "compress" && <FileCompression setActiveTool={setActiveTool} />}
                {activeTool === "color" && <ColorManager />}
                {activeTool === "notes" && <Notes />}
                {activeTool === "gif" && <Gifeditor />}
                {activeTool === "canvas" && <CanvasEditor  />}
                {activeTool === "planner" && <Planner />}
                {activeTool === "photo" && <Photoeditor />}
                {activeTool === "mindmap" && <MindMap />}
                {activeTool === "shortener" && <LinkManager />}
                {activeTool === "flow" && <Flowchart />}
                {activeTool === "audio" && <Audioeditor />}
                {activeTool === "video" && <Videoeditor />}
                {activeTool === "aisumm" && <Aisummarizer />}
              {/*  {activeTool === "imggen" && <Imggen />}
                {activeTool === "audiogen" && <Audiogen />}
                {activeTool === "ainoise" && <AiNoiseremover />}*/}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
