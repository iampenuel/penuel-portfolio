import type { Env, UsageDecision, UsageSnapshot } from './types';

export const VISITOR_HOURLY_LIMIT = 5;
export const VISITOR_DAILY_LIMIT = 15;
export const GLOBAL_DAILY_LIMIT = 200;
export const VISITOR_BURST_LIMIT = 3;
export const GLOBAL_BURST_LIMIT = 20;
const WARNING_THRESHOLDS = [50, 80, 90, 100] as const;

export function utcKeys(now: Date) {
  const day = now.toISOString().slice(0, 10);
  const hour = now.toISOString().slice(0, 13);
  const minute = now.toISOString().slice(0, 16);
  return { day, hour, minute };
}

export function evaluateUsage(snapshot: UsageSnapshot): UsageDecision {
  if (snapshot.globalDay >= GLOBAL_DAILY_LIMIT) return { ok: false, code: 'DAILY_LIMIT_REACHED' };
  if ((snapshot.visitorMinute ?? 0) >= VISITOR_BURST_LIMIT
    || (snapshot.globalMinute ?? 0) >= GLOBAL_BURST_LIMIT
    || snapshot.visitorHour >= VISITOR_HOURLY_LIMIT
    || snapshot.visitorDay >= VISITOR_DAILY_LIMIT) {
    return { ok: false, code: 'RATE_LIMITED' };
  }
  return { ok: true, day: '', hour: '' };
}

function counterKeys(visitorHash: string, day: string, hour: string, minute: string) {
  return {
    visitorMinute: `visitor-minute:${minute}:${visitorHash}`,
    globalMinute: `global-minute:${minute}`,
    visitorHour: `visitor-hour:${hour}:${visitorHash}`,
    visitorDay: `visitor-day:${day}:${visitorHash}`,
    globalDay: `global-day:${day}`
  };
}

interface ReserveBody {
  visitorHash: string;
  timestamp: string;
}

interface ReleaseBody extends ReserveBody {
  day: string;
  hour: string;
}

export class UsageGuard implements DurableObject {
  constructor(private readonly state: DurableObjectState, private readonly env: Env) {}

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/reserve' && request.method === 'POST') return this.reserve(request);
    if (url.pathname === '/release' && request.method === 'POST') return this.release(request);
    if (url.pathname === '/usage' && request.method === 'GET') return this.usage(url.searchParams.get('date'));
    return Response.json({ ok: false }, { status: 404 });
  }

  private async reserve(request: Request) {
    const body = await request.json<ReserveBody>();
    const now = new Date(body.timestamp);
    if (!body.visitorHash || Number.isNaN(now.getTime())) return Response.json({ ok: false }, { status: 400 });
    const { day, hour, minute } = utcKeys(now);
    const keys = counterKeys(body.visitorHash, day, hour, minute);

    const result = await this.state.storage.transaction(async (transaction) => {
      const visitorMinute = (await transaction.get<number>(keys.visitorMinute)) ?? 0;
      const globalMinute = (await transaction.get<number>(keys.globalMinute)) ?? 0;
      const visitorHour = (await transaction.get<number>(keys.visitorHour)) ?? 0;
      const visitorDay = (await transaction.get<number>(keys.visitorDay)) ?? 0;
      const globalDay = (await transaction.get<number>(keys.globalDay)) ?? 0;
      const decision = evaluateUsage({ visitorMinute, globalMinute, visitorHour, visitorDay, globalDay });
      if (!decision.ok) return { decision, warnings: [] as number[] };

      const nextGlobal = globalDay + 1;
      await transaction.put({
        [keys.visitorMinute]: visitorMinute + 1,
        [keys.globalMinute]: globalMinute + 1,
        [keys.visitorHour]: visitorHour + 1,
        [keys.visitorDay]: visitorDay + 1,
        [keys.globalDay]: nextGlobal
      });

      const warnings: number[] = [];
      for (const threshold of WARNING_THRESHOLDS) {
        const crossed = globalDay < Math.ceil((GLOBAL_DAILY_LIMIT * threshold) / 100)
          && nextGlobal >= Math.ceil((GLOBAL_DAILY_LIMIT * threshold) / 100);
        const warningKey = `warning:${day}:${threshold}`;
        if (crossed && !(await transaction.get<boolean>(warningKey))) {
          await transaction.put(warningKey, true);
          warnings.push(threshold);
        }
      }

      return { decision: { ok: true, day, hour } as const, warnings };
    });

    for (const threshold of result.warnings) {
      console.log(JSON.stringify({
        event: 'ai_usage_threshold',
        utcDate: day,
        threshold,
        currentCount: Math.ceil((GLOBAL_DAILY_LIMIT * threshold) / 100),
        configuredLimit: GLOBAL_DAILY_LIMIT
      }));
    }

    return Response.json(result.decision);
  }

  private async release(request: Request) {
    const body = await request.json<ReleaseBody>();
    const minute = body.timestamp.slice(0, 16);
    const keys = counterKeys(body.visitorHash, body.day, body.hour, minute);
    await this.state.storage.transaction(async (transaction) => {
      const visitorHour = (await transaction.get<number>(keys.visitorHour)) ?? 0;
      const visitorDay = (await transaction.get<number>(keys.visitorDay)) ?? 0;
      const globalDay = (await transaction.get<number>(keys.globalDay)) ?? 0;
      await transaction.put({
        [keys.visitorHour]: Math.max(0, visitorHour - 1),
        [keys.visitorDay]: Math.max(0, visitorDay - 1),
        [keys.globalDay]: Math.max(0, globalDay - 1)
      });
    });
    return Response.json({ ok: true });
  }

  private async usage(date: string | null) {
    const day = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : utcKeys(new Date()).day;
    const currentCount = (await this.state.storage.get<number>(`global-day:${day}`)) ?? 0;
    return Response.json({ currentCount });
  }
}
