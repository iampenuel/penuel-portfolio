import { describe, expect, it } from 'vitest';
import {
  GLOBAL_DAILY_LIMIT,
  VISITOR_DAILY_LIMIT,
  VISITOR_HOURLY_LIMIT,
  evaluateUsage,
  utcKeys
} from '../src/usage-guard';

describe('exact usage decisions', () => {
  it('allows a request below every limit', () => {
    expect(evaluateUsage({ visitorHour: 4, visitorDay: 14, globalDay: 199 }).ok).toBe(true);
  });

  it('enforces the visitor hourly limit', () => {
    expect(evaluateUsage({ visitorHour: VISITOR_HOURLY_LIMIT, visitorDay: 5, globalDay: 10 })).toEqual({ ok: false, code: 'RATE_LIMITED' });
  });

  it('enforces the visitor daily limit', () => {
    expect(evaluateUsage({ visitorHour: 1, visitorDay: VISITOR_DAILY_LIMIT, globalDay: 10 })).toEqual({ ok: false, code: 'RATE_LIMITED' });
  });

  it('enforces the global daily limit', () => {
    expect(evaluateUsage({ visitorHour: 1, visitorDay: 2, globalDay: GLOBAL_DAILY_LIMIT })).toEqual({ ok: false, code: 'DAILY_LIMIT_REACHED' });
  });

  it('uses UTC hour and day boundaries', () => {
    expect(utcKeys(new Date('2026-07-16T23:59:59.999Z'))).toEqual({ day: '2026-07-16', hour: '2026-07-16T23', minute: '2026-07-16T23:59' });
    expect(utcKeys(new Date('2026-07-17T00:00:00.000Z'))).toEqual({ day: '2026-07-17', hour: '2026-07-17T00', minute: '2026-07-17T00:00' });
  });

  it('enforces exact per-visitor and global burst limits', () => {
    expect(evaluateUsage({ visitorMinute: 3, globalMinute: 3, visitorHour: 3, visitorDay: 3, globalDay: 3 })).toEqual({ ok: false, code: 'RATE_LIMITED' });
    expect(evaluateUsage({ visitorMinute: 1, globalMinute: 20, visitorHour: 3, visitorDay: 3, globalDay: 3 })).toEqual({ ok: false, code: 'RATE_LIMITED' });
  });
});
