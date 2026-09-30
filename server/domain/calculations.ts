import type { AnalysisResult } from "../../shared/contracts.js";

export function applyDeterministicCalculations(input: AnalysisResult): AnalysisResult {
  if (input.decisionStatus !== "ready") return input;

  const weightKg = Number(input.fields.weightKg?.value || 0);
  const traditionalRecoveryTwd = 55 * weightKg;
  const secondLifeGrossTwd = 95 * weightKg;
  const processingCostTwd = 6000;
  const verificationCostTwd = 2500;
  const logisticsCostTwd = 3500;
  const secondLifeNetTwd = secondLifeGrossTwd - processingCostTwd - verificationCostTwd - logisticsCostTwd;
  const upliftPercent = Number((((secondLifeNetTwd - traditionalRecoveryTwd) / traditionalRecoveryTwd) * 100).toFixed(1));

  const breakdown = {
    materialCompatibility: 100,
    specificationCompatibility: 88,
    quantityMatch: 100,
    processingFeasibility: 80,
    locationLogistics: 80
  };
  const score = Math.round(
    breakdown.materialCompatibility * 0.35 +
      breakdown.specificationCompatibility * 0.25 +
      breakdown.quantityMatch * 0.15 +
      breakdown.processingFeasibility * 0.15 +
      breakdown.locationLogistics * 0.1
  );

  return {
    ...input,
    valuation: {
      status: "ready",
      datasetVersion: "demo-price-tw-2026q3-v1",
      traditionalRecoveryTwd,
      secondLifeGrossTwd,
      processingCostTwd,
      verificationCostTwd,
      logisticsCostTwd,
      secondLifeNetTwd,
      upliftPercent,
      lowTwd: Math.round(secondLifeNetTwd * 0.88),
      highTwd: Math.round(secondLifeNetTwd * 1.12)
    },
    impact: {
      status: "ready",
      factorVersion: "demo-impact-2026-v1",
      divertedKg: weightKg,
      avoidedCo2eKg: weightKg * 3.2,
      virginDisplacementKg: weightKg * 0.85
    },
    match: {
      status: "ready",
      score,
      buyerName: "Synthetic Buyer B",
      breakdown
    }
  };
}
