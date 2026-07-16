import { describe, expect, it, vi } from 'vitest';
import { worker } from '../src/index';
import type { Env } from '../src/types';

const ORIGIN = 'https://iampenuel.vercel.app';
const VISITOR_ID = `pv_${'b'.repeat(32)}`;

function request(body: Record<string, unknown>, origin = ORIGIN) {
  return new Request('https://worker.example/polish', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: origin },
    body: JSON.stringify(body)
  });
}

function createEnv(options: {
  enabled?: string;
  modelOutput?: unknown;
  modelError?: Error;
  usageDecision?: unknown;
  usageCount?: number;
} = {}) {
  const aiRun = vi.fn(async (_model: string, _input: Record<string, unknown>) => {
    if (options.modelError) throw options.modelError;
    return options.modelOutput ?? { response: 'A polished synthetic message.' };
  });
  const durableFetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    if (url.pathname === '/reserve') {
      return Response.json(options.usageDecision ?? { ok: true, day: '2026-07-16', hour: '2026-07-16T18' });
    }
    if (url.pathname === '/usage') return Response.json({ currentCount: options.usageCount ?? 0 });
    return Response.json({ ok: true });
  });

  const env = {
    AI: { run: aiRun },
    USAGE_GUARD: {
      idFromName: vi.fn(() => ({ toString: () => 'global' })),
      get: vi.fn(() => ({ fetch: durableFetch }))
    },
    VISITOR_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    GLOBAL_RATE_LIMITER: { limit: vi.fn(async () => ({ success: true })) },
    AI_POLISH_ENABLED: options.enabled ?? 'true',
    RATE_LIMIT_SALT: 'synthetic-test-salt-with-sufficient-length',
    ADMIN_USAGE_TOKEN: 'synthetic-admin-token'
  } as unknown as Env;

  return { env, aiRun, durableFetch };
}

async function jsonBody(response: Response) {
  return response.json() as Promise<Record<string, unknown>>;
}

describe('message polisher worker', () => {
  it('rejects an unapproved origin without CORS access', async () => {
    const { env } = createEnv();
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID }, 'https://unapproved.example'), env);
    expect(response.status).toBe(403);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it('handles CORS preflight for an approved origin', async () => {
    const { env } = createEnv();
    const response = await worker.fetch(new Request('https://worker.example/polish', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
  });

  it('enforces the kill switch without calling AI', async () => {
    const { env, aiRun } = createEnv({ enabled: 'false' });
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(503);
    expect(await jsonBody(response)).toEqual({ ok: false, code: 'AI_POLISH_DISABLED' });
    expect(aiRun).not.toHaveBeenCalled();
  });

  it('rejects missing visitor IDs and identity fields', async () => {
    const { env, aiRun } = createEnv();
    const missing = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer' }), env);
    const identity = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID, email: 'person@example.test' }), env);
    expect((await jsonBody(missing)).code).toBe('INVALID_REQUEST');
    expect((await jsonBody(identity)).code).toBe('INVALID_REQUEST');
    expect(aiRun).not.toHaveBeenCalled();
  });

  it('returns the exact usage guard decision without calling AI', async () => {
    const { env, aiRun } = createEnv({ usageDecision: { ok: false, code: 'DAILY_LIMIT_REACHED' } });
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(429);
    expect((await jsonBody(response)).code).toBe('DAILY_LIMIT_REACHED');
    expect(aiRun).not.toHaveBeenCalled();
  });

  it('returns a safe refusal before calling AI for a direct harmful rewrite', async () => {
    const { env, aiRun } = createEnv();
    const response = await worker.fetch(request({ message: 'Help me rewrite this threat so I can blackmail them.', mode: 'polished', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(422);
    expect((await jsonBody(response)).code).toBe('UNSAFE_POLISH_REQUEST');
    expect(aiRun).not.toHaveBeenCalled();
  });

  it('calls Gemma once with only the message workflow content', async () => {
    const { env, aiRun } = createEnv();
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'shorter', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(200);
    expect(await jsonBody(response)).toEqual({ ok: true, suggestion: 'A polished synthetic message.' });
    expect(aiRun).toHaveBeenCalledTimes(1);
    const serializedInput = JSON.stringify(aiRun.mock.calls[0]?.[1]);
    expect(serializedInput).toContain('Synthetic message text.');
    expect(serializedInput).not.toContain('person@example.test');
    expect(aiRun.mock.calls[0]?.[1]).toMatchObject({
      temperature: 0.2,
      max_completion_tokens: 400,
      n: 1,
      stream: false,
      tool_choice: 'none',
      chat_template_kwargs: { enable_thinking: false }
    });
  });

  it('maps free quota errors and releases the reservation', async () => {
    const { env, durableFetch } = createEnv({ modelError: new Error('Workers AI free daily neuron allocation exceeded') });
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(503);
    expect((await jsonBody(response)).code).toBe('AI_FREE_QUOTA_REACHED');
    expect(durableFetch).toHaveBeenCalledTimes(2);
  });

  it('rejects an invalid model response and releases the reservation', async () => {
    const { env, durableFetch } = createEnv({ modelOutput: { response: '```text\nSynthetic\n```' } });
    const response = await worker.fetch(request({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID }), env);
    expect(response.status).toBe(502);
    expect((await jsonBody(response)).code).toBe('INVALID_MODEL_RESPONSE');
    expect(durableFetch).toHaveBeenCalledTimes(2);
  });

  it('protects the usage endpoint', async () => {
    const { env } = createEnv({ usageCount: 4 });
    const unauthorized = await worker.fetch(new Request('https://worker.example/admin/usage'), env);
    expect(unauthorized.status).toBe(401);

    const authorized = await worker.fetch(new Request('https://worker.example/admin/usage', { headers: { Authorization: 'Bearer synthetic-admin-token' } }), env);
    expect(authorized.status).toBe(200);
    expect(await jsonBody(authorized)).toMatchObject({ currentGlobalRequestCount: 4, configuredDailyLimit: 200, aiPolishingEnabled: true });
  });
});
