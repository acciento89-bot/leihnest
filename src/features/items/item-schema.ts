import { z } from "zod";
export const itemInputSchema = z.object({ name: z.string().trim().min(2).max(120), description: z.string().trim().max(1000).optional().or(z.literal("")), location: z.string().trim().max(120).optional().or(z.literal("")), totalQuantity: z.coerce.number().int().positive().max(9999) });
