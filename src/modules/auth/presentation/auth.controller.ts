import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { LoginUseCase, type AuthTokensResult } from '../application/login.use-case';
import { RefreshTokensUseCase } from '../application/refresh-tokens.use-case';
import { LogoutUseCase } from '../application/logout.use-case';
import { LoginDto } from './dtos/login.dto';
import { RefreshDto } from './dtos/refresh.dto';
import { AccessTokenGuard, type AuthenticatedRequest } from './guards/access-token.guard';

@Controller()
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshTokensUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthTokensResult> {
    return await this.loginUseCase.execute({ email: dto.email, password: dto.password });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshDto): Promise<AuthTokensResult> {
    return await this.refreshUseCase.execute({ refreshToken: dto.refreshToken });
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto): Promise<void> {
    await this.logoutUseCase.execute({ refreshToken: dto.refreshToken });
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  me(@Req() request: AuthenticatedRequest): { id: string; email: string } {
    return { id: request.auth.sub, email: request.auth.email };
  }
}
