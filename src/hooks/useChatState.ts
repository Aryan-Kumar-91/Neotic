import { useState, useEffect } from "react";
import { ChatSession } from "../@types/index";

// Helper for safe JSON parsing
const safeParse = (key: string, fallback: any) => {
  if (typeof window === "undefined") return fallback;
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

export function useChatState() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => safeParse("neotic_chatHistory", []));
  const [saveChatEnabled, setSaveChatEnabled] = useState(() => {
    const s = safeParse("neotic_saveChat", true);
    return typeof s === "boolean" ? s : true;
  });
  const [folders, setFolders] = useState<string[]>(() => safeParse("neotic_folders", []));
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("neotic_customInstructions") || "";
  });
  const [deletedChats, setDeletedChats] = useState<ChatSession[]>(() => safeParse("neotic_deletedChats", []));
  const [isLoaded, setIsLoaded] = useState(false);

  // Mark hydration complete for client-only components
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Sync state to localStorage on update
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("neotic_chatHistory", JSON.stringify(chatHistory));
      localStorage.setItem("neotic_saveChat", JSON.stringify(saveChatEnabled));
      localStorage.setItem("neotic_folders", JSON.stringify(folders));
      localStorage.setItem("neotic_customInstructions", customInstructions);
      localStorage.setItem("neotic_deletedChats", JSON.stringify(deletedChats));
    }
  }, [chatHistory, saveChatEnabled, folders, customInstructions, deletedChats, isLoaded]);

  return {
    chatHistory, setChatHistory,
    saveChatEnabled, setSaveChatEnabled,
    folders, setFolders,
    activeFolder, setActiveFolder,
    customInstructions, setCustomInstructions,
    deletedChats, setDeletedChats,
    isLoaded, setIsLoaded
  };
}
