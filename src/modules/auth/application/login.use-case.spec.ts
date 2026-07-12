import { LoginUseCase } from './login.use-case';
import { InvalidCredentialsError, TooManyLoginAttemptsError } from '../domain/errors/auth.errors';
import {
  FakeLoginAttemptTracker,
  FakePasswordHasher,
  FakeTokenSigner,
  InMemoryRefreshSessionRepository,
  InMemoryUserRepository,
  testUser,
} from '../testing/fakes';

describe('LoginUseCase', () => {
  const config = { accessTokenTtlSeconds: 900, refreshTokenTtlSeconds: 604800 };

  function build() {
    const users = new InMemoryUserRepository();
    const sessions = new InMemoryRefreshSessionRepository();
    const tracker = new FakeLoginAttemptTracker();
    const useCase = new LoginUseCase(
      users,
      sessions,
      new FakePasswordHasher(),
      new FakeTokenSigner(),
      tracker,
      config,
    );
    return { users, sessions, tracker, useCase };
  }

  it('returns tokens and persists a refresh session on valid credentials', async () => {
    const { users, sessions, useCase } = build();
    users.add(testUser());

    const result = await useCase.execute({ email: 'brayan@mecavoltia.com', password: 'correct-password' });

    expect(result.accessToken).toBe('access-token:user-1');
    expect(result.refreshToken).toHaveLength(43); // 32 bytes base64url
    expect(result.expiresInSeconds).toBe(900);
    expect(result.user).toEqual({ id: 'user-1', email: 'brayan@mecavoltia.com', displayName: 'Brayan de la Cruz' });

    expect(sessions.sessions).toHaveLength(1);
    const session = sessions.sessions[0];
    expect(session?.userId).toBe('user-1');
    expect(session?.tokenHash).not.toBe(result.refreshToken); // solo se guarda el hash
    expect(session?.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('throws InvalidCredentialsError for an unknown email', async () => {
    const { useCase } = build();

    await expect(
      useCase.execute({ email: 'nadie@mecavoltia.com', password: 'whatever' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('throws the same InvalidCredentialsError for a wrong password (no user enumeration)', async () => {
    const { users, useCase } = build();
    users.add(testUser());

    await expect(
      useCase.execute({ email: 'brayan@mecavoltia.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('registers the failure on wrong password and resets the counter on success', async () => {
    const { users, tracker, useCase } = build();
    users.add(testUser());

    await expect(
      useCase.execute({ email: 'brayan@mecavoltia.com', password: 'wrong-password' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(tracker.failures.get('brayan@mecavoltia.com')).toBe(1);

    await useCase.execute({ email: 'brayan@mecavoltia.com', password: 'correct-password' });
    expect(tracker.failures.has('brayan@mecavoltia.com')).toBe(false);
  });

  it('rejects blocked emails without touching credentials', async () => {
    const { users, tracker, useCase } = build();
    users.add(testUser());
    tracker.blockedEmails.add('brayan@mecavoltia.com');

    await expect(
      useCase.execute({ email: 'brayan@mecavoltia.com', password: 'correct-password' }),
    ).rejects.toBeInstanceOf(TooManyLoginAttemptsError);
  });
});
