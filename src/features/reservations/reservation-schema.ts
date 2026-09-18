import { z } from "zod";

export const reservationInputSchema = z
  .object({
    itemId: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
    purpose: z.string().trim().max(300).optional().or(z.literal("")),
  })
  .refine((data) => data.endsAt > data.startsAt, {
    message: "Ende muss nach dem Start liegen",
    path: ["endsAt"],
  });

export const returnNoteSchema = z
  .string()
  .trim()
  .max(500)
  .transform((value) => (value.length > 0 ? value : null));
