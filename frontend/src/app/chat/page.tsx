"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2, Mic, Plus, MessageSquare, FileText, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

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

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "**Morning Briefing:** \n\nSince yesterday: \n- **1** new critical finding was detected (CVE-2023-1234 on prod-db-main).\n- Your **ISO 27001 audit** deadline is exactly 30 days away (3 missing controls).\n- **FIN7** threat actor activity has increased against your industry sector.\n\nHow would you like to proceed?",
      citations: [
        { id: "FIND-892", title: "CVE-2023-1234 on prod-db-main", url: "/findings/vuln-1" },
        { id: "COMP-ISO", title: "ISO 27001 Dashboard", url: "/compliance" },
        { id: "INTEL-FIN7", title: "Threat Intel: FIN7", url: "/threat-intel" }
      ]
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Handle "Generate Board Report" specially
    if (input.toLowerCase().includes("board report") || input.toLowerCase().includes("executive summary")) {
      setTimeout(() => {
        setMessages(prev => [
          ...prev, 
          { 
            id: (Date.now()+1).toString(), 
            role: "assistant", 
            content: "I have generated an Executive Board Report summarizing our current risk posture, compliance standing, and mitigation efforts for the quarter. \n\n**Executive Summary:**\nThe organization has reduced overall critical vulnerabilities by 15% this quarter. The primary residual risks involve unpatched external web services and delayed ISO 27001 control mapping for the third-party integrations.\n\n*Would you like me to email this directly to the board distribution list, or export it to PDF?*",
            tier: "deep",
            citations: [
              { id: "REP-Q3", title: "Q3 Risk Metrics", url: "/dashboard" }
            ]
          }
        ]);
        setIsTyping(false);
      }, 2500);
      return;
    }

    // Simulate Server-Sent Events / streaming response delay normal
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          id: (Date.now()+1).toString(), 
          role: "assistant", 
          content: "Based on the correlation engine, your top priority should be patching the internet-facing server with the Log4j vulnerability, as it is currently being targeted by known Threat Actors in our latest intel feed.",
          tier: "balanced",
          citations: [
            { id: "INTEL-TTP", title: "Log4j Exploitation TTPs", url: "/threat-intel" },
            { id: "ASSET-WEB", title: "frontend-gateway exposures", url: "/correlation" }
          ]
        }
      ]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="flex h-full bg-background overflow-hidden relative">
      
      {/* Sidebar: Conversation History */}
      <div className="w-64 border-r border-border bg-card/30 flex flex-col shrink-0 hidden md:flex">
         <div className="p-4 border-b border-border">
            <button className="flex items-center gap-2 w-full justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-md py-2 text-sm font-medium transition-colors shadow">
               <Plus className="w-4 h-4" /> New Conversation
            </button>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Today</p>
               <button className="w-full text-left px-3 py-2 text-sm text-foreground bg-accent/50 rounded-md truncate font-medium">
                 Morning Briefing & Board Prep
               </button>
            </div>
            <div>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Yesterday</p>
               <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md truncate transition-colors">
                 <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                 Reviewing Log4j Remediation
               </button>
               <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md truncate transition-colors">
                 <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                 ISO 27001 Mapping Gaps
               </button>
            </div>
            <div>
               <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Previous 7 Days</p>
               <button className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md truncate transition-colors">
                 <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                 Suspicious Login Investigation
               </button>
            </div>
         </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 max-w-4xl mx-auto w-full h-full flex flex-col pt-8 pb-8 px-4 md:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
             <Bot className="w-8 h-8 text-primary" />
             vCISO Chat
          </h1>
          <p className="text-muted-foreground mt-1">
            Query your security data naturally. Your AI assistant has full context of your topology, findings, and compliance.
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
                m.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none border border-border/50"
              )}>
                {/* Parse Markdown-like bold tags trivially for the briefing */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {m.content.split('**').map((text, i) => i % 2 === 1 ? <strong key={i}>{text}</strong> : <span key={i}>{text}</span>)}
                </div>
                
                {/* Citations block */}
                {m.citations && (
                  <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-2">
                     {m.citations.map((cite, i) => (
                        <a key={i} href={cite.url || "#"} className="inline-flex items-center gap-1 text-[11px] font-medium bg-background border border-border/50 hover:bg-accent hover:border-border text-muted-foreground hover:text-foreground px-2 py-1 rounded transition-colors group">
                           <FileText className="w-3 h-3 text-primary/70 group-hover:text-primary" />
                           [{cite.id}] {cite.title}
                           <ExternalLink className="w-2.5 h-2.5 ml-0.5 opacity-50" />
                        </a>
                     ))}
                  </div>
                )}
                
                {m.tier && (
                  <div className="mt-3 flex">
                     <span className="text-[10px] uppercase font-mono tracking-wider bg-background border border-border/50 px-2 py-1 rounded text-muted-foreground flex items-center">
                       Model: {m.tier}
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
              placeholder={isListening ? "Listening... Speak now" : "Ask about vulnerabilities, generate a report, check compliance..."}
              className={cn(
                 "w-full bg-background border rounded-full py-4 pl-6 pr-24 text-sm focus:outline-none transition-all",
                 isListening ? "border-red-500/50 ring-1 ring-red-500/50 placeholder:text-red-500/70" : "border-border hover:border-border/80 focus:border-primary/50 focus:ring-1 ring-primary"
              )}
            />
            <div className="absolute right-2 flex items-center gap-1">
               <button 
                 onClick={() => setIsListening(!isListening)}
                 className={cn(
                   "p-2.5 rounded-full transition-colors",
                   isListening ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                 )}
                 title="Voice Input"
               >
                 <Mic className={cn("w-4 h-4", isListening && "animate-pulse")} />
               </button>
               <button 
                 onClick={handleSend}
                 disabled={!input.trim() && !isListening}
                 className="p-2.5 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors shadow-sm"
               >
                 <Send className="w-4 h-4" />
               </button>
            </div>
          </div>
          <div className="flex gap-2 mt-4 px-2 overflow-x-auto pb-2 scrollbar-none">
             {["Generate Board Report", "Summarize top 3 risks", "What changed in compliance this week?", "Any dark web alerts tied to my assets?"].map((suggestion, i) => (
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
