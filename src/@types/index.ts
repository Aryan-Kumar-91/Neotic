export interface Thought {
  step: string;
  content: string;
}

export interface Message {
  role: string;
  content: string;
  thoughts?: Thought[];
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
