import { buildDemoAnalysis } from "../domain/fixtures.js";
import type { MaterialAnalysisProvider } from "./types.js";

export const demoProvider: MaterialAnalysisProvider = {
  async analyze(request, _assets, runId) {
    return buildDemoAnalysis(request.caseId, "demo", runId);
  }
};
