# Connect QuickStarter to the existing website

The new public route is **https://www.josephpress.com/quickstarter/**. The source remains in `investor-olympics`; the four public files are served from `quickstarter/` in the main `jpress123.github.io` website repository. The repository's original `config.js` contained no CloudBase environment ID or publishable key, so those details must be supplied before classroom use.

## 1. Set up Tencent CloudBase

Use a CloudBase environment with the **document database**, cloud functions and cloud storage. Keep the legacy `io_results` collection intact; QuickStarter uses separate collections.

1. Enable anonymous browser sign-in. Students then enter their class and team codes; they do not need Tencent accounts.
2. Add `www.josephpress.com` to the environment's authorized web domains. Add other domains only if actually used.
3. Create these document collections: `qs_rooms`, `qs_uploads`, `qs_attempts`.
4. Deny direct browser reads and writes on all three collections. Use the following custom rules, or the console's equivalent “all users cannot read or write” preset:

```json
{ "read": false, "write": false }
```

5. Use private CloudBase storage for the `quickstarter/` paths. Deny direct browser reads/writes there. The cloud function issues upload authorizations and short-lived private download links after checking the team or instructor session. If an existing bucket serves public files for another app, preserve those existing permissions and apply the private rule only to the QuickStarter path, or use a separate environment.
6. Allow browser uploads from `https://www.josephpress.com` in the storage bucket's CORS settings: POST, GET and HEAD methods, permitted request headers `*`. Use the exact origin instead of `*` for origins. This does not make stored files public.

Never put private Tencent SecretId/SecretKey values in browser code or GitHub.

## 2. Deploy the event cloud function

The folder `cloudfunctions/quickstarter/` is the complete Node.js backend. Create an **event cloud function** named `quickstarter`, handler `index.main`, in the same environment. It is invoked by the CloudBase SDK, not a public HTTP endpoint. Allow invocation by authenticated CloudBase users, including anonymous sessions. Keep the database and storage browser rules denied.

- Choose a supported Node.js runtime **18 or newer**, preferably 20 if offered.
- Set memory to at least **512 MB**, timeout **120 seconds**. Files upload directly to storage; the function verifies two PDFs and stores immutable final copies.
- Install dependencies from this folder's `package-lock.json` using `npm ci --omit=dev`. Upload the folder contents including `node_modules`, or use the console's dependency installation option with the lockfile. Keep `index.js` and `core.cjs` at the deployment root.
- Set these **server-only environment variables** in the Tencent console:

| Variable                      | Value                                                  |
| ----------------------------- | ------------------------------------------------------ |
| `QUICKSTARTER_ADMIN_PASSWORD` | A unique instructor password of at least 20 characters |
| `QUICKSTARTER_SESSION_SECRET` | A separate random secret of at least 32 characters     |

Use a password manager to generate and store these. Do not commit them. Rotating the session secret invalidates all sessions and team codes; create a fresh class afterward. Rotating an individual team code from the instructor screen immediately invalidates that team's previous sessions. Sessions expire after 12 hours.

The server SDK uses the function's environment credentials. No permanent cloud credentials are needed in the source. Retain the lockfile's compatible dependency overrides. The remaining upstream `lodash.set` advisory is documented in VALIDATION.md; the database adapter only writes a fixed `payload` field containing serialized data and does not accept client-supplied database paths.

## 3. Connect the frontend

Fill in `config.js` with the environment ID and the **browser publishable key**, then commit it:

```js
window.QS_CONFIG = {
  env: "YOUR-CLOUDBASE-ENVIRONMENT-ID",
  key: "YOUR-BROWSER-PUBLISHABLE-KEY",
  functionName: "quickstarter",
};
```

Do not use the instructor password or a Tencent API secret here. Keep the function name identical to the deployed name. Run `npm run build`, then `npm run sync:website -- /absolute/path/to/jpress123.github.io`. Commit the four files in that website repository's `quickstarter/` folder and push its publishing branch. Pages does not need npm or a Node server. Preserve the main site's custom-domain configuration. Publish the new folder before the redirect from the old address.

## 4. Rehearse before inviting the class

Open the instructor URL, sign in, create a rehearsal class with at least three teams, and download the access codes. Share each team code only with that team.

1. On two separate phones, join different teams and upload existing A1/A2 sample PDFs, including one near the 15 MB limit. Confirm uploads work on the actual classroom network.
2. Confirm another team cannot open those original PDFs. Check that anonymous direct database reads and direct private file URLs are denied.
3. Open both originals as the instructor. Export the pitch worksheet. Ask the assistant to prepare WHY/WHAT/HOW in EN and CN using only those files, with source page numbers. Import the JSON drafts; verify every statement against the sources and approve each pitch. Mark missing information explicitly. Students are not asked to create extra materials.
4. Publish a pitch for every team, then start the 30-minute campaign. Every team must review all other groups. Fund projects in 100-credit increments; each positive allocation needs a canvas criterion and reason.
5. Save from one phone and confirm the instructor's matrix updates within a few seconds. Check no self-investment, shared team budget, cancellation/reallocation, and rejection of a conflicting save from another teammate.
6. Close the campaign or wait for the server deadline, then reveal rankings. Confirm students can save the debrief. Export the class record.

Keep setup separate from the 30-minute investing period. Prepare summaries before starting the classroom timer. The leaderboard counts all classroom pledges regardless of funding-goal completion.

## Maintenance and limits

A class is stored as a transaction-protected document; this design targets a classroom of up to 40 teams, not a public crowdfunding service. Polling occurs every 3 seconds. Run a rehearsal at the expected number of devices to confirm the environment's quota and classroom connectivity. Tencent usage may incur charges under your existing plan.

The original PDFs are private to the submitting team and instructor, and never sent to an AI provider by this app. Signed download links expire after 60 seconds. Uploads go through a staging path; validated PDFs are copied to new server-only final paths so an old upload authorization cannot change an approved source. Failed/abandoned staging files may remain. Configure a lifecycle rule **only on `quickstarter/staging/`** to expire objects after a day; never apply that rule to `quickstarter/final/`. `qs_uploads` and `qs_attempts` contain expiry timestamps inside their payload; remove expired records during planned maintenance, after exporting any needed class data. Do not delete the legacy `io_results` collection.

## Official references

- [CloudBase web authentication](https://docs.cloudbase.net/en/api-reference/webv3/authentication)
- [Document database security rules](https://docs.cloudbase.net/database/security-rules)
- [Server SDK storage APIs](https://docs.cloudbase.net/api-reference/server/node-sdk/storage)
- [Server SDK database transactions](https://github.com/TencentCloudBase/node-sdk/blob/master/docs/database/database.md)
