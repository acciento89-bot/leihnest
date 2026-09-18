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

  it("contains authenticated workspace navigation in both languages", () => {
    expect(dictionaries.de.dashboard).toBe("Übersicht");
    expect(dictionaries.en.dashboard).toBe("Overview");
    expect(dictionaries.de.items).toBe("Gegenstände");
    expect(dictionaries.en.items).toBe("Items");
    expect(dictionaries.de.reservations).toBe("Reservierungen");
    expect(dictionaries.en.reservations).toBe("Reservations");
    expect(dictionaries.de.members).toBe("Mitglieder");
    expect(dictionaries.en.members).toBe("Members");
    expect(dictionaries.de.settings).toBe("Einstellungen");
    expect(dictionaries.en.settings).toBe("Settings");
  });

  it("contains operational reservation copy in both languages", () => {
    expect(dictionaries.de.returnNote).toBe("Rückgabehinweis");
    expect(dictionaries.en.returnNote).toBe("Return note");
    expect(dictionaries.en.confirmReturn).toBe("Confirm return");
  });
});
