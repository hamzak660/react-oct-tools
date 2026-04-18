import { useState } from "react";
import { Plus, X, Trash2, MoreHorizontal } from "lucide-react";

export default function Planner() {
  const [columns, setColumns] = useState([
    {
      id: 1,
      title: "Backlog",
      cards: [
        {
          id: 11,
          title: "Competitor Feature Audit",
          desc: "Analyze Q3 updates from market leaders.",
          tag: "Research",
        },
        {
          id: 12,
          title: "Update API Keys",
          desc: "",
          tag: "Admin",
        },
      ],
    },
    {
      id: 2,
      title: "In Progress",
      cards: [
        {
          id: 21,
          title: "Brand Identity Guidelines",
          desc: "",
          tag: "Design",
        },
        {
          id: 22,
          title: "Q4 Strategic Forecast",
          desc: "",
          tag: "Strategy",
        },
      ],
    },
  ]);

  // ADD COLUMN
  const addColumn = () => {
    setColumns((prev) => [
      ...prev,
      {
        id: Date.now(),
        title: "New List",
        cards: [],
      },
    ]);
  };

  // DELETE COLUMN
  const deleteColumn = (id) => {
    setColumns((prev) => prev.filter((col) => col.id !== id));
  };

  // ADD CARD
  const addCard = (colId) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? {
              ...col,
              cards: [
                ...col.cards,
                {
                  id: Date.now(),
                  title: "Untitled Task",
                  desc: "Add a description...",
                  tag: "New",
                },
              ],
            }
          : col
      )
    );
  };

  // DELETE CARD
  const deleteCard = (colId, cardId) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? {
              ...col,
              cards: col.cards.filter((c) => c.id !== cardId),
            }
          : col
      )
    );
  };

  // UPDATE CARD
  const updateCard = (colId, cardId, field, value) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === colId
          ? {
              ...col,
              cards: col.cards.map((c) =>
                c.id === cardId ? { ...c, [field]: value } : c
              ),
            }
          : col
      )
    );
  };

  // UPDATE COLUMN TITLE
  const updateColumnTitle = (id, value) => {
    setColumns((prev) =>
      prev.map((col) =>
        col.id === id ? { ...col, title: value } : col
      )
    );
  };

  return (
    <div className="w-full h-full overflow-x-auto flex gap-6 p-6">

      {columns.map((col) => (
        <div
          key={col.id}
          className="w-[320px] bg-[#161b22] border border-[#30363d] rounded-xl flex flex-col max-h-full"
        >
          {/* HEADER */}
          <div className="p-4 flex justify-between items-center">
            <input
              value={col.title}
              onChange={(e) =>
                updateColumnTitle(col.id, e.target.value)
              }
              className="bg-transparent text-sm font-bold uppercase tracking-widest text-gray-400 outline-none"
            />

            <button
              onClick={() => deleteColumn(col.id)}
              className="text-gray-500 hover:text-red-400"
            >
              <X size={16} />
            </button>
          </div>

          {/* CARDS */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {col.cards.map((card) => (
              <div
                key={card.id}
                className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4"
              >
                <input
                  value={card.title}
                  onChange={(e) =>
                    updateCard(col.id, card.id, "title", e.target.value)
                  }
                  className="w-full bg-transparent text-white font-semibold outline-none"
                />

                <textarea
                  value={card.desc}
                  onChange={(e) =>
                    updateCard(col.id, card.id, "desc", e.target.value)
                  }
                  className="w-full bg-transparent text-xs text-gray-500 mt-1 outline-none resize-none"
                />

                <div className="flex justify-between items-center mt-3 text-gray-500 text-xs">
                  <span className="uppercase">{card.tag}</span>

                  <button
                    onClick={() => deleteCard(col.id, card.id)}
                    className="hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* ADD CARD */}
          <button
            onClick={() => addCard(col.id)}
            className="m-3 p-2 text-xs text-gray-500 hover:bg-gray-800 rounded-lg flex items-center gap-2"
          >
            <Plus size={14} /> Add card
          </button>
        </div>
      ))}

      {/* ADD COLUMN */}
      <button
        onClick={addColumn}
        className="w-[320px] h-[52px] border-2 border-dashed border-[#30363d] rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-400 hover:border-blue-400"
      >
        <Plus size={18} />
        <span className="ml-2">New Panel</span>
      </button>
    </div>
  );
}