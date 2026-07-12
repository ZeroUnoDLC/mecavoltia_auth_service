import { Inject, Injectable } from '@nestjs/common';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../domain/errors/auth.errors';
import { USER_REPOSITORY, type UserRepositoryPort } from '../domain/ports/user.repository.port';
import {
  REFRESH_SESSION_REPOSITORY,
  type RefreshSessionRepositoryPort,
} from '../domain/ports/refresh-session.repository.port';
import { TOKEN_SIGNER, type TokenSignerPort } from '../domain/ports/token-signer.port';
import { AUTH_TOKENS_CONFIG, type AuthTokensConfig } from './auth-tokens.config';
import type { AuthTokensResult } from './login.use-case';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.factory';

export interface RefreshCommand {
  readonly refreshToken: string;
}

@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepositoryPort,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort,
    @Inject(AUTH_TOKENS_CONFIG) private readonly config: AuthTokensConfig,
  ) {}

  async execute(command: RefreshCommand): Promise<AuthTokensResult> {
    const now = new Date();
    const session = await this.sessions.findByTokenHash(hashRefreshToken(command.refreshToken));

    if (session === null) {
      throw new InvalidRefreshTokenError();
    }
    if (session.usedAt !== null) {
      // Reuso: alguien presenta un token ya rotado. Se quema la familia entera.
      await this.sessions.revokeFamily(session.familyId, now);
      throw new RefreshTokenReusedError();
    }
    if (session.revokedAt !== null || session.expiresAt.getTime() <= now.getTime()) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.users.findById(session.userId);
    if (user === null) {
      throw new InvalidRefreshTokenError();
    }

    await this.sessions.markUsed(session.id, now);
    const refresh = generateRefreshToken();
    await this.sessions.create({
      familyId: session.familyId,
      tokenHash: refresh.tokenHash,
      userId: user.id,
      expiresAt: new Date(now.getTime() + this.config.refreshTokenTtlSeconds * 1000),
    });

    return {
      accessToken: await this.signer.signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: refresh.token,
      expiresInSeconds: this.config.accessTokenTtlSeconds,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    };
  }
}
