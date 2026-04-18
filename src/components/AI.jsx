import { useState, useRef, useEffect } from "react";
import { Paperclip, ArrowUp, Sparkles } from "lucide-react";
//import BackButton from "./BackButton";

export default function AI({ setActiveTool }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const chatRef = useRef(null);

  const handleSend = () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", text: input }];
    setMessages(newMessages);
    setInput("");

    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          text:
            "I'm processing your request. How else can I assist you with the AI Canvas Suite?",
        },
      ]);
    }, 1000);
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="h-full flex flex-col overflow-hidden ">

      {/* Back Button 
      <BackButton setActiveTool={setActiveTool} />
*/}
      {/* Chat Area */}
      <main
        ref={chatRef}
        className="flex-1 overflow-y-auto px-4 pt-8 pb-32"
      >
        <div className="max-w-[800px] mx-auto space-y-8">

          {/* Welcome State */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Sparkles className="w-8 h-8 text-white" />
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white tracking-tight">
                  How can I help you today?
                </h1>
                <p className="text-gray-500 text-lg">
                  Type a message or attach a file to begin.
                </p>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-4 ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start"
                } animate-[slideUp_0.3s_ease-out]`}
              >
                <div
                  className={`max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-[#161b22] border border-gray-800 text-gray-200"
                  } rounded-2xl px-4 py-3 shadow-sm`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Input Area */}
      <footer className="p-6">
        <div className="max-w-[800px] mx-auto">
          <div className="backdrop-blur-xl bg-[#161b22]/80 border border-gray-800 rounded-2xl p-2 shadow-2xl focus-within:border-blue-500/50 transition-all">
            <div className="flex items-end gap-2">

              {/* Attach */}
              <button className="p-3 text-gray-500 hover:text-blue-400 transition-colors rounded-xl hover:bg-blue-500/10">
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Input */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI..."
                rows="1"
                className="flex-1 bg-transparent border-none focus:ring-0 text-gray-200 py-3 text-base placeholder-gray-600 resize-none min-h-[44px] max-h-[200px]"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />

              {/* Send */}
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 disabled:bg-gray-700 disabled:shadow-none"
              >
                <ArrowUp className="w-5 h-5" />
              </button>
            </div>
          </div>

          <p className="text-center text-[10px] text-gray-600 mt-3 uppercase tracking-widest font-medium">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </footer>
    </div>
  );
}