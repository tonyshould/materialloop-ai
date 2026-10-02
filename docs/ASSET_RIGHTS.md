# Asset and Dependency Rights Review

Review date: 2026-10-02  
Scope: public repository, competition demo video, official-template pitch deck and synthetic demo fixtures.

This is an internal submission-readiness review, not legal advice. The team remains responsible for confirming that every participant is authorized to submit the materials and accept the competition terms.

## Decision

**Low identifiable third-party-rights risk for the current competition package, subject to the confirmations below.** No third-party stock music, customer data, confidential documents or copied commercial imagery was identified in the deliverables reviewed.

## Asset inventory

| Asset | Source | Rights / disclosure status |
| --- | --- | --- |
| Product UI and screenshots | MaterialLoop AI prototype created for the competition | Team-created project output. |
| Demo narration | Original script in `docs/DEMO_SCRIPT.md`, synthesized with Windows SAPI | No third-party voice recording. |
| Demo ambient audio | Procedurally synthesized in `scripts/build-demo-video-v2.ps1` | No stock-music track. |
| Opening campaign artwork | Generated specifically for MaterialLoop AI with OpenAI image generation | Disclosed in the demo production notes and deck speaker notes. Review OpenAI's current [Terms of Use](https://openai.com/policies/terms-of-use/) before submission. |
| Demo prices, buyers, certificates and impact factors | Synthetic fixtures | Explicitly disclosed as synthetic and not engineering or commercial advice. |
| Competition deck layout | Official AI Builder Cup template | Used as the required submission template; competition branding remains intact. |
| Google product names and marks | Descriptive references to services actually used | Used only to identify Gemini, Vertex AI, Cloud Run and Cloud Logging. Follow the competition and Google brand rules. |
| Web fonts | Manrope and DM Mono loaded from Google Fonts | Google Fonts projects are generally distributed under open font licenses; retain the relevant license files if fonts are ever redistributed or bundled. |

## Dependency review snapshot

The installed Node dependency tree was checked for declared licenses. The snapshot contained:

- 216 MIT
- 38 Apache-2.0
- 22 ISC
- 13 BSD-3-Clause
- 4 BlueOak-1.0.0
- 2 BSD-2-Clause
- 2 MPL-2.0
- 1 0BSD
- 1 dual expression: Apache-2.0 AND LGPL-3.0-or-later (`@img/sharp-win32-x64`)

No dependency with a missing license declaration and no GPL, AGPL, SSPL or BUSL license was identified in the snapshot. The Sharp native runtime is consumed as a dependency and is not separately relicensed by this project. Keep dependency notices and source-license files when distributing binaries beyond the competition.

## Human confirmations required before submission

- Every team member confirms that submitted work is original or properly licensed and does not include employer/customer confidential information.
- Every team member confirms eligibility under the official rules, including age, professional/startup status, physical location and non-student requirements.
- The team leader confirms the preferred English display name and the final team name shown on the platform.
- The final public links remain accessible during judging.

