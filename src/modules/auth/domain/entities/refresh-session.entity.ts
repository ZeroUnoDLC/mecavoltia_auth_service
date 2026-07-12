export interface RefreshSession {
  readonly id: string;
  readonly familyId: string;
  readonly tokenHash: string;
  readonly userId: string;
  readonly expiresAt: Date;
  readonly usedAt: Date | null;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

export interface NewRefreshSession {
  readonly familyId: string;
  readonly tokenHash: string;
  readonly userId: string;
  readonly expiresAt: Date;
}
