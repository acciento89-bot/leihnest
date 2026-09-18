import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { metadataBase:new URL("https://leihnest.de"), title:{default:"LeihNest – Gemeinsam nutzen. Einfach organisiert.",template:"%s | LeihNest"}, description:"Gemeinsame Gegenstände verwalten, reservieren, ausleihen und zuverlässig zurückgeben.", alternates:{canonical:"/",languages:{"de-DE":"/","en":"/en"}}, openGraph:{title:"LeihNest",description:"Gemeinsam nutzen. Einfach organisiert.",url:"https://leihnest.de",siteName:"LeihNest",locale:"de_DE",type:"website"} };
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="de"><body>{children}</body></html>}
