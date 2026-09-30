import type { AnalysisResult } from "../../shared/contracts.js";

export function enforceEvidenceGate(result: AnalysisResult): AnalysisResult {
  if (result.decisionStatus !== "ready") {
    return {
      ...result,
      materialPassportId: result.decisionStatus === "insufficient_evidence" ? null : result.materialPassportId,
      opportunities: [],
      valuation: { ...result.valuation, status: "blocked" },
      impact: { ...result.impact, status: "blocked" },
      match: { status: "blocked", score: null, buyerName: null, breakdown: {} },
      notificationStatus: "blocked"
    };
  }
  return result;
}
