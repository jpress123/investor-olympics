"use strict";
const crypto = require("node:crypto");
const blocks = [
  "partners",
  "activities",
  "value",
  "relationships",
  "segments",
  "resources",
  "channels",
  "costs",
  "subsidies",
  "revenue",
  "ecologicalCosts",
  "socialBenefits",
];
const clean = (v, n = 100) =>
  typeof v === "string" ? v.trim().slice(0, n) : "";
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const digest = (v) => crypto.createHash("sha256").update(v).digest("hex");
const equal = (a, b) => {
  const x = Buffer.from(String(a)),
    y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const pitchFields = (p) =>
  Object.fromEntries(
    ["en", "cn"].map((l) => [
      l,
      Object.fromEntries(
        ["why", "what", "how"].map((k) => [k, clean(p?.[l]?.[k], 1800)]),
      ),
    ]),
  );
const MAX = 15 * 1024 * 1024;
function createService({
  store,
  files,
  env,
  clock = Date.now,
  random = () => crypto.randomBytes(16).toString("hex"),
}) {
  const secret = env.QUICKSTARTER_SESSION_SECRET || "";
  const signature = (s) =>
    crypto.createHmac("sha256", secret).update(s).digest("base64url");
  function sign(claims) {
    const p = Buffer.from(
      JSON.stringify({ ...claims, exp: clock() + 12 * 3600000 }),
    ).toString("base64url");
    return p + "." + signature(p);
  }
  function verify(token, uid) {
    try {
      const [p, s, ...rest] = String(token || "").split(".");
      if (rest.length || !s || !equal(s, signature(p)))
        fail("Please join your team.", 401);
      const c = JSON.parse(Buffer.from(p, "base64url"));
      if (c.exp <= clock() || c.uid !== uid)
        fail("Your session expired. Please join again.", 401);
      return c;
    } catch (e) {
      if (e.status) throw e;
      fail("Please join your team.", 401);
    }
  }
  const roomId = (code) => digest("class:" + code).slice(0, 32);
  const ridFrom = (id) => {
    if (!/^[a-f0-9]{32}~[a-f0-9]{32}$/.test(id || "")) fail("Not found", 404);
    return id.split("~")[0];
  };
  const phase = (r) =>
    r.phase === "voting" && r.ends <= clock() ? "closed" : r.phase;
  const admin = (c) => {
    if (c.role !== "admin") fail("Instructor sign-in required.", 403);
  };
  const team = (r, c) => {
    const t = r.teams.find((t) => t.id === c.team);
    if (
      c.role !== "team" ||
      c.room !== r.id ||
      !t ||
      t.generation !== c.generation
    )
      fail("Your session expired. Please join again.", 401);
    return t;
  };
  const requireRoom = (r) => {
    if (!r) fail("Class not found.", 404);
    return r;
  };
  async function rate(key, limit) {
    const ok = await store.mutate("qs_attempts", digest(key), (a) => {
      if (!a || a.expires <= clock())
        a = { count: 0, expires: clock() + 600000 };
      a.count++;
      return { value: a, result: a.count <= limit };
    });
    if (!ok) fail("Too many attempts. Please wait 10 minutes.", 429);
  }
  async function change(rid, fn) {
    return store.mutate("qs_rooms", rid, (r) => {
      requireRoom(r);
      return { value: r, result: fn(r) };
    });
  }
  function snapshot(r, c) {
    requireRoom(r);
    const isAdmin = c.role === "admin",
      t = isAdmin ? null : team(r, c);
    const ts = r.teams.map(({ secret, generation, ...t }) => t);
    const ps = r.proposals
      .filter((p) => isAdmin || p.published || p.team === t?.id)
      .map(({ files, ...p }) => ({
        ...p,
        hasAssignment1: !!files?.[0],
        hasFile: !!files?.[1],
        amount: r.teams.reduce((n, t) => n + (t.portfolio[p.id] || 0), 0),
        backers: r.teams.filter((t) => t.portfolio[p.id] > 0).length,
      }));
    const rankings = ps
      .filter((p) => p.published)
      .sort(
        (a, b) =>
          b.amount - a.amount ||
          b.backers - a.backers ||
          a.title.localeCompare(b.title),
      );
    const { teams, proposals, ...room } = r;
    return {
      room: { ...room, phase: phase(r) },
      serverTime: clock(),
      ...(t ? { team: ts.find((x) => x.id === t.id) } : {}),
      proposals: ps,
      ...(isAdmin ? { teams: ts } : {}),
      ...(isAdmin || phase(r) === "results" ? { rankings } : {}),
      teamCount: ts.length,
      submittedCount: ts.filter((t) =>
        Object.values(t.portfolio).some((v) => v > 0),
      ).length,
    };
  }
  async function handle(event, caller) {
    try {
      if (
        secret.length < 32 ||
        (env.QUICKSTARTER_ADMIN_PASSWORD || "").length < 20
      )
        fail(
          "Classroom setup is incomplete. Please contact the instructor. / 课堂配置尚未完成，请联系教师。",
          503,
        );
      if (!caller.uid)
        fail("CloudBase sign-in required. / 需要云开发登录。", 401);
      if (!event || JSON.stringify(event).length > 1500000)
        fail("Request too large.", 413);
      const path = clean(event.path, 150),
        b = event.body,
        c = () => verify(event.token, caller.uid);
      if (path === "admin/login") {
        await rate("admin:" + caller.ip, 10);
        if (
          !equal(
            digest(String(b?.password || "")),
            digest(env.QUICKSTARTER_ADMIN_PASSWORD),
          )
        )
          fail("Check the instructor password. / 请检查教师密码。", 401);
        return {
          status: 200,
          data: { token: sign({ role: "admin", uid: caller.uid }) },
        };
      }
      if (path === "login") {
        const code = clean(b?.classCode, 30).toUpperCase();
        await rate("login:" + caller.uid + ":" + code, 30);
        await rate("network:" + caller.ip, 1000);
        const r = await store.get("qs_rooms", roomId(code));
        const t = r?.teams.find((t) =>
          equal(t.secret, signature(clean(b?.teamCode, 80))),
        );
        if (!t) fail("Check your class code and team access code.", 401);
        return {
          status: 200,
          data: {
            token: sign({
              role: "team",
              uid: caller.uid,
              room: r.id,
              team: t.id,
              generation: t.generation,
            }),
          },
        };
      }
      const claims = c();
      let result;
      if (path === "logout") result = { ok: true };
      else if (path === "admin/rooms") {
        admin(claims);
        if (b === undefined)
          result = (await store.list("qs_rooms")).map(
            ({ teams, proposals, ...r }) => ({ ...r, phase: phase(r) }),
          );
        else {
          const title = clean(b.title),
            code = clean(b.code, 30).toUpperCase(),
            names = Array.isArray(b.names)
              ? b.names.map((n) => clean(n, 70))
              : [];
          if (
            !title ||
            !/^[-A-Z0-9]{3,30}$/.test(code) ||
            names.length < 2 ||
            names.length > 40 ||
            names.some((n) => !n) ||
            new Set(names).size !== names.length ||
            !Number.isInteger(b.budget) ||
            b.budget < 100 ||
            b.budget > 1000000 ||
            b.budget % 100
          )
            fail(
              "Use 2–40 unique team names, a class code and a budget in hundreds.",
            );
          const id = roomId(code),
            codes = names.map((name) => ({
              id: id + "~" + random(),
              name,
              code: random().slice(0, 16),
            }));
          result = await store.mutate("qs_rooms", id, (old) => {
            if (old)
              fail(
                "This class code is already used. / 班级代码已被使用。",
                409,
              );
            return {
              value: {
                id,
                title,
                code,
                budget: b.budget,
                created: clock(),
                phase: "preparation",
                ends: 0,
                proposals: [],
                teams: codes.map(({ code, ...t }) => ({
                  ...t,
                  secret: signature(code),
                  generation: 1,
                  portfolio: {},
                  reasons: {},
                  criteria: {},
                  reviews: {},
                  version: 0,
                  reflection: {},
                })),
              },
              result: { id, classCode: code, teams: codes },
            };
          });
        }
      } else if (path === "state")
        result = snapshot(await store.get("qs_rooms", claims.room), claims);
      else if (path.startsWith("admin/state/")) {
        admin(claims);
        result = snapshot(await store.get("qs_rooms", path.slice(12)), claims);
      } else if (path === "review")
        result = await change(claims.room, (r) => {
          const t = team(r, claims),
            p = r.proposals.find(
              (p) => p.id === b?.proposal && p.published && p.team !== t.id,
            );
          if (!p || !["preparation", "voting"].includes(phase(r)))
            fail("Choose another group’s published pitch.");
          t.reviews[p.id] = p.updated;
          return { ok: true };
        });
      else if (path === "invest")
        result = await change(claims.room, (r) => {
          const t = team(r, claims);
          if (phase(r) !== "voting") fail("Investing has closed.", 409);
          const ps = r.proposals.filter((p) => p.published);
          if (ps.some((p) => p.team !== t.id && t.reviews[p.id] !== p.updated))
            fail("Review every other group before saving investments.");
          if (
            !b?.portfolio ||
            Array.isArray(b.portfolio) ||
            typeof b.portfolio !== "object" ||
            Object.keys(b.portfolio).length > 100
          )
            fail("Invalid portfolio.");
          const portfolio = {},
            reasons = {},
            criteria = {};
          for (const [k, v] of Object.entries(b.portfolio)) {
            if (
              typeof v !== "number" ||
              !Number.isSafeInteger(v) ||
              v < 0 ||
              v % 100
            )
              fail("Use whole multiples of 100 credits.");
            if (!v) continue;
            const p = ps.find((p) => p.id === k);
            if (!p) fail("This pitch is unavailable.");
            if (p.team === t.id) fail("You cannot invest in your own company.");
            portfolio[k] = v;
            criteria[k] = clean(b.criteria?.[k], 40);
            if (!blocks.includes(criteria[k]))
              fail("Choose a canvas criterion for each investment.");
            reasons[k] = clean(b.reasons?.[k], 500);
            if (reasons[k].length < 5)
              fail("Add a short reason for each investment.");
          }
          if (Object.values(portfolio).reduce((a, b) => a + b, 0) > r.budget)
            fail("Your portfolio exceeds the budget.");
          if (!Number.isInteger(b.version) || b.version !== t.version)
            fail(
              "A teammate updated the portfolio, or time ended. Reload before saving.",
              409,
            );
          Object.assign(t, {
            portfolio,
            reasons,
            criteria,
            version: t.version + 1,
          });
          return { ok: true, version: t.version };
        });
      else if (path === "reflection")
        result = await change(claims.room, (r) => {
          const t = team(r, claims);
          if (!["closed", "results"].includes(phase(r)))
            fail("Close investing before reflecting. / 请在投资结束后复盘。");
          t.reflection = Object.fromEntries(
            ["assumption", "change", "role", "test"].map((k) => [
              k,
              clean(b?.[k], 1500),
            ]),
          );
          return { ok: true };
        });
      else if (path === "admin/phase") {
        admin(claims);
        result = await change(b?.id, (r) => {
          if (b.action === "start") {
            if (
              phase(r) !== "preparation" ||
              r.proposals.filter((p) => p.published).length !== r.teams.length
            )
              fail("Approve one pitch for every team before starting.");
            r.phase = "voting";
            r.ends = clock() + 1800000;
          } else if (b.action === "close") {
            if (phase(r) === "preparation" || phase(r) === "results")
              fail("Investing is not open. / 投资尚未开始或已公布结果。");
            r.phase = "closed";
            r.ends = Math.min(r.ends, clock());
          } else if (b.action === "reveal") {
            if (phase(r) !== "closed")
              fail("Close investing before revealing rankings.");
            r.phase = "results";
          } else fail("Unknown action.");
          return { ok: true };
        });
      } else if (path === "admin/pitch") {
        admin(claims);
        result = await change(ridFrom(b?.id), (r) => {
          const p = r.proposals.find((p) => p.id === b.id);
          if (!p || phase(r) !== "preparation")
            fail("Pitch editing is closed.");
          if (
            !Number.isInteger(b.goal) ||
            b.goal < 100 ||
            b.goal > 1000000 ||
            b.goal % 100
          )
            fail("Funding goal must be a multiple of 100 credits.");
          const pitch = pitchFields(b.pitch);
          if (
            b.published &&
            (!p.files?.[0] || !p.files?.[1] || b.source_checked !== true)
          )
            fail(
              "Check both assignments and confirm that the pitch uses only their evidence.",
            );
          if (
            b.published &&
            ["en", "cn"].some((l) =>
              ["why", "what", "how"].some((k) => pitch[l][k].length < 3),
            )
          )
            fail(
              "Complete every section. Mark missing information explicitly.",
            );
          Object.assign(p, {
            title: clean(b.title) || p.title,
            goal: b.goal,
            pitch,
            published: !!b.published,
            source_checked: !!b.source_checked,
            updated: Math.max(clock(), p.updated + 1),
          });
          return { ok: true };
        });
      } else if (path === "admin/import") {
        admin(claims);
        result = await change(b?.room, (r) => {
          if (
            phase(r) !== "preparation" ||
            !Array.isArray(b.pitches) ||
            b.pitches.length > 40
          )
            fail("Invalid pitch import.");
          if (b.pitches.some((p) => !r.proposals.some((x) => x.id === p.id)))
            fail("Import contains an unknown proposal.");
          for (const draft of b.pitches) {
            const p = r.proposals.find((p) => p.id === draft.id);
            Object.assign(p, {
              pitch: pitchFields(draft.pitch),
              published: false,
              source_checked: false,
              updated: Math.max(clock(), p.updated + 1),
            });
          }
          return { ok: true };
        });
      } else if (path === "admin/rotate") {
        admin(claims);
        result = await change(ridFrom(b?.team), (r) => {
          const t = r.teams.find((t) => t.id === b.team);
          if (!t) fail("Not found", 404);
          const code = random().slice(0, 16);
          t.secret = signature(code);
          t.generation++;
          return { code };
        });
      } else if (path === "upload/prepare") {
        const r = requireRoom(await store.get("qs_rooms", claims.room)),
          t = team(r, claims);
        if (phase(r) !== "preparation") fail("Submissions are closed.");
        if (b?.sourceScope !== "assignments-1-2-only")
          fail("Confirm that these files contain only Assignments 1 and 2.");
        if (
          Object.keys(b).some(
            (k) => !["title", "sourceScope", "files"].includes(k),
          ) ||
          !Array.isArray(b.files) ||
          b.files.length !== 2 ||
          b.files[0].slot !== "assignment1" ||
          b.files[1].slot !== "assignment2"
        )
          fail("Only Assignment 1 and Assignment 2 files are accepted.");
        if (
          !clean(b.title) ||
          b.files.some(
            (f) =>
              !Number.isInteger(f.size) ||
              f.size < 5 ||
              f.size > MAX ||
              !clean(f.name, 160),
          )
        )
          fail(
            "Upload Assignment 1 and Assignment 2 as two PDFs, up to 15 MB each.",
          );
        await rate("upload:" + t.id, 8);
        const id = random(),
          uploads = [];
        for (let i = 0; i < 2; i++)
          uploads.push(
            await files.prepare(
              `quickstarter/staging/${r.id}/${t.id}/${id}/${i + 1}.pdf`,
            ),
          );
        await store.mutate("qs_uploads", id, () => ({
          value: {
            id,
            room: r.id,
            team: t.id,
            generation: t.generation,
            title: clean(b.title),
            expires: clock() + 1800000,
            used: false,
            files: b.files.map((f, i) => ({
              name: clean(f.name, 160),
              size: f.size,
              fileID: uploads[i].fileID,
            })),
          },
          result: null,
        }));
        result = { id, uploads };
      } else if (path === "upload/finish") {
        const pending = await store.get("qs_uploads", b?.id);
        if (
          !pending ||
          pending.used ||
          pending.expires <= clock() ||
          claims.room !== pending.room ||
          claims.team !== pending.team ||
          claims.generation !== pending.generation
        )
          fail(
            "Upload expired. Please upload both PDFs again. / 上传已过期，请重新上传两份 PDF。",
          );
        const r = requireRoom(await store.get("qs_rooms", pending.room));
        team(r, claims);
        if (phase(r) !== "preparation") fail("Submissions are closed.");
        const saved = [];
        let old = [];
        try {
          for (let i = 0; i < 2; i++) {
            const f = pending.files[i],
              bytes = await files.read(f.fileID, MAX);
            if (
              bytes.length !== f.size ||
              bytes.length > MAX ||
              bytes.subarray(0, 5).toString() !== "%PDF-"
            )
              fail("Upload a PDF file.");
            const fileID = await files.write(
              `quickstarter/final/${r.id}/${random()}/${i + 1}.pdf`,
              bytes,
            );
            saved.push({ fileID, name: f.name });
          }
          result = await store.finishUpload(
            pending.id,
            pending.room,
            (latest, current) => {
              if (!latest || latest.used || latest.expires <= clock())
                fail(
                  "Upload expired. Please upload both PDFs again. / 上传已过期，请重新上传两份 PDF。",
                );
              const t = team(requireRoom(current), claims);
              if (phase(current) !== "preparation")
                fail("Submissions just closed.");
              let p = current.proposals.find((p) => p.team === t.id);
              old = p?.files || [];
              if (!p) {
                p = {
                  id: t.id,
                  team: t.id,
                  teamName: t.name,
                  goal: current.budget,
                  updated: 0,
                };
                current.proposals.push(p);
              }
              Object.assign(p, {
                title: latest.title,
                files: saved,
                pitch: pitchFields({}),
                published: false,
                source_checked: false,
                updated: Math.max(clock(), p.updated + 1),
              });
              latest.used = true;
              return { ok: true };
            },
          );
        } catch (e) {
          await files.remove(saved.map((f) => f.fileID)).catch(() => {});
          throw e;
        }
        await files
          .remove([...pending.files, ...old].map((f) => f.fileID))
          .catch(() => {});
      } else if (path.startsWith("file/")) {
        const [, pid, slot] = path.split("/");
        if (!["1", "2"].includes(slot))
          fail("Choose Assignment 1 or Assignment 2.", 404);
        const r = requireRoom(await store.get("qs_rooms", ridFrom(pid))),
          p = r.proposals.find((p) => p.id === pid);
        if (claims.role !== "admin" && team(r, claims).id !== p?.team)
          fail("This submission is private.", 403);
        const f = p?.files?.[Number(slot) - 1];
        if (!f) fail("File not found.", 404);
        result = { url: await files.url(f.fileID) };
      } else fail("Not found", 404);
      return { status: 200, data: result };
    } catch (e) {
      if (!e.status)
        console.error("QuickStarter request failed:", e.code || e.name);
      return {
        status: e.status || 500,
        data: {
          error: e.status
            ? e.message
            : "Could not complete this request. Please try again.",
        },
      };
    }
  }
  return { handle };
}
module.exports = { createService, blocks };
