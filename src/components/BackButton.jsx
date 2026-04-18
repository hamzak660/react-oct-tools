import { ArrowLeft } from "lucide-react";

export default function BackButton({ setActiveTool }) {
  return (
    <button
      onClick={() => setActiveTool(null)}
      className="flex items-center gap-2 mb-4 text-gray-400 hover:text-white"
    >
      <ArrowLeft size={20} />
      Back to tools menu
    </button>
  );
}