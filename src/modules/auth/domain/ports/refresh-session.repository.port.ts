import type { NewRefreshSession, RefreshSession } from '../entities/refresh-session.entity';

export interface RefreshSessionRepositoryPort {
  create(session: NewRefreshSession): Promise<RefreshSession>;
  findByTokenHash(tokenHash: string): Promise<RefreshSession | null>;
  markUsed(id: string, at: Date): Promise<void>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
}

export const REFRESH_SESSION_REPOSITORY = Symbol('REFRESH_SESSION_REPOSITORY');
