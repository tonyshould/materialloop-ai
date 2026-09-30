import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import "dotenv/config";
import express from "express";
import multer from "multer";
import { AnalysisResultSchema, type AnalyzeRequest, type DemoCaseId } from "../shared/contracts.js";
import { applyDeterministicCalculations } from "./domain/calculations.js";
import { enforceEvidenceGate } from "./domain/evidenceGate.js";
import { persistGoogleArtifacts } from "./google/persistence.js";
import { logEvent } from "./google/logging.js";
import { demoProvider } from "./providers/demoProvider.js";
import { geminiProvider } from "./providers/geminiProvider.js";
import type { AnalyzeAssets } from "./providers/types.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 2 },
  fileFilter: (_request, file, callback) => {
    const allowed = ["image/png", "image/jpeg", "application/pdf"];
    if (allowed.includes(file.mimetype)) callback(null, true);
    else callback(new Error("Only PNG, JPEG and PDF files are accepted."));
  }
});

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok", service: "materialloop-ai", provider: process.env.ANALYZER_PROVIDER || "demo" });
});

app.get("/api/config", (_request, response) => {
  response.json({
    defaultProvider: process.env.ANALYZER_PROVIDER || "demo",
    geminiConfigured: Boolean(process.env.GOOGLE_CLOUD_PROJECT && process.env.GEMINI_MODEL),
    model: process.env.GEMINI_MODEL || null,
    googleServices: ["Vertex AI", "Cloud Run", "Cloud Storage", "Firestore", "Secret Manager", "Cloud Logging"]
  });
});

app.post(
  "/api/analyze",
  upload.fields([
    { name: "photo", maxCount: 1 },
    { name: "certificate", maxCount: 1 }
  ]),
  async (request, response) => {
    const runId = randomUUID();
    try {
      const files = request.files as Record<string, Express.Multer.File[]> | undefined;
      const providerName = request.body.provider === "gemini" ? "gemini" : "demo";
      const caseId = (request.body.caseId || "case-a-success") as DemoCaseId;
      const input: AnalyzeRequest = {
        caseId,
        provider: providerName,
        sourceProcess: request.body.sourceProcess || "CNC Milling",
        quantityKg: request.body.quantityKg ? Number(request.body.quantityKg) : caseId === "case-b-photo-only" ? undefined : 500,
        location: request.body.location || (caseId === "case-b-photo-only" ? undefined : "Taiwan")
      };
      const assets: AnalyzeAssets = {
        photo: files?.photo?.[0]
          ? { buffer: files.photo[0].buffer, mimeType: files.photo[0].mimetype, originalName: files.photo[0].originalname }
          : undefined,
        certificate: files?.certificate?.[0]
          ? { buffer: files.certificate[0].buffer, mimeType: files.certificate[0].mimetype, originalName: files.certificate[0].originalname }
          : undefined
      };

      logEvent("INFO", "analysis_started", { runId, caseId, provider: providerName });
      const provider = providerName === "gemini" ? geminiProvider : demoProvider;
      const analyzed = await provider.analyze(input, assets, runId);
      const gated = enforceEvidenceGate(analyzed);
      const calculated = applyDeterministicCalculations(gated);
      const validated = AnalysisResultSchema.parse(calculated);
      const persisted = await persistGoogleArtifacts(validated, assets);
      logEvent("INFO", "analysis_completed", { runId, caseId, provider: providerName, decisionStatus: persisted.decisionStatus });
      response.json(persisted);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown analysis error";
      logEvent("ERROR", "analysis_failed", { runId, message });
      response.status(500).json({ error: "analysis_failed", message, runId });
    }
  }
);

const staticPath = resolve("dist");
app.use(express.static(staticPath));
app.get("/{*path}", (_request, response) => response.sendFile(resolve(staticPath, "index.html")));

const port = Number(process.env.PORT || 8080);
app.listen(port, "0.0.0.0", () => logEvent("INFO", "service_started", { port }));
