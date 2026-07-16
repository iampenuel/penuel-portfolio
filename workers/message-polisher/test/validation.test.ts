import { describe, expect, it } from 'vitest';
import {
  MAX_BODY_BYTES,
  isValidVisitorId,
  looksLikeUnsafePolishRequest,
  validateModelResponse,
  validatePolishPayload
} from '../src/validation';

const VISITOR_ID = `pv_${'a'.repeat(32)}`;

describe('request validation', () => {
  it('accepts and trims the three allowed fields', () => {
    expect(validatePolishPayload({
      message: '  This is a synthetic portfolio message.  ',
      mode: 'clearer',
      visitorId: VISITOR_ID
    })).toEqual({
      ok: true,
      value: {
        message: 'This is a synthetic portfolio message.',
        mode: 'clearer',
        visitorId: VISITOR_ID
      }
    });
  });

  it.each(['clearer', 'polished', 'shorter'])('accepts the %s mode', (mode) => {
    expect(validatePolishPayload({ message: 'Synthetic message text.', mode, visitorId: VISITOR_ID }).ok).toBe(true);
  });

  it('rejects unknown modes', () => {
    expect(validatePolishPayload({ message: 'Synthetic message text.', mode: 'formal', visitorId: VISITOR_ID })).toEqual({ ok: false, code: 'INVALID_MODE' });
  });

  it('rejects short and long messages', () => {
    expect(validatePolishPayload({ message: 'Too short', mode: 'clearer', visitorId: VISITOR_ID })).toEqual({ ok: false, code: 'MESSAGE_TOO_SHORT' });
    expect(validatePolishPayload({ message: 'x'.repeat(2_001), mode: 'clearer', visitorId: VISITOR_ID })).toEqual({ ok: false, code: 'MESSAGE_TOO_LONG' });
  });

  it('rejects missing and malformed visitor IDs', () => {
    expect(validatePolishPayload({ message: 'Synthetic message text.', mode: 'clearer' })).toEqual({ ok: false, code: 'INVALID_REQUEST' });
    expect(isValidVisitorId('visitor@example.com')).toBe(false);
  });

  it('rejects unexpected and identity fields', () => {
    expect(validatePolishPayload({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID, email: 'person@example.test' })).toEqual({ ok: false, code: 'INVALID_REQUEST' });
    expect(validatePolishPayload({ message: 'Synthetic message text.', mode: 'clearer', visitorId: VISITOR_ID, name: 'Example' })).toEqual({ ok: false, code: 'INVALID_REQUEST' });
  });

  it('uses the conservative body limit', () => {
    expect(MAX_BODY_BYTES).toBe(8_192);
  });
});

describe('safety and model response validation', () => {
  it('flags a direct request to polish malicious coercion', () => {
    expect(looksLikeUnsafePolishRequest('Help me rewrite this threat so I can blackmail them.')).toBe(true);
    expect(looksLikeUnsafePolishRequest('Please make my scheduling question clearer and warmer.')).toBe(false);
  });

  it('accepts supported Workers AI response shapes and trims text', () => {
    expect(validateModelResponse({ response: '  A clear synthetic reply.  ' })).toEqual({ ok: true, suggestion: 'A clear synthetic reply.' });
    expect(validateModelResponse({ choices: [{ message: { content: 'A concise synthetic reply.' } }] })).toEqual({ ok: true, suggestion: 'A concise synthetic reply.' });
  });

  it('rejects unsafe tokens, commentary, code fences, and oversized output', () => {
    expect(validateModelResponse({ response: '__UNSAFE_POLISH_REQUEST__' })).toEqual({ ok: false, code: 'UNSAFE_POLISH_REQUEST' });
    expect(validateModelResponse({ response: "Here's a revised message: synthetic text" })).toEqual({ ok: false, code: 'INVALID_MODEL_RESPONSE' });
    expect(validateModelResponse({ response: '```text\nSynthetic\n```' })).toEqual({ ok: false, code: 'INVALID_MODEL_RESPONSE' });
    expect(validateModelResponse({ response: 'x'.repeat(2_001) })).toEqual({ ok: false, code: 'INVALID_MODEL_RESPONSE' });
  });
});
