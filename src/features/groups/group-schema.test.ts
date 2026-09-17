import { describe, expect, it } from "vitest";
import { groupInputSchema, slugifyGroupName } from "./group-schema";
describe("group input", () => {
  it("validates names", () => { expect(groupInputSchema.safeParse({ name: "Vereinsheim" }).success).toBe(true); expect(groupInputSchema.safeParse({ name: " " }).success).toBe(false); });
  it("creates URL-safe slugs", () => expect(slugifyGroupName("Kölner Gartenfreunde e.V.")).toBe("kolner-gartenfreunde-e-v"));
});
