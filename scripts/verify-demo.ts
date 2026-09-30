import { AnalysisResultSchema } from "../shared/contracts.js";
import { applyDeterministicCalculations } from "../server/domain/calculations.js";
import { enforceEvidenceGate } from "../server/domain/evidenceGate.js";
import { buildDemoAnalysis } from "../server/domain/fixtures.js";

const expected = {
  "case-a-success": "ready",
  "case-b-photo-only": "insufficient_evidence",
  "case-c-conflict": "evidence_conflict"
} as const;

for (const [caseId, decisionStatus] of Object.entries(expected)) {
  const result = applyDeterministicCalculations(
    enforceEvidenceGate(buildDemoAnalysis(caseId as keyof typeof expected, "demo", `verify-${caseId}`))
  );
  AnalysisResultSchema.parse(result);
  if (result.decisionStatus !== decisionStatus) throw new Error(`${caseId} returned ${result.decisionStatus}`);
  if (caseId !== "case-a-success" && [result.valuation.status, result.impact.status, result.match.status].some((status) => status !== "blocked")) {
    throw new Error(`${caseId} allowed a downstream claim through the evidence gate.`);
  }
  console.log(`PASS ${caseId}: ${result.decisionStatus}`);
}
