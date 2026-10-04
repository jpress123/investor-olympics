# Investor Olympics: going live

Target: **https://www.josephpress.com/investor-olympics/** served by GitHub Pages from the repository `jpress123/investor-olympics`, with live team results through Tencent CloudBase (腾讯云开发).

The division of labor follows the Sino-Signals and fpsales rule: Claude edits files on disk, you do every commit and push in GitHub Desktop, and you own the two accounts (GitHub, Tencent Cloud). Claude never runs git and never holds your Tencent credentials. The only value that moves from Tencent to the site is a Publishable Key, which Tencent designs to be visible in a browser.

The game works without Part B: teams copy a record from their final screen and you paste it into the Debrief tab. Part B replaces the paste with a live feed.

---

## Part A: GitHub Pages (you, about 10 minutes)

**A1. Create the repository in GitHub Desktop.**
File → New Repository. Name `investor-olympics`, Local Path `Documents/GitHub`, leave "Initialize with README" unticked, Git ignore None, License None. Click Create Repository.

**A2. Publish it.**
Click Publish repository. Untick "Keep this code private" (Pages on a free account needs a public repo). Organization: none. Publish.

**A3. Connect the folder to this Claude session.**
In the Claude desktop app, add the folder `Documents/GitHub/investor-olympics` to this conversation. Tell me when it is connected. I then write `index.html`, `config.js`, `.nojekyll`, `README.md` and this file into it.

**A4. Commit and push.**
GitHub Desktop → Changes tab → Summary "Add Investor Olympics game" → Commit to main → Push origin.

**A5. Turn on Pages.**
On github.com open the repository → Settings → Pages. Under Build and deployment choose Source: Deploy from a branch, Branch: `main`, Folder: `/ (root)`. Save.

**A6. Check the address.**
After one to two minutes the game is at `https://www.josephpress.com/investor-olympics/`. (Because `jpress123.github.io` carries the custom domain `josephpress.com`, every project repository is served under that domain, as fpsales is.) If the page shows your personal site's 404, wait and hard-refresh; the first Pages build can take a few minutes.

**A7. Share with students.**
Put the address on the Investor Olympics slides, or show a QR code. Nothing else is needed for the offline flow.

---

## Part B: Tencent CloudBase (you, about 20 minutes, once)

CloudBase is a hosted backend inside China. Students on campus wifi reach it directly, with no VPN. The game uses one document-database collection and anonymous login. The free "免费开发" tier (3,000 resource points a month for new users in 2026) is far more than one class of ten teams uses.

**B1. Register with WeChat.**
Open https://cloud.tencent.com and click 登录 → 微信登录 (the WeChat QR option). Scan with WeChat and confirm. This creates a Tencent Cloud account bound to your WeChat.

**B2. Real-name verification (实名认证).**
Console → top right account menu → 账号中心 → 实名认证. CloudBase cannot be opened without it. Choose 个人认证. A WeChat-registered account can usually verify through WeChat's own real-name data in one step. If the form asks for a Chinese ID number, choose the 外籍 / 境外个人 option instead and upload your passport (the review can take up to one working day). Flag: I have not verified the current foreign-passport flow from your side of the screen; if the option is missing, send me a screenshot and I will find the right path.

**B3. Open CloudBase and create the environment.**
Go to https://console.cloud.tencent.com/tcb (or 产品 → 开发者工具 → 云开发 CloudBase). Choose 免费开发 (the free personal environment) when offered; otherwise 新建环境 with 按量计费 (pay as you go, which also carries the free monthly quota). Name it `investor-olympics`. Region: keep the default (上海 if offered, otherwise 广州; both are fine from campus). Wait for the status to read 正常.

**B4. Copy the environment ID (环境 ID).**
It is shown on the environment overview page, in the form `investor-olympics-xxxxxxxx`. Send it to me.

**B5. Create the Publishable Key.**
Environment → 环境设置 (Settings) → 访问密钥 / Publishable Key → 生成. It is generated once and cannot be deleted, so copy it into a note. Send it to me. (It is designed to sit in a browser; it only lets the page do what the database rules below allow.)

**B6. Allow the website domain.**
Environment → 环境设置 → 安全配置 → Web 安全域名 → 添加. Add `www.josephpress.com` and `jpress123.github.io`. Without this the browser request is refused.

**B7. Confirm anonymous login is on.**
身份认证 (Authentication) → 登录方式 / 注册配置. 匿名登录 (Anonymous) is on by default; make sure it is enabled. Nothing else needs to be turned on.

**B8. Create the collection.**
数据库 → 文档型数据库 (Document database) → 新建集合. Name: `io_results`. Open it → 权限设置 (Permissions) → choose the preset **所有用户可读，仅创建者可读写** (everyone can read, only the creator can write). That lets every team write its own record, the facilitator screen read all of them, and no team edit another team's.

If the console offers security rules instead of presets, paste:

```json
{
  "read": true,
  "create": "auth != null",
  "update": "doc._openid == auth.openid",
  "delete": "doc._openid == auth.openid"
}
```

**B9. Send me two values.**
The environment ID (B4) and the Publishable Key (B5). I write them into `config.js`. You commit and push (A4). Done.

**B10. Test before class (five minutes).**
Open the live address on your laptop and on a phone. On the phone, register a team with class code `TEST`. On the laptop open Debrief, enter `TEST`, click Follow live. The phone team should appear within a second, and update after each committed round. Then remove the test documents in the CloudBase console (数据库 → io_results → delete rows) or just use a new class code on the day.

---

## Running the live debrief in class

1. Pick a class code for the day, for example `SUES1104`, and write it on the board. Teams enter it with their team name.
2. Open the Debrief tab on the projector and enter the same code → Follow live. The podium table fills as teams play and updates after every committed round, so you can narrate the race between rounds.
3. After round five, ask teams to complete the four reflection questions on their final screen and press Save reflection. Their answers appear under Team reflections.
4. Walk the round tabs 1 to 5. Each shows where the class put its money (bars, traps flagged, multipliers), how many teams funded the trap, the average return, the lesson text and three discussion prompts tied to the SBC, break-even, validation plan, circular value chain and organizational model templates.
5. Close with the "Carry into Assignment 3" list, which is the bridge to the next assignment.

Fallback at any point: teams press "Copy full record for the debrief" and send the text to you (WeChat works); paste it into the box under "Or paste copied records".

## Where things live

| File | Purpose |
| --- | --- |
| `index.html` | The whole game, both languages, offline fallback included |
| `config.js` | Environment ID, Publishable Key, collection name. The only file that changes between offline and live |
| `.nojekyll` | Tells GitHub Pages to serve the files as they are |
| `README.md` | Short description for the repository page |
| `SETUP.md` | This file |

Everything in the game is stored in the student's browser (`localStorage`) and, when live, in the `io_results` collection: team name, class code, allocations, scores, reflection text. No personal data is collected.
