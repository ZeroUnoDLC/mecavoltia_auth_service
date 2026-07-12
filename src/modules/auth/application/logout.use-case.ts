import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_SESSION_REPOSITORY,
  type RefreshSessionRepositoryPort,
} from '../domain/ports/refresh-session.repository.port';
import { hashRefreshToken } from './refresh-token.factory';

export interface LogoutCommand {
  readonly refreshToken: string;
}

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_SESSION_REPOSITORY) private readonly sessions: RefreshSessionRepositoryPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const session = await this.sessions.findByTokenHash(hashRefreshToken(command.refreshToken));
    if (session !== null) {
      await this.sessions.revokeFamily(session.familyId, new Date());
    }
  }
}
