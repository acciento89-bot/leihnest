import { z } from "zod";
export const groupInputSchema = z.object({ name: z.string().trim().min(2).max(80) });
export function slugifyGroupName(name: string) {
  return name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}
