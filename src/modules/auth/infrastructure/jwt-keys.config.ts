export interface JwtKeysConfig {
  readonly privateKeyPath: string;
  readonly publicKeyPath: string;
  readonly kid: string;
  readonly issuer: string;
  readonly audience: string;
}

export const JWT_KEYS_CONFIG = Symbol('JWT_KEYS_CONFIG');
