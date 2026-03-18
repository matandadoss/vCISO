"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Bot, User, Loader2, Mic, Plus, FileText, ExternalLink, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useControlTower } from "@/contexts/ControlTowerContext";

type Citation = {
  id: string;
  title: string;
  url?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tier?: string;
  citations?: Citation[];
  metadata?: any;
};

export function ControlTowerDrawer() {
  const { isOpen, setIsOpen, pageContext } = useControlTower();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "**Control Tower Online**\n\nI am aware of your current context. How can I assist you with this page?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // When context changes and drawer is open, we can optionally notify the user, 
  // but let's keep it simple for now and let the LLM use it silently.

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      // Send to backend with context
      const response = await fetch(`${"https://vciso-backend-7gkk7pkdya-uc.a.run.app"}/api/v1/chat/sessions/default-session/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer mock-token"
        },
        body: JSON.stringify({
           session_id: "default-session",
           content: input,
           org_id: "default",
           page_context: pageContext ? JSON.stringify(pageContext) : null
        })
      });

      if (!response.ok) throw new Error("Chat request failed");

      // Currently the backend is expecting SSE (text/event-stream)
      // I'll simulate a local response for now while we update backend
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      let assistantMsgContent = "";
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: "assistant", content: "" }]);

      while (reader) {
        const { value, done } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
           if (line.startsWith('data: ')) {
              try {
                 const data = JSON.parse(line.slice(6));
                 if (data.type === 'token') {
                    assistantMsgContent += data.content;
                    setMessages(prev => {
                       const newMsgs = [...prev];
                       newMsgs[newMsgs.length - 1].content = assistantMsgContent;
                       return newMsgs;
                    });
                 }
                 if (data.type === 'done') {
                    setMessages(prev => {
                       const newMsgs = [...prev];
                       newMsgs[newMsgs.length - 1].tier = data.model_used;
                       return newMsgs;
                    });
                 }
              } catch (e) {
                 console.error("Parse error streaming data", e);
              }
           }
        }
      }
      setIsTyping(false);
      
    } catch (error) {
       console.error(error);
       setMessages(prev => [...prev, { 
          id: (Date.now()+1).toString(), 
          role: "assistant", 
          content: "I encountered an error connecting to the Control Tower backend. Please try again later." 
       }]);
       setIsTyping(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-over panel */}
      <div 
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full md:w-[450px] bg-card border-l border-border shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center border border-primary/30">
               <Bot className="w-5 h-5 text-primary" />
             </div>
             <div>
               <h2 className="text-sm font-bold text-foreground inline-flex items-center gap-2">
                  Control Tower
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
               </h2>
               <p className="text-[10px] text-muted-foreground">
                 {pageContext ? `Aware of: ${pageContext.title}` : "Global Context Active"}
               </p>
             </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "ml-auto" : "")}>
              {m.role === "assistant" && (
                 <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                   <Bot className="w-3.5 h-3.5 text-primary" />
                 </div>
              )}
              <div className={cn(
                "p-3 rounded-lg max-w-[85%]", 
                m.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-tr-none text-sm ml-auto" 
                  : "bg-muted text-foreground rounded-tl-none border border-border/50 text-sm"
              )}>
                <div className="leading-relaxed whitespace-pre-wrap">
                  {m.content.split('**').map((text, i) => i % 2 === 1 ? <strong key={i}>{text}</strong> : <span key={i}>{text}</span>)}
                </div>
                {m.citations && m.citations.length > 0 && (
                   <div className="mt-3 pt-2 border-t border-border/60 flex flex-wrap gap-1.5">
                      {m.citations.map((cite, i) => (
                         <a key={i} href={cite.url || "#"} className="inline-flex items-center gap-1 text-[10px] font-medium bg-background border border-border/50 hover:bg-accent text-muted-foreground px-1.5 py-0.5 rounded group">
                            [{cite.id}] {cite.title}
                         </a>
                      ))}
                   </div>
                )}
                {m.tier && (
                  <div className="mt-2 text-[9px] uppercase font-mono tracking-wider text-muted-foreground opacity-70">
                    Model: {m.tier}
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && (
             <div className="flex gap-3">
               <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
                 <Bot className="w-3.5 h-3.5 text-primary" />
               </div>
               <div className="bg-muted p-3 rounded-lg rounded-tl-none flex items-center gap-2 border border-border/50">
                  <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="text-xs text-muted-foreground animate-pulse">Analyzing...</span>
               </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 bg-card border-t border-border">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={isListening ? "Listening..." : "Ask Control Tower..."}
              className={cn(
                 "w-full bg-background border rounded-lg py-2.5 pl-3 pr-16 text-sm focus:outline-none transition-colors",
                 isListening ? "border-red-500/50 ring-1 ring-red-500/50" : "border-border hover:border-border/80 focus:border-primary/50 focus:ring-1 focus:ring-primary/50"
              )}
            />
            <div className="absolute right-1.5 flex items-center gap-0.5">
               <button 
                 onClick={() => setIsListening(!isListening)}
                 className={cn(
                   "p-1.5 rounded transition-colors",
                   isListening ? "text-red-500 bg-red-500/10" : "text-muted-foreground hover:bg-muted"
                 )}
               >
                 <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
               </button>
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() && !isListening}
                 className="p-1.5 bg-primary text-primary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
               >
                 <Send className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
