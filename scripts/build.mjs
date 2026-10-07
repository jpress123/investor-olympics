import { build } from "esbuild";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
await mkdir("assets", { recursive: true });
await build({
  entryPoints: ["src/main.tsx"],
  bundle: true,
  outfile: "assets/app.js",
  minify: true,
  jsx: "automatic",
  target: ["es2020"],
  define: { "process.env.NODE_ENV": '"production"' },
  legalComments: "eof",
});
const hash = createHash("sha256")
  .update(await readFile("assets/app.js"))
  .update(await readFile("assets/app.css"))
  .digest("hex")
  .slice(0, 12);
const html = await readFile("index.html", "utf8");
await writeFile(
  "index.html",
  html.replace(
    /\.\/assets\/app\.(js|css)(\?v=[a-f0-9]+)?/g,
    (_, ext) => `./assets/app.${ext}?v=${hash}`,
  ),
);
console.log("Built GitHub Pages assets:", hash);
