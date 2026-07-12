import { RefreshTokensUseCase } from './refresh-tokens.use-case';
import { InvalidRefreshTokenError, RefreshTokenReusedError } from '../domain/errors/auth.errors';
import { hashRefreshToken } from './refresh-token.factory';
import {
  FakeTokenSigner,
  InMemoryRefreshSessionRepository,
  InMemoryUserRepository,
  testUser,
} from '../testing/fakes';

describe('RefreshTokensUseCase', () => {
  const config = { accessTokenTtlSeconds: 900, refreshTokenTtlSeconds: 604800 };
  const inOneWeek = () => new Date(Date.now() + 7 * 24 * 3600 * 1000);

  function build() {
    const users = new InMemoryUserRepository();
    const sessions = new InMemoryRefreshSessionRepository();
    const useCase = new RefreshTokensUseCase(users, sessions, new FakeTokenSigner(), config);
    users.add(testUser());
    return { users, sessions, useCase };
  }

  function seedSession(
    sessions: InMemoryRefreshSessionRepository,
    token: string,
    overrides: Partial<{ expiresAt: Date; usedAt: Date | null; revokedAt: Date | null }> = {},
  ) {
    return sessions.seed({
      familyId: 'family-1',
      tokenHash: hashRefreshToken(token),
      userId: 'user-1',
      expiresAt: overrides.expiresAt ?? inOneWeek(),
      usedAt: overrides.usedAt ?? null,
      revokedAt: overrides.revokedAt ?? null,
    });
  }

  it('rotates the token: marks the old session used and creates a new one in the same family', async () => {
    const { sessions, useCase } = build();
    seedSession(sessions, 'valid-refresh');

    const result = await useCase.execute({ refreshToken: 'valid-refresh' });

    expect(result.accessToken).toBe('access-token:user-1');
    expect(result.refreshToken).not.toBe('valid-refresh');

    expect(sessions.sessions).toHaveLength(2);
    const [oldSession, newSession] = sessions.sessions;
    expect(oldSession?.usedAt).not.toBeNull();
    expect(newSession?.familyId).toBe('family-1');
    expect(newSession?.usedAt).toBeNull();
  });

  it('throws InvalidRefreshTokenError for an unknown token', async () => {
    const { useCase } = build();

    await expect(useCase.execute({ refreshToken: 'ghost' })).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('throws InvalidRefreshTokenError for an expired session', async () => {
    const { sessions, useCase } = build();
    seedSession(sessions, 'expired-refresh', { expiresAt: new Date(Date.now() - 1000) });

    await expect(useCase.execute({ refreshToken: 'expired-refresh' })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });

  it('detects reuse: a used token revokes the WHOLE family', async () => {
    const { sessions, useCase } = build();
    seedSession(sessions, 'stolen-refresh', { usedAt: new Date() });
    seedSession(sessions, 'newer-refresh'); // sesión viva de la misma familia

    await expect(useCase.execute({ refreshToken: 'stolen-refresh' })).rejects.toBeInstanceOf(
      RefreshTokenReusedError,
    );

    // Toda la familia quedó revocada, incluida la sesión que aún no se usaba
    expect(sessions.sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  it('rejects a revoked session', async () => {
    const { sessions, useCase } = build();
    seedSession(sessions, 'revoked-refresh', { revokedAt: new Date() });

    await expect(useCase.execute({ refreshToken: 'revoked-refresh' })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
  });
});
