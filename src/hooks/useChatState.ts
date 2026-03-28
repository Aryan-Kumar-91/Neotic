import { useState, useEffect } from "react";
import { ChatSession } from "../@types/index";
import { db, auth } from "../lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from "firebase/firestore";

// Helper for safe JSON parsing
const safeParse = <T>(key: string, fallback: T): T => {
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
  const [userUid, setUserUid] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserUid(user ? user.uid : null);
    });
    return () => unsub();
  }, []);

  // Mark hydration complete for client-only components
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Firestore Chat Sync
  useEffect(() => {
    if (!userUid) return;
    const chatsRef = collection(db, "users", userUid, "chats");
    const q = query(chatsRef, orderBy("updatedAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbChats: ChatSession[] = [];
      snapshot.forEach(doc => {
        dbChats.push(doc.data() as ChatSession);
      });
      setChatHistory(dbChats);
    }, (err) => {
      console.error("Firestore sync error:", err);
    });

    return () => unsubscribe();
  }, [userUid]);

  const updateChatInDb = async (chat: ChatSession) => {
    if (!auth.currentUser) return;
    try {
      const chatRef = doc(db, "users", auth.currentUser.uid, "chats", chat.id);
      await setDoc(chatRef, chat);
    } catch (e) {
      console.error("Error saving chat:", e);
    }
  };

  const deleteChatFromDb = async (chatId: string) => {
    if (!auth.currentUser) return;
    try {
      const chatRef = doc(db, "users", auth.currentUser.uid, "chats", chatId);
      await deleteDoc(chatRef);
    } catch (e) {
      console.error("Error deleting chat:", e);
    }
  };

  // Sync state to localStorage on update
  useEffect(() => {
    if (isLoaded) {
      if (!userUid) localStorage.setItem("neotic_chatHistory", JSON.stringify(chatHistory));
      localStorage.setItem("neotic_saveChat", JSON.stringify(saveChatEnabled));
      localStorage.setItem("neotic_folders", JSON.stringify(folders));
      localStorage.setItem("neotic_customInstructions", customInstructions);
      localStorage.setItem("neotic_deletedChats", JSON.stringify(deletedChats));
    }
  }, [chatHistory, saveChatEnabled, folders, customInstructions, deletedChats, isLoaded, userUid]);

  return {
    chatHistory, setChatHistory,
    saveChatEnabled, setSaveChatEnabled,
    folders, setFolders,
    activeFolder, setActiveFolder,
    customInstructions, setCustomInstructions,
    deletedChats, setDeletedChats,
    isLoaded, setIsLoaded,
    updateChatInDb, deleteChatFromDb
  };
}
