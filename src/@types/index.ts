export interface Thought {
  step: string;
  content: string;
  confidence?: number;
  duration_ms?: number;
  is_reflection?: boolean;
}

export interface Citation {
  claim: string;
  source: string;
  verification_status: "verified" | "unverified";
}

export interface Message {
  role: string;
  content: string;
  thoughts?: Thought[];
  citations?: Citation[];
  sender?: string; // email of user who sent the prompt (for collab rooms)
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  folder: string | null;
  updatedAt: number;
}

export interface CollabUser {
  email: string;
  color: string;
  joinedAt: number;
}
