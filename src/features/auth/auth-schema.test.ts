import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "./auth-schema";
describe("auth input", () => {
  it("accepts valid registration", () => expect(registerSchema.safeParse({ name: "Anna", email: "anna@example.de", password: "sicher123" }).success).toBe(true));
  it("rejects invalid email and short password", () => expect(loginSchema.safeParse({ email: "nope", password: "123" }).success).toBe(false));
});
