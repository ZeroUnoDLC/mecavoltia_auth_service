export interface AuthTokensConfig {
  readonly accessTokenTtlSeconds: number;
  readonly refreshTokenTtlSeconds: number;
}

export const AUTH_TOKENS_CONFIG = Symbol('AUTH_TOKENS_CONFIG');
