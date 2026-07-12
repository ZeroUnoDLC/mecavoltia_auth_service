export interface User {
  readonly id: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly displayName: string;
}
