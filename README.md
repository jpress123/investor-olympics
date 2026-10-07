# QuickStarter · 创新创业实践

Class 3 replaces the former Investor Olympics round game with a Kickstarter-inspired classroom campaign. The repository name and public address stay the same: **https://www.josephpress.com/investor-olympics/**.

Students upload **only their existing Assignments 1 and 2**, one PDF each (15 MB maximum per file). The instructor prepares and approves exactly three bilingual pitch pages:

1. **WHY** — the problem, intended customer and evidence.
2. **WHAT** — the existing product, service or solution.
3. **HOW** — business model facts supported by those assignments.

Missing facts must say “Not stated in Assignments 1–2”; summaries cite A1/A2 page numbers. No Assignment 3, new research, completed canvas or additional pitch homework is requested. The app does not automatically read or translate PDFs: export the preparation worksheet, prepare the summaries with the assistant, import them, and check both sources before publishing.

Each team reviews every other group's three pages, uses the 12-block sustainable business model canvas as its investment criteria, and saves one shared portfolio. Each funded project needs a canvas block and an evidence/risk reason. Teams cannot invest in themselves. Everyone receives the same budget; allocations use 100-credit increments. A server-enforced 30-minute deadline closes investing. Instructor controls provide the live team-by-project matrix, ranked results, winner presentation and team reflections.

Kickstarter-inspired features include project discovery, three-page pitches, funding goals and progress bars, backing-team counts, a campaign deadline, and editable/cancellable pledges. This is a classroom simulation: virtual credits only, no payments or equity. Unlike Kickstarter's all-or-nothing funding, all classroom pledges count in the ranking. Rank by credits, then backing teams; equal results share a rank. Rankings are discussion material, not grades.

## Hosting and readiness

- **GitHub Pages:** static `index.html`, `config.js` and committed `assets/`; supports the existing project subdirectory.
- **Tencent CloudBase:** one event cloud function, document database and private file storage. The browser never writes portfolios directly to the database.
- **Student:** `/investor-olympics/`; **instructor:** `/investor-olympics/?instructor=1`.
- EN/中文 toggle; responsive phone/tablet/desktop layouts and 44 px minimum button targets.
- 2–40 teams per class. Ask students to choose one team member to save decisions. The instructor can see every team's choices; individual students do not receive separate portfolios.

**The checked-in CloudBase configuration is blank. A GitHub push alone will not create the live backend.** Follow [SETUP.md](SETUP.md), configure CloudBase, then deploy the frontend when ready. No live student data or production credentials are included.

## Development

Node.js 20 or newer is recommended for local tooling.

```sh
npm ci
npm test
npx tsc
npm run build
npm run preview
```

The local preview prints demonstration access codes and an instructor password. It binds only to `127.0.0.1:5180`, clearly labels every page LOCAL REHEARSAL, and uses disposable in-memory data. It exercises the same classroom rules; it does not validate a real Tencent deployment. The preview server and test credentials are never included in the production JavaScript bundle.

After frontend changes, run `npm run build` and commit both source and generated assets. Use `npm ci --prefix cloudfunctions/quickstarter` to install the separately locked backend dependencies. [VALIDATION.md](VALIDATION.md) describes tested behavior and remaining deployment checks.
