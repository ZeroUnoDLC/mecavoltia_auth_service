import { randomUUID } from 'node:crypto';
import type { User } from '../domain/entities/user.entity';
import type { NewRefreshSession, RefreshSession } from '../domain/entities/refresh-session.entity';
import type { UserRepositoryPort } from '../domain/ports/user.repository.port';
import type { RefreshSessionRepositoryPort } from '../domain/ports/refresh-session.repository.port';
import type { PasswordHasherPort } from '../domain/ports/password-hasher.port';
import type { AccessTokenClaims, PublicJwks, TokenSignerPort } from '../domain/ports/token-signer.port';
import type { LoginAttemptTrackerPort } from '../domain/ports/login-attempt-tracker.port';

export class InMemoryUserRepository implements UserRepositoryPort {
  private readonly users: User[] = [];

  add(user: User): void {
    this.users.push(user);
  }

  findByEmail(email: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.email === email) ?? null);
  }

  findById(id: string): Promise<User | null> {
    return Promise.resolve(this.users.find((u) => u.id === id) ?? null);
  }
}

interface MutableSession {
  id: string;
  familyId: string;
  tokenHash: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  revokedAt: Date | null;
  createdAt: Date;
}

export class InMemoryRefreshSessionRepository implements RefreshSessionRepositoryPort {
  readonly sessions: MutableSession[] = [];

  seed(session: Omit<MutableSession, 'id' | 'createdAt'>): RefreshSession {
    const stored: MutableSession = { ...session, id: randomUUID(), createdAt: new Date() };
    this.sessions.push(stored);
    return { ...stored };
  }

  create(session: NewRefreshSession): Promise<RefreshSession> {
    const stored: MutableSession = {
      ...session,
      id: randomUUID(),
      usedAt: null,
      revokedAt: null,
      createdAt: new Date(),
    };
    this.sessions.push(stored);
    return Promise.resolve({ ...stored });
  }

  findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    const found = this.sessions.find((s) => s.tokenHash === tokenHash);
    return Promise.resolve(found ? { ...found } : null);
  }

  markUsed(id: string, at: Date): Promise<void> {
    const session = this.sessions.find((s) => s.id === id);
    if (session) session.usedAt = at;
    return Promise.resolve();
  }

  revokeFamily(familyId: string, at: Date): Promise<void> {
    for (const session of this.sessions) {
      if (session.familyId === familyId && session.revokedAt === null) session.revokedAt = at;
    }
    return Promise.resolve();
  }
}

export class FakePasswordHasher implements PasswordHasherPort {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  verify(hash: string, plain: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}

export class FakeTokenSigner implements TokenSignerPort {
  signAccessToken(claims: AccessTokenClaims): Promise<string> {
    return Promise.resolve(`access-token:${claims.sub}`);
  }

  verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const sub = token.replace('access-token:', '');
    return Promise.resolve({ sub, email: `${sub}@test.dev` });
  }

  getPublicJwks(): Promise<PublicJwks> {
    return Promise.resolve({ keys: [] });
  }
}

export class FakeLoginAttemptTracker implements LoginAttemptTrackerPort {
  readonly failures = new Map<string, number>();
  blockedEmails = new Set<string>();

  isBlocked(email: string): Promise<boolean> {
    return Promise.resolve(this.blockedEmails.has(email));
  }

  registerFailure(email: string): Promise<void> {
    this.failures.set(email, (this.failures.get(email) ?? 0) + 1);
    return Promise.resolve();
  }

  reset(email: string): Promise<void> {
    this.failures.delete(email);
    return Promise.resolve();
  }
}

export function testUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'brayan@mecavoltia.com',
    passwordHash: 'hashed:correct-password',
    displayName: 'Brayan de la Cruz',
    ...overrides,
  };
}
