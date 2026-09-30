import "dotenv/config";
import { randomUUID } from "node:crypto";
import { AnalysisResultSchema } from "../shared/contracts.js";
import { applyDeterministicCalculations } from "../server/domain/calculations.js";
import { enforceEvidenceGate } from "../server/domain/evidenceGate.js";
import { geminiProvider } from "../server/providers/geminiProvider.js";

const project = process.env.GOOGLE_CLOUD_PROJECT;
const model = process.env.GEMINI_MODEL;
if (!project || !model) {
  throw new Error("Set GOOGLE_CLOUD_PROJECT and GEMINI_MODEL in .env before running npm run gemini:verify.");
}

console.log(`Verifying ${model} on Vertex AI project ${project}...`);
const observed = await geminiProvider.analyze(
  {
    caseId: "case-a-success",
    provider: "gemini",
    sourceProcess: "CNC Milling",
    quantityKg: 500,
    location: "Taiwan"
  },
  {},
  randomUUID()
);
const result = AnalysisResultSchema.parse(applyDeterministicCalculations(enforceEvidenceGate(observed)));

if (result.provider !== "gemini" || result.decisionStatus !== "ready") {
  throw new Error(`Unexpected Gemini result: provider=${result.provider}, decisionStatus=${result.decisionStatus}`);
}
if (!result.fields.materialFamily?.value || !result.fields.physicalForm?.value) {
  throw new Error("Gemini did not return the required material observations.");
}

console.log(JSON.stringify({
  status: "PASS",
  provider: result.provider,
  model: result.model,
  materialFamily: result.fields.materialFamily.value,
  candidateMaterial: result.fields.candidateMaterial?.value,
  physicalForm: result.fields.physicalForm.value,
  decisionStatus: result.decisionStatus,
  valueDataset: result.valuation.datasetVersion,
  impactFactor: result.impact.factorVersion
}, null, 2));
