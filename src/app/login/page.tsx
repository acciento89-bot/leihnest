import type { Metadata } from "next";
import { AuthLayout } from "@/components/design/auth-layout";
import { safeNextPath } from "@/features/auth/safe-next-path";
export const metadata: Metadata = { title: "Anmelden", robots: { index: false, follow: false } };
type PageProps={searchParams:Promise<{next?:string;lang?:string}>};
export default async function Page({searchParams}:PageProps){
  const {next,lang}=await searchParams;
  const locale=lang==="en"?"en":"de";
  return <AuthLayout mode="login" locale={locale} redirectTo={safeNextPath(next)}/>;
}
