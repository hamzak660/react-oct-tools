import { Command } from "lucide-react";

export default function DefaultView() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
      <div className="p-6 rounded-3xl bg-blue-500/5 border border-blue-500/10">
        <Command className="w-12 h-12 text-blue-500/20" />
      </div>

      <div className="space-y-1">
        <h2 className="text-xl font-bold text-white tracking-tight">
          Ready to Initialize
        </h2>
        <p className="text-gray-500 text-sm max-w-sm mx-auto">
          Select a module from the sidebar to begin.
        </p>
      </div>
    </div>
  );
}