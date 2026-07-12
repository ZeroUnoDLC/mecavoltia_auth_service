import { Injectable } from '@nestjs/common';
import type { NewRefreshSession, RefreshSession } from '../domain/entities/refresh-session.entity';
import type { RefreshSessionRepositoryPort } from '../domain/ports/refresh-session.repository.port';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';

@Injectable()
export class PrismaRefreshSessionRepository implements RefreshSessionRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(session: NewRefreshSession): Promise<RefreshSession> {
    return await this.prisma.refreshSession.create({
      data: {
        familyId: session.familyId,
        tokenHash: session.tokenHash,
        userId: session.userId,
        expiresAt: session.expiresAt,
      },
    });
  }

  async findByTokenHash(tokenHash: string): Promise<RefreshSession | null> {
    return await this.prisma.refreshSession.findUnique({ where: { tokenHash } });
  }

  async markUsed(id: string, at: Date): Promise<void> {
    await this.prisma.refreshSession.update({ where: { id }, data: { usedAt: at } });
  }

  async revokeFamily(familyId: string, at: Date): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: at },
    });
  }
}
