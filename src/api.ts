type Obj = Record<string, any>;
declare global {
  interface Window {
    cloudbase: any;
    QS_CONFIG: Obj;
  }
}
const instructor = new URLSearchParams(location.search).has("instructor");
const tokenKey = instructor ? "qs-instructor-token" : "qs-team-token";
let ready: Promise<any> | undefined;
async function cloud() {
  if (!ready)
    ready = (async () => {
      const cfg = window.QS_CONFIG || {};
      if (!cfg.env)
        throw Error(
          "Classroom setup is incomplete. Please contact the instructor. / 课堂配置尚未完成，请联系教师。",
        );
      if (!window.cloudbase)
        throw Error(
          "Connection unavailable. Reload the page. / 无法连接，请重新加载页面。",
        );
      const app = window.cloudbase.init({
        env: cfg.env,
        accessKey: cfg.key || undefined,
      });
      const session = await app.auth.getSession();
      if (!session?.data?.user) await app.auth.signInAnonymously();
      return app;
    })().catch((e) => {
      ready = undefined;
      throw e;
    });
  return ready;
}
export async function api(path: string, body?: any): Promise<any> {
  if (path === "logout") {
    sessionStorage.removeItem(tokenKey);
    return { ok: true };
  }
  if (body instanceof FormData) {
    if (
      [...body.keys()].some(
        (k) =>
          !["title", "sourceScope", "assignment1", "assignment2"].includes(k),
      ) ||
      ["assignment1", "assignment2"].some((k) => body.getAll(k).length !== 1)
    )
      throw Error("Only Assignment 1 and Assignment 2 files are accepted.");
    const uploads = ["assignment1", "assignment2"].map((slot) => ({
      slot,
      file: body.get(slot) as File,
    }));
    for (const { file } of uploads) {
      if (
        !(file instanceof File) ||
        file.size < 5 ||
        file.size > 15 * 1024 * 1024
      )
        throw Error(
          "Upload Assignment 1 and Assignment 2 as two PDFs, up to 15 MB each.",
        );
      if ((await file.slice(0, 5).text()) !== "%PDF-")
        throw Error("Upload a PDF file.");
    }
    const prep = await api("upload/prepare", {
      title: body.get("title"),
      sourceScope: body.get("sourceScope"),
      files: uploads.map(({ slot, file }) => ({
        slot,
        name: file.name,
        size: file.size,
      })),
    });
    for (let i = 0; i < 2; i++) {
      const m = prep.uploads[i],
        f = new FormData();
      for (const [k, v] of Object.entries(m.fields)) f.append(k, String(v));
      f.append("file", uploads[i].file);
      const r = await fetch(m.url, { method: "POST", body: f });
      if (!r.ok)
        throw Error("Upload failed. Please try again. / 上传失败，请重试。");
    }
    return api("upload/finish", { id: prep.id });
  }
  const app = await cloud();
  const response = await app.callFunction({
    name: window.QS_CONFIG.functionName || "quickstarter",
    data: {
      path,
      ...(body === undefined ? {} : { body }),
      token: sessionStorage.getItem(tokenKey) || "",
    },
  });
  const r = response.result;
  if (!r || !Number.isInteger(r.status))
    throw Error("Could not complete this request. Please try again.");
  if (r.status >= 400)
    throw Object.assign(Error(r.data?.error || "Please try again."), {
      status: r.status,
    });
  if (r.data?.token) sessionStorage.setItem(tokenKey, r.data.token);
  return r.data;
}
export async function openAssignment(path: string) {
  const tab = window.open("about:blank", "_blank");
  try {
    const { url } = await api(path);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else location.href = url;
  } catch (e) {
    tab?.close();
    throw e;
  }
}
