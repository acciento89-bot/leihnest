import { describe, expect, it } from "vitest";
import { resolveAuthRuntimeConfig } from "./runtime-config";

describe("resolveAuthRuntimeConfig", () => {
  it("prefers Better Auth production variables", () => {
    expect(resolveAuthRuntimeConfig({
      BETTER_AUTH_SECRET: "new-secret",
      BETTER_AUTH_URL: "https://new.example",
      SECRET_KEY: "legacy-secret",
      PUBLIC_URL: "https://legacy.example",
    })).toEqual({
      secret: "new-secret",
      baseURL: "https://new.example",
    });
  });

  it("falls back to the existing Portainer SECRET_KEY and PUBLIC_URL variables", () => {
    expect(resolveAuthRuntimeConfig({
      SECRET_KEY: "legacy-secret",
      PUBLIC_URL: "https://leihnest.de",
    })).toEqual({
      secret: "legacy-secret",
      baseURL: "https://leihnest.de",
    });
  });
});
