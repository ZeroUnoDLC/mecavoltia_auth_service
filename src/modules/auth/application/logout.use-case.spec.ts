import { LogoutUseCase } from './logout.use-case';
import { hashRefreshToken } from './refresh-token.factory';
import { InMemoryRefreshSessionRepository } from '../testing/fakes';

describe('LogoutUseCase', () => {
  it('revokes the whole session family of the presented refresh token', async () => {
    const sessions = new InMemoryRefreshSessionRepository();
    sessions.seed({
      familyId: 'family-1',
      tokenHash: hashRefreshToken('current-refresh'),
      userId: 'user-1',
      expiresAt: new Date(Date.now() + 1000 * 60),
      usedAt: null,
      revokedAt: null,
    });
    const useCase = new LogoutUseCase(sessions);

    await useCase.execute({ refreshToken: 'current-refresh' });

    expect(sessions.sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });

  it('is idempotent: an unknown token does not throw', async () => {
    const useCase = new LogoutUseCase(new InMemoryRefreshSessionRepository());

    await expect(useCase.execute({ refreshToken: 'ghost' })).resolves.toBeUndefined();
  });
});
