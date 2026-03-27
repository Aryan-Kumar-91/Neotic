"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useCollabRoom } from "@/hooks/useCollabRoom";
import { sendPromptToAgent } from "@/api/chatClient";
import ReasoningChain from "@/components/ReasoningChain";
import StarBackground from "@/components/StarBackground";
import type { Message, CollabUser } from "@/@types/index";
import {
  Send, Bot, Loader2, Copy, Check, LogOut, Users, ArrowLeft, Square
} from "lucide-react";

// ─── Markdown Parser (reused from main page) ────────────────────────────────
const MessageContent = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?(?:```|$))/g).filter(Boolean);
  return (
    <div className="leading-relaxed text-[15px] text-[#E3E3E3] space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)(?:```|$)/);
          if (match) {
            return (
              <div key={i} className="my-3 rounded-xl overflow-hidden border border-[#333]">
                <div className="flex items-center justify-between px-4 py-2 bg-[#1E1E20] border-b border-[#333]">
                  <span className="text-xs font-mono text-[#A1A1AA] lowercase">{match[1] || "code"}</span>
                  <button onClick={() => navigator.clipboard.writeText(match[2])} className="text-xs text-[#A1A1AA] hover:text-white transition-colors">Copy</button>
                </div>
                <div className="p-4 overflow-x-auto bg-[#0E0E0F]">
                  <code className="text-sm font-mono text-[#E3E3E3] whitespace-pre">{match[2]}</code>
                </div>
              </div>
            );
          }
        }
        return <p key={i} className="whitespace-pre-wrap">{part}</p>;
      })}
    </div>
  );
};

// ─── Avatar component ────────────────────────────────────────────────────────
function UserAvatar({ email, color, size = "sm" }: { email: string; color: string; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-[11px]" : "w-8 h-8 text-xs";
  return (
    <div
      className={`${s} rounded-full flex items-center justify-center text-white font-bold shrink-0 ring-2 ring-[#0A0A0B] transition-transform hover:scale-110`}
      style={{ backgroundColor: color }}
      title={email}
    >
      {email[0].toUpperCase()}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CollabRoom() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Auth check — only logged-in users can access
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
      setAuthChecked(true);
      if (!data.user?.email) router.push("/login");
    });
  }, [router]);

  // Collab hook
  const { onlineUsers, incomingMessage, broadcastMessage, clearIncoming } = useCollabRoom(roomId, userEmail);

  // Process incoming messages from peers
  useEffect(() => {
    if (!incomingMessage) return;
    setMessages((prev) => [...prev, incomingMessage]);
    clearIncoming();
  }, [incomingMessage, clearIncoming]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => { abortControllerRef.current?.abort(); };
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const submitPrompt = useCallback(async (text: string) => {
    if (!text.trim() || isGenerating || !userEmail) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMsg: Message = { role: "user", content: text, sender: userEmail };
    setMessages((prev) => [...prev, userMsg]);
    broadcastMessage(userMsg);
    setInput("");
    setIsGenerating(true);

    try {
      const data = await sendPromptToAgent(text, controller);
      const assistantMsg: Message = {
        role: "assistant",
        content: data.final_answer,
        thoughts: data.thoughts,
        sender: userEmail, // attribution: this user triggered the response
      };
      setMessages((prev) => [...prev, assistantMsg]);
      broadcastMessage(assistantMsg);
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
      const errorMsg: Message = {
        role: "assistant",
        content: "Backend disconnected: " + (err instanceof Error ? err.message : String(err)),
        sender: "system",
      };
      setMessages((prev) => [...prev, errorMsg]);
      broadcastMessage(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, userEmail, broadcastMessage]);

  const handleStop = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  if (!authChecked) {
    return (
      <div className="flex h-screen bg-[#131314] items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!userEmail) return null; // redirecting to login

  return (
    <div className="flex flex-col h-screen bg-[#131314] text-[#E3E3E3] font-sans overflow-hidden relative">
      <StarBackground />

      {/* ── Header ── */}
      <header className="px-4 py-3 flex items-center justify-between border-b border-[#1E1E20] bg-[#131314]/90 backdrop-blur-md z-10 shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-md hover:bg-[#1E1E20] transition-colors" title="Back to home">
            <ArrowLeft className="w-5 h-5 text-[#C4C7C5]" />
          </Link>
          <div>
            <h1 className="text-base font-semibold">Collab Room</h1>
            <p className="text-[10px] text-[#777] font-mono tracking-wider uppercase">{roomId}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Online Users */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-[#555]" />
            <div className="flex -space-x-2">
              {onlineUsers.map((u) => (
                <UserAvatar key={u.email} email={u.email} color={u.color} />
              ))}
            </div>
            <span className="text-[11px] text-[#555] font-medium ml-1">
              {onlineUsers.length} online
            </span>
          </div>

          <div className="w-px h-5 bg-[#333]" />

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 text-[11px] text-[#888] hover:text-white bg-[#1E1E20] hover:bg-[#333] px-3 py-1.5 rounded-lg transition-colors font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied!" : "Invite Link"}
          </button>

          {/* User + Logout */}
          <div className="flex items-center gap-1">
            <UserAvatar email={userEmail} color={onlineUsers.find((u) => u.email === userEmail)?.color || "#3B82F6"} size="md" />
            <button onClick={handleLogout} className="p-2 rounded-md text-[#555] hover:text-red-500 hover:bg-[#1E1E20] transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Chat Feed ── */}
      <div ref={feedRef} className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto px-4 pb-48 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="mt-20 flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Collaborative Session</h2>
            <p className="text-[#777] text-sm max-w-md">Share the invite link with teammates. All prompts and AI responses are synced in real time.</p>
          </div>
        ) : (
          <div className="space-y-5 mt-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-[#1E1E20] border border-[#333] flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-[#E3E3E3]" />
                  </div>
                )}
                <div className={`overflow-hidden ${msg.role === "user" ? "max-w-[85%]" : "w-full"}`}>
                  {/* Sender Tag */}
                  {msg.sender && msg.sender !== "system" && (
                    <p className={`text-[11px] font-semibold mb-1 tracking-wide ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      <span className="text-[#666]">{msg.sender === userEmail ? "You" : msg.sender}</span>
                    </p>
                  )}
                  <div className={msg.role === "user"
                    ? "bg-[#1E1E20] text-[#E3E3E3] py-3 px-5 rounded-xl border border-[#1E1E20]"
                    : "pt-1"}>
                    {msg.role === "assistant" && msg.thoughts && msg.thoughts.length > 0 && (
                      <ReasoningChain thoughts={msg.thoughts} isGenerating={isGenerating && i === messages.length - 1} />
                    )}
                    {msg.role === "user" ? (
                      <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.content}</p>
                    ) : (
                      <MessageContent content={msg.content} />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isGenerating && (
              <div className="flex gap-3 w-full justify-start">
                <div className="w-8 h-8 rounded-full bg-[#1E1E20] border border-[#333] flex items-center justify-center shrink-0">
                  <Loader2 className="w-4 h-4 text-[#C4C7C5] animate-spin" />
                </div>
                <div className="pt-2 flex items-center">
                  <span className="text-sm text-[#777]">Processing...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Input Bar ── */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-[#131314] via-[#131314] to-transparent pt-12 pb-6 px-4">
        <div className="max-w-[850px] mx-auto">
          <div className="bg-[#1E1E20] rounded-xl flex flex-col px-4 pt-3 pb-2 border border-[#1E1E20] focus-within:border-blue-500/40 transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) submitPrompt(input);
                }
              }}
              disabled={isGenerating}
              placeholder="Ask Neotic collaboratively..."
              className="w-full bg-transparent outline-none resize-none text-[15px] text-[#E3E3E3] placeholder-[#C4C7C5]/50 leading-6"
              rows={1}
              style={{ minHeight: "24px" }}
            />
            <div className="flex justify-end items-center mt-2 pt-1">
              {isGenerating ? (
                <button onClick={handleStop} className="p-2 rounded-md bg-[#1E1E20] text-red-500 hover:bg-red-500/10 transition-colors" title="Stop">
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => { if (input.trim()) submitPrompt(input); }}
                  disabled={!input.trim()}
                  className={`p-2 rounded-md transition-colors ${input.trim() ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-[#1E1E20] text-[#C4C7C5] cursor-not-allowed"}`}
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <p className="text-center text-xs text-[#555] mt-3">
            Collaborative session · All messages are shared in real time
          </p>
        </div>
      </div>
    </div>
  );
}
