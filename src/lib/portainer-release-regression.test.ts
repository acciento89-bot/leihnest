import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) =>
  readFileSync(join(process.cwd(), path), "utf8");

describe("Portainer Git release images", () => {
  it("uses explicit versioned image tags for services built from the repository", () => {
    const compose = read("compose.portainer.yaml");

    expect(compose).toContain("image: leihnest-migrate:20260918-site-finish");
    expect(compose).toContain("image: leihnest-web:20260918-site-finish");
  });

  it("keeps the duplicate Portainer compose definition identical", () => {
    expect(read("docker-compose.portainer.yml")).toBe(
      read("compose.portainer.yaml")
    );
  });

  it("documents that every source release must bump the local image tag", () => {
    const readme = read("README.md");

    expect(readme).toContain("Bump both versioned local image tags");
  });
});
