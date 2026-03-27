import { Message, ChatSession } from "../@types/index";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8001";

export async function sendPromptToAgent(input: string, abortController: AbortController): Promise<{ thoughts: any[], final_answer: string }> {
  const response = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input }),
    signal: abortController.signal
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.statusText}`);
  }

  return response.json();
}
