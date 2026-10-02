# AI Builder Cup Submission Checklist

## Required artifacts

- [x] Working Google Cloud prototype: https://materialloop-ai-474046076456.asia-east1.run.app
- [x] Public GitHub repository: https://github.com/tonyshould/materialloop-ai
- [x] Public Cloud Storage backup video with a verified runtime of 130.70 seconds
- [x] Public Google Drive video link: https://drive.google.com/file/d/1N2p3ff0elwVjEaCPjTW3iOZLihHU9H8Q/view?usp=sharing
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
- [ ] GitHub, deck, video and submission form use the same description and links
- [x] Registered roster contains 2 members (minimum team size met)
- [ ] Team name, team-leader display name and each member's eligibility confirmed by the team leader

## Publication gate

- [x] Exclude `.env`, credentials, tokens, personal addresses and billing screenshots from Git
- [x] Image, dependency and document rights reviewed in `docs/ASSET_RIGHTS.md`
- [x] Confirm the GitHub repository opens without login
- [x] Confirm the Cloud Storage backup video opens without login
- [x] Confirm the final Google Drive video opens without login
- [x] Confirm the deck opens without login
- [ ] Save the final submission receipt and timestamp
