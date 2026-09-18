import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";
import { resolveAuthRuntimeConfig } from "@/lib/runtime-config";

const runtime = resolveAuthRuntimeConfig(process.env);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  secret: runtime.secret,
  baseURL: runtime.baseURL,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  user: { deleteUser: { enabled: true } },
});
