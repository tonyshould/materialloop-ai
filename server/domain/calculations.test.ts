import { describe, expect, it } from "vitest";
import { AnalysisResultSchema } from "../../shared/contracts.js";
import { applyDeterministicCalculations } from "./calculations.js";
import { enforceEvidenceGate } from "./evidenceGate.js";
import { buildDemoAnalysis } from "./fixtures.js";

describe("MaterialLoop evidence-gated calculations", () => {
  it("calculates the approved Case A values from versioned rules", () => {
    const result = applyDeterministicCalculations(enforceEvidenceGate(buildDemoAnalysis("case-a-success", "demo", "12345678-demo")));
    expect(result.decisionStatus).toBe("ready");
    expect(result.valuation.traditionalRecoveryTwd).toBe(27_500);
    expect(result.valuation.secondLifeNetTwd).toBe(35_500);
    expect(result.valuation.upliftPercent).toBe(29.1);
    expect(result.impact.avoidedCo2eKg).toBe(1_600);
    expect(result.match.score).toBe(92);
    expect(() => AnalysisResultSchema.parse(result)).not.toThrow();
  });

  it.each(["case-b-photo-only", "case-c-conflict"] as const)("blocks every downstream claim for %s", (caseId) => {
    const result = applyDeterministicCalculations(enforceEvidenceGate(buildDemoAnalysis(caseId, "demo", "12345678-demo")));
    expect(result.valuation.status).toBe("blocked");
    expect(result.impact.status).toBe("blocked");
    expect(result.match.status).toBe("blocked");
    expect(result.notificationStatus).toBe("blocked");
    expect(result.opportunities).toHaveLength(0);
    expect(() => AnalysisResultSchema.parse(result)).not.toThrow();
  });
});
