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

interface Thought {
  step: string;
  content: string;
}

export async function sendPromptToAgent(
  input: string,
  abortController: AbortController,
  attachments?: File[]
): Promise<{ thoughts: Thought[]; final_answer: string }> {
  
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

  const response = await fetch('/api/chat', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: input, files }),
    signal: abortController.signal,
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.statusText}`);
  }

  return response.json();
}
