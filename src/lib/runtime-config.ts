type AuthRuntimeEnv = Record<string, string | undefined>;

export function resolveAuthRuntimeConfig(env: AuthRuntimeEnv) {
  return {
    secret: env.BETTER_AUTH_SECRET?.trim() || env.SECRET_KEY?.trim(),
    baseURL: env.BETTER_AUTH_URL?.trim() || env.PUBLIC_URL?.trim(),
  };
}
