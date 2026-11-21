import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ReasoningChain from "./ReasoningChain";

// Mock @xyflow/react
vi.mock("@xyflow/react", () => ({
  ReactFlow: ({ children }: any) => <div data-testid="react-flow">{children}</div>,
  Background: () => <div data-testid="flow-background" />,
  Handle: () => <div data-testid="flow-handle" />,
  Position: { Left: "left", Right: "right" },
  MarkerType: { ArrowClosed: "arrowclosed" },
}));

describe("ReasoningChain", () => {
  const sampleThoughts = [
    { step: "Decomposition", content: "Breaking down the user question into subproblems." },
    { step: "Synthesis", content: "Aggregating findings into a final response." },
  ];

  it("renders null when thoughts array is empty", () => {
    const { container } = render(<ReasoningChain thoughts={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the reasoning trace header and steps", () => {
    render(<ReasoningChain thoughts={sampleThoughts} />);
    expect(screen.getByText("Reasoning Trace")).toBeInTheDocument();
    expect(screen.getByText("2 steps")).toBeInTheDocument();
  });

  it("supports copying the trace text to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });

    render(<ReasoningChain thoughts={sampleThoughts} />);
    const copyBtn = screen.getByTitle("Copy reasoning trace");
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("[Phase 1 - Decomposition]")
    );
  });
});
