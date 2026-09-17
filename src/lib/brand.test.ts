import { describe, expect, it } from "vitest";
import { APP_NAME, TAGLINE_DE } from "./brand";

describe("LeihNest brand", () => {
  it("uses the approved product name and tagline", () => {
    expect(APP_NAME).toBe("LeihNest");
    expect(TAGLINE_DE).toBe("Gemeinsam nutzen. Einfach organisiert.");
  });
});
