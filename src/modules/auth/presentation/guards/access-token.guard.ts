import {
  Inject,
  Injectable,
  UnauthorizedException,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  TOKEN_SIGNER,
  type AccessTokenClaims,
  type TokenSignerPort,
} from '../../domain/ports/token-signer.port';

export interface AuthenticatedRequest extends Request {
  auth: AccessTokenClaims;
}

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(@Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;

    if (header === undefined || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException();
    }

    try {
      request.auth = await this.signer.verifyAccessToken(header.slice('Bearer '.length));
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }
}
