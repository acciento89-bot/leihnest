import type { Metadata } from "next";
import { ReferenceHome } from "@/components/home/reference-home";
export const metadata: Metadata = {
  title: "Share more. Organize less.",
  description: "Organise your shared collection, loans and returns. A private space for your club, family or community.",
  alternates: { canonical: "/en", languages: { "de-DE": "/", en: "/en" } },
  openGraph: { title: "LeihNest - Good things are better shared.", description: "Share more. Organize less.", url: "https://leihnest.de/en", locale: "en_GB", type: "website" },
};
export default function EnglishHome(){ return <ReferenceHome locale="en"/>; }
