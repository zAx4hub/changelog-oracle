import { describe, it, expect } from "vitest";
import { run, demo, inspect, parseCommit, suggestBump, renderChangelog } from "../src/engine";

describe("changelog-oracle", () => {
  it("demo + inspect", () => {
    expect(demo().score).toBeGreaterThanOrEqual(0);
    expect(inspect().name).toBe("changelog-oracle");
  });
  it("run changelog", () => {
    const r = run({});
    expect(r.changelog).toContain("Changelog");
    expect(r.bump).toBe("major");
  });
  it("parse + bump", () => {
    expect(parseCommit("feat: x").ok).toBe(true);
    expect(suggestBump([parseCommit("feat!: break")])).toBe("major");
    expect(renderChangelog([parseCommit("feat: x")])).toContain("Features");
  });
});
