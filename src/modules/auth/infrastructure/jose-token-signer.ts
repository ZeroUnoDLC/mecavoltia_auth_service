import { readFileSync } from 'node:fs';
import { Inject, Injectable } from '@nestjs/common';
import { SignJWT, exportJWK, importSPKI, importPKCS8, jwtVerify, type KeyLike } from 'jose';
import type { AccessTokenClaims, PublicJwks, TokenSignerPort } from '../domain/ports/token-signer.port';
import { AUTH_TOKENS_CONFIG, type AuthTokensConfig } from '../application/auth-tokens.config';
import { JWT_KEYS_CONFIG, type JwtKeysConfig } from './jwt-keys.config';

const ALG = 'RS256';

@Injectable()
export class JoseTokenSigner implements TokenSignerPort {
  private privateKey: KeyLike | null = null;
  private publicKey: KeyLike | null = null;
  private jwks: PublicJwks | null = null;

  constructor(
    @Inject(JWT_KEYS_CONFIG) private readonly keys: JwtKeysConfig,
    @Inject(AUTH_TOKENS_CONFIG) private readonly tokens: AuthTokensConfig,
  ) {}

  async signAccessToken(claims: AccessTokenClaims): Promise<string> {
    const key = await this.getPrivateKey();
    return await new SignJWT({ email: claims.email })
      .setProtectedHeader({ alg: ALG, kid: this.keys.kid })
      .setSubject(claims.sub)
      .setIssuer(this.keys.issuer)
      .setAudience(this.keys.audience)
      .setIssuedAt()
      .setExpirationTime(`${this.tokens.accessTokenTtlSeconds}s`)
      .sign(key);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const key = await this.getPublicKey();
    const { payload } = await jwtVerify(token, key, {
      issuer: this.keys.issuer,
      audience: this.keys.audience,
    });
    if (typeof payload.sub !== 'string' || typeof payload['email'] !== 'string') {
      throw new Error('Access token payload is missing required claims');
    }
    return { sub: payload.sub, email: payload['email'] };
  }

  async getPublicJwks(): Promise<PublicJwks> {
    if (this.jwks === null) {
      const jwk = await exportJWK(await this.getPublicKey());
      this.jwks = { keys: [{ ...jwk, alg: ALG, use: 'sig', kid: this.keys.kid }] };
    }
    return this.jwks;
  }

  private async getPrivateKey(): Promise<KeyLike> {
    if (this.privateKey === null) {
      this.privateKey = await importPKCS8(readFileSync(this.keys.privateKeyPath, 'utf8'), ALG);
    }
    return this.privateKey;
  }

  private async getPublicKey(): Promise<KeyLike> {
    if (this.publicKey === null) {
      this.publicKey = await importSPKI(readFileSync(this.keys.publicKeyPath, 'utf8'), ALG);
    }
    return this.publicKey;
  }
}
