import { Injectable } from '@nestjs/common';
import type { LoginAttemptTrackerPort } from '../domain/ports/login-attempt-tracker.port';

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;

// Suficiente para una sola instancia con 3 usuarios. Si el servicio escala
// horizontalmente, reemplazar por un adapter respaldado en Postgres/Redis.
@Injectable()
export class InMemoryLoginAttemptTracker implements LoginAttemptTrackerPort {
  private readonly failures = new Map<string, number[]>();

  isBlocked(email: string): Promise<boolean> {
    return Promise.resolve(this.recentFailures(email).length >= MAX_FAILURES);
  }

  registerFailure(email: string): Promise<void> {
    const recent = this.recentFailures(email);
    recent.push(Date.now());
    this.failures.set(email, recent);
    return Promise.resolve();
  }

  reset(email: string): Promise<void> {
    this.failures.delete(email);
    return Promise.resolve();
  }

  private recentFailures(email: string): number[] {
    const cutoff = Date.now() - WINDOW_MS;
    return (this.failures.get(email) ?? []).filter((at) => at > cutoff);
  }
}
