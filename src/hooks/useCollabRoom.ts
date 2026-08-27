"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { db } from "@/lib/firebase";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import type { Message, CollabUser } from "@/@types/index";

// Stable user colors for the presence avatars
const USER_COLORS = [
  "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B",
  "#10B981", "#06B6D4", "#EF4444", "#6366F1",
];

function pickColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function useCollabRoom(roomId: string, userEmail: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<CollabUser[]>([]);
  const [incomingMessage, setIncomingMessage] = useState<Message | null>(null);
  const messageListenerInitialized = useRef(false);

  // 1. Sync Online Users (Presence)
  useEffect(() => {
    if (!roomId || !userEmail) return;

    const presenceRef = collection(db, "rooms", roomId, "presence");
    const userPresenceDoc = doc(presenceRef, userEmail.replace(/\./g, "_"));

    // Join room
    const joinRoom = async () => {
      await setDoc(userPresenceDoc, {
        email: userEmail,
        color: pickColor(userEmail),
        lastActive: serverTimestamp()
      });
    };

    joinRoom();

    // Listen to players
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const users: CollabUser[] = snapshot.docs.map((doc) => ({
        email: doc.data().email,
        color: doc.data().color,
        joinedAt: doc.data().lastActive?.seconds * 1000 || Date.now()
      }));
      setOnlineUsers(users);
    });

    return () => {
      unsubscribe();
      deleteDoc(userPresenceDoc); // Cleanup on leave
    };
  }, [roomId, userEmail]);

  // 2. Sync Messages (Broadcast)
  useEffect(() => {
    messageListenerInitialized.current = false;
    if (!roomId) return;

    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

    // Ignore the initial snapshot so joining a room does not replay its last message.
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!messageListenerInitialized.current) {
        messageListenerInitialized.current = true;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type !== "added") return;
        const data = change.doc.data() as Message;
        // The sender already appends its local message; only peers should receive it.
        if (data.sender && data.sender === userEmail) return;
        setIncomingMessage(data);
      });
    });

    return () => unsubscribe();
  }, [roomId, userEmail]);

  // Broadcast a message to all peers
  const broadcastMessage = useCallback(
    async (message: Message) => {
      if (!roomId) return;
      await addDoc(collection(db, "rooms", roomId, "messages"), {
        ...message,
        timestamp: serverTimestamp()
      });
    },
    [roomId]
  );

  // Clear the incoming message after consumer reads it
  const clearIncoming = useCallback(() => setIncomingMessage(null), []);

  return { onlineUsers, incomingMessage, broadcastMessage, clearIncoming };
}
