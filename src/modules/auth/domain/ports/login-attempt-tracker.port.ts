export interface LoginAttemptTrackerPort {
  isBlocked(email: string): Promise<boolean>;
  registerFailure(email: string): Promise<void>;
  reset(email: string): Promise<void>;
}

export const LOGIN_ATTEMPT_TRACKER = Symbol('LOGIN_ATTEMPT_TRACKER');
