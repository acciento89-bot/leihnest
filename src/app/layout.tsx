import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeihNest – Gemeinsam nutzen. Einfach organisiert.",
  description: "Gemeinsame Gegenstände verwalten, reservieren, ausleihen und zuverlässig zurückgeben.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="de"><body>{children}</body></html>;
}
