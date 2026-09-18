import { describe, expect, it } from "vitest";
import { toActionError } from "./action-result";

describe("toActionError", () => {
  it("maps reservation conflicts to a safe public message", () => {
    expect(toActionError(new Error("RESERVATION_CONFLICT"))).toBe("Im gewählten Zeitraum ist nicht genug Bestand verfügbar.");
  });

  it("does not expose unknown internal error messages", () => {
    expect(toActionError(new Error("database password leaked"))).toBe("Die Aktion konnte nicht ausgeführt werden.");
  });
});
