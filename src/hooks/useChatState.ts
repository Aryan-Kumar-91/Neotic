import { useState, useEffect } from "react";
import { ChatSession } from "../@types/index";

export function useChatState() {
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([]);
  const [saveChatEnabled, setSaveChatEnabled] = useState(true);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [customInstructions, setCustomInstructions] = useState("");
  const [deletedChats, setDeletedChats] = useState<ChatSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // [PERFORMANCE] Optimistically syncing previous workspace environment states
  useEffect(() => {
    try {
      const h = localStorage.getItem("noetic_chatHistory");
      if (h) setChatHistory(JSON.parse(h));
      
      const f = localStorage.getItem("noetic_folders");
      if (f) setFolders(JSON.parse(f));
      
      const ci = localStorage.getItem("noetic_customInstructions");
      if (ci) setCustomInstructions(ci);
      
      const bin = localStorage.getItem("noetic_deletedChats");
      if (bin) setDeletedChats(JSON.parse(bin));
      
      const gc = localStorage.getItem("noetic_guest_prompts");
      // Guest state handled separately since it doesn't align purely with history
    } catch (e) {
      console.error("Local storage sync error", e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_chatHistory", JSON.stringify(chatHistory));
  }, [chatHistory, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_saveChat", JSON.stringify(saveChatEnabled));
  }, [saveChatEnabled, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_folders", JSON.stringify(folders));
  }, [folders, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_customInstructions", customInstructions);
  }, [customInstructions, isLoaded]);

  useEffect(() => {
    if (isLoaded) localStorage.setItem("noetic_deletedChats", JSON.stringify(deletedChats));
  }, [deletedChats, isLoaded]);

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
