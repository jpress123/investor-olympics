const { test } = require("node:test");
const assert = require("node:assert/strict");
const { fixture } = require("./helpers.cjs");
test("source boundary, privacy, revisions and atomic publication", async () => {
  const f = fixture(),
    { admin, room, tokens } = await f.start();
  assert.equal((await f.call("admin/rooms", undefined, tokens[0])).status, 403);
  assert.equal(
    (await f.call("state", undefined, tokens[0], "different-browser")).status,
    401,
  );
  assert.equal((await f.call("state", undefined, tokens[0] + "x")).status, 401);
  const body = {
    title: "Project",
    sourceScope: "assignments-1-2-only",
    files: [
      { slot: "assignment1", name: "a.pdf", size: 6 },
      { slot: "assignment2", name: "b.pdf", size: 6 },
    ],
  };
  for (const bad of [
    { ...body, sourceScope: "" },
    { ...body, assignment3: "extra" },
    { ...body, files: [...body.files, body.files[0]] },
    { ...body, files: [body.files[0], body.files[0]] },
    {
      ...body,
      files: [{ ...body.files[0], size: 16 * 1024 * 1024 }, body.files[1]],
    },
  ])
    assert.equal((await f.call("upload/prepare", bad, tokens[0])).status, 400);
  const badPdf = await f.ok("upload/prepare", body, tokens[0]);
  badPdf.uploads.forEach((x) => f.blobs.set(x.fileID, Buffer.from("NOTPDF")));
  assert.equal(
    (await f.call("upload/finish", { id: badPdf.id }, tokens[0])).status,
    400,
  );
  await f.submit(tokens[0]);
  const pid = room.teams[0].id;
  assert.equal(
    (await f.call("file/" + pid + "/1", undefined, tokens[1])).status,
    403,
  );
  assert.match(
    (await f.ok("file/" + pid + "/1", undefined, admin)).url,
    /final/,
  );
  let s = await f.ok("state", undefined, tokens[0]);
  assert.equal(s.proposals.length, 1);
  assert.equal(s.proposals[0].files, undefined);
  assert.equal(s.team.secret, undefined);
  assert.equal(s.teams, undefined);
  assert.equal(s.rankings, undefined);
  assert.equal((await f.ok("state", undefined, tokens[1])).proposals.length, 0);
  let p = s.proposals[0];
  assert.equal(
    (
      await f.call(
        "admin/pitch",
        { ...p, pitch: f.pitch, published: true, source_checked: false },
        admin,
      )
    ).status,
    400,
  );
  await f.ok(
    "admin/pitch",
    { ...p, pitch: f.pitch, published: true, source_checked: true },
    admin,
  );
  await f.ok("review", { proposal: pid }, tokens[1]);
  const previous = (await f.ok("state", undefined, tokens[1])).team.reviews[
    pid
  ];
  await f.ok(
    "admin/pitch",
    { ...p, pitch: f.pitch, published: true, source_checked: true },
    admin,
  );
  s = await f.ok("state", undefined, tokens[1]);
  assert.ok(s.proposals[0].updated > previous);
  await f.ok(
    "admin/import",
    { room: room.id, pitches: [{ id: pid, pitch: f.pitch }] },
    admin,
  );
  s = await f.ok("admin/state/" + room.id, undefined, admin);
  assert.equal(s.proposals[0].source_checked, false);
  assert.equal(s.proposals[0].published, false);
  const rotate = await f.ok("admin/rotate", { team: room.teams[0].id }, admin);
  assert.equal((await f.call("state", undefined, tokens[0])).status, 401);
  assert.equal(
    (
      await f.call("login", {
        classCode: room.classCode,
        teamCode: room.teams[0].code,
      })
    ).status,
    401,
  );
  assert.ok(
    (await f.ok("login", { classCode: room.classCode, teamCode: rotate.code }))
      .token,
  );
});
test("review-all, shared budget, concurrent saves, live totals and deadline", async () => {
  const f = fixture(),
    { admin, room, tokens } = await f.start();
  assert.equal(
    (await f.call("admin/phase", { id: room.id, action: "start" }, admin))
      .status,
    400,
  );
  const state = await f.approveAll(admin, room, tokens),
    ps = state.proposals;
  await f.ok("admin/phase", { id: room.id, action: "start" }, admin);
  const body = {
    portfolio: { [ps[1].id]: 5000 },
    criteria: { [ps[1].id]: "value" },
    reasons: {
      [ps[1].id]: "A2 prototype evidence; repeat demand remains unknown.",
    },
    version: 0,
  };
  assert.equal((await f.call("invest", body, tokens[0])).status, 400);
  assert.equal(
    (await f.call("review", { proposal: ps[0].id }, tokens[0])).status,
    400,
  );
  for (const p of ps.slice(1))
    await f.ok("review", { proposal: p.id }, tokens[0]);
  for (const bad of [
    { ...body, criteria: {} },
    { ...body, reasons: {} },
    { ...body, portfolio: { [ps[1].id]: 11000 } },
    { ...body, portfolio: { [ps[1].id]: 123 } },
    { ...body, portfolio: { [ps[0].id]: 100 } },
    { ...body, portfolio: { unknown: 100 } },
    { ...body, portfolio: { [ps[1].id]: -100 } },
  ])
    assert.equal((await f.call("invest", bad, tokens[0])).status, 400);
  const saves = await Promise.all([
    f.call("invest", body, tokens[0]),
    f.call("invest", { ...body, portfolio: { [ps[1].id]: 6000 } }, tokens[0]),
  ]);
  assert.deepEqual(saves.map((r) => r.status).sort(), [200, 409]);
  let s = await f.ok("state", undefined, tokens[1]);
  assert.equal(s.proposals.find((p) => p.id === ps[1].id).amount, 5000);
  assert.equal(s.rankings, undefined);
  s = await f.ok("admin/state/" + room.id, undefined, admin);
  assert.equal(s.rankings[0].id, ps[1].id);
  assert.equal(s.rankings[0].backers, 1);
  assert.equal(s.teams[0].criteria[ps[1].id], "value");
  await f.ok(
    "invest",
    { portfolio: {}, criteria: {}, reasons: {}, version: 1 },
    tokens[0],
  );
  assert.equal(
    (await f.ok("state", undefined, tokens[1])).proposals[1].amount,
    0,
  );
  await f.ok("invest", { ...body, version: 2 }, tokens[0]);
  assert.equal(
    (await f.call("admin/phase", { id: room.id, action: "reveal" }, admin))
      .status,
    400,
  );
  assert.equal((await f.call("upload/prepare", {}, tokens[0])).status, 400);
  f.advance(1800001);
  assert.equal(
    (await f.call("invest", { ...body, version: 3 }, tokens[0])).status,
    409,
  );
  assert.equal(
    (await f.ok("state", undefined, tokens[0])).room.phase,
    "closed",
  );
  await f.ok("admin/phase", { id: room.id, action: "reveal" }, admin);
  s = await f.ok("state", undefined, tokens[0]);
  assert.equal(s.rankings[0].amount, 5000);
  assert.equal(s.rankings[0].files, undefined);
  await f.ok(
    "reflection",
    { assumption: "Demand", change: "Test", role: "Owner", test: "Interview" },
    tokens[0],
  );
  assert.equal(
    (await f.ok("state", undefined, tokens[0])).team.reflection.role,
    "Owner",
  );
});
test("upload finalize is private, immutable and cannot replay or cross the deadline", async () => {
  const f = fixture(),
    { admin, room, tokens } = await f.start(),
    bytes = Buffer.from("%PDF-1.4 fixture");
  const body = {
    title: "Source project",
    sourceScope: "assignments-1-2-only",
    files: ["assignment1", "assignment2"].map((slot) => ({
      slot,
      name: slot + ".pdf",
      size: bytes.length,
    })),
  };
  const p = await f.ok("upload/prepare", body, tokens[0]);
  p.uploads.forEach((x) => f.blobs.set(x.fileID, bytes));
  assert.equal(
    (await f.call("upload/finish", { id: p.id }, tokens[1])).status,
    400,
  );
  await f.ok("upload/finish", { id: p.id }, tokens[0]);
  assert.equal(
    (await f.call("upload/finish", { id: p.id }, tokens[0])).status,
    400,
  );
  p.uploads.forEach((x) => assert.equal(f.blobs.has(x.fileID), false));
  const current = (await f.store.get("qs_rooms", room.id)).proposals[0];
  assert.ok(current.files.every((x) => x.fileID.includes("/final/")));
  const late = await f.ok("upload/prepare", body, tokens[0]);
  late.uploads.forEach((x) => f.blobs.set(x.fileID, bytes));
  await f.approveAll(admin, room, tokens);
  await f.ok("admin/phase", { id: room.id, action: "start" }, admin);
  assert.equal(
    (await f.call("upload/finish", { id: late.id }, tokens[0])).status,
    400,
  );
});
test("login throttling and session expiry", async () => {
  const f = fixture();
  for (let i = 0; i < 10; i++)
    assert.equal(
      (await f.call("admin/login", { password: "wrong" })).status,
      401,
    );
  assert.equal(
    (
      await f.call("admin/login", {
        password: f.env.QUICKSTARTER_ADMIN_PASSWORD,
      })
    ).status,
    429,
  );
  f.advance(600001);
  const { admin, tokens } = await f.start();
  f.advance(12 * 3600000 + 1);
  assert.equal((await f.call("state", undefined, tokens[0])).status, 401);
  assert.equal((await f.call("admin/rooms", undefined, admin)).status, 401);
});
