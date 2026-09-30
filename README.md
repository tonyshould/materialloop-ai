# MaterialLoop AI

MaterialLoop AI is a competition-ready industrial circularity demo. It uses Gemini on Vertex AI to interpret material photos and certificates, then passes all downstream claims through deterministic evidence, valuation, impact and matching rules.

- **Challenge:** Google Cloud AI Builder Cup 2026
- **Theme:** Sustainability & Social Impact
- **Live prototype:** https://materialloop-ai-474046076456.asia-east1.run.app
- **Demo video (2:10.70):** https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Demo_2026.mp4
- **Presentation PDF:** https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Builder_Cup_2026_Deck.pdf

## Why it matters

Manufacturers often sell usable by-products into low-value recovery channels because photos, certificates and process records are difficult to compare. MaterialLoop AI turns that fragmented evidence into a traceable material passport, proposes conditional second-life pathways and stops unsupported claims before they reach valuation or buyer matching.

## What is real in this build

- **Gemini / Vertex AI:** server-side multimodal image and PDF interpretation with structured JSON output.
- **Cloud Run:** container target for the React frontend and Express API.
- **Cloud Storage:** optional evidence-object persistence with SHA-256 metadata.
- **Firestore:** optional analysis and audit-record persistence.
- **Cloud Logging:** structured JSON events emitted to stdout for automatic ingestion on Cloud Run.
- **Application Default Credentials:** no Google credential or API key is exposed to the browser.

The `demo` provider is deterministic and always runnable. The `gemini` provider is live only when Google Cloud variables and ADC are configured. Gemini extracts observations and candidate pathways; it does **not** calculate financial value, CO₂e, final match score, or evidence-gate decisions.

## Demo cases

| Case | Evidence | Required behavior |
| --- | --- | --- |
| A | Photo + synthetic COA + lot data | Produce a material passport and deterministic value/impact/match |
| B | Photo only | Block valuation, impact, match and notification |
| C | Conflicting lot and 102.40% composition | Surface both conflicts and block all downstream claims |

All included images, certificates, values, factors and buyers are synthetic fixtures. They are clearly labeled and are not engineering or commercial advice.

## Local setup

Requires Node.js 22 or newer.

```powershell
npm install
npm run lint
npm test
npm run demo:verify
npm run dev
```

Open `http://127.0.0.1:5173`. Vite proxies `/api` to the Express service on port 8080.

## Live Gemini mode

Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install-sdk), then authenticate both the CLI and local Application Default Credentials:

```powershell
gcloud init
gcloud auth application-default login
```

Copy `.env.example` to `.env`, set at minimum:

```text
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=global
GEMINI_MODEL=gemini-2.5-flash
ANALYZER_PROVIDER=gemini
```

Run the preflight and the real multimodal smoke test:

```powershell
npm run gcp:preflight -- -ProjectId "YOUR_PROJECT_ID"
npm run gemini:verify
```

`gemini:verify` sends the included synthetic material photo and synthetic COA to Gemini on Vertex AI, validates the structured response, and then applies the local deterministic evidence/value/impact rules. A passing result is the evidence that the demo actually used Gemini; the offline demo provider is not accepted as a substitute.

For persistent evidence and audit records, also set:

```text
PERSIST_RESULTS=true
GCS_BUCKET=your-bucket
FIRESTORE_COLLECTION=materialloop_runs
```

The runtime service account needs only the roles required by enabled features: Vertex AI User, Datastore User, and object access scoped to the evidence bucket. Keep persistence disabled for a no-write local demo.

## Google Cloud deployment

The repository includes a multi-stage `Dockerfile`, `cloudbuild.yaml`, and a PowerShell deployment helper:

```powershell
.\scripts\deploy-gcp.ps1 -ProjectId "YOUR_PROJECT_ID" -Region "asia-east1"
```

The default first deployment keeps persistence disabled so it does not lock the project into a Firestore location. After confirming the database region, enable Storage and Firestore explicitly:

```powershell
.\scripts\deploy-gcp.ps1 -ProjectId "YOUR_PROJECT_ID" -Region "asia-east1" -EnablePersistence -CreateFirestoreIfMissing
```

Before production use, create Firestore in Native mode, use a dedicated Cloud Run service account, scope IAM to least privilege, configure retention/lifecycle rules for the evidence bucket, and decide whether uploaded files may contain sensitive or personal data.

## Cross-computer delivery

Create a clean source package and SHA-256 manifest:

```powershell
npm run delivery:package
```

The package excludes `.env`, local credentials, dependencies, build output and temporary screenshots. On the destination computer, verify the SHA-256, extract the archive, run `npm install`, then follow the local or Google Cloud setup above.

## Safety boundary

The app never upgrades an observed or inferred field to verified. Case B and Case C are regression-tested to ensure no financial, environmental, matching or notification claim escapes the evidence gate. External buyer outreach is always approval-required.

## Competition materials

- [Public demo video](https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Demo_2026.mp4)
- [Public presentation PDF](https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Builder_Cup_2026_Deck.pdf)
- [Architecture](docs/ARCHITECTURE.md)
- [Business case](docs/BUSINESS_CASE.md)
- [Demo narration](docs/DEMO_SCRIPT.md)
- [Submission checklist](docs/SUBMISSION_CHECKLIST.md)
- [Security policy](SECURITY.md)

## Known prototype limits

- The prototype currently covers one synthetic aluminum workflow.
- Prices, impact factors and buyer profiles are versioned synthetic fixtures.
- Cloud Storage and Firestore adapters are implemented but persistence is disabled in the public demo until the team confirms the permanent Firestore region.
- The public endpoint is intended for judging and demonstration, not production traffic.
