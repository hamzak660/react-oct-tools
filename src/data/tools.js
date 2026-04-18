import {
  Palette, Archive, FileText, Link, Sparkles, Layout,
  Calendar, GitBranch, Brain, Video, Mic, Image,
  Clapperboard, DownloadCloud, FolderOpen
} from "lucide-react";

export const tools = [
  { id: "color",     label: "Color Manager",   icon: Palette },
  { id: "compress",  label: "File Compression",icon: Archive },
  { id: "notes",     label: "Notes",           icon: FileText },
  { id: "shortener", label: "Link Shortener",  icon: Link },
  { id: "ai",        label: "AI",              icon: Sparkles },
  { id: "canvas",    label: "Canvas",          icon: Layout },
  { id: "planner",   label: "Planner",         icon: Calendar },
  { id: "flow",      label: "Flowchart",       icon: GitBranch },
  { id: "mindmap",   label: "MindMap",         icon: Brain },
  { id: "video",     label: "Video Editor",    icon: Video },
  { id: "audio",     label: "Audio Editor",    icon: Mic },
  { id: "photo",     label: "Photo Editor",    icon: Image },
  { id: "gif",       label: "Gif Editor",      icon: Clapperboard },
];