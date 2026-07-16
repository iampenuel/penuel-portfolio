import { describe, expect, it } from 'vitest';
import {
  VISITOR_STORAGE_KEY,
  applyAiSuggestion,
  canStartAiRequest,
  dictationControlPresentation,
  dictationEndNotice,
  getOrCreateVisitorId,
  keepOriginal,
  mergeTranscript,
  scrollTopToRevealEnd,
  scrollTopToRevealStart,
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

describe('dictation control states', () => {
  it('uses explicit idle and listening labels', () => {
    expect(dictationControlPresentation(false)).toEqual({
      label: 'Dictate',
      accessibleLabel: 'Start voice dictation'
    });
    expect(dictationControlPresentation(true)).toEqual({
      label: 'Stop',
      accessibleLabel: 'Stop voice dictation'
    });
  });

  it('announces completion only after a successful recognition end', () => {
    expect(dictationEndNotice(true)).toBe('Done listening.');
    expect(dictationEndNotice(false)).toBe('');
  });
});

describe('contact internal scrolling', () => {
  it('aligns a completed suggestion near the top of the contact scroller', () => {
    expect(scrollTopToRevealStart({
      scrollTop: 240,
      containerTop: 100,
      elementTop: 640,
      margin: 14
    })).toBe(766);
  });

  it('scrolls only enough to reveal the message toolbar after dictation', () => {
    expect(scrollTopToRevealEnd({
      scrollTop: 180,
      visibleBottom: 700,
      elementBottom: 742,
      margin: 12
    })).toBe(234);
    expect(scrollTopToRevealEnd({
      scrollTop: 180,
      visibleBottom: 700,
      elementBottom: 680,
      margin: 12
    })).toBeNull();
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
