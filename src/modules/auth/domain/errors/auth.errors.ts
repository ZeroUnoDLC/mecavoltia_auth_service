import { DomainError } from '../../../../shared/domain/domain-error';

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid credentials');
  }
}

export class TooManyLoginAttemptsError extends DomainError {
  readonly code = 'TOO_MANY_LOGIN_ATTEMPTS';

  constructor() {
    super('Too many failed login attempts, try again later');
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';

  constructor() {
    super('Invalid or expired refresh token');
  }
}

export class RefreshTokenReusedError extends DomainError {
  readonly code = 'REFRESH_TOKEN_REUSED';

  constructor() {
    super('Refresh token reuse detected, session family revoked');
  }
}
