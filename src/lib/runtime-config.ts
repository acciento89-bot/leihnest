type AuthRuntimeEnv = {
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  SECRET_KEY?: string;
  PUBLIC_URL?: string;
};

export function resolveAuthRuntimeConfig(env: AuthRuntimeEnv) {
  return {
    secret: env.BETTER_AUTH_SECRET?.trim() || env.SECRET_KEY?.trim(),
    baseURL: env.BETTER_AUTH_URL?.trim() || env.PUBLIC_URL?.trim(),
  };
}
