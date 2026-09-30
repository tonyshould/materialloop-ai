import type { AnalyzeRequest, AnalysisResult } from "../../shared/contracts.js";

export interface AnalyzeAssets {
  photo?: { buffer: Buffer; mimeType: string; originalName: string };
  certificate?: { buffer: Buffer; mimeType: string; originalName: string };
}

export interface MaterialAnalysisProvider {
  analyze(request: AnalyzeRequest, assets: AnalyzeAssets, runId: string): Promise<AnalysisResult>;
}
