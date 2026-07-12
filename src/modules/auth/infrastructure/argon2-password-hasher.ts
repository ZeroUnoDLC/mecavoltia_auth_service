import { Injectable } from '@nestjs/common';
import { hash, verify, Algorithm } from '@node-rs/argon2';
import type { PasswordHasherPort } from '../domain/ports/password-hasher.port';

// Parámetros según recomendación OWASP para argon2id
const ARGON2_OPTIONS = {
  algorithm: Algorithm.Argon2id,
  memoryCost: 19456, // KiB (19 MiB)
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
  async hash(plain: string): Promise<string> {
    return await hash(plain, ARGON2_OPTIONS);
  }

  async verify(hashValue: string, plain: string): Promise<boolean> {
    try {
      return await verify(hashValue, plain);
    } catch {
      return false;
    }
  }
}
