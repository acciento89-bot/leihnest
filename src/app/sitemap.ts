import type { MetadataRoute } from "next";
export default function sitemap():MetadataRoute.Sitemap{const base="https://leihnest.de";return ["","/en","/login","/register","/impressum","/datenschutz"].map(path=>({url:`${base}${path}`,lastModified:new Date(),changeFrequency:path===""?"weekly":"monthly",priority:path===""?1:0.6}))}
