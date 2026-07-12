import { createHash, randomBytes, randomUUID } from 'node:crypto';

export interface GeneratedRefreshToken {
  readonly token: string;
  readonly tokenHash: string;
}

// El refresh token es opaco (no JWT): al cliente viaja el valor aleatorio,
// en la DB solo se persiste su hash.
export function generateRefreshToken(): GeneratedRefreshToken {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function newFamilyId(): string {
  return randomUUID();
}
