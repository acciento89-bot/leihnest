import { z } from "zod";
export const loginSchema = z.object({ email: z.email(), password: z.string().min(8) });
export const registerSchema = loginSchema.extend({ name: z.string().trim().min(2).max(80) });
