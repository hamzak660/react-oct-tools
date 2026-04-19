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
  { id: "ai",        label: "AI Chat",              icon: Sparkles },
  { id: "canvas",    label: "Canvas",          icon: Layout },
  { id: "planner",   label: "Planner",         icon: Calendar },
  { id: "flow",      label: "Flowchart",       icon: GitBranch },
  { id: "mindmap",   label: "MindMap",         icon: Brain },
  { id: "video",     label: "Video Editor",    icon: Video },
  { id: "audio",     label: "Audio Editor",    icon: Mic },
  { id: "photo",     label: "Photo Editor",    icon: Image },
  { id: "aisumm",       label: "Document Summarizer",      icon: Clapperboard },
  { id: "gif",       label: "Gif Editor",      icon: Clapperboard },
  /*{ id: "imggen",       label: "Image Generation",      icon: Clapperboard },
  { id: "audiogen",       label: "Text to Audio Generation",      icon: Clapperboard },
  { id: "ainoise",       label: "AI Noise Remover",      icon: Clapperboard },
*/
];