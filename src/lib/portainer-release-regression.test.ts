import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Portainer Git release images", () => {
  it("forces repository-built services to rebuild on each GitOps update", () => {
    const compose = read("compose.portainer.yaml");
    const buildPolicies = compose.match(/pull_policy:\s*build/g) ?? [];

    expect(buildPolicies).toHaveLength(2);
    expect(compose).toContain("target: migrator");
    expect(compose).toContain("target: runner");
  });

  it("keeps the duplicate Portainer compose definition identical", () => {
    expect(read("docker-compose.portainer.yml")).toBe(
      read("compose.portainer.yaml")
    );
  });

  it("documents the GitOps rebuild policy", () => {
    const readme = read("README.md");

    expect(readme).toContain("pull_policy: build");
    expect(readme).toContain("rebuilds both repository-built images");
  });
});
