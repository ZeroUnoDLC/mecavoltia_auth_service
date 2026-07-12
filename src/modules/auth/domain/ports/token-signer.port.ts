export interface AccessTokenClaims {
  readonly sub: string;
  readonly email: string;
}

export interface PublicJwks {
  readonly keys: readonly Record<string, unknown>[];
}

export interface TokenSignerPort {
  signAccessToken(claims: AccessTokenClaims): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
  getPublicJwks(): Promise<PublicJwks>;
}

export const TOKEN_SIGNER = Symbol('TOKEN_SIGNER');
