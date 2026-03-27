"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { 
  Send, Mic, Image as ImageIcon, Menu, History as HistoryIcon,
  Search, FolderPlus, Folder, Plus, MessageSquare, 
  Sun, Moon, Bot, Loader2, Trash2, LogOut, Settings,
  RotateCcw, Info, SlidersHorizontal, Square
} from "lucide-react";
import ReasoningChain from "../components/ReasoningChain";
import StarBackground from "../components/StarBackground";
import { Message, ChatSession } from "../@types/index";
import { HOT_TOPICS, PLACEHOLDER_IDEAS } from "../utils/constants";
import { sendPromptToAgent } from "../api/chatClient";
import { useChatState } from "../hooks/useChatState";

// [UI COMPONENT] Lightweight Markdown parser to beautifully render LLM code blocks without bulky dependencies
const MessageContent = ({ content, isUser, theme }: { content: string, isUser: boolean, theme: any }) => {
  if (isUser) {
    return <p className={`whitespace-pre-wrap leading-relaxed text-[15px] ${theme ? '' : ''}`}>{content}</p>;
  }

  const parts = content.split(/(```[\s\S]*?(?:```|$))/g).filter(Boolean);
  
  return (
    <div className={`leading-relaxed text-[15px] ${theme?.textPrimary || ''} space-y-3`}>
      {parts.map((part, index) => {
        if (part.startsWith('```')) {
          const match = part.match(/```(\w*)\n([\s\S]*?)(?:```|$)/);
          if (match) {
            const lang = match[1] || 'code';
            const code = match[2];
            return (
              <div key={index} className="my-3 rounded-xl overflow-hidden border border-[#1E1E20] dark:border-[#333] shadow-sm">
                <div className="flex items-center justify-between px-4 py-2 bg-[#F0F4F9] dark:bg-[#1E1E20] border-b border-[#E3E3E3] dark:border-[#333]">
                  <span className="text-xs font-mono text-[#444746] dark:text-[#A1A1AA] lowercase">{lang}</span>
                  <button 
                    onClick={() => navigator.clipboard.writeText(code)}
                    className="text-xs font-medium text-[#444746] hover:text-[#1F1F1F] dark:text-[#A1A1AA] dark:hover:text-white transition-colors"
                  >
                    Copy code
                  </button>
                </div>
                <div className="p-4 overflow-x-auto bg-[#FAFAFA] dark:bg-[#0E0E0F] custom-scrollbar">
                  <code className="text-sm font-mono text-[#1F1F1F] dark:text-[#E3E3E3] whitespace-pre">{code}</code>
                </div>
              </div>
            );
          }
          // If it doesn't match the standard ```lang format, just render it as is
          return <p key={index} className="whitespace-pre-wrap">{part.replace(/```/g, '')}</p>;
        }
        return <p key={index} className="whitespace-pre-wrap">{part}</p>;
      })}
    </div>
  );
};

export default function GeminiClone() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [randomPrompts, setRandomPrompts] = useState<typeof HOT_TOPICS>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Custom Hook [ARCHITECTURE] Abstracted 6 massive useStates for Chat History, Folders, and LocalStorage syncing
  const { 
    chatHistory, setChatHistory, 
    saveChatEnabled, setSaveChatEnabled, 
    folders, setFolders, 
    activeFolder, setActiveFolder, 
    customInstructions, setCustomInstructions, 
    deletedChats, setDeletedChats,
    isLoaded, setIsLoaded
  } = useChatState();

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Settings modal & dropdown
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [uploadDropdownOpen, setUploadDropdownOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"instructions" | "bin" | "about">("instructions");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [animatedPlaceholder, setAnimatedPlaceholder] = useState("");
  const [movingChatId, setMovingChatId] = useState<string | null>(null);
  const currentIdeaRef = useRef(0);

  const [guestPromptCount, setGuestPromptCount] = useState(0);
  const [showGuestModal, setShowGuestModal] = useState(false);

  // In-flight request controller — cancelled when a new prompt is submitted or component unmounts
  const abortControllerRef = useRef<AbortController | null>(null);

  // [AUTH STATE] Checking Supabase for active JWT session to securely grant premium/storage access
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  // Syncing guest count separately since it's auth-related, not global state-related
  useEffect(() => {
    try {
      const t = localStorage.getItem("noetic_theme");
      if (t === "dark") setIsDarkMode(true);
      const gc = localStorage.getItem("noetic_guest_prompts");
      if (gc) setGuestPromptCount(parseInt(gc, 10));
    } catch {}
    setIsLoaded(true);
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode, isLoaded]);

  // Typewriter placeholder animation
  useEffect(() => {
    if (!isLoaded) return;
    
    let ideaIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let timeout: NodeJS.Timeout;

    const animate = () => {
      const currentIdea = PLACEHOLDER_IDEAS[ideaIndex];
      
      if (isDeleting) {
        setAnimatedPlaceholder(currentIdea.substring(0, charIndex - 1));
        charIndex--;
      } else {
        setAnimatedPlaceholder(currentIdea.substring(0, charIndex + 1));
        charIndex++;
      }

      let speed = isDeleting ? 15 : 30;

      if (!isDeleting && charIndex === currentIdea.length) {
        speed = 2500; // Hold at the end
        isDeleting = true;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        ideaIndex = (ideaIndex + 1) % PLACEHOLDER_IDEAS.length;
        currentIdeaRef.current = ideaIndex;
        speed = 400; // Pause before next word
      }

      timeout = setTimeout(animate, speed);
    };

    timeout = setTimeout(animate, 1000);
    return () => clearTimeout(timeout);
  }, [isLoaded]);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);


  // Strict Design System Colors
  const theme = {
    bgApp: isDarkMode ? "bg-[#131314]" : "bg-[#FFFFFF]",
    bgSidebar: isDarkMode ? "bg-[#131314]" : "bg-[#F0F4F9]",
    bgModule: isDarkMode ? "bg-[#1E1E20]" : "bg-[#F0F4F9]",
    bgInput: isDarkMode ? "bg-[#1E1E20]" : "bg-[#F0F4F9]",
    
    textPrimary: isDarkMode ? "text-[#E3E3E3]" : "text-[#1F1F1F]",
    textSecondary: isDarkMode ? "text-[#C4C7C5]" : "text-[#444746]",
    textMuted: isDarkMode ? "text-[#C4C7C5]/60" : "text-[#444746]/60",
    
    borderMain: isDarkMode ? "border-[#1E1E20]" : "border-[#E3E3E3]",
    borderFocus: isDarkMode ? "focus-within:border-blue-500/40" : "focus-within:border-blue-500/30",
    
    hoverBg: isDarkMode ? "hover:bg-[#1E1E20]/80" : "hover:bg-[#E3E3E3]/50",
    activeBg: isDarkMode ? "active:bg-[#1E1E20]" : "active:bg-[#E3E3E3]",
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
      setChatHistory([newSession, ...chatHistory]);
    }
    setMessages([]);
    setCurrentChatId(null);
    setActiveFolder(null);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleAddFolder = () => {
    const name = window.prompt("New folder name:")?.trim();
    if (name && !folders.includes(name)) {
      setFolders(prev => [...prev, name]);
    }
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Move to recycle bin instead of permanent deletion
    const chat = chatHistory.find(c => c.id === id);
    if (chat) setDeletedChats(prev => [chat, ...prev]);
    setChatHistory(prev => prev.filter(c => c.id !== id));
    if (currentChatId === id) {
      setMessages([]);
      setCurrentChatId(null);
    }
  };

  const handleMoveToFolder = (id: string, folder: string | null, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatHistory(prev => prev.map(c => c.id === id ? { ...c, folder } : c));
    if (folder) setActiveFolder(folder);
    setMovingChatId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
      setUploadDropdownOpen(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const submitPrompt = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating) return;

    // [MONETIZATION] Enforcing our local guest quota strategy to drive trial-to-auth conversions
    if (!userEmail) {
      if (guestPromptCount >= 3) {
        setShowGuestModal(true);
        return;
      }
      setGuestPromptCount(prev => {
        const next = prev + 1;
        localStorage.setItem("noetic_guest_prompts", next.toString());
        return next;
      });
    }

    // Cancel any in-flight request before starting a new one
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsGenerating(true);
       // [CORE REASONING] Proxying request to the Python pipeline via isolated api client.
    try {
      const data = await sendPromptToAgent(text, controller);
      
      const responseMessage: Message = { 
        role: "assistant", 
        content: data.final_answer, 
        thoughts: data.thoughts 
      };
      
      const updatedMessages = [...newMessages, responseMessage];
      setMessages(updatedMessages);
      setIsGenerating(false);

      if (saveChatEnabled && userEmail) {
        if (currentChatId) {
          setChatHistory(prev => prev.map(chat => 
            chat.id === currentChatId 
              ? { ...chat, messages: updatedMessages, updatedAt: Date.now() } 
              : chat
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
      if (err instanceof Error && err.name === "AbortError") return; // cancelled — silently ignore
      const errorMessage = err instanceof Error ? err.message : String(err);
      setMessages([...newMessages, { 
        role: "assistant", 
        content: "Backend disconnected or failed: " + errorMessage
      }]);
      setIsGenerating(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, isGenerating, saveChatEnabled, currentChatId]);

  const loadChat = (chat: ChatSession) => {
    if (currentChatId === chat.id || isGenerating) return;
    
    if (saveChatEnabled && userEmail && messages.length > 0 && !currentChatId) {
      setChatHistory(prev => [{
        id: Date.now().toString(),
        title: messages[0].content.substring(0, 30) + "...",
        messages: [...messages],
        folder: activeFolder,
        updatedAt: Date.now()
      }, ...prev]);
    }
    
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    if (chat.folder) setActiveFolder(chat.folder);
  };
  
  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const filteredHistory = chatHistory.filter(chat => {
    const matchesSearch = !searchQuery || 
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      chat.messages.some((m: Message) => m.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFolder = activeFolder ? chat.folder === activeFolder : true;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className={`flex h-screen ${theme.bgApp} ${theme.textPrimary} font-sans selection:bg-blue-500/30 overflow-hidden transition-colors duration-500 relative`}>
      {isDarkMode && <StarBackground />}
      
      {/* Sidebar Wrapper */}
      <aside className={`${theme.bgSidebar} border-r ${theme.borderMain} flex flex-col h-full py-4 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarOpen ? 'w-[280px] translate-x-0' : 'w-0 -translate-x-full opacity-0 overflow-hidden'} z-20`}>
        <div className="px-4 mb-6 flex items-center justify-between relative">
          <button 
            onClick={() => setSidebarOpen(false)} 
            className={`p-2 rounded-md ${theme.hoverBg} transition-colors`}
            aria-label="Close sidebar"
          >
            <Menu className={`w-5 h-5 ${theme.textSecondary}`} />
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)} 
              className={`p-2 rounded-md ${theme.hoverBg} transition-colors ${dropdownOpen ? 'text-blue-500 bg-blue-500/10' : theme.textSecondary}`}
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setDropdownOpen(false)} />
                <div className={`absolute right-0 mt-2 w-56 rounded-xl border ${theme.borderMain} ${theme.bgModule} shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in zoom-in duration-200`}>
                  {[
                    { id: "instructions" as const, label: "My Instructions", icon: <SlidersHorizontal className="w-4 h-4" /> },
                    { id: "bin" as const, label: "Recycle Bin", icon: <Trash2 className="w-4 h-4" /> },
                    { id: "about" as const, label: "About Noetic", icon: <Info className="w-4 h-4" /> },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSettingsTab(item.id);
                        setSettingsOpen(true);
                        setDropdownOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textSecondary} hover:${theme.textPrimary} hover:${theme.hoverBg} transition-colors text-left`}
                    >
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
          <button 
            onClick={handleNewChat}
            disabled={isGenerating}
            className={`flex items-center gap-3 ${theme.bgModule} ${theme.hoverBg} text-sm px-4 py-2.5 rounded-md transition-colors w-full border ${theme.borderMain} ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Plus className={`w-4 h-4 ${theme.textSecondary}`} />
            <span className={`font-medium ${theme.textPrimary}`}>New chat</span>
          </button>
        </div>

        {/* Folders & History Section (Only visible to logged in users) */}
        {userEmail ? (
          <>
            <div className="px-4 mb-6">
              <div className="flex items-center justify-between px-2 mb-2">
                <p className={`text-xs font-semibold ${theme.textSecondary} tracking-wide uppercase`}>Folders</p>
                <button onClick={handleAddFolder} title="New folder" className={`p-1 rounded ${theme.hoverBg} hover:text-blue-500 transition-colors`}>
                  <FolderPlus className={`w-4 h-4 ${theme.textMuted}`} />
                </button>
              </div>
              <div className="space-y-0.5">
                {folders.map(folder => {
                  const folderChats = chatHistory.filter(c => c.folder === folder);
                  const isActive = activeFolder === folder;
                  
                  return (
                    <div key={folder} className="space-y-0.5">
                      <button 
                        onClick={() => setActiveFolder(isActive ? null : folder)}
                        className={`w-full flex items-center gap-3 text-sm px-3 py-2 rounded-md transition-colors text-left ${isActive ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' : `${theme.textSecondary} ${theme.hoverBg}`}`}
                      >
                        <Folder className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-500' : theme.textMuted}`} />
                        <span className="truncate flex-1 font-medium">{folder}</span>
                        {folderChats.length > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500/20' : 'bg-slate-200 dark:bg-[#1E1E20]'} ${theme.textMuted}`}>
                            {folderChats.length}
                          </span>
                        )}
                      </button>
                      
                      {/* Nested chats for active folder */}
                      {isActive && (
                        <div className="ml-7 border-l border-slate-200 dark:border-[#1E1E20] space-y-0.5 mt-0.5 pl-1">
                          {folderChats.length === 0 ? (
                            <p className={`text-[11px] ${theme.textMuted} py-1 pl-3 italic`}>No chats</p>
                          ) : (
                            folderChats.map(chat => (
                              <div
                                key={chat.id}
                                className={`group w-full flex flex-col gap-0.5 text-[13px] px-3 py-2 rounded-md text-left transition-colors cursor-pointer ${currentChatId === chat.id ? 'bg-slate-200 dark:bg-[#1E1E20] text-slate-900 dark:text-[#E3E3E3]' : `${theme.textSecondary} ${theme.hoverBg}`}`}
                                onClick={() => loadChat(chat)}
                              >
                                <div className="flex items-center gap-2">
                                  <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${currentChatId === chat.id ? theme.textPrimary : theme.textMuted}`} />
                                  <span className="truncate flex-1">{chat.title}</span>
                                  <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0 relative">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMovingChatId(movingChatId === chat.id ? null : chat.id);
                                      }}
                                      className={`p-1 rounded hover:text-blue-500 hover:bg-blue-500/10 ${movingChatId === chat.id ? 'text-blue-500 bg-blue-500/10' : ''}`}
                                      title="Move to folder"
                                    >
                                      <FolderPlus className="w-3 h-3" />
                                    </button>
                                    
                                    {movingChatId === chat.id && (
                                      <>
                                        <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMovingChatId(null); }} />
                                        <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border ${theme.borderMain} ${theme.bgModule} shadow-xl z-40 py-1 overflow-hidden animate-in fade-in zoom-in duration-200`}>
                                          <p className={`text-[10px] font-bold ${theme.textMuted} px-3 py-1 uppercase`}>Move to...</p>
                                          {folders.filter(f => f !== chat.folder).map(f => (
                                            <button
                                              key={f}
                                              onClick={(e) => handleMoveToFolder(chat.id, f, e)}
                                              className={`w-full text-left px-3 py-1.5 text-xs ${theme.textSecondary} hover:${theme.hoverBg} transition-colors flex items-center gap-2`}
                                            >
                                              <Folder className="w-3 h-3" /> {f}
                                            </button>
                                          ))}
                                          {chat.folder && (
                                            <button
                                              onClick={(e) => handleMoveToFolder(chat.id, null, e)}
                                              className={`w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2 border-t ${theme.borderMain}`}
                                            >
                                              <Trash2 className="w-3 h-3" /> Unfile chat
                                            </button>
                                          )}
                                        </div>
                                      </>
                                    )}
                                    
                                    <button
                                      onClick={(e) => handleDeleteChat(chat.id, e)}
                                      className={`p-1 rounded hover:text-red-500 hover:bg-red-500/10`}
                                      title="Delete chat"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Chat Toggle */}
            <div className="px-5 mb-5">
              <div className={`flex items-center justify-between p-3 ${theme.bgModule} rounded-md border ${theme.borderMain}`}>
                <span className={`text-sm ${theme.textSecondary} font-medium`}>Save History</span>
                <button 
                  onClick={() => setSaveChatEnabled(!saveChatEnabled)}
                  className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${saveChatEnabled ? 'bg-blue-600' : 'bg-slate-400 dark:bg-[#1E1E20]'}`}
                >
                  <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ease-[cubic-bezier(0.4,0,0.2,1)] ${saveChatEnabled ? 'translate-x-4' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* History / Recent */}
            <div className={`px-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col pt-4 border-t ${theme.borderMain}`}>
              <div className={`sticky top-0 ${theme.bgSidebar} pb-3 z-10`}>
                <div className={`relative flex items-center ${theme.bgModule} border ${theme.borderMain} ${theme.borderFocus} rounded-md px-3 py-2 transition-colors`}>
                  <Search className={`w-4 h-4 mr-2 ${theme.textMuted}`} />
                  <input 
                    type="text" 
                    placeholder={activeFolder ? `Search ${activeFolder}...` : "Search history..."} 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full bg-transparent ${theme.textPrimary} text-sm focus:outline-none ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#444746]/50'}`}
                  />
                </div>
              </div>
              
              <div className="space-y-0.5 mt-2">
                <p className={`text-xs font-semibold ${theme.textSecondary} uppercase px-2 mb-2`}>Recent Chats</p>
                {(() => {
                  // Only show chats that don't belong to any folder in this section
                  const unfiledChats = chatHistory.filter(c => !c.folder && (!searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase())));
                  
                  if (unfiledChats.length === 0) {
                    return (
                      <p className={`text-xs ${theme.textMuted} px-2 py-4 ${theme.bgModule} rounded-md border ${theme.borderMain} text-center`}>
                        {searchQuery ? "No unfiled matches." : "No unfiled chats."}
                      </p>
                    );
                  }
                  
                  return unfiledChats.map(chat => (
                    <div
                      key={chat.id}
                      className={`group w-full flex items-center gap-2 text-sm px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer ${currentChatId === chat.id ? 'bg-slate-200 dark:bg-[#1E1E20] text-slate-900 dark:text-[#E3E3E3]' : `${theme.textSecondary} ${theme.hoverBg}`}`}
                      onClick={() => loadChat(chat)}
                    >
                      <MessageSquare className={`w-4 h-4 shrink-0 ${currentChatId === chat.id ? theme.textPrimary : theme.textMuted}`} />
                      <span className="truncate flex-1">{chat.title}</span>
                      <div className="flex items-center opacity-0 group-hover:opacity-100 transition-all shrink-0 relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMovingChatId(movingChatId === chat.id ? null : chat.id);
                          }}
                          className={`p-1 rounded hover:text-blue-500 hover:bg-blue-500/10 ${movingChatId === chat.id ? 'text-blue-500 bg-blue-500/10' : ''}`}
                          title="Move to folder"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                        </button>
                        
                        {movingChatId === chat.id && (
                          <>
                            <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setMovingChatId(null); }} />
                            <div className={`absolute right-0 top-full mt-1 w-48 rounded-lg border ${theme.borderMain} ${theme.bgModule} shadow-xl z-40 py-1 overflow-hidden animate-in fade-in zoom-in duration-200`}>
                              <p className={`text-[10px] font-bold ${theme.textMuted} px-3 py-1 uppercase`}>Move to...</p>
                              {folders.map(f => (
                                <button
                                  key={f}
                                  onClick={(e) => handleMoveToFolder(chat.id, f, e)}
                                  className={`w-full text-left px-3 py-1.5 text-xs ${theme.textSecondary} hover:${theme.hoverBg} transition-colors flex items-center gap-2`}
                                >
                                  <Folder className="w-3 h-3" /> {f}
                                </button>
                              ))}
                            </div>
                          </>
                        )}

                        <button
                          onClick={(e) => handleDeleteChat(chat.id, e)}
                          className={`p-1 rounded hover:text-red-500 hover:bg-red-500/10`}
                          title="Delete chat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </>
        ) : (
          <div className="px-5 mt-4 flex-1">
            <div className={`p-4 rounded-xl border border-dashed ${theme.borderMain} ${theme.bgModule} text-center flex flex-col items-center justify-center gap-3`}>
              <HistoryIcon className={`w-6 h-6 ${theme.textMuted}`} />
              <p className={`text-sm ${theme.textSecondary}`}>
                Sign in to save your chat history and organize with folders.
              </p>
              <Link href="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer">
                Create Account
              </Link>
            </div>
          </div>
        )}
      </aside>

      {/* ── Settings Modal ─────────────────────────────────────────────────── */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setSettingsOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <div
            className={`relative w-full max-w-lg ${theme.bgModule} border ${theme.borderMain} rounded-2xl shadow-2xl overflow-hidden`}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between px-6 py-4 border-b ${theme.borderMain}`}>
              <h2 className={`font-semibold text-base ${theme.textPrimary}`}>Settings</h2>
              <button onClick={() => setSettingsOpen(false)} className={`text-xl leading-none ${theme.textMuted} hover:${theme.textPrimary} transition-colors`}>&times;</button>
            </div>

            {/* Tabs */}
            <div className={`flex border-b ${theme.borderMain} px-6`}>
              {([
                { id: "instructions" as const, label: "My Instructions", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
                { id: "bin" as const, label: "Recycle Bin", icon: <Trash2 className="w-3.5 h-3.5" /> },
                { id: "about" as const, label: "About", icon: <Info className="w-3.5 h-3.5" /> },
              ]).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSettingsTab(tab.id)}
                  className={`flex items-center gap-1.5 text-sm font-medium px-1 py-3 mr-5 border-b-2 transition-colors ${
                    settingsTab === tab.id
                      ? "border-blue-500 text-blue-500"
                      : `border-transparent ${theme.textMuted} hover:${theme.textSecondary}`
                  }`}
                >
                  {tab.icon}{tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="px-6 py-5 min-h-[260px]">

              {/* ── Personalised Instructions ── */}
              {settingsTab === "instructions" && (
                <div className="flex flex-col gap-3 h-full">
                  <p className={`text-sm ${theme.textSecondary}`}>
                    Tell Noetic how to respond — tone, focus areas, or anything you&apos;d like it to keep in mind.
                  </p>
                  <textarea
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    rows={7}
                    placeholder="e.g. Always respond concisely. Prefer code examples. Assume I'm an expert in Go and TypeScript."
                    className={`w-full resize-none rounded-xl border ${theme.borderMain} ${theme.bgSidebar} ${theme.textPrimary} text-sm px-4 py-3 outline-none focus:border-blue-500/60 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] transition-all placeholder-[#C4C7C5]/50`}
                  />
                  <p className={`text-xs ${theme.textMuted}`}>{customInstructions.length} / 2000 characters</p>
                </div>
              )}

              {/* ── Recycle Bin ── */}
              {settingsTab === "bin" && (
                <div className="flex flex-col gap-2">
                  {deletedChats.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-12 gap-2 ${theme.textMuted}`}>
                      <Trash2 className="w-8 h-8 opacity-30" />
                      <p className="text-sm">Recycle bin is empty</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-end mb-1">
                        <button
                          onClick={() => setDeletedChats([])}
                          className="text-xs text-red-500 hover:text-red-400 transition-colors"
                        >
                          Empty bin
                        </button>
                      </div>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto custom-scrollbar">
                        {deletedChats.map(chat => (
                          <div key={chat.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border ${theme.borderMain} ${theme.bgSidebar}`}>
                            <MessageSquare className={`w-4 h-4 shrink-0 ${theme.textMuted}`} />
                            <span className={`flex-1 text-sm truncate ${theme.textSecondary}`}>{chat.title}</span>
                            <button
                              onClick={() => {
                                setChatHistory(prev => [chat, ...prev]);
                                setDeletedChats(prev => prev.filter(c => c.id !== chat.id));
                              }}
                              title="Restore"
                              className="text-blue-500 hover:text-blue-400 transition-colors shrink-0"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletedChats(prev => prev.filter(c => c.id !== chat.id))}
                              title="Delete permanently"
                              className="text-red-500/60 hover:text-red-500 transition-colors shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── About ── */}
              {settingsTab === "about" && (
                <div className={`flex flex-col gap-4 text-sm ${theme.textSecondary}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className={`font-semibold ${theme.textPrimary}`}>Noetic</p>
                      <p className={`text-xs ${theme.textMuted}`}>AI Reasoning Platform — v1.0.0</p>
                    </div>
                  </div>
                  <p>Noetic is a chain-of-thought reasoning interface powered by a custom Go transformer backend. It visualises attention maps, reasoning steps, and tool calls in real time.</p>
                  <div className={`rounded-xl border ${theme.borderMain} divide-y ${theme.borderMain} text-xs`}>
                    {[
                      ["Frontend", "Next.js 16 · React 19 · Tailwind CSS 4"],
                      ["Backend", "Go · Gorilla Mux · Redis · Kafka"],
                      ["Auth", "Supabase JWT"],
                      ["Built for", "Hackathon 2026"],
                    ].map(([k, v]) => (
                      <div key={k} className="flex items-center px-3 py-2 gap-3">
                        <span className={`w-20 shrink-0 ${theme.textMuted}`}>{k}</span>
                        <span className={theme.textPrimary}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 flex flex-col relative h-full min-w-0 overflow-hidden">
        {/* Header */}
        <header className={`px-4 py-3 flex items-center justify-between sticky top-0 ${theme.bgApp} border-b ${theme.borderMain} z-10 w-full transition-colors duration-500`}>
          <div className="flex items-center gap-3">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className={`p-2 rounded-md ${theme.hoverBg} transition-colors mr-1`}>
                <Menu className={`w-5 h-5 ${theme.textSecondary}`} />
              </button>
            )}
            <div className={`flex items-center text-lg font-semibold ${theme.textPrimary}`}>
              <span>Noetic</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className={`p-2 rounded-md ${theme.textSecondary} ${theme.hoverBg} transition-colors`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            {/* Avatar + logout */}
            {userEmail ? (
              <div className="flex items-center gap-1">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0`} title={userEmail ?? ""} >
                  {userEmail[0].toUpperCase()}
                </div>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-md ${theme.textMuted} ${theme.hoverBg} hover:text-red-500 transition-colors`}
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link 
                href="/login"
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-medium transition-colors shadow-sm ml-1`}
              >
                Sign In
              </Link>
            )}
          </div>
        </header>

        {/* Feed & Welcome */}
        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 pb-48 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="mt-20 flex flex-col items-center text-center px-4 max-w-4xl mx-auto">
              <h1 className={`text-3xl font-semibold mb-2 tracking-tight ${theme.textPrimary} transition-colors duration-500`}>
                Hello, Aryan
              </h1>
              <h2 className={`text-xl font-normal ${theme.textSecondary} transition-colors duration-500`}>
                How can I help you today?
              </h2>
              
              {/* Suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 w-full mt-12">
                {randomPrompts.map((prompt: { text: string }, idx: number) => (
                   <button 
                     key={idx}
                     onClick={() => submitPrompt(prompt.text)}
                     disabled={isGenerating}
                     className={`text-left ${theme.bgModule} ${theme.hoverBg} p-4 rounded-xl min-h-[120px] flex flex-col border ${theme.borderMain} transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-0.5 ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                   >
                     <p className={`${theme.textSecondary} text-sm leading-relaxed line-clamp-4`}>{prompt.text}</p>
                   </button>
                ))}
              </div>

              {!saveChatEnabled && (
                <div className={`mt-8 bg-transparent border ${isDarkMode ? 'border-[#C4C7C5]/30 text-[#C4C7C5]/90' : 'border-[#444746]/30 text-[#444746]/90'} text-sm px-4 py-2.5 rounded-xl flex items-center justify-center gap-2.5 max-w-sm mx-auto transition-colors duration-500`}>
                  <HistoryIcon className="w-3.5 h-3.5 opacity-60" />
                  <span className="text-[13px] font-medium tracking-tight">Chat saving is deactivated for this session</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6 mt-8">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-4 w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className={`w-8 h-8 rounded-full ${theme.bgModule} border ${theme.borderMain} flex items-center justify-center shrink-0`}>
                      <Bot className={`w-4 h-4 ${theme.textPrimary}`} />
                    </div>
                  )}
                  <div className={`w-full overflow-hidden ${msg.role === 'user' ? `max-w-[85%] bg-[#F0F4F9] dark:bg-[#1E1E20] text-[#1F1F1F] dark:text-[#E3E3E3] py-3 px-5 rounded-xl border border-[#E3E3E3] dark:border-[#1E1E20] transition-colors duration-500` : 'pt-1.5 transition-colors duration-500'}`}>
                    {/* [VISUALIZER] Dynamically extracting the parsed thoughts to map out the AI's internal logic as an xyflow DAG */}
                    {msg.role === 'assistant' && msg.thoughts && msg.thoughts.length > 0 && (
                      <ReasoningChain thoughts={msg.thoughts} isGenerating={isGenerating && i === messages.length - 1} />
                    )}
                    <MessageContent content={msg.content} isUser={msg.role === 'user'} theme={theme} />
                  </div>
                </div>
              ))}
              
              {/* UI Loading State */}
              {isGenerating && (
                <div className="flex gap-4 w-full justify-start">
                  <div className={`w-8 h-8 rounded-full ${theme.bgModule} border ${theme.borderMain} flex items-center justify-center shrink-0`}>
                    <Loader2 className={`w-4 h-4 ${theme.textSecondary} animate-spin`} />
                  </div>
                  <div className="pt-2 flex items-center">
                    <span className={`text-sm ${theme.textMuted}`}>Processing...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input Wrapper */}
        <div className={`absolute bottom-0 w-full bg-gradient-to-t ${isDarkMode ? 'from-slate-950 via-slate-950' : 'from-white via-white'} to-transparent pt-12 pb-6 px-4 transition-colors duration-500`}>
          <div className="max-w-[850px] mx-auto">
            {/* Hidden Inputs */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
            <input type="file" ref={imageInputRef} onChange={handleFileChange} accept="image/*" className="hidden" multiple />

            <div className={`${theme.bgInput} rounded-xl flex flex-col px-4 pt-3 pb-2 border ${theme.borderMain} ${theme.borderFocus} transition-colors duration-500`}>
              
              {/* Attachment Preview Area */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-slate-200 dark:border-[#1E1E20]">
                  {attachments.map((file, i) => (
                    <div key={i} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium border ${theme.borderMain} ${theme.bgSidebar} ${theme.textSecondary}`}>
                      <span className="max-w-[120px] truncate">{file.name}</span>
                      <button onClick={() => removeAttachment(i)} className={`hover:text-red-500 transition-colors`}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <textarea 
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab' && !input.trim() && animatedPlaceholder) {
                    e.preventDefault();
                    setInput(PLACEHOLDER_IDEAS[currentIdeaRef.current]);
                    return;
                  }
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (input.trim() || attachments.length > 0) {
                      submitPrompt(input);
                      setAttachments([]); // Clear after submit
                    }
                  }
                }}
                disabled={isGenerating}
                placeholder={animatedPlaceholder || "Ask Noetic"}
                className={`w-full bg-transparent outline-none resize-none text-[15px] ${theme.textPrimary} ${isDarkMode ? 'placeholder-[#C4C7C5]/50' : 'placeholder-[#1F1F1F]/60'} leading-6`}
                rows={1}
                style={{ minHeight: "24px" }}
              />
              <div className="flex justify-between items-center mt-3 border-t border-transparent pt-1">
                <div className={`flex gap-1 ${theme.textMuted} relative`}>
                  
                  {/* Upload Dropdown */}
                  <div className="relative">
                    <button 
                      type="button" 
                      onClick={() => setUploadDropdownOpen(!uploadDropdownOpen)}
                      disabled={isGenerating} 
                      className={`p-2 ${theme.hoverBg} rounded-md transition-colors ${uploadDropdownOpen ? 'text-blue-500 bg-blue-500/10' : ''}`}
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {uploadDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setUploadDropdownOpen(false)} />
                        <div className={`absolute bottom-full left-0 mb-2 w-48 rounded-xl border ${theme.borderMain} ${theme.bgModule} shadow-xl z-40 py-1.5 overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textSecondary} hover:${theme.textPrimary} hover:${theme.hoverBg} transition-colors text-left`}
                          >
                            <SlidersHorizontal className="w-4 h-4 opacity-70" />
                            <span className="font-medium">Upload Files</span>
                          </button>
                          <button
                            onClick={() => imageInputRef.current?.click()}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm ${theme.textSecondary} hover:${theme.textPrimary} hover:${theme.hoverBg} transition-colors text-left`}
                          >
                            <ImageIcon className="w-4 h-4 opacity-70" />
                            <span className="font-medium">Upload Images</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  <button type="button" disabled={isGenerating} className={`p-2 ${theme.hoverBg} rounded-md transition-colors`}><Mic className="w-4 h-4" /></button>
                </div>
                
                {isGenerating ? (
                  <button 
                    onClick={handleStop}
                    className={`p-2 rounded-md ${theme.bgModule} text-red-500 hover:bg-red-500/10 transition-colors border-none outline-none`}
                    title="Stop generating"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                ) : (
                  <button 
                    onClick={() => {
                      submitPrompt(input);
                      setAttachments([]); // Clear after submit
                    }}
                    disabled={!input.trim() && attachments.length === 0}
                    className={`p-2 rounded-md transition-colors border-none outline-none ${input.trim() || attachments.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white' : `${theme.bgModule} text-[#444746] dark:text-[#C4C7C5] cursor-not-allowed`}`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className={`text-center text-xs ${theme.textMuted} mt-3`}>
              Noetic operates on an isolated AI reasoning model. Please verify responses. <Link href="/privacy" className="underline hover:text-blue-500 transition-colors">Privacy</Link>
            </p>
          </div>
        </div>

        {/* ── Guest Limit Modal ─────────────────────────────────────────────────── */}
        {showGuestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowGuestModal(false)}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div className={`relative w-full max-w-sm ${theme.bgModule} border ${theme.borderMain} rounded-2xl shadow-2xl p-6 text-center animate-in fade-in zoom-in duration-200`} onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <h2 className={`text-lg font-bold ${theme.textPrimary} mb-2`}>Guest Limit Reached</h2>
              <p className={`text-[15px] ${theme.textSecondary} mb-6 leading-relaxed`}>
                You&apos;ve used up your free preview prompts. Sign in or create an account to continue reasoning and save your chat history.
              </p>
              <div className="flex flex-col gap-2">
                <Link 
                  href="/login"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl transition-colors inline-block"
                >
                  Sign In / Sign Up
                </Link>
                <button 
                  onClick={() => setShowGuestModal(false)}
                  className={`w-full py-2.5 text-sm font-medium ${theme.textSecondary} hover:${theme.textPrimary} transition-colors`}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
