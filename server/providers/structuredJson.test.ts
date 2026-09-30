import { describe, expect, it } from "vitest";
import { parseStructuredJson } from "./structuredJson.js";

describe("parseStructuredJson", () => {
  it("parses a clean JSON object", () => {
    expect(parseStructuredJson<{ value: number }>("{\"value\":42}")).toEqual({ value: 42 });
  });

  it("removes markdown fences and trailing commas", () => {
    const text = "```json\n{\n  \"items\": [\"aluminum\",],\n}\n```";
    expect(parseStructuredJson<{ items: string[] }>(text)).toEqual({ items: ["aluminum"] });
  });

  it("rejects output without an object", () => {
    expect(() => parseStructuredJson("not json")).toThrow("did not contain a JSON object");
  });
});
