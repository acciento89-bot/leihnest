import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://leihnest.de";
  return ["", "/en", "/kontakt", "/impressum", "/datenschutz"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/en" ? 0.9 : 0.6,
  }));
}
