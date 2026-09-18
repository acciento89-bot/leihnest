import { describe, expect, it } from "vitest";
import { z } from "zod";
import { toActionError } from "./action-result";

describe("toActionError", () => {
  it("maps availability conflicts to a useful message", () => {
    expect(toActionError(new Error("NOT_AVAILABLE"))).toBe(
      "Für diesen Zeitraum ist die gewünschte Menge nicht verfügbar."
    );
  });

  it("maps authorization failures without leaking internal details", () => {
    expect(toActionError(new Error("FORBIDDEN"))).toBe(
      "Dafür hast du keine Berechtigung."
    );
  });

  it("maps validation errors to a safe input message", () => {
    const result = z.object({ name: z.string().min(2) }).safeParse({ name: "" });
    if (result.success) throw new Error("expected validation failure");
    expect(toActionError(result.error)).toBe("Bitte prüfe deine Eingaben.");
  });

  it("does not expose unknown internal errors", () => {
    expect(toActionError(new Error("database exploded"))).toBe(
      "Etwas ist schiefgelaufen. Bitte versuche es erneut."
    );
  });
});
