const { createService } = require("../cloudfunctions/quickstarter/core.cjs");
function fixture({ realtime = false } = {}) {
  const rows = new Map(),
    blobs = new Map();
  let tick = 1800000000000,
    seq = 0,
    queue = Promise.resolve();
  const random = () =>
    require("node:crypto")
      .createHash("md5")
      .update(String(++seq))
      .digest("hex");
  const transact = (fn) => {
    const next = queue.then(fn);
    queue = next.catch(() => {});
    return next;
  };
  const get = (c, id) => structuredClone(rows.get(c + ":" + id) || null);
  const store = {
    get: async (c, id) => get(c, id),
    list: async (c) =>
      [...rows]
        .filter(([k]) => k.startsWith(c + ":"))
        .map(([, v]) => structuredClone(v)),
    mutate: (c, id, fn) =>
      transact(() => {
        const { value, result } = fn(get(c, id));
        rows.set(c + ":" + id, structuredClone(value));
        return result;
      }),
    finishUpload: (id, rid, fn) =>
      transact(() => {
        const p = get("qs_uploads", id),
          r = get("qs_rooms", rid);
        const result = fn(p, r);
        rows.set("qs_uploads:" + id, p);
        rows.set("qs_rooms:" + rid, r);
        return result;
      }),
  };
  const files = {
    prepare: async (path) => ({
      url: "https://upload.example.test",
      fileID: path,
      fields: { key: path },
    }),
    read: async (id) => {
      if (!blobs.has(id)) throw Error("Missing file");
      return blobs.get(id);
    },
    write: async (path, data) => {
      blobs.set(path, Buffer.from(data));
      return path;
    },
    remove: async (ids) => ids.forEach((id) => blobs.delete(id)),
    url: async (id) => "https://files.example.test/" + id,
  };
  const env = {
    QUICKSTARTER_SESSION_SECRET:
      "test-secret-which-is-over-thirty-two-characters",
    QUICKSTARTER_ADMIN_PASSWORD: "local-testing-password-only",
  };
  const service = createService({
    store,
    files,
    env,
    clock: () => (realtime ? Date.now() : tick),
    random,
  });
  const call = (path, body, token = "", uid = "browser-a") =>
    service.handle(
      { path, ...(body === undefined ? {} : { body }), token },
      { uid, ip: "203.0.113.1" },
    );
  const ok = async (...args) => {
    const r = await call(...args);
    if (r.status !== 200)
      throw Error(`${args[0]}: ${r.status} ${r.data.error}`);
    return r.data;
  };
  const advance = (ms) => (tick += ms);
  async function start() {
    const { token: admin } = await ok("admin/login", {
      password: env.QUICKSTARTER_ADMIN_PASSWORD,
    });
    const room = await ok(
      "admin/rooms",
      {
        title: "QuickStarter test",
        code: "TEST-CLASS",
        budget: 10000,
        names: ["Team A", "Team B", "Team C"],
      },
      admin,
    );
    const tokens = [];
    for (const team of room.teams)
      tokens.push(
        (await ok("login", { classCode: room.classCode, teamCode: team.code }))
          .token,
      );
    return { admin, room, tokens };
  }
  async function submit(
    token,
    title = "Assignment project",
    bytes = Buffer.from("%PDF-1.4\nlocal fixture"),
  ) {
    const prep = await ok(
      "upload/prepare",
      {
        title,
        sourceScope: "assignments-1-2-only",
        files: ["assignment1", "assignment2"].map((slot) => ({
          slot,
          name: slot + ".pdf",
          size: bytes.length,
        })),
      },
      token,
    );
    for (const f of prep.uploads) blobs.set(f.fileID, bytes);
    return ok("upload/finish", { id: prep.id }, token);
  }
  const pitch = {
    en: {
      why: "A1 p.1: commuter needs.",
      what: "A2 p.2: prototype and test.",
      how: "A2 p.3: revenue not stated in Assignments 1–2.",
    },
    cn: {
      why: "作业一第1页：通勤用户需求。",
      what: "作业二第2页：原型与测试。",
      how: "作业二第3页：收入信息未提供。",
    },
  };
  async function approveAll(admin, room, tokens) {
    for (let i = 0; i < tokens.length; i++)
      await submit(tokens[i], room.teams[i].name);
    let s = await ok("admin/state/" + room.id, undefined, admin);
    for (const p of s.proposals)
      await ok(
        "admin/pitch",
        { ...p, pitch, published: true, source_checked: true },
        admin,
      );
    return ok("admin/state/" + room.id, undefined, admin);
  }
  return {
    rows,
    blobs,
    store,
    files,
    env,
    service,
    call,
    ok,
    advance,
    start,
    submit,
    pitch,
    approveAll,
  };
}
module.exports = { fixture };
