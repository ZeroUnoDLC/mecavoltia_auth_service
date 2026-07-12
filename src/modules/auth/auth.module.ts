import { Module } from '@nestjs/common';
import { PrismaService } from '../../shared/infrastructure/prisma.service';
import { loadConfig } from '../../config/configuration';
import { USER_REPOSITORY } from './domain/ports/user.repository.port';
import { REFRESH_SESSION_REPOSITORY } from './domain/ports/refresh-session.repository.port';
import { PASSWORD_HASHER } from './domain/ports/password-hasher.port';
import { TOKEN_SIGNER } from './domain/ports/token-signer.port';
import { LOGIN_ATTEMPT_TRACKER } from './domain/ports/login-attempt-tracker.port';
import { AUTH_TOKENS_CONFIG } from './application/auth-tokens.config';
import { LoginUseCase } from './application/login.use-case';
import { RefreshTokensUseCase } from './application/refresh-tokens.use-case';
import { LogoutUseCase } from './application/logout.use-case';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { PrismaRefreshSessionRepository } from './infrastructure/prisma-refresh-session.repository';
import { Argon2PasswordHasher } from './infrastructure/argon2-password-hasher';
import { JoseTokenSigner } from './infrastructure/jose-token-signer';
import { JWT_KEYS_CONFIG } from './infrastructure/jwt-keys.config';
import { InMemoryLoginAttemptTracker } from './infrastructure/in-memory-login-attempt.tracker';
import { AuthController } from './presentation/auth.controller';
import { JwksController } from './presentation/jwks.controller';

const config = loadConfig();

@Module({
  controllers: [AuthController, JwksController],
  providers: [
    PrismaService,
    LoginUseCase,
    RefreshTokensUseCase,
    LogoutUseCase,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: REFRESH_SESSION_REPOSITORY, useClass: PrismaRefreshSessionRepository },
    { provide: PASSWORD_HASHER, useClass: Argon2PasswordHasher },
    { provide: TOKEN_SIGNER, useClass: JoseTokenSigner },
    { provide: LOGIN_ATTEMPT_TRACKER, useClass: InMemoryLoginAttemptTracker },
    { provide: AUTH_TOKENS_CONFIG, useValue: config.tokens },
    {
      provide: JWT_KEYS_CONFIG,
      useValue: {
        privateKeyPath: config.jwt.privateKeyPath,
        publicKeyPath: config.jwt.publicKeyPath,
        kid: config.jwt.kid,
        issuer: config.jwt.issuer,
        audience: config.jwt.audience,
      },
    },
  ],
})
export class AuthModule {}
