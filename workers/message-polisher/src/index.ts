import { buildUserInstruction, SYSTEM_INSTRUCTION } from './prompts';
import { GLOBAL_DAILY_LIMIT, UsageGuard, utcKeys } from './usage-guard';
import {
  MAX_BODY_BYTES,
  isAllowedOrigin,
  looksLikeUnsafePolishRequest,
  validateModelResponse,
  validatePolishPayload
} from './validation';
import type { Env, UsageDecision, UsageReservation } from './types';

export { UsageGuard };

export const MODEL_IDENTIFIER = '@cf/google/gemma-4-26b-a4b-it';

export const ALLOWED_ORIGINS = new Set([
  'https://iampenuel.vercel.app',
  'https://penuel-portfolio.vercel.app',
  'http://localhost:4321',
  'http://127.0.0.1:4321',
  'http://localhost:4322',
  'http://127.0.0.1:4322',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
]);

const ERROR_STATUS: Record<string, number> = {
  INVALID_REQUEST: 400,
  MESSAGE_TOO_SHORT: 400,
  MESSAGE_TOO_LONG: 400,
  INVALID_MODE: 400,
  RATE_LIMITED: 429,
  DAILY_LIMIT_REACHED: 429,
  AI_POLISH_DISABLED: 503,
  AI_FREE_QUOTA_REACHED: 503,
  UNSAFE_POLISH_REQUEST: 422,
  MODEL_UNAVAILABLE: 503,
  INVALID_MODEL_RESPONSE: 502,
  SERVER_ERROR: 500
};

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin'
  };
}

function json(data: unknown, status = 200, origin?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  };
  if (origin) Object.assign(headers, corsHeaders(origin));
  return new Response(JSON.stringify(data), { status, headers });
}

function error(code: string, origin?: string) {
  return json({ ok: false, code }, ERROR_STATUS[code] ?? 500, origin);
}

function constantTimeEqual(left: string, right: string) {
  const encoder = new TextEncoder();
  const leftBytes = encoder.encode(left);
  const rightBytes = encoder.encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

async function hashVisitorId(visitorId: string, salt: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', encoder.encode(salt), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(visitorId));
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function usageStub(env: Env) {
  return env.USAGE_GUARD.get(env.USAGE_GUARD.idFromName('global'));
}

async function reserveUsage(env: Env, visitorHash: string): Promise<UsageDecision> {
  const response = await usageStub(env).fetch('https://usage.internal/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorHash, timestamp: new Date().toISOString() })
  });
  if (!response.ok) throw new Error('Usage guard unavailable');
  return response.json<UsageDecision>();
}

async function releaseUsage(env: Env, visitorHash: string, reservation: UsageReservation) {
  await usageStub(env).fetch('https://usage.internal/release', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitorHash, timestamp: new Date().toISOString(), day: reservation.day, hour: reservation.hour })
  });
}

function isFreeQuotaError(caught: unknown) {
  if (!(caught instanceof Error)) return false;
  return /(?:free|daily|neuron|quota).{0,40}(?:quota|allocation|limit|exceed)|(?:quota|allocation|limit|exceed).{0,40}(?:free|daily|neuron)/i.test(caught.message);
}

async function handleAdminUsage(request: Request, env: Env) {
  const authorization = request.headers.get('Authorization');
  const expected = env.ADMIN_USAGE_TOKEN ? `Bearer ${env.ADMIN_USAGE_TOKEN}` : '';
  if (!authorization || !expected || !constantTimeEqual(authorization, expected)) {
    return json({ ok: false, code: 'UNAUTHORIZED' }, 401);
  }

  const { day } = utcKeys(new Date());
  const response = await usageStub(env).fetch(`https://usage.internal/usage?date=${encodeURIComponent(day)}`);
  if (!response.ok) return error('SERVER_ERROR');
  const usage = await response.json<{ currentCount: number }>();
  return json({
    utcDate: day,
    currentGlobalRequestCount: usage.currentCount,
    configuredDailyLimit: GLOBAL_DAILY_LIMIT,
    percentageUsed: Math.min(100, Number(((usage.currentCount / GLOBAL_DAILY_LIMIT) * 100).toFixed(1))),
    aiPolishingEnabled: env.AI_POLISH_ENABLED === 'true',
    modelIdentifier: MODEL_IDENTIFIER
  });
}

async function handlePolish(request: Request, env: Env, origin: string) {
  const contentType = request.headers.get('Content-Type')?.split(';', 1)[0].trim().toLowerCase();
  if (contentType !== 'application/json') return error('INVALID_REQUEST', origin);

  const declaredLength = Number(request.headers.get('Content-Length') ?? 0);
  if (declaredLength > MAX_BODY_BYTES) return error('INVALID_REQUEST', origin);

  const bytes = await request.arrayBuffer();
  if (bytes.byteLength > MAX_BODY_BYTES) return error('INVALID_REQUEST', origin);

  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return error('INVALID_REQUEST', origin);
  }

  const validated = validatePolishPayload(parsed);
  if (!validated.ok) return error(validated.code, origin);
  if (env.AI_POLISH_ENABLED !== 'true') return error('AI_POLISH_DISABLED', origin);
  if (!env.RATE_LIMIT_SALT) return error('SERVER_ERROR', origin);
  if (looksLikeUnsafePolishRequest(validated.value.message)) return error('UNSAFE_POLISH_REQUEST', origin);

  const visitorHash = await hashVisitorId(validated.value.visitorId, env.RATE_LIMIT_SALT);

  try {
    const [visitorBurst, globalBurst] = await Promise.all([
      env.VISITOR_RATE_LIMITER.limit({ key: visitorHash }),
      env.GLOBAL_RATE_LIMITER.limit({ key: 'global' })
    ]);
    if (!visitorBurst.success || !globalBurst.success) return error('RATE_LIMITED', origin);
  } catch {
    // The exact Durable Object guard remains authoritative if the secondary burst layer is unavailable.
  }

  let decision: UsageDecision;
  try {
    decision = await reserveUsage(env, visitorHash);
  } catch {
    return error('SERVER_ERROR', origin);
  }
  if (!decision.ok) return error(decision.code, origin);

  try {
    const output = await env.AI.run(MODEL_IDENTIFIER, {
      messages: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: buildUserInstruction(validated.value.mode, validated.value.message) }
      ],
      temperature: 0.2,
      max_completion_tokens: 400,
      n: 1,
      stream: false,
      store: false,
      modalities: ['text'],
      tool_choice: 'none',
      parallel_tool_calls: false,
      chat_template_kwargs: { enable_thinking: false }
    });

    const checked = validateModelResponse(output);
    if (!checked.ok) {
      await releaseUsage(env, visitorHash, decision);
      return error(checked.code, origin);
    }
    return json({ ok: true, suggestion: checked.suggestion }, 200, origin);
  } catch (caught) {
    await releaseUsage(env, visitorHash, decision);
    return error(isFreeQuotaError(caught) ? 'AI_FREE_QUOTA_REACHED' : 'MODEL_UNAVAILABLE', origin);
  }
}

export const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS') {
      if (url.pathname !== '/polish' || !isAllowedOrigin(origin, ALLOWED_ORIGINS)) return json({ ok: false, code: 'INVALID_ORIGIN' }, 403);
      return new Response(null, { status: 204, headers: corsHeaders(origin!) });
    }

    if (url.pathname === '/health') {
      if (request.method !== 'GET') return json({ ok: false, code: 'METHOD_NOT_ALLOWED' }, 405);
      return json({ status: 'ok' });
    }

    if (url.pathname === '/admin/usage') {
      if (request.method !== 'GET') return json({ ok: false, code: 'METHOD_NOT_ALLOWED' }, 405);
      return handleAdminUsage(request, env);
    }

    if (url.pathname === '/polish') {
      if (request.method !== 'POST') return json({ ok: false, code: 'METHOD_NOT_ALLOWED' }, 405);
      if (!isAllowedOrigin(origin, ALLOWED_ORIGINS)) return json({ ok: false, code: 'INVALID_ORIGIN' }, 403);
      return handlePolish(request, env, origin!);
    }

    return json({ ok: false, code: 'NOT_FOUND' }, 404);
  }
} satisfies ExportedHandler<Env>;

export default worker;
