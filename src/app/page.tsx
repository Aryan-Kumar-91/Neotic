"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Send, Mic, Menu, History as HistoryIcon,
  Plus, Sun, Moon, Bot, LogOut, Settings,
  Info, SlidersHorizontal, Square, Trash2
} from "lucide-react";
import ReasoningChain from "../components/ReasoningChain";
import StarBackground from "../components/StarBackground";
import { Message, ChatSession } from "../@types/index";
import { HOT_TOPICS, PLACEHOLDER_IDEAS } from "../utils/constants";
import { sendPromptToAgent } from "../api/chatClient";
import { useChatState } from "../hooks/useChatState";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { atomDark, materialLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Copy, Code, FileCode, Terminal, Globe } from "lucide-react";

interface ThemeProps {
  bgApp: string;
  bgSidebar: string;
  bgModule: string;
  bgInput: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  borderMain: string;
  borderFocus: string;
  hoverBg: string;
  accent: string;
  accentBg: string;
  accentGradient: string;
  accentShadow: string;
}

const CodeBlock = ({ code, lang, isDarkMode }: { code: string; lang: string; isDarkMode: boolean }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getIcon = () => {
    const l = lang.toLowerCase();
    if (["js", "jsx", "ts", "tsx", "javascript", "typescript"].includes(l)) return <FileCode className="w-3.5 h-3.5" />;
    if (["html", "css", "scss", "less"].includes(l)) return <Globe className="w-3.5 h-3.5" />;
    if (["sh", "bash", "zsh", "shell", "powershell", "ps1"].includes(l)) return <Terminal className="w-3.5 h-3.5" />;
    return <Code className="w-3.5 h-3.5" />;
  };

  return (
    <div className="my-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-2xl group ring-1 ring-slate-200/50 dark:ring-white/5 transition-all duration-300 hover:shadow-purple-500/10">
      <div className="flex items-center justify-between px-4 py-2 bg-slate-100/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 dark:text-slate-400 opacity-60">{getIcon()}</span>
          <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400 lowercase tracking-wider">{lang || "code"}</span>
        </div>
        <button 
          onClick={handleCopy}
          className={`group/btn relative flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-300 overflow-hidden ${
            copied ? "bg-green-500/10 text-green-500" : "hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3 transition-transform group-hover/btn:scale-110" />}
          <span>{copied ? "Copied" : "Copy"}</span>
          {copied && <span className="absolute inset-0 bg-green-500/5 animate-pulse" />}
        </button>
      </div>
      <div className="relative group/code">
        <SyntaxHighlighter
          language={lang || "javascript"}
          style={isDarkMode ? atomDark : materialLight}
          customStyle={{
            margin: 0,
            padding: "1.25rem",
            fontSize: "0.875rem",
            background: isDarkMode ? "transparent" : "#FAFAFA",
            lineHeight: "1.6",
          }}
          className="custom-scrollbar bg-transparent!"
        >
          {code.trim()}
        </SyntaxHighlighter>
        <div className="absolute inset-0 pointer-events-none bg-linear-to-r from-transparent via-transparent to-slate-200/5 dark:to-white/5 opacity-0 group-hover/code:opacity-100 transition-opacity" />
      </div>
    </div>
  );
};

const MessageContent = ({ content, isUser, theme, isDarkMode }: { content: string; isUser: boolean; theme: ThemeProps; isDarkMode: boolean }) => {
  if (isUser) {
    return <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{content}</p>;
  }

  // Automatic code detection for responses without backticks
  const detectRawCode = (text: string) => {
    if (text.startsWith("```")) return null;
    const codeIndicators = [/^import /, /^const /, /^let /, /^var /, /^function /, /^class /, /^@import /, /^public class /, /^def /, /^#include /, /^\{/];
    const lines = text.trim().split("\n");
    if (lines.length > 3) {
      const matchCount = lines.slice(0, 5).filter(line => codeIndicators.some(regex => regex.test(line))).length;
      if (matchCount >= 1 || (lines.length > 5 && lines.every(l => l.startsWith("  ") || l.startsWith("\t") || l === ""))) {
        return { code: text.trim(), lang: "code" };
      }
    }
    return null;
  };

  const rawCode = detectRawCode(content);
  if (rawCode) {
    return <CodeBlock code={rawCode.code} lang={rawCode.lang} isDarkMode={isDarkMode} />;
  }

  const parts = content.split(/(```[\s\S]*?(?:```|$))/g).filter(Boolean);
  
  return (
    <div className={`leading-relaxed text-[15px] ${theme.textPrimary} space-y-4`}>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)(?:```|$)/);
          if (match) {
            const lang = match[1] || 'code';
            const code = match[2];
            return <CodeBlock key={index} code={code} lang={lang} isDarkMode={isDarkMode} />;
          }
          const smallMatch = part.match(/```(\w*)\s([\s\S]*?)(?:```|$)/);
           if (smallMatch) {
            const lang = smallMatch[1] || 'code';
            const code = smallMatch[2];
            return <CodeBlock key={index} code={code} lang={lang} isDarkMode={isDarkMode} />;
          }
          return <p key={index} className="whitespace-pre-wrap py-1">{part.replace(/```/g, '')}</p>;
        }
        return <p key={index} className="whitespace-pre-wrap py-1">{part}</p>;
      })}
    </div>
  );
};

export default function NeoticMain() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [randomPrompts, setRandomPrompts] = useState<typeof HOT_TOPICS>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const { 
    chatHistory, setChatHistory, 
    saveChatEnabled, 
    activeFolder,
    customInstructions, 
    isLoaded, setIsLoaded
  } = useChatState();

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"instructions" | "bin" | "about">("instructions");
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [guestPromptCount, setGuestPromptCount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  useEffect(() => {
    try {
      const t = localStorage.getItem("neotic_theme");
      if (t === "dark") setIsDarkMode(true);
      const gc = localStorage.getItem("neotic_guest_prompts");
      if (gc) setGuestPromptCount(parseInt(gc, 10));
    } catch {}
    setIsLoaded(true);
  }, [setIsLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("neotic_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    let ideaIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      const currentIdea = PLACEHOLDER_IDEAS[ideaIndex];
      const nextChar = isDeleting ? charIndex - 1 : charIndex + 1;
      setAnimatedPlaceholder(currentIdea.substring(0, nextChar));
      charIndex = nextChar;

      let speed = isDeleting ? 15 : 30;
      if (!isDeleting && charIndex === currentIdea.length) {
        speed = 2500;
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        ideaIndex = (ideaIndex + 1) % PLACEHOLDER_IDEAS.length;
        speed = 400;
      }
      timeout = setTimeout(animate, speed);
    };
    timeout = setTimeout(animate, 1000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const theme: ThemeProps = {
    bgApp: isDarkMode ? "bg-[#0A0A0B]" : "bg-[#FFFFFF]",
    bgSidebar: isDarkMode ? "bg-[#0F0F10]" : "bg-[#F8FAFC]",
    bgModule: isDarkMode ? "bg-[#161618]" : "bg-[#FFFFFF]",
    bgInput: isDarkMode ? "bg-[#161618]/80" : "bg-white",
    textPrimary: isDarkMode ? "text-slate-100" : "text-slate-900",
    textSecondary: isDarkMode ? "text-slate-400" : "text-slate-600",
    textMuted: isDarkMode ? "text-slate-500" : "text-slate-400",
    borderMain: isDarkMode ? "border-white/5" : "border-slate-200",
    borderFocus: isDarkMode ? (isDarkMode ? "focus-within:border-purple-500/40" : "focus-within:border-blue-500/40") : "focus-within:border-blue-500/50",
    hoverBg: isDarkMode ? "hover:bg-white/5" : "hover:bg-slate-100",
    accent: isDarkMode ? "text-purple-500" : "text-blue-500",
    accentBg: isDarkMode ? "bg-purple-600" : "bg-blue-600",
    accentGradient: isDarkMode ? "from-purple-500 to-violet-600" : "from-blue-500 to-indigo-600",
    accentShadow: isDarkMode ? "shadow-purple-500/20" : "shadow-blue-500/20",
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  useEffect(() => {
    if (messages.length === 0) {
      const shuffled = [...HOT_TOPICS].sort(() => 0.5 - Math.random());
      setRandomPrompts(shuffled.slice(0, 4));
    }
  }, [messages.length]);

  const handleNewChat = () => {
    if (saveChatEnabled && userEmail && messages.length > 0 && !currentChatId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: messages[0].content.substring(0, 30) + "...",
        messages: [...messages],
        folder: activeFolder,
        updatedAt: Date.now()
      };
      setChatHistory(prev => [newSession, ...prev]);
    }
    setMessages([]);
    setCurrentChatId(null);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const submitPrompt = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;

    if (!userEmail) {
      if (guestPromptCount >= 3) {
        setShowGuestModal(true);
        return;
      }
      setGuestPromptCount(prev => {
        const next = prev + 1;
        localStorage.setItem("neotic_guest_prompts", next.toString());
        return next;
      });
    }

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);

    try {
      const data = await sendPromptToAgent(text, controller);
      const responseMessage: Message = { role: "assistant", content: data.final_answer, thoughts: data.thoughts };
      const updatedMessages = [...newMessages, responseMessage];
      setMessages(updatedMessages);

      if (saveChatEnabled && userEmail) {
        if (currentChatId) {
          setChatHistory(prev => prev.map(chat => 
            chat.id === currentChatId ? { ...chat, messages: updatedMessages, updatedAt: Date.now() } : chat
          ));
        } else {
          const newId = Date.now().toString();
          setCurrentChatId(newId);
          setChatHistory(prev => [{
            id: newId,
            title: newMessages[0].content.substring(0, 30) + "...",
            messages: updatedMessages,
            folder: null,
            updatedAt: Date.now()
          }, ...prev]);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      setMessages([...newMessages, { role: "assistant", content: "The Neotic core failed to respond." }]);
    } finally {
      setIsGenerating(false);
    }
  }, [messages, isGenerating, saveChatEnabled, currentChatId, userEmail, guestPromptCount, setChatHistory]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  return (
    <div className={`flex h-screen ${theme.bgApp} ${theme.textPrimary} font-sans selection:bg-purple-500/30 overflow-hidden relative transition-colors duration-500`}>
      {isDarkMode && <StarBackground />}
      
      <aside className={`${theme.bgSidebar} border-r ${theme.borderMain} flex flex-col h-full py-4 transition-all duration-300 ${sidebarOpen ? 'w-[280px]' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} z-20`}>
        <div className="px-4 mb-6 flex items-center justify-between relative">
          <button onClick={() => setSidebarOpen(false)} className={`p-2 rounded-md ${theme.hoverBg}`} aria-label="Close sidebar"><Menu className="w-5 h-5" /></button>
          <div className="relative">
            <button onClick={() => setDropdownOpen(!dropdownOpen)} className={`p-2 rounded-md ${theme.hoverBg} ${dropdownOpen ? `${theme.accent} ${isDarkMode ? 'bg-purple-500/10' : 'bg-blue-500/10'}` : ''}`}><Settings className="w-5 h-5" /></button>
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className={`absolute right-0 mt-2 w-56 rounded-xl border ${theme.borderMain} ${theme.bgModule} shadow-xl z-40 py-1.5 animate-in fade-in zoom-in duration-200`}>
                  {[
                    { id: "instructions" as const, label: "Instructions", icon: <SlidersHorizontal className="w-4 h-4" /> },
                    { id: "bin" as const, label: "Recycle Bin", icon: <Trash2 className="w-4 h-4" /> },
                    { id: "about" as const, label: "About Neotic", icon: <Info className="w-4 h-4" /> },
                  ].map((item) => (
                    <button key={item.id} onClick={() => { setSettingsTab(item.id); setSettingsOpen(true); setDropdownOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textSecondary} hover:${theme.textPrimary} hover:${theme.hoverBg} transition-colors`}>
                      <span className={theme.textMuted}>{item.icon}</span>
                      <span className="font-medium">{item.label}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="px-4 mb-6">
          <button onClick={handleNewChat} disabled={isGenerating} className={`flex items-center gap-3 ${theme.bgApp} ${theme.hoverBg} text-sm px-4 py-2.5 rounded-xl border ${theme.borderMain} w-full font-semibold`}>
            <Plus className="w-4 h-4" /> <span>New chat</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 custom-scrollbar">
           {userEmail ? (
             <div className="space-y-6">
                <p className={`text-[10px] font-bold ${theme.textMuted} tracking-widest uppercase px-2`}>History</p>
                {chatHistory.map(chat => (
                   <button key={chat.id} onClick={() => { setMessages(chat.messages); setCurrentChatId(chat.id); }} className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-xl transition-colors text-left ${currentChatId === chat.id ? `${isDarkMode ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}` : `${theme.textSecondary} ${theme.hoverBg}`}`}>
                     <HistoryIcon className="w-3.5 h-3.5" /><span className="truncate flex-1">{chat.title}</span>
                   </button>
                ))}
             </div>
           ) : (
             <div className={`p-5 rounded-2xl border border-dashed ${theme.borderMain} text-center space-y-4`}>
                <HistoryIcon className="w-5 h-5 mx-auto opacity-30" />
                <p className="text-xs font-medium">Log in to save history.</p>
                <Link href="/login" className={`block w-full py-2 ${theme.accentBg} text-white rounded-lg text-xs font-bold`}>Log In</Link>
             </div>
           )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
        <header className={`px-6 py-4 flex items-center justify-between sticky top-0 ${theme.bgApp}/80 backdrop-blur-xl border-b ${theme.borderMain} z-10 w-full`}>
          <div className="flex items-center gap-4">
            {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-lg ${theme.hoverBg}`}><Menu className="w-5 h-5" /></button>}
            <div className="flex items-center gap-2">
              <Image src={isDarkMode ? "/neotic-minimalist-logo-darkmode-v2.png" : "/neotic-minimalist-logo-lightmode-v2.png"} alt="Neotic Logo" width={32} height={32} priority className="rounded-lg shadow-lg w-8 h-auto" />
              <span className={`text-lg font-bold bg-clip-text text-transparent bg-linear-to-r ${theme.accentGradient}`}>Neotic</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.hoverBg}`}>{isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
            {userEmail && <div className={`w-8 h-8 rounded-lg bg-linear-to-br ${theme.accentGradient} flex items-center justify-center text-xs font-bold text-white uppercase ${theme.accentShadow}`}>{userEmail[0]}</div>}
            <button onClick={handleLogout} className={`p-2 rounded-lg ${theme.textMuted} ${theme.hoverBg} hover:text-red-500`}><LogOut className="w-4 h-4" /></button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-6 pb-60 custom-scrollbar pt-8">
          {messages.length === 0 ? (
            <div className="mt-32 flex flex-col items-center text-center">
              <Image src={isDarkMode ? "/neotic-minimalist-logo-darkmode-v2.png" : "/neotic-minimalist-logo-lightmode-v2.png"} alt="Neotic Brand" width={96} height={96} priority className={`mb-6 drop-shadow-[0_0_15px_${isDarkMode ? 'rgba(168,85,247,0.5)' : 'rgba(59,130,246,0.5)'}] animate-pulse w-24 h-auto`} />
              <h1 className="text-4xl font-bold mb-3">Welcome to Neotic</h1>
              <p className={`text-lg ${theme.textSecondary} mb-12`}>Advanced reasoning core for systematic problem-solving.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
                {randomPrompts.map((p, i) => (
                  <button key={i} onClick={() => submitPrompt(p.text)} className={`${theme.bgModule} p-5 rounded-2xl text-left border ${theme.borderMain} hover:border-purple-500/20`}><p className="text-sm font-medium">{p.text}</p></button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && <div className={`w-9 h-9 rounded-xl ${theme.bgModule} border ${theme.borderMain} flex items-center justify-center shrink-0 shadow-sm`}><Bot className="w-5 h-5" /></div>}
                  <div className={`w-full overflow-hidden ${msg.role === 'user' ? `max-w-[85%] ${isDarkMode ? 'bg-purple-900/60' : 'bg-slate-900'} dark:bg-purple-700 text-white py-3.5 px-5 rounded-2xl shadow-lg ${theme.accentShadow}` : 'pt-2'}`}>
                    {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && <ReasoningChain thoughts={msg.thoughts} isGenerating={isGenerating && i === messages.length - 1} />}
                    <MessageContent content={msg.content} isUser={msg.role === 'user'} theme={theme} isDarkMode={isDarkMode} />
                  </div>
                </div>
              ))}
              {isGenerating && <div className={`text-sm font-medium ${theme.textMuted} px-14 animate-pulse`}>Neotic is thinking...</div>}
            </div>
          )}
        </div>

        <div className={`absolute bottom-0 w-full z-20 bg-linear-to-t ${isDarkMode ? 'from-[#0A0A0B]' : 'from-white'} via-transparent pt-20 pb-8 px-6`}>
           <div className="max-w-[850px] mx-auto">
              <div className={`${theme.bgInput} rounded-2xl flex flex-col p-2 border ${theme.borderMain} ${theme.borderFocus} shadow-2xl`}>
                 <div className="px-3 pt-3"><textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitPrompt(input); } }} disabled={isGenerating} placeholder={animatedPlaceholder || "Ask Neotic..."} className={`w-full bg-transparent outline-none resize-none text-[16px] ${theme.textPrimary}`} rows={1} /></div>
                 <div className="flex justify-between items-center px-2 pb-1 mt-2">
                    <div className="flex gap-1"><button className="p-2.5 text-slate-500"><Plus className="w-4 h-4" /></button><button className="p-2.5 text-slate-500"><Mic className="w-4 h-4" /></button></div>
                    {isGenerating ? <button onClick={handleStop} className="p-2.5 bg-red-500/10 text-red-500 rounded-xl"><Square className="w-4 h-4 fill-current" /></button> : <button onClick={() => submitPrompt(input)} disabled={!input.trim()} className={`p-2.5 rounded-xl transition-all ${input.trim() ? `${theme.accentBg} text-white` : 'text-slate-400'}`}><Send className="w-4 h-4" /></button>}
                 </div>
              </div>
           </div>
        </div>
      </main>

      {showGuestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/60" onClick={() => setShowGuestModal(false)} />
           <div className={`relative w-full max-w-sm ${theme.bgModule} rounded-3xl p-8 z-50 shadow-2xl`}>
              <h2 className="text-2xl font-bold mb-4">Reasoning Limit</h2>
              <p className="mb-6 opacity-70">You&apos;ve reached your guest limit. Log in to keep exploring.</p>
              <Link href="/login" className={`block w-full py-3 ${theme.accentBg} text-white rounded-xl font-bold text-center`}>Log In</Link>
           </div>
        </div>
      )}

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSettingsOpen(false)}>
           <div className="absolute inset-0 bg-black/60" />
           <div className={`relative w-full max-w-lg ${theme.bgModule} rounded-3xl p-6 z-50 shadow-2xl`} onClick={e => e.stopPropagation()}>
              <h2 className="font-bold text-lg mb-4">Settings</h2>
              <div className="h-40">{settingsTab === "instructions" ? <p>{customInstructions || "No custom instructions."}</p> : <p>Neotic v1.0.0</p>}</div>
           </div>
        </div>
      )}
    </div>
  );
}
