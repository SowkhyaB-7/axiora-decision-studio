import { describe, expect, it } from "vitest";
import { byNewest, byRecentlyUpdated, matchesSearch, toWorkItem } from "./work";

const item = (over: Record<string, unknown>) =>
  toWorkItem({ id: "x", raw_goal: "", title: "", created_at: "", ...over });

describe("workspace search", () => {
  it("requires every query word to match some field, case-insensitively", () => {
    const a = item({ raw_goal: "Should we invest in family LAND now", title: "Investment timing" });
    expect(matchesSearch(a, "land timing")).toBe(true);
    expect(matchesSearch(a, "land rental")).toBe(false);
  });
  it("searches standalone decision context", () => {
    const a = { ...item({ title: "Career direction" }), context: "Two months of APM applications" };
    expect(matchesSearch(a, "apm")).toBe(true);
  });
});

describe("workspace sorting", () => {
  it("puts newest created first and missing timestamps last", () => {
    const list = [item({ id: "old", created_at: "2026-01-01" }), item({ id: "none" }), item({ id: "new", created_at: "2026-06-01" })];
    expect(list.sort(byNewest).map((i) => i.id)).toEqual(["new", "old", "none"]);
  });
  it("orders recently updated independently of creation", () => {
    const list = [
      item({ id: "a", created_at: "2026-06-01", updated_at: "2026-06-01" }),
      item({ id: "b", created_at: "2026-01-01", updated_at: "2026-07-01" }),
    ];
    expect(list.sort(byRecentlyUpdated).map((i) => i.id)).toEqual(["b", "a"]);
  });
});
