import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendPromptToAgent, streamPromptToAgent, Thought } from "./chatClient";

describe("chatClient.sendPromptToAgent", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should successfully send prompt and return parsed response", async () => {
    const mockResponseData = {
      thoughts: [{ step: "Step 1", content: "Analyzing question" }],
      final_answer: "The answer is 42",
      citations: [
        {
          claim: "Calculated answer",
          source: "Deep Thought",
          verification_status: "verified" as const,
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => mockResponseData,
    } as Response);

    const controller = new AbortController();
    const result = await sendPromptToAgent("What is the meaning of life?", controller);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(result.final_answer).toBe("The answer is 42");
    expect(result.thoughts).toHaveLength(1);
    expect(result.thoughts[0].step).toBe("Step 1");
    expect(result.citations).toHaveLength(1);
  });

  it("should throw an error when API returns a non-ok status", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "Internal Server Error" }),
    } as Response);

    const controller = new AbortController();
    await expect(sendPromptToAgent("Test prompt", controller)).rejects.toThrow(
      "Internal Server Error"
    );
  });

  it("should stream thoughts via SSE and return final result", async () => {
    const ssePayload = [
      'event: thought\ndata: {"step": "Phase 1", "content": "Initializing"}\n\n',
      'event: thought\ndata: {"step": "Phase 2", "content": "Deducing"}\n\n',
      'event: done\ndata: {"final_answer": "Streamed Answer", "thoughts": [{"step": "Phase 1", "content": "Initializing"}, {"step": "Phase 2", "content": "Deducing"}], "citations": []}\n\n'
    ].join("");

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(ctrl) {
        ctrl.enqueue(encoder.encode(ssePayload));
        ctrl.close();
      }
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      body: stream,
    } as unknown as Response);

    const receivedThoughts: Thought[] = [];
    const controller = new AbortController();
    const result = await streamPromptToAgent(
      "Streaming test prompt",
      controller,
      (t) => receivedThoughts.push(t)
    );

    expect(receivedThoughts).toHaveLength(2);
    expect(receivedThoughts[0].step).toBe("Phase 1");
    expect(receivedThoughts[1].step).toBe("Phase 2");
    expect(result.final_answer).toBe("Streamed Answer");
  });
});
