import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-next-path";

describe("safeNextPath", () => {
  it("allows local application paths", () => {
    expect(safeNextPath("/invite/abc")).toBe("/invite/abc");
  });

  it("rejects protocol-relative and external redirects", () => {
    expect(safeNextPath("//evil.example")).toBe("/app");
    expect(safeNextPath("https://evil.example")).toBe("/app");
  });
});
