import { UNSAFE_REFUSAL_TOKEN } from './prompts';
import type { PolishMode, PolishRequest } from './types';

export const MAX_BODY_BYTES = 8 * 1024;
export const MAX_MESSAGE_LENGTH = 2_000;
export const ALLOWED_MODES = ['clearer', 'polished', 'shorter'] as const;
export const VISITOR_ID_PATTERN = /^pv_[A-Za-z0-9_-]{32}$/;

export type ValidationErrorCode =
  | 'INVALID_REQUEST'
  | 'MESSAGE_TOO_SHORT'
  | 'MESSAGE_TOO_LONG'
  | 'INVALID_MODE';

export type ValidationResult =
  | { ok: true; value: PolishRequest }
  | { ok: false; code: ValidationErrorCode };

export type ModelResponseResult =
  | { ok: true; suggestion: string }
  | { ok: false; code: 'UNSAFE_POLISH_REQUEST' | 'INVALID_MODEL_RESPONSE' };

export function isAllowedOrigin(origin: string | null, allowedOrigins: ReadonlySet<string>) {
  return Boolean(origin && allowedOrigins.has(origin));
}

export function isValidVisitorId(value: unknown): value is string {
  return typeof value === 'string' && VISITOR_ID_PATTERN.test(value);
}

export function validatePolishPayload(input: unknown): ValidationResult {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return { ok: false, code: 'INVALID_REQUEST' };
  }

  const payload = input as Record<string, unknown>;
  const keys = Object.keys(payload);
  const allowedKeys = new Set(['message', 'mode', 'visitorId']);
  if (keys.length !== 3 || keys.some((key) => !allowedKeys.has(key))) {
    return { ok: false, code: 'INVALID_REQUEST' };
  }

  if (typeof payload.message !== 'string') return { ok: false, code: 'INVALID_REQUEST' };
  const message = payload.message.trim();
  if (message.length < 10) return { ok: false, code: 'MESSAGE_TOO_SHORT' };
  if (message.length > MAX_MESSAGE_LENGTH) return { ok: false, code: 'MESSAGE_TOO_LONG' };

  if (typeof payload.mode !== 'string' || !ALLOWED_MODES.includes(payload.mode as PolishMode)) {
    return { ok: false, code: 'INVALID_MODE' };
  }

  if (!isValidVisitorId(payload.visitorId)) return { ok: false, code: 'INVALID_REQUEST' };

  return {
    ok: true,
    value: {
      message,
      mode: payload.mode as PolishMode,
      visitorId: payload.visitorId
    }
  };
}

export function looksLikeUnsafePolishRequest(message: string) {
  const normalized = message.toLowerCase();
  const unsafePatterns = [
    /\b(?:help me|make this|rewrite this|polish this).{0,36}\b(?:threat|blackmail|extort|coerce)\b/,
    /\b(?:pretend|impersonat\w*)\b.{0,32}\b(?:bank|government|police|employer|another person)\b/,
    /\b(?:phish\w*|steal).{0,24}\b(?:password|credential|login|account)\b/,
    /\b(?:exploit|groom).{0,24}\b(?:minor|child)\b/,
    /\b(?:hurt|kill|attack)\b.{0,24}\b(?:you|them|him|her|their family)\b/
  ];
  return unsafePatterns.some((pattern) => pattern.test(normalized));
}

function extractModelText(output: unknown): string | null {
  if (!output || typeof output !== 'object') return null;
  const record = output as Record<string, unknown>;
  if (typeof record.response === 'string') return record.response;

  if (Array.isArray(record.choices) && record.choices.length === 1) {
    const choice = record.choices[0];
    if (!choice || typeof choice !== 'object') return null;
    const message = (choice as Record<string, unknown>).message;
    if (!message || typeof message !== 'object') return null;
    const content = (message as Record<string, unknown>).content;
    return typeof content === 'string' ? content : null;
  }
  return null;
}

export function validateModelResponse(output: unknown): ModelResponseResult {
  const extracted = extractModelText(output);
  if (extracted === null) return { ok: false, code: 'INVALID_MODEL_RESPONSE' };
  const suggestion = extracted.trim();

  if (suggestion === UNSAFE_REFUSAL_TOKEN) return { ok: false, code: 'UNSAFE_POLISH_REQUEST' };
  if (!suggestion || suggestion.length > MAX_MESSAGE_LENGTH) return { ok: false, code: 'INVALID_MODEL_RESPONSE' };
  if (suggestion.includes('```') || /<\/?think>/i.test(suggestion)) return { ok: false, code: 'INVALID_MODEL_RESPONSE' };
  if (/^(?:here(?:'s| is)|revised message|rewritten message|sure[,!:])/i.test(suggestion)) {
    return { ok: false, code: 'INVALID_MODEL_RESPONSE' };
  }

  return { ok: true, suggestion };
}
