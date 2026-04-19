import { useEffect, useState } from "react";
import { Plus, FileText, Trash2 } from "lucide-react";

export default function NotesApp() {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem("notes_app");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: Date.now(),
            title: "Untitled Note",
            blocks: [""],
          },
        ];
  });

  const [activeId, setActiveId] = useState(pages[0].id);

  const activePage = pages.find((p) => p.id === activeId);

  // SAVE
  useEffect(() => {
    localStorage.setItem("notes_app", JSON.stringify(pages));
  }, [pages]);

  // UPDATE PAGE
  const updatePage = (updated) => {
    setPages((prev) =>
      prev.map((p) => (p.id === activeId ? updated : p))
    );
  };

  // TITLE
  const updateTitle = (val) => {
    updatePage({ ...activePage, title: val });
  };

  // BLOCK UPDATE
  const updateBlock = (index, value) => {
    const blocks = [...activePage.blocks];
    blocks[index] = value;
    updatePage({ ...activePage, blocks });
  };

  // ADD BLOCK
  const addBlock = (index) => {
    const blocks = [...activePage.blocks];
    blocks.splice(index + 1, 0, "");
    updatePage({ ...activePage, blocks });
  };

  // DELETE BLOCK
  const deleteBlock = (index) => {
    const blocks = activePage.blocks.filter((_, i) => i !== index);
    updatePage({
      ...activePage,
      blocks: blocks.length ? blocks : [""],
    });
  };

  // NEW PAGE
  const addPage = () => {
    const newPage = {
      id: Date.now(),
      title: "Untitled Note",
      blocks: [""],
    };
    setPages([...pages, newPage]);
    setActiveId(newPage.id);
  };

  return (
    <div className="h-screen flex bg-[#0f0f0f] text-gray-200 font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 border-r border-gray-800 flex flex-col">
        <div className="p-3 text-xs text-gray-500 uppercase">
          Notes
        </div>

        <div className="flex-1 overflow-auto">
          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => setActiveId(p.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-[#1a1a1a] ${
                p.id === activeId ? "bg-[#1a1a1a]" : ""
              }`}
            >
              <FileText size={14} />
              <span className="truncate text-sm">
                {p.title}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={addPage}
          className="flex items-center gap-2 p-3 border-t border-gray-800 hover:bg-[#1a1a1a]"
        >
          <Plus size={16} /> New Note
        </button>
      </aside>

      {/* EDITOR */}
      <main className="flex-1 flex justify-center p-10 overflow-auto">
        <div className="w-full max-w-3xl">

          {/* TITLE */}
          <input
            value={activePage.title}
            onChange={(e) => updateTitle(e.target.value)}
            className="w-full text-3xl font-semibold bg-transparent outline-none mb-6"
            placeholder="Untitled"
          />

          {/* TEXT BLOCKS */}
          <div className="space-y-2">
            {activePage.blocks.map((text, i) => (
              <div key={i} className="flex gap-2 group">

                <span className="text-gray-600 select-none">
                  •
                </span>

                <input
                  value={text}
                  onChange={(e) =>
                    updateBlock(i, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBlock(i);
                    }

                    if (
                      e.key === "Backspace" &&
                      text === ""
                    ) {
                      e.preventDefault();
                      deleteBlock(i);
                    }
                  }}
                  className="flex-1 bg-transparent outline-none text-gray-200"
                  placeholder="Write something..."
                />
              </div>
            ))}
          </div>

        </div>
      </main>
    </div>
  );
}