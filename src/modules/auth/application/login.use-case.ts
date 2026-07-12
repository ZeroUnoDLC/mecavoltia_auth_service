import { Inject, Injectable } from '@nestjs/common';
import { InvalidCredentialsError, TooManyLoginAttemptsError } from '../domain/errors/auth.errors';
import { USER_REPOSITORY, type UserRepositoryPort } from '../domain/ports/user.repository.port';
import {
  REFRESH_SESSION_REPOSITORY,
  type RefreshSessionRepositoryPort,
} from '../domain/ports/refresh-session.repository.port';
import { PASSWORD_HASHER, type PasswordHasherPort } from '../domain/ports/password-hasher.port';
import { TOKEN_SIGNER, type TokenSignerPort } from '../domain/ports/token-signer.port';
import {
  LOGIN_ATTEMPT_TRACKER,
  type LoginAttemptTrackerPort,
} from '../domain/ports/login-attempt-tracker.port';
import { AUTH_TOKENS_CONFIG, type AuthTokensConfig } from './auth-tokens.config';
import { generateRefreshToken, newFamilyId } from './refresh-token.factory';

export interface LoginCommand {
  readonly email: string;
  readonly password: string;
}

export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
}

export interface AuthTokensResult {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresInSeconds: number;
  readonly user: AuthenticatedUser;
}

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepositoryPort,
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepositoryPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort,
    @Inject(LOGIN_ATTEMPT_TRACKER) private readonly attempts: LoginAttemptTrackerPort,
    @Inject(AUTH_TOKENS_CONFIG) private readonly config: AuthTokensConfig,
  ) {}

  async execute(command: LoginCommand): Promise<AuthTokensResult> {
    if (await this.attempts.isBlocked(command.email)) {
      throw new TooManyLoginAttemptsError();
    }

    const user = await this.users.findByEmail(command.email);
    const passwordOk = user !== null && (await this.hasher.verify(user.passwordHash, command.password));

    if (user === null || !passwordOk) {
      await this.attempts.registerFailure(command.email);
      throw new InvalidCredentialsError();
    }

    await this.attempts.reset(command.email);

    const refresh = generateRefreshToken();
    await this.sessions.create({
      familyId: newFamilyId(),
      tokenHash: refresh.tokenHash,
      userId: user.id,
      expiresAt: new Date(Date.now() + this.config.refreshTokenTtlSeconds * 1000),
    });

    return {
      accessToken: await this.signer.signAccessToken({ sub: user.id, email: user.email }),
      refreshToken: refresh.token,
      expiresInSeconds: this.config.accessTokenTtlSeconds,
      user: { id: user.id, email: user.email, displayName: user.displayName },
    };
  }
}
