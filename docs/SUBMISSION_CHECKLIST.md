# AI Builder Cup Submission Checklist

## Required artifacts

- [x] Working Google Cloud prototype: https://materialloop-ai-474046076456.asia-east1.run.app
- [x] Public GitHub repository: https://github.com/tonyshould/materialloop-ai
- [x] Public Cloud Storage backup of the final 179.00-second video: https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Demo_Final_2m59.mp4
- [x] Public Google Drive video link (verified runtime: 179.00 seconds): https://drive.google.com/file/d/1cKBtEqEtBLswikTGTFjhstOb6rwPcsrh/view?usp=sharing
- [x] Official-template presentation exported to PDF (0.79 MiB, below the 5 MiB limit)
- [x] Public official-template deck: https://storage.googleapis.com/ruitwin-production-materialloop-public/MaterialLoop_AI_Official.pdf

## Technical verification

- [x] Gemini 2.5 Flash runs through Vertex AI
- [x] Cloud Run serves the public application
- [x] Cases A, B and C pass live smoke tests
- [x] Lint, unit tests and production build pass
- [x] Cloud Logging contains completed run events
- [x] Verified source commit SHA recorded in `verification-report.json`
- [x] Current source tree passes a credential-pattern secret scan
- [x] Final repository history passes a secret scan after the first commit
- [x] Public endpoint returns HTTP 200 without authentication

## Submission consistency

- [x] Theme: Sustainability & Social Impact
- [x] Product name: MaterialLoop AI
- [x] All competition-facing materials are in English
- [x] Synthetic prices, buyers, certificates and impact factors are disclosed
- [x] GitHub, deck, final 2:59 video and submitted form use consistent competition links
- [x] Registered roster contains 2 members (minimum team size met)
- [x] Team name, team-leader display name and each member's eligibility confirmed by the team leader

## Publication gate

- [x] Exclude `.env`, credentials, tokens, personal addresses and billing screenshots from Git
- [x] Image, dependency and document rights reviewed in `docs/ASSET_RIGHTS.md`
- [x] Confirm the GitHub repository opens without login
- [x] Confirm the Cloud Storage backup video opens without login
- [x] Confirm the final Google Drive video opens without login
- [x] Confirm the deck opens without login
- [x] Save the final submission receipt and timestamp in `docs/SUBMISSION_RECEIPT.md`
