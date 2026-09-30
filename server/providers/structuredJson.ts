function extractObject(text: string): string {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end < start) {
    throw new SyntaxError("The model response did not contain a JSON object.");
  }
  return trimmed.slice(start, end + 1);
}

/**
 * Parse structured model output while tolerating two common presentation errors:
 * Markdown fences and trailing commas. Schema validation remains the caller's job.
 */
export function parseStructuredJson<T>(text: string): T {
  const objectText = extractObject(text);
  const candidates = [objectText, objectText.replace(/,\s*([}\]])/g, "$1")];
  let lastError: unknown;

  for (const candidate of [...new Set(candidates)]) {
    try {
      return JSON.parse(candidate) as T;
    } catch (error) {
      lastError = error;
    }
  }

  const detail = lastError instanceof Error ? lastError.message : "Unknown JSON parse error";
  throw new SyntaxError(`The model returned invalid JSON: ${detail}`);
}
