export const VISITOR_STORAGE_KEY = 'penuel-portfolio.ai-visitor-id';
export const VISITOR_ID_PATTERN = /^pv_[a-f0-9]{32}$/;

interface VisitorIdStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function isValidVisitorId(value: unknown): value is string {
  return typeof value === 'string' && VISITOR_ID_PATTERN.test(value);
}

export function createVisitorId(cryptoApi: Pick<Crypto, 'getRandomValues'> = crypto) {
  const bytes = cryptoApi.getRandomValues(new Uint8Array(16));
  return `pv_${Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')}`;
}

export function getOrCreateVisitorId(
  storage: VisitorIdStorage,
  cryptoApi: Pick<Crypto, 'getRandomValues'> = crypto
) {
  try {
    const existing = storage.getItem(VISITOR_STORAGE_KEY);
    if (isValidVisitorId(existing)) return existing;
    const created = createVisitorId(cryptoApi);
    storage.setItem(VISITOR_STORAGE_KEY, created);
    return created;
  } catch {
    return createVisitorId(cryptoApi);
  }
}

export function mergeTranscript(message: string, transcript: string, maxLength = 2_000) {
  const segment = transcript.trim();
  if (!segment) return message;
  if (message.trimEnd().toLocaleLowerCase().endsWith(segment.toLocaleLowerCase())) return message;
  const separator = message && !/\s$/.test(message) ? ' ' : '';
  return `${message}${separator}${segment}`.slice(0, maxLength);
}

export function dictationControlPresentation(listening: boolean) {
  return listening
    ? { label: 'Stop', accessibleLabel: 'Stop voice dictation' }
    : { label: 'Dictate', accessibleLabel: 'Start voice dictation' };
}

export function dictationEndNotice(completedSuccessfully: boolean) {
  return completedSuccessfully ? 'Done listening.' : '';
}

export function applyAiSuggestion(original: string, suggestion: string) {
  return { message: suggestion, undoMessage: original };
}

export function keepOriginal(original: string) {
  return original;
}

export function undoAiSuggestion(undoMessage: string) {
  return undoMessage;
}

export function canStartAiRequest(options: {
  meaningfulCharacters: number;
  submitting: boolean;
  listening: boolean;
  requestInFlight: boolean;
  cooldownUntil: number;
  now: number;
}) {
  return options.meaningfulCharacters >= 10
    && !options.submitting
    && !options.listening
    && !options.requestInFlight
    && options.now >= options.cooldownUntil;
}

export function scrollTopToRevealStart(options: {
  scrollTop: number;
  containerTop: number;
  elementTop: number;
  margin: number;
}) {
  return Math.max(0, options.scrollTop + options.elementTop - options.containerTop - options.margin);
}

export function scrollTopToRevealEnd(options: {
  scrollTop: number;
  visibleBottom: number;
  elementBottom: number;
  margin: number;
}) {
  if (options.elementBottom <= options.visibleBottom) return null;
  return Math.max(0, options.scrollTop + options.elementBottom - options.visibleBottom + options.margin);
}
