import { describe, expect, it } from "vitest";
import { itemInputSchema } from "./item-schema";
describe("item input", () => {
  it("requires name and positive integer quantity", () => { expect(itemInputSchema.safeParse({ name: "Beamer", totalQuantity: 2 }).success).toBe(true); expect(itemInputSchema.safeParse({ name: "", totalQuantity: 0 }).success).toBe(false); });
});
