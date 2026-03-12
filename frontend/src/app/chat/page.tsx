"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  tier?: string;
  metadata?: any;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am your AI Virtual CISO. I have full context of your recent vulnerabilities, cloud risks, and compliance posture. How can I help you today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate Server-Sent Events / streaming response delay
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now()+1).toString(), 
          role: "assistant", 
          content: "Based on the correlation engine, your top priority should be patching the internet-facing server with the Log4j vulnerability, as it is currently being targeted by known Threat Actors in our latest intel feed.",
          tier: "deep"
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full bg-background p-8">
      <div className="max-w-4xl mx-auto w-full h-full flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">vCISO Chat</h1>
          <p className="text-muted-foreground mt-1">
            Query your security data naturally. Responses are intelligently routed to optimize cost.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto bg-card border border-border rounded-t-lg p-6 space-y-6">
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-4 max-w-[80%]", m.role === "user" ? "ml-auto" : "")}>
              {m.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
              )}
              <div className={cn(
                "p-4 rounded-xl", 
                m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
              )}>
                <p className="text-sm leading-relaxed">{m.content}</p>
                {m.tier && (
                  <div className="mt-3 pt-3 border-t border-border/50 flex">
                     <span className="text-[10px] uppercase font-mono tracking-wider bg-background px-2 py-1 rounded text-muted-foreground flex items-center">
                       Route: {m.tier}
                     </span>
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 border border-border">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
             <div className="flex gap-4 max-w-[80%]">
             <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
               <Bot className="w-5 h-5 text-primary" />
             </div>
             <div className="bg-muted p-4 rounded-xl rounded-tl-none flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
                <span className="text-xs text-muted-foreground animate-pulse">Routing query...</span>
             </div>
           </div>
          )}
        </div>

        <div className="bg-card border-l border-r border-b border-border rounded-b-lg p-4">
          <div className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask about vulnerabilities, risks, compliance gaps..."
              className="w-full bg-background border border-border rounded-full py-3 pl-6 pr-14 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 ring-primary transition-all"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim()}
              className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex gap-2 mt-4 px-2 overflow-x-auto pb-2 scrollbar-none">
             {["Summarize my top 3 risks", "What changed in compliance this week?", "Any dark web alerts tied to my assets?"].map((suggestion, i) => (
                <button 
                  key={i} 
                  onClick={() => setInput(suggestion)}
                  className="whitespace-nowrap bg-muted hover:bg-muted/80 text-muted-foreground text-xs px-3 py-1.5 rounded-full border border-border/50 transition-colors"
                >
                  {suggestion}
                </button>
             ))}
          </div>
        </div>

      </div>
    </div>
  );
}
