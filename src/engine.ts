/** changelog-oracle — Conventional commits → changelog + breaking lint. Author: zAx4hub */
export type Commit = { hash?: string; message: string };
export type Report = {
  project: string;
  author: string;
  summary: string;
  score: number;
  findings: Array<Record<string, unknown>>;
  metrics: Record<string, number>;
  changelog?: string;
  bump?: string;
};

const AUTHOR = "zAx4hub";
const RE =
  /^(?<type>feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(?<scope>\([^)]+\))?(?<break>!)?:\s*(?<desc>.+)$/;

export function parseCommit(message: string) {
  const m = RE.exec(message.trim());
  if (!m?.groups) return { ok: false as const, message };
  const breaking = Boolean(m.groups.break) || /BREAKING CHANGE/i.test(message);
  return {
    ok: true as const,
    type: m.groups.type,
    scope: m.groups.scope?.slice(1, -1),
    description: m.groups.desc,
    breaking,
    message,
  };
}

export function suggestBump(commits: ReturnType<typeof parseCommit>[]): "major" | "minor" | "patch" | "none" {
  const ok = commits.filter((c) => c.ok) as Array<Extract<ReturnType<typeof parseCommit>, { ok: true }>>;
  if (ok.some((c) => c.breaking)) return "major";
  if (ok.some((c) => c.type === "feat")) return "minor";
  if (ok.some((c) => c.type === "fix" || c.type === "perf")) return "patch";
  return ok.length ? "patch" : "none";
}

export function renderChangelog(commits: ReturnType<typeof parseCommit>[], version = "Unreleased"): string {
  const groups: Record<string, string[]> = { Features: [], Fixes: [], Breaking: [], Other: [] };
  for (const c of commits) {
    if (!c.ok) {
      groups.Other.push(`- ${c.message}`);
      continue;
    }
    const line = `- ${c.scope ? `**${c.scope}**: ` : ""}${c.description}`;
    if (c.breaking) groups.Breaking.push(line);
    else if (c.type === "feat") groups.Features.push(line);
    else if (c.type === "fix") groups.Fixes.push(line);
    else groups.Other.push(line);
  }
  const parts = [`# Changelog\n\n## ${version}\n`];
  for (const [name, lines] of Object.entries(groups)) {
    if (!lines.length) continue;
    parts.push(`### ${name}\n${lines.join("\n")}\n`);
  }
  return parts.join("\n");
}

export function run(input: { commits?: Commit[]; version?: string } = {}): Report {
  const commits = (
    input.commits ?? [
      { message: "feat(api): add replay endpoint" },
      { message: "fix: handle null body" },
      { message: "feat!: remove legacy v1 path" },
      { message: "updated stuff" },
    ]
  ).map((c) => parseCommit(c.message));
  const bump = suggestBump(commits);
  const changelog = renderChangelog(commits, input.version ?? "Unreleased");
  const findings = commits.map((c, i) => ({
    id: `c${i + 1}`,
    text: c.ok ? `${c.type}: ${c.description}` : `non-conventional: ${c.message}`,
    score: c.ok ? (c.breaking ? 0.5 : 1) : 0,
    tag: !c.ok ? "lint" : c.breaking ? "breaking" : "ok",
  }));
  const lintFails = findings.filter((f) => f.tag === "lint").length;
  return {
    project: "changelog-oracle",
    author: AUTHOR,
    summary: `Parsed ${commits.length} commits; bump=${bump}; lintFails=${lintFails}`,
    score: Math.round((1 - lintFails / Math.max(1, commits.length)) * 1000) / 1000,
    findings,
    metrics: { commits: commits.length, lintFails, breaking: findings.filter((f) => f.tag === "breaking").length },
    changelog,
    bump,
  };
}

export function demo(): Report {
  return run();
}

export function inspect() {
  return {
    name: "changelog-oracle",
    author: AUTHOR,
    oneLiner: "Conventional commits → changelog + breaking lint",
    features: ["conventional parse", "semver bump", "changelog render", "breaking lint"],
    version: "0.1.0",
    commands: ["demo", "run", "inspect"],
  };
}

export function similarity(a: string, b: string): number {
  return a === b ? 1 : 0;
}
export function rank(text: string): number {
  return parseCommit(text).ok ? 1 : 0.2;
}
