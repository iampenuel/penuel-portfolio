export type PolishMode = 'clearer' | 'polished' | 'shorter';

export interface PolishRequest {
  message: string;
  mode: PolishMode;
  visitorId: string;
}

export interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface AiBinding {
  run(model: string, input: Record<string, unknown>): Promise<unknown>;
}

export interface Env {
  AI: AiBinding;
  USAGE_GUARD: DurableObjectNamespace;
  VISITOR_RATE_LIMITER: RateLimitBinding;
  GLOBAL_RATE_LIMITER: RateLimitBinding;
  AI_POLISH_ENABLED: string;
  RATE_LIMIT_SALT: string;
  ADMIN_USAGE_TOKEN: string;
}

export interface UsageReservation {
  ok: true;
  day: string;
  hour: string;
}

export interface UsageRejection {
  ok: false;
  code: 'RATE_LIMITED' | 'DAILY_LIMIT_REACHED';
}

export type UsageDecision = UsageReservation | UsageRejection;

export interface UsageSnapshot {
  visitorMinute?: number;
  globalMinute?: number;
  visitorHour: number;
  visitorDay: number;
  globalDay: number;
}
