import { describe, it, expect } from "vitest";
import { HOT_TOPICS, PLACEHOLDER_IDEAS } from "./constants";

describe("Constants", () => {
  it("should define non-empty HOT_TOPICS list", () => {
    expect(Array.isArray(HOT_TOPICS)).toBe(true);
    expect(HOT_TOPICS.length).toBeGreaterThan(0);
    HOT_TOPICS.forEach((topic) => {
      expect(topic).toHaveProperty("text");
      expect(typeof topic.text).toBe("string");
      expect(topic.text.trim().length).toBeGreaterThan(0);
    });
  });

  it("should define non-empty PLACEHOLDER_IDEAS list", () => {
    expect(Array.isArray(PLACEHOLDER_IDEAS)).toBe(true);
    expect(PLACEHOLDER_IDEAS.length).toBeGreaterThan(0);
    PLACEHOLDER_IDEAS.forEach((idea) => {
      expect(typeof idea).toBe("string");
      expect(idea.trim().length).toBeGreaterThan(0);
    });
  });
});
