import { cookies, headers } from "next/headers";
import { resolveWorkspaceLocale, workspaceText } from "./workspace";
export async function getWorkspaceLocale() {
  const [jar, requestHeaders] = await Promise.all([cookies(), headers()]);
  return resolveWorkspaceLocale(jar.get("leihnest-language")?.value, requestHeaders.get("accept-language") ?? undefined);
}
export async function getWorkspaceText() {
  const locale = await getWorkspaceLocale();
  return { locale, t: workspaceText[locale] };
}
