import { z } from "zod";

export const ProvenanceSchema = z.enum([
  "USER_PROVIDED",
  "DOCUMENT_EXTRACTED",
  "AI_INFERRED",
  "DEMO_DATA",
  "VERIFIED",
  "RULE_ENGINE"
]);

export const VerificationStatusSchema = z.enum([
  "missing",
  "observed",
  "supported",
  "conflict",
  "human_verified"
]);

export const DecisionStatusSchema = z.enum([
  "ready",
  "insufficient_evidence",
  "evidence_conflict",
  "manual_review",
  "analysis_failed"
]);

export const EvidenceFieldSchema = z.object({
  value: z.union([z.string(), z.number(), z.null()]),
  provenance: ProvenanceSchema,
  verificationStatus: VerificationStatusSchema,
  confidence: z.number().min(0).max(1).nullable(),
  sourceLabel: z.string()
});

export const OpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  target: z.string(),
  compatibility: z.number().min(0).max(100),
  economicPotential: z.enum(["LOW", "MEDIUM", "HIGH"]),
  circularityPotential: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["CONDITIONAL", "VERIFICATION_REQUIRED"]),
  requiredProcessing: z.string(),
  risk: z.string()
});

export const ConflictSchema = z.object({
  field: z.string(),
  evidenceA: z.string(),
  evidenceB: z.string(),
  resolution: z.string()
});

export const AnalysisResultSchema = z.object({
  runId: z.string(),
  caseId: z.enum(["case-a-success", "case-b-photo-only", "case-c-conflict"]),
  provider: z.enum(["demo", "gemini"]),
  model: z.string(),
  decisionStatus: DecisionStatusSchema,
  materialPassportId: z.string().nullable(),
  fields: z.record(z.string(), EvidenceFieldSchema),
  missingFields: z.array(z.string()),
  conflicts: z.array(ConflictSchema),
  opportunities: z.array(OpportunitySchema),
  valuation: z.object({
    status: z.enum(["ready", "blocked"]),
    datasetVersion: z.string().nullable(),
    traditionalRecoveryTwd: z.number().nullable(),
    secondLifeGrossTwd: z.number().nullable(),
    processingCostTwd: z.number().nullable(),
    verificationCostTwd: z.number().nullable(),
    logisticsCostTwd: z.number().nullable(),
    secondLifeNetTwd: z.number().nullable(),
    upliftPercent: z.number().nullable(),
    lowTwd: z.number().nullable(),
    highTwd: z.number().nullable()
  }),
  impact: z.object({
    status: z.enum(["ready", "blocked"]),
    factorVersion: z.string().nullable(),
    divertedKg: z.number().nullable(),
    avoidedCo2eKg: z.number().nullable(),
    virginDisplacementKg: z.number().nullable()
  }),
  match: z.object({
    status: z.enum(["ready", "blocked"]),
    score: z.number().nullable(),
    buyerName: z.string().nullable(),
    breakdown: z.record(z.string(), z.number())
  }),
  notificationStatus: z.enum(["approval_required", "blocked"]),
  disclaimers: z.array(z.string()),
  googleServices: z.object({
    vertexAi: z.boolean(),
    cloudStorage: z.boolean(),
    firestore: z.boolean(),
    cloudLogging: z.boolean()
  }),
  createdAt: z.string()
});

export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type EvidenceField = z.infer<typeof EvidenceFieldSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type DemoCaseId = AnalysisResult["caseId"];

export interface AnalyzeRequest {
  caseId: DemoCaseId;
  provider: "demo" | "gemini";
  sourceProcess?: string;
  quantityKg?: number;
  location?: string;
}
