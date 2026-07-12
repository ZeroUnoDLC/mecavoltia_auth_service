import { Injectable } from '@nestjs/common';
import type { User } from '../domain/entities/user.entity';
import type { UserRepositoryPort } from '../domain/ports/user.repository.port';
import { PrismaService } from '../../../shared/infrastructure/prisma.service';

@Injectable()
export class PrismaUserRepository implements UserRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user === null ? null : this.toDomain(user);
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user === null ? null : this.toDomain(user);
  }

  private toDomain(user: { id: string; email: string; passwordHash: string; displayName: string }): User {
    return {
      id: user.id,
      email: user.email,
      passwordHash: user.passwordHash,
      displayName: user.displayName,
    };
  }
}
