import { Controller, Get, Inject } from '@nestjs/common';
import { TOKEN_SIGNER, type PublicJwks, type TokenSignerPort } from '../domain/ports/token-signer.port';

@Controller('.well-known')
export class JwksController {
  constructor(@Inject(TOKEN_SIGNER) private readonly signer: TokenSignerPort) {}

  @Get('jwks.json')
  async jwks(): Promise<PublicJwks> {
    return await this.signer.getPublicJwks();
  }
}
