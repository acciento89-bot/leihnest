import { describe, expect, it } from "vitest";
import { dictionaries } from "./dictionaries";

describe("locale dictionaries", () => {
  it("keeps German and English keys in parity", () => {
    expect(Object.keys(dictionaries.de).sort()).toEqual(Object.keys(dictionaries.en).sort());
  });

  it("contains the primary public navigation labels", () => {
    expect(dictionaries.de.contact).toBe("Kontakt");
    expect(dictionaries.en.contact).toBe("Contact");
  });
});
