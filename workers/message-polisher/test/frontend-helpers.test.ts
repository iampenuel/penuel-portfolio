import { describe, expect, it } from 'vitest';
import {
  VISITOR_STORAGE_KEY,
  applyAiSuggestion,
  canStartAiRequest,
  getOrCreateVisitorId,
  keepOriginal,
  mergeTranscript,
  undoAiSuggestion
} from '../../../src/lib/contactAssistant';

describe('anonymous visitor ID', () => {
  it('generates, stores, and reuses a valid anonymous ID', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    };
    const cryptoApi = { getRandomValues: <T extends ArrayBufferView | null>(array: T) => {
      const bytes = array as Uint8Array;
      bytes.fill(7);
      return array;
    } } as Pick<Crypto, 'getRandomValues'>;

    const first = getOrCreateVisitorId(storage, cryptoApi);
    const second = getOrCreateVisitorId(storage, cryptoApi);
    expect(first).toMatch(/^pv_[a-f0-9]{32}$/);
    expect(second).toBe(first);
    expect(values.get(VISITOR_STORAGE_KEY)).toBe(first);
  });
});

describe('dictation transcript merging', () => {
  it('appends finalized speech without deleting typed text', () => {
    expect(mergeTranscript('Typed opening.', 'Dictated ending.')).toBe('Typed opening. Dictated ending.');
  });

  it('does not insert the same finalized segment twice', () => {
    expect(mergeTranscript('Typed opening. Dictated ending.', 'Dictated ending.')).toBe('Typed opening. Dictated ending.');
  });
});

describe('AI review state helpers', () => {
  it('applies only the approved suggestion and preserves exact undo text', () => {
    expect(applyAiSuggestion('Original  text.', 'Suggested text.')).toEqual({ message: 'Suggested text.', undoMessage: 'Original  text.' });
  });

  it('keeps and restores the exact original', () => {
    expect(keepOriginal('Original  text.')).toBe('Original  text.');
    expect(undoAiSuggestion('Original  text.')).toBe('Original  text.');
  });

  it('prevents duplicate requests and honors the cooldown', () => {
    const base = { meaningfulCharacters: 20, submitting: false, listening: false, cooldownUntil: 100, now: 100 };
    expect(canStartAiRequest({ ...base, requestInFlight: false })).toBe(true);
    expect(canStartAiRequest({ ...base, requestInFlight: true })).toBe(false);
    expect(canStartAiRequest({ ...base, requestInFlight: false, now: 99 })).toBe(false);
  });
});
