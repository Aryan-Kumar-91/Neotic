"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import type { Message, CollabUser } from "@/@types/index";
import type { RealtimeChannel } from "@supabase/supabase-js";

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Join the room
  useEffect(() => {
    if (!roomId || !userEmail) return;

    const channel = supabase.channel(`collab:${roomId}`, {
      config: { broadcast: { self: false } },
    });

    // ── Presence: track who is online ──
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState<{ email: string; color: string; joinedAt: number }>();
      const users: CollabUser[] = [];
      const seen = new Set<string>();
      Object.values(state).forEach((presences) => {
        presences.forEach((p) => {
          if (!seen.has(p.email)) {
            seen.add(p.email);
            users.push({ email: p.email, color: p.color, joinedAt: p.joinedAt });
          }
        });
      });
      setOnlineUsers(users);
    });

    // ── Broadcast: receive messages from other users ──
    channel.on("broadcast", { event: "message" }, (payload) => {
      const msg = payload.payload as Message;
      setIncomingMessage(msg);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          email: userEmail,
          color: pickColor(userEmail),
          joinedAt: Date.now(),
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, userEmail]);

  // Broadcast a message to all peers
  const broadcastMessage = useCallback(
    (message: Message) => {
      channelRef.current?.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });
    },
    []
  );

  // Clear the incoming message after consumer reads it
  const clearIncoming = useCallback(() => setIncomingMessage(null), []);

  return { onlineUsers, incomingMessage, broadcastMessage, clearIncoming };
}
