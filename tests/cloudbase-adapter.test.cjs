const { test } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
test("CloudBase adapter handles SDK responses, transactions and private-file round trip", async () => {
  const rows = new Map(),
    blobs = new Map();
  let objectResponse = false;
  const client = {
    collection(name) {
      return {
        doc(id) {
          return {
            async get() {
              const row = rows.get(name + ":" + id);
              return { data: objectResponse ? row || null : row ? [row] : [] };
            },
            async set(value) {
              rows.set(name + ":" + id, structuredClone(value));
              return { updated: 1 };
            },
          };
        },
        skip() {
          return this;
        },
        limit() {
          return this;
        },
        async get() {
          return {
            data: [...rows]
              .filter(([k]) => k.startsWith(name + ":"))
              .map(([, v]) => v),
          };
        },
      };
    },
    async runTransaction(fn) {
      return fn(client);
    },
  };
  const sdk = {
    SYMBOL_CURRENT_ENV: Symbol("env"),
    init: () => ({
      database: () => client,
      auth: () => ({
        getUserInfo: () => ({ uid: "cloud-uid" }),
        getClientIP: () => "203.0.113.4",
      }),
      getUploadMetadata: async ({ cloudPath }) => ({
        data: {
          url: "https://storage.test/upload",
          token: "test-token",
          authorization: "test-signature",
          fileId: cloudPath,
          cosFileId: "test-cos-id",
        },
      }),
      getTempFileURL: async ({ fileList }) => ({
        fileList: fileList.map((f) => ({
          code: "SUCCESS",
          tempFileURL: "https://storage.test/" + f.fileID,
        })),
      }),
      uploadFile: async ({ cloudPath, fileContent }) => {
        blobs.set(cloudPath, fileContent);
        return { fileID: cloudPath };
      },
      deleteFile: async ({ fileList }) => {
        fileList.forEach((f) => blobs.delete(f));
        return { fileList: [] };
      },
    }),
  };
  const load = Module._load,
    oldFetch = global.fetch,
    previous = {
      secret: process.env.QUICKSTARTER_SESSION_SECRET,
      password: process.env.QUICKSTARTER_ADMIN_PASSWORD,
    };
  process.env.QUICKSTARTER_SESSION_SECRET =
    "adapter-test-secret-thirty-two-plus-characters";
  process.env.QUICKSTARTER_ADMIN_PASSWORD = "adapter-test-password-only";
  Module._load = function (id, ...args) {
    if (id === "@cloudbase/node-sdk") return sdk;
    return load.call(this, id, ...args);
  };
  global.fetch = async (url) =>
    new Response(blobs.get(String(url).replace("https://storage.test/", "")));
  try {
    const { main } = require("../cloudfunctions/quickstarter/index.js");
    const call = async (path, body, token) => {
      const r = await main({
        path,
        ...(body === undefined ? {} : { body }),
        token,
      });
      assert.equal(r.status, 200, JSON.stringify(r));
      return r.data;
    };
    const a = await call("admin/login", {
      password: process.env.QUICKSTARTER_ADMIN_PASSWORD,
    });
    const r = await call(
      "admin/rooms",
      {
        title: "Adapter class",
        code: "ADAPTER",
        budget: 10000,
        names: ["A", "B"],
      },
      a.token,
    );
    objectResponse = true;
    const t = await call("login", {
      classCode: r.classCode,
      teamCode: r.teams[0].code,
    });
    const bytes = Buffer.from("%PDF-1.4 adapter");
    const p = await call(
      "upload/prepare",
      {
        title: "Source",
        sourceScope: "assignments-1-2-only",
        files: ["assignment1", "assignment2"].map((slot) => ({
          slot,
          name: slot + ".pdf",
          size: bytes.length,
        })),
      },
      t.token,
    );
    assert.equal(p.uploads[0].fields.Signature, "test-signature");
    assert.equal(p.uploads[0].fields["x-cos-security-token"], "test-token");
    p.uploads.forEach((x) => blobs.set(x.fileID, bytes));
    await call("upload/finish", { id: p.id }, t.token);
    const state = await call("state", undefined, t.token);
    assert.equal(state.proposals[0].hasAssignment1, true);
    assert.equal(state.proposals[0].hasFile, true);
    assert.equal(state.proposals[0].files, undefined);
    assert.match(
      (await call("file/" + state.proposals[0].id + "/1", undefined, t.token))
        .url,
      /quickstarter\/final/,
    );
    assert.equal((await call("admin/rooms", undefined, a.token)).length, 1);
  } finally {
    Module._load = load;
    global.fetch = oldFetch;
    for (const [key, value] of Object.entries({
      QUICKSTARTER_SESSION_SECRET: previous.secret,
      QUICKSTARTER_ADMIN_PASSWORD: previous.password,
    })) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
});
