"use client";
import { useEffect, useState, useRef } from "react";
import { localize } from "./translations";
import { api, openAssignment } from "./api";
type Obj = Record<string, any>;
const labels: Obj = {
  why: "Why · Problem & customer / 为什么 · 问题与用户",
  what: "What · Product, service or solution / 是什么 · 产品、服务或解决方案",
  how: "How · Business model / 如何实现 · 商业模式",
};
const sections = ["why", "what", "how"];
const canvas: Obj = {
  partners: [
    "Partners / 合作伙伴",
    "Who must help deliver the promise? / 谁必须参与交付？",
  ],
  activities: [
    "Activities / 关键活动",
    "Can the essential work happen reliably? / 关键工作能否可靠完成？",
  ],
  value: [
    "Value proposition / 价值主张",
    "Why would the customer choose this solution? / 用户为什么选择这个方案？",
  ],
  relationships: [
    "Relationships / 客户关系",
    "What earns trust and repeat use? / 如何获得信任与持续使用？",
  ],
  segments: [
    "Customer segments / 客户群体",
    "Whose need is supported by evidence? / 哪类用户需求有证据支持？",
  ],
  resources: [
    "Resources / 关键资源",
    "Are the required people, tools and assets available? / 所需人员、工具和资产能否获得？",
  ],
  channels: [
    "Channels / 渠道",
    "How will customers discover, buy and receive it? / 用户如何发现、购买并获得服务？",
  ],
  costs: [
    "Costs / 成本结构",
    "What must be paid, including delivery and upkeep? / 交付与维护需要支付什么成本？",
  ],
  subsidies: [
    "Subsidies / 补贴",
    "Does viability depend on unconfirmed support? / 可行性是否依赖未确认的补贴？",
  ],
  revenue: [
    "Revenue / 收入来源",
    "Who pays, for what, and when? / 谁付钱、为什么付、何时付？",
  ],
  ecologicalCosts: [
    "Ecological and social costs / 生态与社会成本",
    "What harm or resource use could undermine the model? / 什么损害或资源消耗会削弱模式？",
  ],
  socialBenefits: [
    "Ecological and social benefits / 生态与社会收益",
    "What positive impact has supporting evidence? / 哪些积极影响有证据支持？",
  ],
};
function CanvasGuide({ lang }: { lang: "en" | "cn" }) {
  return localize(
    <details className="canvas-guide">
      <summary>
        Business model canvas: our investment criteria /
        商业模式画布：投资评审标准
      </summary>
      <p>
        Use all 12 blocks to judge whether the model works as a whole. A missing
        detail is a question to test, not proof of failure. Popularity and
        funding totals are not evidence of success. / 用全部 12
        个模块判断模式是否完整可行。缺失信息是待验证的问题，不等于失败。人气与众筹金额不是成功的证据。
      </p>
      <div className="criteria-grid">
        {Object.entries(canvas).map(([k, v]) => (
          <section key={k}>
            <h3>{v[0]}</h3>
            <p>{v[1]}</p>
          </section>
        ))}
      </div>
    </details>,
    lang,
  );
}
const phaseNames: Obj = {
  preparation: "Pitch preparation / 项目准备",
  voting: "Investing is open / 投资进行中",
  closed: "Investing has closed / 投资已结束",
  results: "Results & reflection / 排名与复盘",
};
const number = (v: number) => v.toLocaleString("en-US");
function download(name: string, value: any, type = "application/json") {
  const url = URL.createObjectURL(
    new Blob(
      [typeof value === "string" ? value : JSON.stringify(value, null, 2)],
      { type },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
function Pitch({
  p,
  onClose,
  lang,
  onReview,
  reviewed,
  busy,
}: {
  p: Obj;
  onClose: () => void;
  lang: "en" | "cn";
  onReview?: () => void;
  reviewed?: boolean;
  busy?: boolean;
}) {
  const [page, setPage] = useState(0);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);
  return localize(
    <div
      className="overlay"
      role="dialog"
      aria-modal="true"
      aria-label={p.title}
    >
      <section className="pitch-slide">
        <div className="row">
          <span className="eyebrow">
            {p.teamName} · Assignments 1 & 2 / 作业一与二
          </span>
          <button autoFocus className="quiet" onClick={onClose}>
            Close / 关闭
          </button>
        </div>
        <h1>{p.title}</h1>
        <div className="pitch-content">
          <section>
            <h2>{labels[sections[page]]}</h2>
            <p>
              {p.pitch[lang]?.[sections[page]] ||
                (lang === "cn"
                  ? "尚未提供中文版"
                  : "English summary not provided")}
            </p>
          </section>
        </div>
        <nav className="row">
          <button disabled={!page} onClick={() => setPage(page - 1)}>
            Previous
          </button>
          <span>{page + 1} / 3</span>
          <button disabled={page === 2} onClick={() => setPage(page + 1)}>
            Next
          </button>
        </nav>
        {onReview && page === 2 && (
          <div className="review-action">
            <CanvasGuide lang={lang} />
            <button
              className="primary"
              disabled={busy || reviewed}
              onClick={onReview}
            >
              {reviewed
                ? "Reviewed by our team / 本组已评审"
                : "We reviewed all 3 pages using the canvas / 已用画布评审全部三页"}
            </button>
          </div>
        )}
      </section>
    </div>,
    lang,
  );
}
export default function QuickStarter({ admin = false }: { admin?: boolean }) {
  const [lang, setLang] = useState<"en" | "cn">("en");
  useEffect(() => {
    const saved = localStorage.getItem("qs-language");
    if (saved === "cn") setLang("cn");
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "cn" ? "zh-CN" : "en";
  }, [lang]);
  const [adminLogin, setAdminLogin] = useState(false),
    [password, setPassword] = useState("");
  const [editLang, setEditLang] = useState<"en" | "cn">("en");
  const [state, setState] = useState<Obj | null>(null),
    [rooms, setRooms] = useState<Obj[]>([]),
    [room, setRoom] = useState(""),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [classCode, setClassCode] = useState(""),
    [teamCode, setTeamCode] = useState(""),
    [portfolio, setPortfolio] = useState<Obj>({}),
    [reasons, setReasons] = useState<Obj>({}),
    [criteria, setCriteria] = useState<Obj>({}),
    [version, setVersion] = useState(0),
    [dirty, setDirty] = useState(false),
    [pitch, setPitch] = useState<Obj | null>(null),
    [editing, setEditing] = useState<Obj | null>(null),
    [reflection, setReflection] = useState<Obj>({}),
    [clock, setClock] = useState(Date.now()),
    [access, setAccess] = useState<Obj | null>(null),
    [roster, setRoster] = useState(""),
    [title, setTitle] = useState("Class 3 · QuickStarter"),
    [budget, setBudget] = useState(10000);
  const serverOffset = useRef(0);
  const dirtyRef = useRef(false),
    syncRef = useRef(false);
  dirtyRef.current = dirty;
  async function refresh(force = false) {
    try {
      if (admin && !room) {
        setRooms(await api("admin/rooms"));
        setAdminLogin(false);
        setLoading(false);
        return;
      }
      const s = await api(admin ? "admin/state/" + room : "state");
      serverOffset.current = s.serverTime - Date.now();
      setClock(s.serverTime);
      setState(s);
      if (!admin && (!dirtyRef.current || force)) {
        setPortfolio(s.team.portfolio);
        setReasons(s.team.reasons);
        setCriteria(s.team.criteria || {});
        setVersion(s.team.version);
        if (force || !syncRef.current) setReflection(s.team.reflection);
        syncRef.current = true;
        if (force) {
          dirtyRef.current = false;
          setDirty(false);
        }
      }
      setLoading(false);
    } catch (e: any) {
      if (e.status === 401) {
        setState(null);
        if (admin) setAdminLogin(true);
        setLoading(false);
      } else {
        setError(e.message);
        setLoading(false);
      }
    }
  }
  useEffect(() => {
    setState(null);
    setLoading(true);
    refresh();
    const t = setInterval(() => refresh(), 3000);
    return () => clearInterval(t);
  }, [admin, room]);
  useEffect(() => {
    const t = setInterval(
      () => setClock(Date.now() + serverOffset.current),
      1000,
    );
    return () => clearInterval(t);
  }, []);
  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const spent = Object.values(portfolio).reduce(
      (a: number, b: any) => a + Number(b || 0),
      0,
    ) as number,
    remaining = (state?.room.budget || 0) - spent;
  const closed = state?.room.phase !== "voting" || state?.room.ends < clock;
  const mins = state?.room.ends
    ? Math.max(0, Math.ceil((state.room.ends - clock) / 1000))
    : 0;
  function change(k: string, v: any) {
    setPortfolio((x) => ({ ...x, [k]: v }));
    dirtyRef.current = true;
    setDirty(true);
  }
  const own = state?.proposals.find((p: Obj) => p.team === state.team?.id);
  const otherPitches =
    state?.proposals.filter(
      (p: Obj) => p.published && p.team !== state.team?.id,
    ) || [];
  const reviewedCount = otherPitches.filter(
    (p: Obj) => state?.team?.reviews?.[p.id] === p.updated,
  ).length;
  const allReviewed =
    otherPitches.length > 0 && reviewedCount === otherPitches.length;
  return localize(
    <>
      <header inert={!!pitch || !!editing}>
        <a className="brand" href="./">
          Quick<span>Starter</span>
          <small>创新创业实践</small>
        </a>
        <div className="header-side">
          <div className="language" aria-label="Language">
            <button
              aria-pressed={lang === "en"}
              onClick={() => {
                setLang("en");
                localStorage.setItem("qs-language", "en");
              }}
            >
              EN
            </button>
            <button
              aria-pressed={lang === "cn"}
              onClick={() => {
                setLang("cn");
                localStorage.setItem("qs-language", "cn");
              }}
            >
              中文
            </button>
          </div>
          {state && (
            <span>{admin ? "Instructor / 教师" : state.team.name}</span>
          )}
          <a href={admin ? "./" : "?instructor=1"}>
            {admin ? "Student view" : "Instructor"}
          </a>
          {admin && !adminLogin && (
            <button
              className="quiet"
              onClick={() =>
                act(async () => {
                  await api("logout", {});
                  setState(null);
                  setRoom("");
                  setAdminLogin(true);
                })
              }
            >
              Sign out / 退出登录
            </button>
          )}
          {state && !admin && (
            <button
              className="quiet"
              onClick={() =>
                act(async () => {
                  await api("logout", {});
                  setState(null);
                  setDirty(false);
                })
              }
            >
              Leave team
            </button>
          )}
        </div>
      </header>
      <main inert={!!pitch || !!editing}>
        {error && (
          <div role="alert" className="notice error">
            {error}
            <button className="quiet" onClick={() => setError("")}>
              Dismiss
            </button>
          </div>
        )}
        {message && (
          <div role="status" className="notice">
            {message}
          </div>
        )}
        {loading ? (
          <p>Loading QuickStarter…</p>
        ) : !admin && !state ? (
          <div className="join">
            <div>
              <span className="eyebrow">CLASS 3 / 第三讲</span>
              <h1>
                Your classmates.
                <br />
                Their ideas.
                <br />
                <em>Your investment.</em>
              </h1>
              <p>
                Review projects from Assignments 1 and 2 with your team.
                <br />
                Use the business model canvas to decide which ideas can succeed.
              </p>
              <p className="muted">
                Inspired by Kickstarter: project pitches, funding goals, backers
                and a campaign deadline. Classroom credits only. No real
                payments or equity.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                act(async () => {
                  await api("login", { classCode, teamCode });
                  await refresh(true);
                });
              }}
            >
              <h2>Join your team / 加入小组</h2>
              <label>
                Class code / 班级代码
                <input
                  autoComplete="off"
                  required
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                />
              </label>
              <label>
                Team access code / 小组访问码
                <input
                  type="password"
                  autoComplete="off"
                  required
                  value={teamCode}
                  onChange={(e) => setTeamCode(e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy}>
                Join QuickStarter
              </button>
              <p className="muted">
                Your instructor provides both codes. Everyone in your team
                shares one portfolio. Choose one person to save decisions.
              </p>
            </form>
          </div>
        ) : null}
        {admin && adminLogin && !loading && (
          <form
            className="instructor-login"
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await api("admin/login", { password });
                setPassword("");
                setAdminLogin(false);
                await refresh();
              });
            }}
          >
            <h1>Instructor sign-in / 教师登录</h1>
            <label>
              Instructor password / 教师密码
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button disabled={busy} className="primary">
              Sign in / 登录
            </button>
          </form>
        )}
        {admin && !adminLogin && !state && !loading && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">INSTRUCTOR / 教师</span>
                <h1>Classes</h1>
              </div>
            </div>
            <div className="admin-grid">
              <section>
                <h2>Existing classes</h2>
                {rooms.length ? (
                  rooms.map((r) => (
                    <button
                      className="room-choice"
                      key={r.id}
                      onClick={() => setRoom(r.id)}
                    >
                      <strong>{r.title}</strong>
                      <span>
                        {r.code} · {phaseNames[r.phase]}
                      </span>
                    </button>
                  ))
                ) : (
                  <p>No classes yet. Create a roster to begin.</p>
                )}
              </section>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    const a = await api("admin/rooms", {
                      title,
                      code: classCode,
                      budget,
                      names: roster
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean),
                    });
                    setAccess(a);
                    setRoom(a.id);
                  });
                }}
              >
                <h2>Create a class</h2>
                <label>
                  Class title
                  <input
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </label>
                <label>
                  Class code
                  <input
                    required
                    pattern="[-a-zA-Z0-9]{3,30}"
                    value={classCode}
                    onChange={(e) => setClassCode(e.target.value.toUpperCase())}
                    placeholder="IEP-CLASS3"
                  />
                </label>
                <label>
                  Credits per team
                  <input
                    type="number"
                    min="100"
                    max="1000000"
                    step="100"
                    value={budget}
                    onChange={(e) => setBudget(Number(e.target.value))}
                  />
                </label>
                <label>
                  Team names, one per line
                  <textarea
                    required
                    rows={7}
                    value={roster}
                    onChange={(e) => setRoster(e.target.value)}
                    placeholder={"Team 1\nTeam 2\nTeam 3"}
                  />
                </label>
                <button disabled={busy} className="primary">
                  Create class & access codes
                </button>
              </form>
            </div>
          </>
        )}
        {access && (
          <section className="notice access">
            <h2>Save the team access codes</h2>
            <p>
              These codes appear only now. Share each code with its own team.
            </p>
            <button
              onClick={() =>
                download(
                  "QuickStarter-access-codes.txt",
                  `Class code: ${access.classCode}\n\n` +
                    access.teams
                      .map((t: Obj) => `${t.name}: ${t.code}`)
                      .join("\n"),
                  "text/plain",
                )
              }
            >
              Download access codes
            </button>
            <button className="quiet" onClick={() => setAccess(null)}>
              I saved the codes
            </button>
          </section>
        )}
        {state && (
          <>
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  {state.room.code} / {phaseNames[state.room.phase]}
                </span>
                <h1>{state.room.title}</h1>
              </div>
              <div className="timer">
                {state.room.phase === "voting"
                  ? `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, "0")}`
                  : state.room.phase === "results"
                    ? "Results"
                    : `${state.proposals.filter((p: Obj) => p.published).length}/${state.teamCount}`}
                <small>
                  {state.room.phase === "voting"
                    ? "time remaining / 剩余时间"
                    : state.room.phase === "results"
                      ? "投资结果"
                      : "pitches approved / 项目已批准"}
                </small>
              </div>
            </div>
            {admin ? (
              <>
                <div className="toolbar">
                  <button onClick={() => setRoom("")}>All classes</button>
                  <button
                    disabled={busy || state.room.phase !== "preparation"}
                    className="primary"
                    onClick={() =>
                      act(async () => {
                        await api("admin/phase", { id: room, action: "start" });
                        await refresh();
                      })
                    }
                  >
                    Start 30-minute investing
                  </button>
                  <button
                    disabled={busy || state.room.phase !== "voting"}
                    onClick={() =>
                      act(async () => {
                        await api("admin/phase", { id: room, action: "close" });
                        await refresh();
                      })
                    }
                  >
                    Close investing
                  </button>
                  <button
                    disabled={busy || state.room.phase !== "closed"}
                    onClick={() =>
                      act(async () => {
                        await api("admin/phase", {
                          id: room,
                          action: "reveal",
                        });
                        await refresh();
                      })
                    }
                  >
                    Reveal rankings
                  </button>
                  <button
                    onClick={() =>
                      download("QuickStarter-class-record.json", state)
                    }
                  >
                    Export class record
                  </button>
                </div>
                {state.room.phase === "preparation" && (
                  <section className="preparation">
                    <h2>Assignments 1 & 2 to three pitch pages</h2>
                    <p>
                      Students upload their existing Assignment 1 and Assignment
                      2 PDFs only. Prepare three pages from those sources: Why,
                      What and How. Review both languages before publishing.
                    </p>
                    <p className="muted">
                      No new research, completed canvas, Assignment 3 or extra
                      pitch homework is required. The platform does not read
                      PDFs automatically. Verify source pages and mark missing
                      business details “Not stated in Assignments 1–2”.
                    </p>
                    <div className="toolbar">
                      <button
                        onClick={() =>
                          download("QuickStarter-pitch-drafts.json", {
                            room,
                            pitches: state.proposals.map((p: Obj) => ({
                              id: p.id,
                              team: p.teamName,
                              title: p.title,
                              pitch: p.pitch,
                            })),
                            instructions:
                              "Use ONLY the existing Assignment 1 and Assignment 2 PDFs for each team. No Assignment 3, new research, invented prices or added business plans. Produce exactly 3 pitch pages in EN and CN: why (problem, intended customer and evidence), what (existing product/service/solution and test evidence), how (business model facts already stated). Map How to the 12-block sustainable business model canvas where the sources support it. Mark absent details Not stated in Assignments 1–2. Cite A1/A2 page numbers in each page. Return {en:{why,what,how},cn:{why,what,how}}. Maximum 1800 characters per page. Import drafts, check both PDFs, then approve. Students use the canvas as review criteria in class; they do not submit a new canvas.",
                          })
                        }
                      >
                        Export pitch worksheet
                      </button>
                      <label className="file-button">
                        Import prepared summaries
                        <input
                          type="file"
                          accept=".json"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f)
                              act(async () => {
                                const b = JSON.parse(await f.text());
                                if (b.room !== room)
                                  throw Error(
                                    "This file belongs to another class.",
                                  );
                                await api("admin/import", b);
                                await refresh();
                                setMessage(
                                  "Drafts imported. Review each pitch before publishing.",
                                );
                              });
                            e.target.value = "";
                          }}
                        />
                      </label>
                    </div>
                  </section>
                )}
                <h2>
                  {state.room.phase === "preparation"
                    ? "Submissions & pitch review"
                    : "Live investment choices"}
                </h2>
                {state.room.phase === "preparation" ? (
                  <div className="pitch-grid">
                    {state.teams.map((t: Obj) => {
                      const p = state.proposals.find(
                        (x: Obj) => x.team === t.id,
                      );
                      return (
                        <article key={t.id}>
                          <span className="eyebrow">{t.name}</span>
                          <h2>{p?.title || "Waiting for Assignments 1 & 2"}</h2>
                          <p>
                            {p?.published
                              ? "Approved / 已批准"
                              : p
                                ? "Draft / 待审核"
                                : "No upload yet / 尚未上传"}
                          </p>
                          <div className="toolbar">
                            {p && (
                              <>
                                {p.hasAssignment1 && (
                                  <button
                                    onClick={() =>
                                      act(() =>
                                        openAssignment("file/" + p.id + "/1"),
                                      )
                                    }
                                  >
                                    Assignment 1 PDF
                                  </button>
                                )}
                                {p.hasFile && (
                                  <button
                                    onClick={() =>
                                      act(() =>
                                        openAssignment("file/" + p.id + "/2"),
                                      )
                                    }
                                  >
                                    Assignment 2 PDF
                                  </button>
                                )}
                                <button
                                  onClick={() =>
                                    setEditing({
                                      ...structuredClone(p),
                                      source_checked: !!p.source_checked,
                                    })
                                  }
                                >
                                  Edit pitch
                                </button>
                                <button
                                  className="quiet"
                                  onClick={() => setPitch(p)}
                                >
                                  Preview
                                </button>
                              </>
                            )}
                            <button
                              className="quiet"
                              onClick={() =>
                                act(async () => {
                                  const r = await api("admin/rotate", {
                                    team: t.id,
                                  });
                                  download(
                                    "Access-" + t.name + ".txt",
                                    `${t.name}\nClass: ${state.room.code}\nNew team code: ${r.code}`,
                                    "text/plain",
                                  );
                                  setMessage(
                                    "New code downloaded. The old code and sessions are now invalid.",
                                  );
                                })
                              }
                            >
                              New access code
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <p>
                      {state.submittedCount} / {state.teamCount} teams have
                      saved investments. Refreshes every 3 seconds. Project
                      progress is visible to students. The ranked results appear
                      when revealed.
                    </p>
                    <div className="table-wrap">
                      <table>
                        <thead>
                          <tr>
                            <th>Investor team</th>
                            {state.proposals
                              .filter((p: Obj) => p.published)
                              .map((p: Obj) => (
                                <th key={p.id}>{p.title}</th>
                              ))}
                            <th>Unspent</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.teams.map((t: Obj) => (
                            <tr key={t.id}>
                              <th>{t.name}</th>
                              {state.proposals
                                .filter((p: Obj) => p.published)
                                .map((p: Obj) => (
                                  <td title={t.reasons[p.id] || ""} key={p.id}>
                                    {t.id === p.team
                                      ? "Own company"
                                      : number(t.portfolio[p.id] || 0)}
                                  </td>
                                ))}
                              <td>
                                {number(
                                  state.room.budget -
                                    (
                                      Object.values(t.portfolio) as number[]
                                    ).reduce((a, b) => a + b, 0),
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {state.room.phase === "preparation" && (
                  <section className="preparation">
                    <h2>
                      Your existing Assignments 1 & 2 / 已完成的作业一与二
                    </h2>
                    <p>
                      Upload your existing Assignment 1 and Assignment 2 as two
                      PDFs, up to 15 MB each. No new content, completed canvas
                      or Assignment 3 is needed. The instructor summarizes only
                      these sources into Why, What and How. Original PDFs are
                      private to your team and the instructor.
                    </p>
                    {own && (
                      <p>
                        <strong>{own.title}</strong> ·{" "}
                        {own.published
                          ? "Approved pitch / 已批准"
                          : "Awaiting instructor review / 待教师审核"}{" "}
                        ·{" "}
                        {own.hasAssignment1 && (
                          <button
                            className="quiet"
                            onClick={() =>
                              act(() => openAssignment("file/" + own.id + "/1"))
                            }
                          >
                            Assignment 1 PDF
                          </button>
                        )}{" "}
                        ·{" "}
                        <button
                          className="quiet"
                          onClick={() =>
                            act(() => openAssignment("file/" + own.id + "/2"))
                          }
                        >
                          Assignment 2 PDF
                        </button>
                      </p>
                    )}
                    <form
                      className="upload-row"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.currentTarget;
                        act(async () => {
                          await api("upload", new FormData(form));
                          form.reset();
                          await refresh();
                          setMessage(
                            "Uploaded. Your instructor can now prepare the pitch.",
                          );
                        });
                      }}
                    >
                      <label>
                        Company / proposal title
                        <input name="title" required maxLength={100} />
                      </label>
                      <label>
                        Assignment 1 PDF
                        <input
                          name="assignment1"
                          type="file"
                          accept="application/pdf"
                          required
                        />
                      </label>
                      <label>
                        Assignment 2 PDF
                        <input
                          name="assignment2"
                          type="file"
                          accept="application/pdf"
                          required
                        />
                      </label>
                      <label className="checkbox source-confirm">
                        <input
                          name="sourceScope"
                          value="assignments-1-2-only"
                          type="checkbox"
                          required
                        />
                        These files contain only our existing Assignments 1 and
                        2. / 文件仅包含本组已完成的作业一与二。
                      </label>
                      <button disabled={busy} className="primary">
                        {own ? "Replace submission" : "Upload both PDFs"}
                      </button>
                    </form>
                    {own && (
                      <p className="muted">
                        Replacing a submission resets its pitch for instructor
                        review.
                      </p>
                    )}
                  </section>
                )}
                <div className="market-layout">
                  <section>
                    <h2>
                      {state.room.phase === "preparation"
                        ? "Approved pitches / 已批准项目"
                        : "The proposals / 候选项目"}
                    </h2>
                    <p>
                      Review every other group before investing. Use the canvas
                      to judge which business is most likely to succeed, using
                      evidence from Assignments 1 and 2. /
                      投资前评审所有其他小组。用画布判断哪个商业模式最可能成功，依据仅限作业一与二的证据。
                    </p>
                    <CanvasGuide lang={lang} />
                    <p className="review-progress">
                      {reviewedCount} / {otherPitches.length} groups reviewed /
                      已评审小组
                    </p>
                    <div className="pitch-grid">
                      {state.proposals
                        .filter((p: Obj) => p.published)
                        .map((p: Obj) => (
                          <article key={p.id}>
                            <span className="eyebrow">
                              {p.teamName}
                              {p.team === state.team.id
                                ? " · YOUR COMPANY / 本组项目"
                                : ""}
                            </span>
                            <h2>{p.title}</h2>
                            <p>{(p.pitch[lang]?.what || "").slice(0, 220)}</p>
                            <p className="muted">
                              {(p.pitch[lang]?.why || "").slice(0, 160)}
                            </p>
                            <div className="campaign">
                              <strong>{number(p.amount || 0)}</strong>
                              <span> credits pledged</span>
                              <small>
                                {number(p.goal)} credit goal · {p.backers || 0}{" "}
                                backing teams
                              </small>
                              <div className="bar">
                                <i
                                  style={{
                                    width: `${Math.min(100, ((p.amount || 0) / p.goal) * 100)}%`,
                                  }}
                                />
                              </div>
                              <small>
                                {Math.round(((p.amount || 0) / p.goal) * 100)}%
                                funded
                                {p.amount >= p.goal ? " · Goal reached" : ""}
                              </small>
                            </div>
                            <button onClick={() => setPitch(p)}>
                              Read 3-page pitch / 查看项目
                            </button>
                            {p.team !== state.team.id && (
                              <p className="review-status">
                                {state.team.reviews?.[p.id] === p.updated
                                  ? "Reviewed / 已评审"
                                  : "Review needed / 待评审"}
                              </p>
                            )}
                            {p.team !== state.team.id && (
                              <div className="allocation">
                                <label>
                                  Investment / 投资额
                                  <input
                                    type="number"
                                    min="0"
                                    max={state.room.budget}
                                    step="100"
                                    disabled={closed}
                                    value={portfolio[p.id] || 0}
                                    onChange={(e) =>
                                      change(p.id, Number(e.target.value))
                                    }
                                  />
                                </label>
                                {portfolio[p.id] > 0 && (
                                  <>
                                    <label>
                                      Canvas criterion / 画布评审模块
                                      <select
                                        disabled={closed}
                                        value={criteria[p.id] || ""}
                                        onChange={(e) => {
                                          setCriteria((x) => ({
                                            ...x,
                                            [p.id]: e.target.value,
                                          }));
                                          dirtyRef.current = true;
                                          setDirty(true);
                                        }}
                                      >
                                        <option value="">
                                          Choose a canvas block / 选择画布模块
                                        </option>
                                        {Object.entries(canvas).map(
                                          ([k, v]) => (
                                            <option key={k} value={k}>
                                              {v[0]}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </label>
                                    <label>
                                      Evidence for success and remaining risk /
                                      成功依据与尚存风险
                                      <textarea
                                        maxLength={500}
                                        disabled={closed}
                                        value={reasons[p.id] || ""}
                                        onChange={(e) => {
                                          setReasons((x) => ({
                                            ...x,
                                            [p.id]: e.target.value,
                                          }));
                                          dirtyRef.current = true;
                                          setDirty(true);
                                        }}
                                        placeholder="Which evidence supports this canvas block? What is still unknown? / 哪些证据支持该模块？还有什么未知？"
                                      />
                                    </label>
                                  </>
                                )}
                              </div>
                            )}
                          </article>
                        ))}
                    </div>
                    {!state.proposals.some((p: Obj) => p.published) && (
                      <div className="empty">
                        The instructor is preparing the class pitches. They will
                        appear here when approved.
                        <br />
                        教师正在准备项目简报，批准后将在此显示。
                      </div>
                    )}
                  </section>
                  <aside>
                    <span className="eyebrow">
                      TEAM PORTFOLIO / 小组投资组合
                    </span>
                    <h2>
                      {number(Math.max(0, remaining))}
                      <small>credits remaining / 剩余积分</small>
                    </h2>
                    <p>
                      Budget: {number(state.room.budget)} credits
                      <br />
                      Allocated: {number(spent)} credits
                    </p>
                    {remaining < 0 && (
                      <p className="danger">
                        Over budget by {number(-remaining)}
                      </p>
                    )}
                    <details className="portfolio-rules">
                      <summary>Investment rules / 投资规则</summary>
                      <ul>
                        <li>Review every other group using the canvas.</li>
                        <li>No investment in your own company.</li>
                        <li>Use increments of 100 credits.</li>
                        <li>You may keep unspent credits.</li>
                        <li>Change or cancel a pledge before the deadline.</li>
                        <li>Save before the timer ends.</li>
                      </ul>
                      <p className="muted">
                        One portfolio per team. Choose one person to edit and
                        save. Teammates see saved changes automatically.
                      </p>
                    </details>
                    <button
                      className="primary"
                      disabled={
                        busy ||
                        closed ||
                        remaining < 0 ||
                        !dirty ||
                        !allReviewed
                      }
                      onClick={() =>
                        act(async () => {
                          const r = await api("invest", {
                            portfolio,
                            reasons,
                            criteria,
                            version,
                          });
                          setVersion(r.version);
                          setDirty(false);
                          dirtyRef.current = false;
                          setMessage("Portfolio saved / 投资组合已保存");
                          await refresh(true);
                        })
                      }
                    >
                      Save portfolio / 保存投资
                    </button>
                    {!allReviewed && (
                      <p className="muted">
                        Review all groups to unlock saving. /
                        完成全部小组评审后即可保存投资。
                      </p>
                    )}
                    <p aria-live="polite">
                      {dirty
                        ? "Unsaved changes / 尚未保存"
                        : state.team.version
                          ? "Saved / 已保存"
                          : "No investments saved yet"}
                    </p>
                    {dirty && (
                      <button className="quiet" onClick={() => refresh(true)}>
                        Discard changes & reload
                      </button>
                    )}
                    <p className="muted">
                      Virtual credits only. Rankings are a discussion prompt,
                      not a course grade.
                    </p>
                  </aside>
                </div>
              </>
            )}
            {state.rankings && state.room.phase !== "preparation" && (
              <section className="rankings">
                <span className="eyebrow">
                  {admin && state.room.phase !== "results"
                    ? "INSTRUCTOR LIVE VIEW"
                    : "QUICKSTARTER RESULTS"}
                </span>
                <h2>Which ideas earned support? / 哪些项目获得支持？</h2>
                <p>
                  Ranked by pledged credits, then backing teams. Equal scores
                  share a rank. Goals show whether a project reached its target.
                  All pledges count for classroom ranking, even below goal.
                </p>
                {state.rankings.map((p: Obj, i: number, arr: Obj[]) => {
                  const rank =
                    arr.findIndex(
                      (x) => x.amount === p.amount && x.backers === p.backers,
                    ) + 1;
                  return (
                    <div className="ranking" key={p.id}>
                      <span className="rank">
                        {String(rank).padStart(2, "0")}
                      </span>
                      <div>
                        <strong>{p.title}</strong>
                        <small>
                          {p.teamName} · {p.backers} backing teams
                        </small>
                        <small>
                          {number(p.goal)} credit goal ·{" "}
                          {Math.round((p.amount / p.goal) * 100)}% funded ·{" "}
                          {p.amount >= p.goal ? "Goal reached" : "Below goal"}
                        </small>
                        <div className="bar">
                          <i
                            style={{
                              width: `${Math.min(100, (p.amount / p.goal) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <b>{number(p.amount)}</b>
                      <button onClick={() => setPitch(p)}>Pitch</button>
                    </div>
                  );
                })}
                <p>
                  Winning team: a 3-minute presentation, followed by 2 minutes
                  of questions. Joint winners share the time.
                </p>
              </section>
            )}
            {!admin && ["closed", "results"].includes(state.room.phase) && (
              <form
                className="reflection"
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    await api("reflection", reflection);
                    setMessage("Reflection saved / 复盘已保存");
                  });
                }}
              >
                <h2>Our next version / 我们的下一版</h2>
                <p>
                  Use the investment discussion to revise your own business
                  before organizational design.
                </p>
                {Object.entries({
                  assumption:
                    "Which assumption did investors challenge? / 哪个假设受到质疑？",
                  change:
                    "What will we change in our business model? / 商业模式如何修改？",
                  role: "Which role owns that change? / 谁负责改变？",
                  test: "What evidence will we collect next? / 下一步收集什么证据？",
                }).map(([k, l]) => (
                  <label key={k}>
                    {l}
                    <textarea
                      maxLength={1500}
                      required
                      value={reflection[k] || ""}
                      onChange={(e) =>
                        setReflection((x) => ({ ...x, [k]: e.target.value }))
                      }
                    />
                  </label>
                ))}
                <button disabled={busy} className="primary">
                  Save team reflection
                </button>
              </form>
            )}
            {admin && state.room.phase === "results" && (
              <section>
                <h2>Team reflections</h2>
                {state.teams.map((t: Obj) => (
                  <details key={t.id}>
                    <summary>{t.name}</summary>
                    {Object.entries(t.reflection).map(([k, v]) => (
                      <p key={k}>
                        <strong>{k}:</strong> {String(v)}
                      </p>
                    ))}
                  </details>
                ))}
              </section>
            )}
          </>
        )}
      </main>
      <footer inert={!!pitch || !!editing}>
        QuickStarter · SUES School of Design · Classroom simulation / 课堂模拟
      </footer>
      {pitch && (
        <Pitch
          p={pitch}
          lang={lang}
          busy={busy}
          reviewed={state?.team?.reviews?.[pitch.id] === pitch.updated}
          onReview={
            !admin &&
            pitch.team !== state?.team?.id &&
            ["preparation", "voting"].includes(state?.room.phase)
              ? () =>
                  act(async () => {
                    await api("review", { proposal: pitch.id });
                    await refresh();
                    setPitch(null);
                    setMessage("Review saved / 评审已保存");
                  })
              : undefined
          }
          onClose={() => setPitch(null)}
        />
      )}
      {editing && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Pitch review"
        >
          <form
            className="editor"
            onSubmit={(e) => {
              e.preventDefault();
              act(async () => {
                await api("admin/pitch", editing);
                setEditing(null);
                await refresh();
                setMessage("Pitch saved.");
              });
            }}
          >
            <div className="row">
              <h2>Pitch review / 简报审核</h2>
              <button
                type="button"
                className="quiet"
                onClick={() => setEditing(null)}
              >
                Close
              </button>
            </div>
            <label>
              Title
              <input
                required
                maxLength={100}
                value={editing.title}
                onChange={(e) =>
                  setEditing({ ...editing, title: e.target.value })
                }
              />
            </label>
            <label>
              Funding goal / 众筹目标
              <input
                type="number"
                min="100"
                max="1000000"
                step="100"
                value={editing.goal}
                onChange={(e) =>
                  setEditing({ ...editing, goal: Number(e.target.value) })
                }
              />
            </label>
            <div className="toolbar">
              <button type="button" onClick={() => setEditLang("en")}>
                English pitch
              </button>
              <button type="button" onClick={() => setEditLang("cn")}>
                中文简报
              </button>
              <strong>{editLang === "en" ? "English" : "中文"}</strong>
            </div>
            {Object.entries(labels).map(([k, l]) => (
              <label key={k}>
                {l}
                <textarea
                  maxLength={1800}
                  rows={5}
                  value={editing.pitch[editLang]?.[k] || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      pitch: {
                        ...editing.pitch,
                        [editLang]: {
                          ...editing.pitch[editLang],
                          [k]: e.target.value,
                        },
                      },
                    })
                  }
                />
              </label>
            ))}
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!!editing.source_checked}
                onChange={(e) =>
                  setEditing({ ...editing, source_checked: e.target.checked })
                }
              />
              I checked both source PDFs: only Assignments 1–2, with missing
              facts marked. / 我已核对两份原始
              PDF：仅使用作业一与二，缺失事实已标注。
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={!!editing.published}
                onChange={(e) =>
                  setEditing({ ...editing, published: e.target.checked })
                }
              />
              Approve for students / 向学生发布
            </label>
            <button className="primary" disabled={busy}>
              Save pitch
            </button>
            {error && (
              <p role="alert" className="danger">
                {error}
              </p>
            )}
          </form>
        </div>
      )}
    </>,
    lang,
  );
}
