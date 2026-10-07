# Validation — QuickStarter GitHub Pages update

Checked locally on 7 October 2026. These checks do **not** certify a deployed Tencent environment; the repository's public configuration remains blank.

## Automated checks

`npm test`: five integration suites pass, covering:

- Only Assignment 1 and Assignment 2 upload slots; confirmation required; extra/duplicate slots, oversized files and non-PDF data rejected.
- Private original PDFs; no storage IDs or team secrets in student snapshots; instructor-only controls; signed sessions bound to the CloudBase caller.
- Source confirmation before publishing; bilingual sections required; importing or replacing sources resets approval; revised pitches invalidate previous reviews.
- Review every other group before saving; reject self-investment, invalid projects, over-budget amounts, non-hundred increments, missing canvas criteria and missing reasoning.
- Concurrent portfolio saves: one wins, the stale version is rejected. Reallocation and cancellation update totals. Server deadline prevents late saves; rankings and reflections appear at the appropriate phase.
- Login throttling, session expiry and team-code rotation.
- CloudBase adapter contract with mocked SDK responses: document array/object responses, transactions, upload authorization fields, immutable final PDF copies and short-lived private downloads.

`npx tsc` and `npm run build` pass. Compiled assets are committed for the repository-root GitHub Pages deployment. Source links use relative paths and `?instructor=1`, preserving `/investor-olympics/`.

## Browser rehearsal

The actual static production bundle was served under `/investor-olympics/` with an explicitly labelled local backend simulation. Verified:

- EN and CN at 390 px and 360 px widths; no horizontal page overflow.
- Student code sign-in, WHY/WHAT/HOW navigation, review confirmations, canvas choice, reasoning and a successful 5,000-credit save.
- Instructor password sign-in, class selection, live investment matrix and matching ranking totals.
- Original-language/Chinese interface controls and private-file actions use the same frontend API adapter as production.

## Dependency note

The browser build dependencies have no reported npm audit findings at this check. The current official `@cloudbase/node-sdk` 3.18.3 brings an upstream `lodash.set` prototype-pollution advisory, reported through three packages (`lodash.set`, `@cloudbase/database`, `@cloudbase/node-sdk`). There is no patched `lodash.set` release in the registry at this check. Compatible overrides update Axios to 0.34.0 and lodash.unset to 4.18.0.

The adapter exposes no dynamic query/update path to clients: collection names and document fields are fixed, IDs are validated, and complete class data is serialized inside a single `payload` string. This limits the known path-based exposure but is not a claim that the upstream advisory is fixed. Recheck the official SDK before production deployment; do not use `npm audit fix --force` to silently replace it with an unrelated older SDK.

## Still required on the real environment

Deploy the cloud function, configure its two server-only secrets, deny direct browser database/storage access, configure the domain and upload CORS, then fill in the public environment settings. Rehearse source uploads/downloads, actual permissions, cross-device synchronization, the deadline and expected classroom concurrency. Test near-limit PDFs and the classroom network. The mock adapter tests do not exercise Tencent permissions, quotas, network behavior or real transaction contention.
