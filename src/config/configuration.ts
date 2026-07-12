export interface AppConfig {
  readonly port: number;
  readonly jwt: {
    readonly privateKeyPath: string;
    readonly publicKeyPath: string;
    readonly kid: string;
    readonly issuer: string;
    readonly audience: string;
  };
  readonly tokens: {
    readonly accessTokenTtlSeconds: number;
    readonly refreshTokenTtlSeconds: number;
  };
}

function required(name: string): string {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function numberWithDefault(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${name} must be a positive integer, got: ${raw}`);
  }
  return parsed;
}

// Fail-fast: si falta configuración el servicio no arranca.
export function loadConfig(): AppConfig {
  return {
    port: numberWithDefault('PORT', 3000),
    jwt: {
      privateKeyPath: required('JWT_PRIVATE_KEY_PATH'),
      publicKeyPath: required('JWT_PUBLIC_KEY_PATH'),
      kid: required('JWT_KID'),
      issuer: process.env['JWT_ISSUER'] ?? 'https://mecavoltia.com',
      audience: process.env['JWT_AUDIENCE'] ?? 'mecavoltia',
    },
    tokens: {
      accessTokenTtlSeconds: numberWithDefault('ACCESS_TOKEN_TTL_SECONDS', 900),
      refreshTokenTtlSeconds: numberWithDefault('REFRESH_TOKEN_TTL_SECONDS', 604800),
    },
  };
}
