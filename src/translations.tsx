import { Children, cloneElement, isValidElement, ReactNode } from "react";
const zh: Record<string, string> = {
  "Review projects from Assignments 1 and 2 with your team.":
    "与小组一起评审作业一与二的项目。",
  "Use the business model canvas to decide which ideas can succeed.":
    "用商业模式画布判断哪些创意可能成功。",
  "Assignments 1 & 2 to three pitch pages": "将作业一与二整理为三页简报",
  "Students upload their existing Assignment 1 and Assignment 2 PDFs only. Prepare three pages from those sources: Why, What and How. Review both languages before publishing.":
    "学生仅上传已完成的作业一与二 PDF。根据这两份材料整理为“为什么、是什么、如何实现”三页简报，审核中英文后发布。",
  "No new research, completed canvas, Assignment 3 or extra pitch homework is required. The platform does not read PDFs automatically. Verify source pages and mark missing business details “Not stated in Assignments 1–2”.":
    "不要求新调研、已完成的画布、作业三或额外路演作业。平台不会自动阅读 PDF。请核对原始页码，将缺失的商业信息标为“作业一与二未提供”。",
  "Waiting for Assignments 1 & 2": "等待作业一与二",
  "Assignment 1 PDF": "作业一 PDF",
  "Upload both PDFs": "上传两份 PDF",
  "Upload your existing Assignment 1 and Assignment 2 as two PDFs, up to 15 MB each. No new content, completed canvas or Assignment 3 is needed. The instructor summarizes only these sources into Why, What and How. Original PDFs are private to your team and the instructor.":
    "将已完成的作业一与二分别上传为两份 PDF，每份不超过 15 MB。无需新增内容、完成画布或提交作业三。教师仅根据这两份材料整理三页简报。原始 PDF 仅本组和教师可访问。",
  "Review every other group using the canvas.": "用画布评审所有其他小组。",
  "Confirm that these files contain only Assignments 1 and 2.":
    "请确认文件仅包含作业一与二。",
  "Only Assignment 1 and Assignment 2 files are accepted.":
    "仅接受作业一与作业二文件。",
  "Upload Assignment 1 and Assignment 2 as two PDFs, up to 15 MB each.":
    "请分别上传作业一与二的 PDF，每份不超过 15 MB。",
  "Choose Assignment 1 or Assignment 2.": "请选择作业一或作业二。",
  "Choose another group’s published pitch.": "请选择其他小组已发布的简报。",
  "Review every other group before saving investments.":
    "保存投资前请评审所有其他小组。",
  "Choose a canvas criterion for each investment.":
    "请为每项投资选择画布评审模块。",
  "Check both assignments and confirm that the pitch uses only their evidence.":
    "请核对两份作业，并确认简报仅使用其中的证据。",
  "groups reviewed": "个小组已评审",

  "Your classmates.": "你的同学。",
  "Their ideas.": "他们的创意。",
  "Your investment.": "你的投资。",
  "CLASS 3": "第三讲",
  "Review Assignment 2 proposals with your team.":
    "与小组一起评审作业二的项目。",
  "Decide which businesses deserve your support.":
    "决定哪些商业项目值得你们支持。",
  "Inspired by Kickstarter: project pitches, funding goals, backers and a campaign deadline. Classroom credits only. No real payments or equity.":
    "借鉴 Kickstarter 的项目简报、众筹目标、支持者和活动截止时间。仅使用课堂积分，无真实支付或股权交易。",
  "Join QuickStarter": "进入 QuickStarter",
  "Your instructor provides both codes. Everyone in your team shares one portfolio. Choose one person to save decisions.":
    "教师提供班级代码和小组访问码。同组共享一个投资组合，请指定一人保存决定。",
  Instructor: "教师入口",
  "Student view": "学生视图",
  "Leave team": "退出小组",
  Language: "语言",
  "Loading QuickStarter…": "正在载入 QuickStarter…",
  INSTRUCTOR: "教师",
  Classes: "班级",
  "Existing classes": "已有班级",
  "No classes yet. Create a roster to begin.":
    "尚无班级。创建小组名单即可开始。",
  "Create a class": "创建班级",
  "Class title": "班级名称",
  "Class code": "班级代码",
  "Credits per team": "每组积分",
  "Team names, one per line": "小组名称，每行一组",
  "Create class & access codes": "创建班级和访问码",
  "Save the team access codes": "请保存小组访问码",
  "These codes appear only now. Share each code with its own team.":
    "访问码仅在此时显示。请分别发送给对应小组。",
  "Download access codes": "下载访问码",
  "I saved the codes": "我已保存访问码",
  Results: "结果",
  "All classes": "所有班级",
  "Start 30-minute investing": "开始 30 分钟投资",
  "Close investing": "结束投资",
  "Reveal rankings": "公布排名",
  "Export class record": "导出班级记录",
  "Assignment 2 to three pitch pages": "将作业二转为三页简报",
  "Students upload their PDFs. Download each source for conversion, then review Why, What and How in both languages. Publish one approved pitch per team before starting.":
    "学生上传 PDF。下载源文件制作简报，审核中英文的“为什么、是什么、如何实现”。开始前，每组必须有一份已批准的简报。",
  "Pitch drafts need instructor preparation or an imported summary. The platform does not automatically read PDFs. Preserve evidence and label missing business assumptions.":
    "简报需由教师准备或导入摘要。平台不会自动阅读 PDF。请保留证据，明确标注未提供的商业假设。",
  "Export pitch worksheet": "导出简报工作表",
  "Import prepared summaries": "导入已准备的摘要",
  "Submissions & pitch review": "提交文件与简报审核",
  "Live investment choices": "实时投资选择",
  "Waiting for Assignment 2": "等待作业二",
  "Download PDF": "下载 PDF",
  "Edit pitch": "编辑简报",
  Preview: "预览",
  "New access code": "重新生成访问码",
  "Investor team": "投资小组",
  "Own company": "本组项目",
  Unspent: "未使用积分",
  "teams have saved investments. Refreshes every 3 seconds. Project progress is visible to students. The ranked results appear when revealed.":
    "个小组已保存投资。每 3 秒刷新一次。学生可查看项目进度，教师公布后显示排名。",
  "Upload one PDF per team, up to 15 MB. The instructor will prepare and approve a short pitch for the class. Original PDFs remain available only to your team and the instructor.":
    "每组上传一份不超过 15 MB 的 PDF。教师将准备并批准课堂简报。原始 PDF 仅本组和教师可访问。",
  "Your PDF": "你们的 PDF",
  "Company / proposal title": "公司／项目名称",
  "Assignment 2 PDF": "作业二 PDF",
  "Replace submission": "替换提交文件",
  "Upload PDF": "上传 PDF",
  "Replacing a submission resets its pitch for instructor review.":
    "替换文件后，简报将重置并重新提交教师审核。",
  "Read all pitches with your team. Compare customer value, test evidence, feasibility and social or environmental effects.":
    "与小组一起阅读所有简报，比较客户价值、测试证据、可行性以及社会或环境影响。",
  "The instructor is preparing the class pitches. They will appear here when approved.":
    "教师正在准备项目简报，批准后将在此显示。",
  "教师正在准备项目简报，批准后将在此显示。":
    "教师正在准备项目简报，批准后将在此显示。",
  "Budget:": "预算：",
  "Allocated:": "已分配：",
  credits: "积分",
  "credits pledged": "已认投积分",
  "credit goal": "积分目标",
  "backing teams": "个支持小组",
  funded: "达成目标",
  "Goal reached": "已达目标",
  "· Goal reached": "· 已达目标",
  "Below goal": "未达目标",
  "Over budget by": "超出预算",
  "No investment in your own company.": "不能投资本组公司。",
  "Use increments of 100 credits.": "以 100 积分为单位投资。",
  "You may keep unspent credits.": "可以保留未使用的积分。",
  "Change or cancel a pledge before the deadline.":
    "截止前可以修改或取消认投。",
  "Save before the timer ends.": "倒计时结束前保存。",
  "One portfolio per team. Choose one person to edit and save. Teammates see saved changes automatically.":
    "每组共享一个投资组合。请指定一人编辑和保存，组员可自动看到已保存的修改。",
  "No investments saved yet": "尚未保存投资",
  "Discard changes & reload": "放弃修改并重新载入",
  "Virtual credits only. Rankings are a discussion prompt, not a course grade.":
    "仅使用虚拟积分。排名用于讨论，不是课程成绩。",
  "INSTRUCTOR LIVE VIEW": "教师实时视图",
  "QUICKSTARTER RESULTS": "QUICKSTARTER 结果",
  "Ranked by pledged credits, then backing teams. Equal scores share a rank. Goals show whether a project reached its target. All pledges count for classroom ranking, even below goal.":
    "先按认投积分排名，再比较支持小组数量，相同结果并列。众筹目标显示是否达标。课堂排名统计全部认投，包括未达目标的项目。",
  Pitch: "项目简报",
  "Winning team: a 3-minute presentation, followed by 2 minutes of questions. Joint winners share the time.":
    "优胜小组进行 3 分钟展示，随后 2 分钟问答。并列优胜小组共享时间。",
  "Use the investment discussion to revise your own business before organizational design.":
    "在进入组织设计前，根据投资讨论修改你们的商业模式。",
  "Save team reflection": "保存小组复盘",
  "Team reflections": "小组复盘",
  assumption: "假设",
  change: "改变",
  role: "负责角色",
  test: "下一步测试",
  Previous: "上一页",
  Next: "下一页",
  Close: "关闭",
  Title: "标题",
  "English pitch": "英文简报",
  English: "英文",
  "Save pitch": "保存简报",
  Dismiss: "关闭提示",
  "Please join your team.": "请先加入小组。",
  "Your session expired. Please join again.": "会话已过期，请重新加入。",
  "Check your class code and team access code.": "请检查班级代码和小组访问码。",
  "Too many attempts. Please wait 10 minutes.":
    "尝试次数过多，请等待 10 分钟。",
  "Could not complete this request. Please try again.":
    "未能完成请求，请重试。",
  "Instructor sign-in required.": "请使用教师账户登录。",
  "Submissions are closed.": "文件提交已关闭。",
  "Add a title and PDF up to 15 MB.": "请填写标题并上传不超过 15 MB 的 PDF。",
  "Upload a PDF file.": "请上传 PDF 文件。",
  "Investing has closed.": "投资已结束。",
  "You cannot invest in your own company.": "不能投资本组公司。",
  "Your portfolio exceeds the budget.": "投资组合超出预算。",
  "Use whole multiples of 100 credits.": "请使用 100 积分的整数倍。",
  "Add a short reason for each investment.": "请为每项投资填写简短理由。",
  "A teammate updated the portfolio, or time ended. Reload before saving.":
    "组员已修改投资组合，或时间已结束。请重新载入后再保存。",
  "Approve one pitch for every team before starting.":
    "开始前，请批准每个小组的简报。",
  "Complete every section. Mark missing information explicitly.":
    "请填写中英文所有部分，明确标注未提供的信息。",
  "Funding goal must be a multiple of 100 credits.":
    "众筹目标必须是 100 积分的整数倍。",
  "Pitch editing is closed.": "简报编辑已关闭。",
  "Close investing before revealing rankings.": "公布排名前请先结束投资。",
  "Uploaded. Your instructor can now prepare the pitch.":
    "上传成功，教师现在可以准备简报。",
  "Pitch saved.": "简报已保存。",
  "Drafts imported. Review each pitch before publishing.":
    "草稿已导入，请审核后发布。",
  "New code downloaded. The old code and sessions are now invalid.":
    "新访问码已下载，旧访问码及会话已失效。",
  "This file belongs to another class.": "该文件属于另一个班级。",
  "This submission is private.": "该提交文件仅限本组和教师访问。",
  "This pitch is unavailable.": "此简报不可用。",
  "Reload your team portfolio.": "请重新载入小组投资组合。",
  "File not found.": "找不到文件。",
  "Invalid pitch import.": "简报导入格式无效。",
  "Import contains an unknown proposal.": "导入文件包含未知项目。",
  "Not found": "未找到。",
  "Invalid request origin.": "请求来源无效。",
  "Submissions just closed.": "文件提交刚刚关闭。",
  "Invalid portfolio.": "投资组合格式无效。",
  "Class not found.": "找不到班级。",
  "Use 2–40 unique team names, a class code and a budget in hundreds.":
    "请输入 2 至 40 个不同的小组名称、班级代码以及以 100 为单位的预算。",
};
function text(value: string, lang: "en" | "cn") {
  const t = value.trim();
  if (!t) return value;
  if (t.startsWith("QuickStarter · SUES"))
    return lang === "cn"
      ? "QuickStarter · 上海工程技术大学设计学院 · 课堂模拟"
      : "QuickStarter · SUES School of Design · Classroom simulation";
  const both = t.match(/^(.+?)\s+\/\s+([^]*[\u3400-\u9fff][^]*)$/);
  if (both) return lang === "cn" ? both[2] : both[1];
  if (lang === "en") {
    if (t === "课堂模拟投资，无真实资金交易。")
      return "Classroom simulation. No real payments.";
    if (t === "教师正在准备项目简报，批准后将在此显示。") return "";
    return value;
  }
  if (zh[t]) return value.replace(t, zh[t]);
  if (t.startsWith("QuickStarter · SUES"))
    return "QuickStarter · 上海工程技术大学设计学院 · 课堂模拟";
  if (t === "· Assignment 2") return "· 作业二";
  if (t.includes("credit goal ·"))
    return value
      .replace("credit goal", "积分目标")
      .replace("backing teams", "个支持小组");
  if (t.includes("% funded"))
    return value
      .replace("% funded", "% 达成目标")
      .replace("Goal reached", "已达目标")
      .replace("Below goal", "未达目标");
  if (t.includes("backing teams"))
    return value.replace("backing teams", "个支持小组");
  return value;
}
export function localize(node: ReactNode, lang: "en" | "cn"): ReactNode {
  if (typeof node === "string") return text(node, lang);
  if (Array.isArray(node))
    return node.map((child, i) =>
      isValidElement(child)
        ? cloneElement(
            child,
            { key: child.key || i },
            localize((child.props as any).children, lang),
          )
        : localize(child, lang),
    );
  if (!isValidElement(node)) return node;
  const p = node.props as any;
  const attrs: Record<string, any> = {};
  for (const k of ["aria-label", "placeholder"])
    if (typeof p[k] === "string") attrs[k] = text(p[k], lang);
  return cloneElement(
    node,
    attrs,
    Children.map(p.children, (c) => localize(c, lang)),
  );
}
