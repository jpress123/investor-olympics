"use strict";
const cloudbase = require("@cloudbase/node-sdk");
const { createService } = require("./core.cjs");
const app = cloudbase.init({ env: cloudbase.SYMBOL_CURRENT_ENV });
const db = app.database();
function checked(res) {
  if (res?.code)
    throw Object.assign(new Error(res.message || res.code), { code: res.code });
  return res;
}
function doc(client, collection, id) {
  if (!/^[a-f0-9]{32,64}$/.test(id || ""))
    throw Object.assign(new Error("Not found"), { status: 404 });
  return client.collection(collection).doc(id);
}
async function read(client, collection, id) {
  const res = checked(await doc(client, collection, id).get());
  const row = Array.isArray(res.data) ? res.data[0] : res.data;
  return row?.payload ? JSON.parse(row.payload) : null;
}
async function write(client, collection, id, value) {
  checked(
    await doc(client, collection, id).set({ payload: JSON.stringify(value) }),
  );
}
const store = {
  get: (collection, id) => read(db, collection, id),
  async list(collection) {
    const rows = [];
    for (let skip = 0; ; skip += 100) {
      const res = checked(
        await db.collection(collection).skip(skip).limit(100).get(),
      );
      rows.push(...res.data.map((x) => JSON.parse(x.payload)));
      if (res.data.length < 100) break;
    }
    return rows.sort((a, b) => b.created - a.created);
  },
  mutate: (collection, id, fn) =>
    db.runTransaction(async (tx) => {
      const { value, result } = fn(await read(tx, collection, id));
      await write(tx, collection, id, value);
      return result;
    }),
  finishUpload: (id, rid, fn) =>
    db.runTransaction(async (tx) => {
      const pending = await read(tx, "qs_uploads", id),
        room = await read(tx, "qs_rooms", rid);
      const result = fn(pending, room);
      await write(tx, "qs_uploads", id, pending);
      await write(tx, "qs_rooms", rid, room);
      return result;
    }),
};
const files = {
  async prepare(cloudPath) {
    const res = checked(await app.getUploadMetadata({ cloudPath })),
      m = res.data;
    if (!m?.url || !m.fileId) throw Error("Missing upload metadata");
    return {
      url: m.url,
      fileID: m.fileId,
      fields: {
        Signature: m.authorization,
        "x-cos-security-token": m.token,
        "x-cos-meta-fileid": m.cosFileId,
        key: cloudPath,
      },
    };
  },
  async url(fileID) {
    const res = checked(
      await app.getTempFileURL({ fileList: [{ fileID, maxAge: 60 }] }),
    );
    const f = res.fileList?.[0];
    if (f?.code !== "SUCCESS" || !f.tempFileURL)
      throw Error("File unavailable");
    return f.tempFileURL;
  },
  async read(fileID, max) {
    const url = await files.url(fileID),
      res = await fetch(url, { signal: AbortSignal.timeout(45000) });
    if (!res.ok) throw Error("File unavailable");
    if (Number(res.headers.get("content-length")) > max)
      throw Object.assign(Error("Upload a PDF file."), { status: 400 });
    const chunks = [];
    let size = 0;
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > max)
        throw Object.assign(Error("Upload a PDF file."), { status: 400 });
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  },
  async write(cloudPath, fileContent) {
    const res = checked(await app.uploadFile({ cloudPath, fileContent }));
    if (!res.fileID) throw Error("File upload failed");
    return res.fileID;
  },
  async remove(fileList) {
    if (fileList.length) checked(await app.deleteFile({ fileList }));
  },
};
const service = createService({ store, files, env: process.env });
exports.main = async (event) =>
  service.handle(event, {
    uid: app.auth().getUserInfo().uid,
    ip: app.auth().getClientIP(),
  });
