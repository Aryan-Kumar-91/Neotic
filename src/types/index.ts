export interface Thought {
  step: string;
  content: string;
}

export interface Message {
  role: string;
  content: string;
  thoughts?: Thought[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  folder: string | null;
  updatedAt: number;
}
