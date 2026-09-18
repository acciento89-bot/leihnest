import { z } from "zod";
export const reservationInputSchema = z.object({ itemId: z.string().min(1), quantity: z.coerce.number().int().positive(), startsAt: z.coerce.date(), endsAt: z.coerce.date(), purpose: z.string().trim().max(300).optional().or(z.literal("")) }).refine((d) => d.endsAt > d.startsAt, { message: "Ende muss nach dem Start liegen", path: ["endsAt"] });
