// Convert a File to a base64 data string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]); // strip data:...;base64, prefix
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface FileAttachment {
  name: string;
  mime_type: string;
  data: string; // base64
}

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

export async function sendPromptToAgent(
  input: string,
  abortController: AbortController,
  attachments?: File[],
  userPrefs?: { name: string; interests: string }
): Promise<{ thoughts: Thought[]; final_answer: string; citations: Citation[] }> {
  
  // Build attachment payloads
  const files: FileAttachment[] = [];
  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      files.push({
        name: file.name,
        mime_type: file.type || "application/octet-stream",
        data: await fileToBase64(file),
      });
    }
  }

  const apiBase = import.meta.env.VITE_API_URL || "";
  const response = await fetch(`${apiBase}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input, files, user_prefs: userPrefs }),
    signal: abortController.signal,
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.statusText}`);
  }

  return response.json();
}

export async function streamPromptToAgent(
  input: string,
  abortController: AbortController,
  onThought: (thought: Thought) => void,
  attachments?: File[],
  userPrefs?: { name: string; interests: string }
): Promise<{ thoughts: Thought[]; final_answer: string; citations: Citation[] }> {
  const files: FileAttachment[] = [];
  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      files.push({
        name: file.name,
        mime_type: file.type || "application/octet-stream",
        data: await fileToBase64(file),
      });
    }
  }

  const apiBase = import.meta.env.VITE_API_URL || "";
  let response: Response;

  try {
    response = await fetch(`${apiBase}/api/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input, files, user_prefs: userPrefs }),
      signal: abortController.signal,
    });
  } catch {
    return sendPromptToAgent(input, abortController, attachments, userPrefs);
  }

  if (!response.ok || !response.body) {
    return sendPromptToAgent(input, abortController, attachments, userPrefs);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const collectedThoughts: Thought[] = [];
  let result: { thoughts: Thought[]; final_answer: string; citations: Citation[] } | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const events = buffer.split("\n\n");
    buffer = events.pop() || "";

    for (const event of events) {
      const lines = event.split("\n");
      let eventType = "message";
      let data = "";

      for (const line of lines) {
        if (line.startsWith("event: ")) {
          eventType = line.slice(7).trim();
        } else if (line.startsWith("data: ")) {
          data = line.slice(6).trim();
        }
      }

      if (!data) continue;

      try {
        const parsed = JSON.parse(data);
        if (eventType === "thought") {
          collectedThoughts.push(parsed);
          onThought(parsed);
        } else if (eventType === "done") {
          result = parsed;
        }
      } catch {
        // Skip unparseable lines
      }
    }
  }

  if (result) {
    return result;
  }

  return {
    thoughts: collectedThoughts,
    final_answer: "Reasoning complete.",
    citations: [],
  };
}
