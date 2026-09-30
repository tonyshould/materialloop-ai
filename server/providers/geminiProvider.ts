import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { AnalysisResultSchema, type AnalysisResult, type EvidenceField, type Opportunity } from "../../shared/contracts.js";
import { buildDemoAnalysis, opportunities as demoOpportunities } from "../domain/fixtures.js";
import { parseStructuredJson } from "./structuredJson.js";
import type { MaterialAnalysisProvider } from "./types.js";

const GeminiObservationSchema = z.object({
  materialFamily: z.string().nullable(),
  candidateMaterial: z.string().nullable(),
  physicalForm: z.string().nullable(),
  contaminationObservation: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  documentLotId: z.string().nullable(),
  compositionTotalPct: z.number().nullable(),
  suggestedOpportunities: z.array(z.object({
    title: z.string(),
    target: z.string(),
    compatibility: z.number().min(0).max(100),
    requiredProcessing: z.string(),
    risk: z.string()
  })).max(5)
});

type GeminiObservation = z.infer<typeof GeminiObservationSchema>;

const fixtureCertificateByCase = {
  "case-a-success": "public/demo/Demo_COA_Aluminum_6061_ML-A-001.pdf",
  "case-c-conflict": "public/demo/Demo_COA_Conflict_ML-C-077.pdf"
} as const;

const responseJsonSchema = {
  type: "object",
  required: ["materialFamily", "candidateMaterial", "physicalForm", "contaminationObservation", "confidence", "documentLotId", "compositionTotalPct", "suggestedOpportunities"],
  properties: {
    materialFamily: { anyOf: [{ type: "string" }, { type: "null" }] },
    candidateMaterial: { anyOf: [{ type: "string" }, { type: "null" }] },
    physicalForm: { anyOf: [{ type: "string" }, { type: "null" }] },
    contaminationObservation: { anyOf: [{ type: "string" }, { type: "null" }] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    documentLotId: { anyOf: [{ type: "string" }, { type: "null" }] },
    compositionTotalPct: { anyOf: [{ type: "number" }, { type: "null" }] },
    suggestedOpportunities: {
      type: "array",
      maxItems: 5,
      items: {
        type: "object",
        required: ["title", "target", "compatibility", "requiredProcessing", "risk"],
        properties: {
          title: { type: "string" },
          target: { type: "string" },
          compatibility: { type: "number", minimum: 0, maximum: 100 },
          requiredProcessing: { type: "string" },
          risk: { type: "string" }
        }
      }
    }
  }
};

function toOpportunity(item: GeminiObservation["suggestedOpportunities"][number], index: number): Opportunity {
  return {
    id: `gemini-opportunity-${index + 1}`,
    title: item.title,
    target: item.target,
    compatibility: Math.round(item.compatibility),
    economicPotential: index === 0 ? "HIGH" : index < 3 ? "MEDIUM" : "LOW",
    circularityPotential: index < 2 ? "HIGH" : "MEDIUM",
    status: item.compatibility >= 80 ? "CONDITIONAL" : "VERIFICATION_REQUIRED",
    requiredProcessing: item.requiredProcessing,
    risk: item.risk
  };
}

export const geminiProvider: MaterialAnalysisProvider = {
  async analyze(request, assets, runId) {
    const project = process.env.GOOGLE_CLOUD_PROJECT;
    const location = process.env.GOOGLE_CLOUD_LOCATION || "global";
    const model = process.env.GEMINI_MODEL;
    if (!project || !model) {
      throw new Error("Gemini mode requires GOOGLE_CLOUD_PROJECT and GEMINI_MODEL.");
    }

    const ai = new GoogleGenAI({ vertexai: true, project, location });
    const fallbackImage = await readFile(resolve("public/demo/aluminum-offcuts-demo.png"));
    const fixtureCertificatePath = request.caseId === "case-b-photo-only" ? null : fixtureCertificateByCase[request.caseId];
    const certificate = assets.certificate
      ? assets.certificate
      : fixtureCertificatePath
        ? {
            buffer: await readFile(resolve(fixtureCertificatePath)),
            mimeType: "application/pdf",
            originalName: fixtureCertificatePath.split("/").at(-1) || "synthetic-demo-coa.pdf"
          }
        : undefined;
    const parts: Array<Record<string, unknown>> = [
      {
        text: [
          "You are the multimodal evidence reader for MaterialLoop AI.",
          "Observe the industrial by-product photo and, when present, extract the supplied material certificate.",
          "Do not make final engineering safety decisions, financial calculations, CO2 calculations or the final match score.",
          "Return null when evidence is unavailable. Treat all supplied sample data as synthetic demo evidence.",
          `User form: source process=${request.sourceProcess || "unknown"}, quantity kg=${request.quantityKg ?? "unknown"}, location=${request.location || "unknown"}.`,
          `Requested fixture path=${request.caseId}.`
        ].join("\n")
      },
      {
        inlineData: {
          data: (assets.photo?.buffer || fallbackImage).toString("base64"),
          mimeType: assets.photo?.mimeType || "image/png"
        }
      }
    ];
    if (certificate) {
      parts.push({
        inlineData: {
          data: certificate.buffer.toString("base64"),
          mimeType: certificate.mimeType
        }
      });
    }

    let observation: GeminiObservation | undefined;
    let lastStructuredOutputError: unknown;
    for (let attempt = 1; attempt <= 2; attempt += 1) {
      const attemptParts = attempt === 1
        ? parts
        : [{ text: "Retry: return one complete JSON object only. Do not use Markdown fences or trailing commas." }, ...parts];
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: "user", parts: attemptParts }],
        config: {
          responseMimeType: "application/json",
          responseJsonSchema,
          temperature: 0,
          maxOutputTokens: 3500
        }
      });

      try {
        observation = GeminiObservationSchema.parse(parseStructuredJson<unknown>(response.text || ""));
        break;
      } catch (error) {
        lastStructuredOutputError = error;
      }
    }
    if (!observation) {
      const detail = lastStructuredOutputError instanceof Error ? lastStructuredOutputError.message : "Unknown structured-output error";
      throw new Error(`Gemini structured output failed after one retry: ${detail}`);
    }
    const result = buildDemoAnalysis(request.caseId, "gemini", runId);
    result.model = model;

    const patchField = (key: string, value: string | number | null, source: string, confidence: number): EvidenceField => ({
      value,
      provenance: source === "certificate" ? "DOCUMENT_EXTRACTED" : "AI_INFERRED",
      verificationStatus: value === null ? "missing" : source === "certificate" ? "supported" : "observed",
      confidence,
      sourceLabel: source === "certificate" ? "Uploaded certificate" : "Gemini image observation"
    });

    result.fields.materialFamily = patchField("materialFamily", observation.materialFamily, "image", observation.confidence);
    result.fields.physicalForm = patchField("physicalForm", observation.physicalForm, "image", observation.confidence);
    result.fields.contamination = patchField("contamination", observation.contaminationObservation, "image", observation.confidence);
    if (certificate) {
      result.fields.candidateMaterial = patchField("candidateMaterial", observation.candidateMaterial, "certificate", observation.confidence);
    }
    if (request.caseId === "case-a-success") {
      result.opportunities = observation.suggestedOpportunities.length
        ? observation.suggestedOpportunities.map(toOpportunity)
        : demoOpportunities;
    }
    return AnalysisResultSchema.parse(result) as AnalysisResult;
  }
};
