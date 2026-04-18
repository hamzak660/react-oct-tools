import { useState, useEffect, useRef } from "react";
import {
  Plus,
  Settings,
  Trash2,
  FileText,
  GripVertical,
  Bold,
  Italic,
  Underline,
} from "lucide-react";

export default function Notes() {
  const [pages, setPages] = useState(() => {
    const saved = localStorage.getItem("notion_pages");
    return (
      JSON.parse(saved) || [
        {
          id: 1,
          title: "Getting Started",
          content: [
            "Welcome to your workspace.",
            "Highlight text to see formatting options.",
          ],
        },
      ]
    );
  });

  const [currentPageId, setCurrentPageId] = useState(pages[0].id);
  const [toast, setToast] = useState("");
  const toolbarRef = useRef(null);

  const currentPage = pages.find((p) => p.id === currentPageId);

  // SAVE TO LOCALSTORAGE
  useEffect(() => {
    localStorage.setItem("notion_pages", JSON.stringify(pages));
  }, [pages]);

  // FLOATING TOOLBAR
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        toolbarRef.current.style.display = "none";
        return;
      }

      const rect = selection.getRangeAt(0).getBoundingClientRect();
      const toolbar = toolbarRef.current;

      toolbar.style.display = "flex";
      toolbar.style.top = `${rect.top + window.scrollY - 50}px`;
      toolbar.style.left = `${rect.left + rect.width / 2}px`;
    };

    document.addEventListener("selectionchange", handleSelection);
    return () =>
      document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const updatePage = (updated) => {
    setPages((prev) =>
      prev.map((p) => (p.id === currentPageId ? updated : p))
    );
  };

  const handleTitleChange = (e) => {
    updatePage({ ...currentPage, title: e.target.value });
  };

  const handleBlockChange = (i, html) => {
    const updated = [...currentPage.content];
    updated[i] = html;
    updatePage({ ...currentPage, content: updated });
  };

  const addBlock = () => {
    updatePage({
      ...currentPage,
      content: [...currentPage.content, ""],
    });
  };

  const deleteBlock = (i) => {
    const updated = currentPage.content.filter((_, idx) => idx !== i);
    updatePage({ ...currentPage, content: updated });
  };

  const addPage = () => {
    const newPage = {
      id: Date.now(),
      title: "",
      content: [""],
    };
    setPages([...pages, newPage]);
    setCurrentPageId(newPage.id);
    showToast("New page created");
  };

  const resetApp = () => {
    if (!confirm("Reset everything?")) return;
    localStorage.removeItem("notion_pages");
    window.location.reload();
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2000);
  };

  const format = (cmd) => {
    document.execCommand(cmd, false, null);
  };

  return (
    <div className="flex h-full">

      {/* Toolbar */}
      <div
        ref={toolbarRef}
        className="fixed hidden bg-[#202020] border border-gray-700 rounded-lg p-1 gap-1 z-50"
      >
        <button onClick={() => format("bold")}>
          <Bold className="w-4 h-4 text-white" />
        </button>
        <button onClick={() => format("italic")}>
          <Italic className="w-4 h-4 text-white" />
        </button>
        <button onClick={() => format("underline")}>
          <Underline className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Sidebar */}
      <aside className="w-60 bg-[#202020] text-white flex flex-col">
        <div className="flex-1 overflow-y-auto p-2">
          <div className="text-xs text-gray-400 px-3 mb-2">Private</div>

          {pages.map((p) => (
            <div
              key={p.id}
              onClick={() => setCurrentPageId(p.id)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer rounded ${
                p.id === currentPageId ? "bg-gray-700" : "hover:bg-gray-800"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span className="truncate">
                {p.title || "Untitled"}
              </span>
            </div>
          ))}

          <button
            onClick={addPage}
            className="flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white"
          >
            <Plus className="w-4 h-4" /> Add page
          </button>
        </div>

        <div className="border-t border-gray-700 p-2">
          <div className="flex items-center gap-2 px-3 py-2 hover:bg-gray-800 cursor-pointer">
            <Settings className="w-4 h-4" />
            Settings
          </div>

          <div
            onClick={resetApp}
            className="flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-gray-800 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            Reset
          </div>
        </div>
      </aside>

      {/* Editor */}
      <main className="flex-1 overflow-y-auto p-10 flex justify-center">
        <div className="w-full max-w-3xl">

          {/* Title */}
          <input
            value={currentPage.title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className="text-4xl font-bold bg-transparent outline-none w-full mb-6"
          />

          {/* Blocks */}
          <div className="flex flex-col gap-2">
            {currentPage.content.map((block, i) => (
              <div key={i} className="flex gap-2 group">
                <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 cursor-grab" />

                <div
                  contentEditable
                  suppressContentEditableWarning
                  className="flex-1 outline-none"
                  onInput={(e) =>
                    handleBlockChange(i, e.currentTarget.innerHTML)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addBlock();
                    }
                    if (
                      e.key === "Backspace" &&
                      e.currentTarget.innerHTML === ""
                    ) {
                      deleteBlock(i);
                    }
                  }}
                  dangerouslySetInnerHTML={{ __html: block }}
                />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 px-4 py-2 rounded">
          {toast}
        </div>
      )}
    </div>
  );
}