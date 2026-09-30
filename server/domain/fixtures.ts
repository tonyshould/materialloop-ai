import type { AnalysisResult, DemoCaseId, EvidenceField, Opportunity } from "../../shared/contracts.js";

const field = (
  value: string | number | null,
  provenance: EvidenceField["provenance"],
  verificationStatus: EvidenceField["verificationStatus"],
  confidence: number | null,
  sourceLabel: string
): EvidenceField => ({ value, provenance, verificationStatus, confidence, sourceLabel });

export const opportunities: Opportunity[] = [
  {
    id: "architectural-components",
    title: "Architectural Components",
    target: "Construction",
    compatibility: 92,
    economicPotential: "HIGH",
    circularityPotential: "HIGH",
    status: "CONDITIONAL",
    requiredProcessing: "Degreasing, sorting and dimensional conversion",
    risk: "Composition and surface contamination must be verified"
  },
  {
    id: "secondary-feedstock",
    title: "Secondary Aluminum Feedstock",
    target: "Metals",
    compatibility: 89,
    economicPotential: "MEDIUM",
    circularityPotential: "HIGH",
    status: "CONDITIONAL",
    requiredProcessing: "Sorting, compaction and remelt preparation",
    risk: "Alloy segregation requires verification"
  },
  {
    id: "furniture-components",
    title: "Furniture Components",
    target: "Furniture",
    compatibility: 84,
    economicPotential: "MEDIUM",
    circularityPotential: "MEDIUM",
    status: "CONDITIONAL",
    requiredProcessing: "Surface finishing and mechanical conversion",
    risk: "Mechanical properties require testing"
  },
  {
    id: "thermal-management",
    title: "Thermal Management Applications",
    target: "Electronics",
    compatibility: 72,
    economicPotential: "MEDIUM",
    circularityPotential: "MEDIUM",
    status: "VERIFICATION_REQUIRED",
    requiredProcessing: "Purification and precision forming",
    risk: "Thermal performance is not yet verified"
  },
  {
    id: "additive-feedstock",
    title: "Additive Manufacturing Feedstock",
    target: "Advanced Manufacturing",
    compatibility: 68,
    economicPotential: "LOW",
    circularityPotential: "MEDIUM",
    status: "VERIFICATION_REQUIRED",
    requiredProcessing: "Atomization and powder qualification",
    risk: "Powder safety and alloy chemistry require full validation"
  }
];

const base = (caseId: DemoCaseId, provider: "demo" | "gemini", runId: string): AnalysisResult => ({
  runId,
  caseId,
  provider,
  model: provider === "gemini" ? process.env.GEMINI_MODEL || "environment-configured" : "deterministic-demo-v1",
  decisionStatus: "analysis_failed",
  materialPassportId: null,
  fields: {},
  missingFields: [],
  conflicts: [],
  opportunities: [],
  valuation: {
    status: "blocked",
    datasetVersion: null,
    traditionalRecoveryTwd: null,
    secondLifeGrossTwd: null,
    processingCostTwd: null,
    verificationCostTwd: null,
    logisticsCostTwd: null,
    secondLifeNetTwd: null,
    upliftPercent: null,
    lowTwd: null,
    highTwd: null
  },
  impact: {
    status: "blocked",
    factorVersion: null,
    divertedKg: null,
    avoidedCo2eKg: null,
    virginDisplacementKg: null
  },
  match: { status: "blocked", score: null, buyerName: null, breakdown: {} },
  notificationStatus: "blocked",
  disclaimers: [
    "AI-generated preliminary assessment.",
    "Engineering and regulatory verification may be required before industrial use."
  ],
  googleServices: {
    vertexAi: provider === "gemini",
    cloudStorage: false,
    firestore: false,
    cloudLogging: true
  },
  createdAt: new Date().toISOString()
});

export function buildDemoAnalysis(caseId: DemoCaseId, provider: "demo" | "gemini", runId: string): AnalysisResult {
  const result = base(caseId, provider, runId);

  if (caseId === "case-b-photo-only") {
    result.decisionStatus = "insufficient_evidence";
    result.fields = {
      candidateMaterial: field(null, "AI_INFERRED", "missing", 0.42, "Material photo"),
      materialFamily: field("Aluminum-like metal", "AI_INFERRED", "observed", 0.68, "Material photo"),
      physicalForm: field("Mixed machining chips", "AI_INFERRED", "observed", 0.87, "Material photo"),
      contamination: field("Surface oil possible", "AI_INFERRED", "observed", 0.61, "Material photo"),
      weightKg: field(null, "USER_PROVIDED", "missing", null, "Input form"),
      location: field(null, "USER_PROVIDED", "missing", null, "Input form")
    };
    result.missingFields = ["lot_id", "material_certificate", "weight_kg", "location_region"];
    return result;
  }

  if (caseId === "case-c-conflict") {
    result.decisionStatus = "evidence_conflict";
    result.fields = {
      lotId: field(null, "DOCUMENT_EXTRACTED", "conflict", 0.99, "Form + Demo COA"),
      materialFamily: field("Aluminum", "DOCUMENT_EXTRACTED", "supported", 0.96, "Demo COA"),
      compositionTotalPct: field(102.4, "DOCUMENT_EXTRACTED", "conflict", 0.99, "Demo COA"),
      weightKg: field(500, "USER_PROVIDED", "supported", null, "Input form"),
      location: field("Taiwan", "USER_PROVIDED", "supported", null, "Input form")
    };
    result.conflicts = [
      {
        field: "lot_id",
        evidenceA: "Form: ML-C-042",
        evidenceB: "COA: ML-C-077",
        resolution: "Confirm document ownership before continuing"
      },
      {
        field: "composition_total_pct",
        evidenceA: "Expected demo tolerance: 98-101%",
        evidenceB: "COA total: 102.40%",
        resolution: "Upload a corrected certificate or request human review"
      }
    ];
    return result;
  }

  result.decisionStatus = "ready";
  result.materialPassportId = `MP-${runId.slice(0, 8).toUpperCase()}`;
  result.fields = {
    candidateMaterial: field("Aluminum 6061", "DOCUMENT_EXTRACTED", "supported", 0.94, "Demo COA"),
    materialFamily: field("Aluminum", "DOCUMENT_EXTRACTED", "supported", 0.98, "Demo COA"),
    physicalForm: field("CNC Machining Offcuts", "AI_INFERRED", "observed", 0.94, "Material photo"),
    sourceProcess: field("CNC Milling", "USER_PROVIDED", "supported", null, "Input form"),
    weightKg: field(500, "USER_PROVIDED", "supported", null, "Input form"),
    location: field("Taiwan", "USER_PROVIDED", "supported", null, "Input form"),
    contamination: field("Unknown surface contamination", "AI_INFERRED", "missing", 0.55, "Material photo")
  };
  result.opportunities = opportunities;
  result.notificationStatus = "approval_required";
  return result;
}
