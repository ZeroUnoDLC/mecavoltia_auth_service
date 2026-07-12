import { Catch, HttpStatus, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { DomainError } from '../domain/domain-error';

const STATUS_BY_CODE: Record<string, HttpStatus> = {
  INVALID_CREDENTIALS: HttpStatus.UNAUTHORIZED,
  INVALID_REFRESH_TOKEN: HttpStatus.UNAUTHORIZED,
  REFRESH_TOKEN_REUSED: HttpStatus.UNAUTHORIZED,
  TOO_MANY_LOGIN_ATTEMPTS: HttpStatus.TOO_MANY_REQUESTS,
};

@Catch(DomainError)
export class DomainErrorFilter implements ExceptionFilter<DomainError> {
  catch(exception: DomainError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = STATUS_BY_CODE[exception.code] ?? HttpStatus.UNPROCESSABLE_ENTITY;

    response.status(status).json({
      statusCode: status,
      code: exception.code,
      message: exception.message,
    });
  }
}
