// Local-only rehearsal. Never deploy this server to GitHub Pages.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url),
  { fixture } = require("../tests/helpers.cjs");
const f = fixture({ realtime: true }),
  { admin, room, tokens } = await f.start();
await f.approveAll(admin, room, tokens);
await f.ok("admin/phase", { id: room.id, action: "start" }, admin);
const base = "http://127.0.0.1:5180";
f.files.prepare = async (key) => ({
  url: base + "/__upload",
  fileID: key,
  fields: { key },
});
f.files.url = async (id) => base + "/__file?id=" + encodeURIComponent(id);
const sdk = `window.cloudbase={init:()=>({auth:{getSession:async()=>({data:{user:{id:'browser-a'}}}),signInAnonymously:async()=>({})},callFunction:async({data})=>({result:await fetch('/__api',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(data)}).then(r=>r.json())})})};window.QS_CONFIG={env:'LOCAL-REHEARSAL',functionName:'quickstarter'};`;
const root = process.cwd();
const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, base);
    if (u.pathname === "/__api" && req.method === "POST") {
      const parts = [];
      for await (const p of req) parts.push(p);
      const result = await f.service.handle(JSON.parse(Buffer.concat(parts)), {
        uid: "browser-a",
        ip: "127.0.0.1",
      });
      res.setHeader("Content-Type", "application/json");
      return res.end(JSON.stringify(result));
    }
    if (u.pathname === "/__upload" && req.method === "POST") {
      const request = new Request(base + req.url, {
          method: "POST",
          headers: req.headers,
          body: Readable.toWeb(req),
          duplex: "half",
        }),
        form = await request.formData();
      f.blobs.set(
        form.get("key"),
        Buffer.from(await form.get("file").arrayBuffer()),
      );
      res.statusCode = 204;
      return res.end();
    }
    if (u.pathname === "/__file") {
      const bytes = f.blobs.get(u.searchParams.get("id"));
      if (!bytes) {
        res.statusCode = 404;
        return res.end();
      }
      res.setHeader("Content-Type", "application/pdf");
      return res.end(bytes);
    }
    if (u.pathname === "/__demo-sdk.js") {
      res.setHeader("Content-Type", "text/javascript");
      return res.end(sdk);
    }
    let relative = decodeURIComponent(u.pathname).replace(
      /^\/investor-olympics\//,
      "/",
    );
    if (relative === "/") relative = "/index.html";
    const filename = path.resolve(root, "." + relative);
    if (
      !filename.startsWith(root + path.sep) ||
      !/^\/(index.html|config.js|assets\/[^/]+)$/.test(relative)
    ) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    let data = await readFile(filename);
    if (relative === "/index.html")
      data = Buffer.from(
        data
          .toString()
          .replace(
            "https://static.cloudbase.net/cloudbase-js-sdk/3.10.1/cloudbase.full.js",
            "/__demo-sdk.js",
          )
          .replace(
            "<body>",
            '<body><div style="padding:8px 5%;background:#704e12;color:white;font:14px Arial">LOCAL REHEARSAL · 示例数据 · Not a live classroom</div>',
          ),
      );
    res.setHeader(
      "Content-Type",
      relative.endsWith(".html")
        ? "text/html; charset=utf-8"
        : relative.endsWith(".css")
          ? "text/css"
          : "text/javascript",
    );
    res.end(data);
  } catch (e) {
    res.statusCode = 500;
    res.end("Local preview failed");
    console.error(e.message);
  }
});
server.listen(5180, "127.0.0.1", () =>
  console.log(
    JSON.stringify(
      {
        preview: base + "/investor-olympics/",
        instructor: base + "/investor-olympics/?instructor=1",
        localPassword: f.env.QUICKSTARTER_ADMIN_PASSWORD,
        classCode: room.classCode,
        teams: room.teams.map((t) => ({ name: t.name, code: t.code })),
      },
      null,
      2,
    ),
  ),
);
