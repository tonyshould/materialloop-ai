import { createHash } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";
import { Storage } from "@google-cloud/storage";
import type { AnalysisResult } from "../../shared/contracts.js";
import type { AnalyzeAssets } from "../providers/types.js";

export async function persistGoogleArtifacts(result: AnalysisResult, assets: AnalyzeAssets): Promise<AnalysisResult> {
  if (process.env.PERSIST_RESULTS !== "true") return result;
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const bucketName = process.env.GCS_BUCKET;
  if (!projectId) throw new Error("GOOGLE_CLOUD_PROJECT is required when persistence is enabled.");

  const updated: AnalysisResult = { ...result, googleServices: { ...result.googleServices } };
  if (bucketName) {
    const storage = new Storage({ projectId });
    for (const [kind, asset] of Object.entries(assets)) {
      if (!asset) continue;
      const hash = createHash("sha256").update(asset.buffer).digest("hex");
      await storage.bucket(bucketName).file(`runs/${result.runId}/${kind}-${hash.slice(0, 12)}-${asset.originalName}`).save(asset.buffer, {
        contentType: asset.mimeType,
        resumable: false,
        metadata: { metadata: { sha256: hash, syntheticDemo: "true" } }
      });
    }
    updated.googleServices.cloudStorage = true;
  }

  const firestore = new Firestore({ projectId });
  const collection = process.env.FIRESTORE_COLLECTION || "materialloop_runs";
  await firestore.collection(collection).doc(result.runId).set(updated);
  updated.googleServices.firestore = true;
  return updated;
}
