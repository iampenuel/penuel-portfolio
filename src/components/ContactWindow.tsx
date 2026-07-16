import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent
} from 'react';
import {
  applyAiSuggestion,
  canStartAiRequest,
  getOrCreateVisitorId,
  keepOriginal,
  mergeTranscript,
  undoAiSuggestion
} from '../lib/contactAssistant';

const FORMSPREE_FORM_ID = import.meta.env.PUBLIC_FORMSPREE_FORM_ID?.trim();
const FORMSPREE_ENDPOINT = FORMSPREE_FORM_ID ? `https://formspree.io/f/${FORMSPREE_FORM_ID}` : null;
const AI_POLISH_ENDPOINT = import.meta.env.PUBLIC_AI_POLISH_ENDPOINT?.trim();
const DIRECT_EMAIL = 'mailto:stanleyzebulonp@gmail.com';
const AI_TIMEOUT_MS = 15_000;
const AI_COOLDOWN_MS = 10_000;

type ContactField = 'firstName' | 'lastName' | 'email' | 'message';
type ContactValues = Record<ContactField, string> & { website: string };
type ContactErrors = Partial<Record<ContactField, string>>;
type SubmitState = 'idle' | 'sending' | 'success' | 'error';
type PolishMode = 'clearer' | 'polished' | 'shorter';
type AssistantState = 'idle' | 'loading' | 'review' | 'error';

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

const EMPTY_FORM: ContactValues = {
  firstName: '',
  lastName: '',
  email: '',
  message: '',
  website: ''
};

const MODE_ITEMS: ReadonlyArray<{ mode: PolishMode; label: string }> = [
  { mode: 'clearer', label: 'Make clearer' },
  { mode: 'polished', label: 'Polish tone' },
  { mode: 'shorter', label: 'Make shorter' }
];

const AI_FAILURE_MESSAGES: Record<string, { message: string; retry: boolean }> = {
  RATE_LIMITED: { message: 'Give it a moment, then try again.', retry: false },
  DAILY_LIMIT_REACHED: { message: 'Writing help has reached today’s limit.', retry: false },
  AI_FREE_QUOTA_REACHED: { message: 'Writing help has reached today’s limit.', retry: false },
  AI_POLISH_DISABLED: { message: 'Writing help is unavailable. Your draft is safe.', retry: false },
  UNSAFE_POLISH_REQUEST: { message: 'I can’t help rewrite that message.', retry: false },
  MODEL_ERROR: { message: 'Couldn’t tidy that up. Your draft is unchanged.', retry: true },
  MODEL_UNAVAILABLE: { message: 'Couldn’t tidy that up. Your draft is unchanged.', retry: true },
  INVALID_MODEL_RESPONSE: { message: 'That suggestion didn’t work. Your draft is unchanged.', retry: true },
  SERVER_ERROR: { message: 'Couldn’t tidy that up. Your draft is unchanged.', retry: true },
  MESSAGE_TOO_SHORT: { message: 'Add a little more to your message first.', retry: false },
  MESSAGE_TOO_LONG: { message: 'Shorten your message before tidying it.', retry: false },
  INVALID_REQUEST: { message: 'Check your message and try again.', retry: false },
  INVALID_MODE: { message: 'Choose a tidy option and try again.', retry: false }
};

function MicrophoneIcon() {
  return (
    <svg className="contact-tool-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <rect x="5.25" y="1.75" width="5.5" height="8" rx="2.75" />
      <path d="M3.5 7.75a4.5 4.5 0 0 0 9 0M8 12.25v2M5.75 14.25h4.5" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg className="contact-tool-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path d="m3 11.75-.5 2 2-.5 7.8-7.8-1.5-1.5L3 11.75Z" />
      <path d="m9.9 4.85 1.5 1.5M10.8 3.95l.75-.75a1.05 1.05 0 0 1 1.5 0l.5.5a1.05 1.05 0 0 1 0 1.5l-.75.75" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="contact-state-icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="m5 10.25 3.2 3.2L15.25 6.5" />
    </svg>
  );
}

function isValidEmail(value: string) {
  const input = document.createElement('input');
  input.type = 'email';
  input.value = value;
  return input.validity.valid;
}

function validate(values: ContactValues): ContactErrors {
  const errors: ContactErrors = {};
  if (!values.firstName.trim()) errors.firstName = 'Please enter your first name.';
  else if (values.firstName.trim().length > 60) errors.firstName = 'Keep your first name under 60 characters.';

  if (!values.lastName.trim()) errors.lastName = 'Please enter your last name.';
  else if (values.lastName.trim().length > 60) errors.lastName = 'Keep your last name under 60 characters.';

  const email = values.email.trim();
  if (!email || email.length > 254 || !isValidEmail(email)) errors.email = 'Enter a valid email address.';

  const message = values.message.trim();
  if (message.length < 10) errors.message = 'Give me a little more to work with—at least 10 characters.';
  else if (message.length > 2_000) errors.message = 'Keep your message under 2,000 characters.';
  return errors;
}

function speechConstructor() {
  const speechWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition ?? null;
}

export function ContactWindow({
  closeRequest,
  minimized,
  onClose
}: {
  closeRequest: number;
  minimized: boolean;
  onClose: () => void;
}) {
  const [values, setValues] = useState<ContactValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [discardOpen, setDiscardOpen] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const [voiceNoticeIsError, setVoiceNoticeIsError] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [modeMenuOpen, setModeMenuOpen] = useState(false);
  const [assistantState, setAssistantState] = useState<AssistantState>('idle');
  const [assistantStatus, setAssistantStatus] = useState('');
  const [assistantCanRetry, setAssistantCanRetry] = useState(false);
  const [lastPolishMode, setLastPolishMode] = useState<PolishMode>('clearer');
  const [editableSuggestion, setEditableSuggestion] = useState('');
  const [preAiOriginal, setPreAiOriginal] = useState<string | null>(null);
  const [undoMessage, setUndoMessage] = useState<string | null>(null);
  const [cooldownActive, setCooldownActive] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);
  const keepWritingRef = useRef<HTMLButtonElement>(null);
  const tidyButtonRef = useRef<HTMLButtonElement>(null);
  const modeMenuRef = useRef<HTMLDivElement>(null);
  const modeMenuFirstRef = useRef<HTMLButtonElement>(null);
  const suggestionHeadingRef = useRef<HTMLHeadingElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const finalResultsRef = useRef(new Map<number, string>());
  const voiceNoticeTimerRef = useRef<number | null>(null);
  const aiAbortRef = useRef<AbortController | null>(null);
  const aiRequestInFlightRef = useRef(false);
  const aiAbortForLifecycleRef = useRef(false);
  const aiCooldownUntilRef = useRef(0);
  const cooldownTimerRef = useRef<number | null>(null);
  const submittingRef = useRef(false);
  const observedCloseRequestRef = useRef(closeRequest);

  const fieldRefs = useMemo(() => ({
    firstName: firstNameRef,
    lastName: lastNameRef,
    email: emailRef,
    message: messageRef
  }), []);
  const hasDraft = values.firstName.length > 0
    || values.lastName.length > 0
    || values.email.length > 0
    || values.message.length > 0;
  const meaningfulMessageLength = values.message.trim().length;
  const aiLoading = assistantState === 'loading';
  const canOpenModeMenu = meaningfulMessageLength >= 10
    && submitState !== 'sending'
    && !aiLoading
    && assistantState !== 'review'
    && !isListening
    && !cooldownActive;

  const stopRecognition = useCallback((abort = true) => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        if (abort) recognition.abort();
        else recognition.stop();
      } catch {
        // Recognition may already have stopped.
      }
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const cancelAiRequest = useCallback((forLifecycle = true) => {
    aiAbortForLifecycleRef.current = forLifecycle;
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    aiRequestInFlightRef.current = false;
    setAssistantState((current) => current === 'loading' ? 'idle' : current);
    setAssistantStatus((current) => current === 'Tidying your message…' ? '' : current);
  }, []);

  const resetAssistant = useCallback(() => {
    cancelAiRequest();
    setModeMenuOpen(false);
    setAssistantState('idle');
    setAssistantStatus('');
    setAssistantCanRetry(false);
    setLastPolishMode('clearer');
    setEditableSuggestion('');
    setPreAiOriginal(null);
    setUndoMessage(null);
    aiCooldownUntilRef.current = 0;
    setCooldownActive(false);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
  }, [cancelAiRequest]);

  const clearForm = useCallback(() => {
    stopRecognition();
    resetAssistant();
    setValues(EMPTY_FORM);
    setErrors({});
    setSubmitState('idle');
    setDiscardOpen(false);
    setVoiceNotice('');
    setVoiceNoticeIsError(false);
    setInterimTranscript('');
    submittingRef.current = false;
  }, [resetAssistant, stopRecognition]);

  const closeAndClear = useCallback(() => {
    clearForm();
    onClose();
  }, [clearForm, onClose]);

  useEffect(() => {
    setVoiceSupported(Boolean(speechConstructor()));
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (closeRequest === observedCloseRequestRef.current) return;
    observedCloseRequestRef.current = closeRequest;
    stopRecognition();
    cancelAiRequest();
    setModeMenuOpen(false);
    if (!hasDraft || submitState === 'success') {
      closeAndClear();
      return;
    }
    setDiscardOpen(true);
  }, [cancelAiRequest, closeAndClear, closeRequest, hasDraft, stopRecognition, submitState]);

  useEffect(() => {
    if (!minimized) return;
    stopRecognition();
    cancelAiRequest();
    setModeMenuOpen(false);
  }, [cancelAiRequest, minimized, stopRecognition]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) stopRecognition();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [stopRecognition]);

  useEffect(() => {
    if (modeMenuOpen) modeMenuFirstRef.current?.focus();
  }, [modeMenuOpen]);

  useEffect(() => {
    if (discardOpen) keepWritingRef.current?.focus();
  }, [discardOpen]);

  useEffect(() => {
    if (submitState === 'success') successHeadingRef.current?.focus();
    if (submitState === 'error') errorHeadingRef.current?.focus();
  }, [submitState]);

  useEffect(() => () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      // Recognition may already have stopped.
    }
    aiAbortRef.current?.abort();
    if (voiceNoticeTimerRef.current) window.clearTimeout(voiceNoticeTimerRef.current);
    if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
  }, []);

  const updateField = (field: keyof ContactValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== 'website' && errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const showTranscriptAdded = () => {
    setVoiceNotice('Transcript added.');
    setVoiceNoticeIsError(false);
    if (voiceNoticeTimerRef.current) window.clearTimeout(voiceNoticeTimerRef.current);
    voiceNoticeTimerRef.current = window.setTimeout(() => setVoiceNotice(''), 4_000);
  };

  const startRecognition = () => {
    const Constructor = speechConstructor();
    if (!Constructor) {
      setVoiceSupported(false);
      setVoiceNotice('Dictation isn’t supported in this browser.');
      setVoiceNoticeIsError(false);
      return;
    }

    if (!recognitionRef.current) {
      const recognition = new Constructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.lang = navigator.language || 'en-US';
      recognition.onresult = (event) => {
        let interim = '';
        let addedFinal = false;
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcript = result?.[0]?.transcript?.trim() ?? '';
          if (!transcript) continue;
          if (!result.isFinal) {
            interim += `${transcript} `;
            continue;
          }
          if (finalResultsRef.current.get(index) === transcript) continue;
          finalResultsRef.current.set(index, transcript);
          setValues((current) => ({ ...current, message: mergeTranscript(current.message, transcript) }));
          setErrors((current) => ({ ...current, message: undefined }));
          addedFinal = true;
        }
        setInterimTranscript(interim.trim());
        if (addedFinal) showTranscriptAdded();
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        setInterimTranscript('');
        if (event.error === 'aborted') return;
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceNotice('Microphone access wasn’t allowed. You can still type.');
          setVoiceNoticeIsError(true);
          return;
        }
        setVoiceNotice('I didn’t catch that. Try again or type instead.');
        setVoiceNoticeIsError(true);
      };
      recognition.onend = () => {
        setIsListening(false);
        setInterimTranscript('');
      };
      recognitionRef.current = recognition;
    }

    finalResultsRef.current.clear();
    setVoiceNotice('');
    setVoiceNoticeIsError(false);
    setInterimTranscript('');
    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
      setVoiceNotice('I didn’t catch that. Try again or type instead.');
      setVoiceNoticeIsError(true);
    }
  };

  const toggleRecognition = () => {
    if (isListening) {
      stopRecognition(false);
      return;
    }
    startRecognition();
  };

  const closeModeMenu = () => {
    setModeMenuOpen(false);
    window.requestAnimationFrame(() => tidyButtonRef.current?.focus());
  };

  const handleModeMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeModeMenu();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const items = Array.from(modeMenuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    if (event.key === 'Home') items[0]?.focus();
    else if (event.key === 'End') items.at(-1)?.focus();
    else if (event.key === 'ArrowDown') items[(currentIndex + 1 + items.length) % items.length]?.focus();
    else items[(currentIndex - 1 + items.length) % items.length]?.focus();
  };

  const createSuggestion = async (mode: PolishMode) => {
    const now = Date.now();
    if (!canStartAiRequest({
      meaningfulCharacters: meaningfulMessageLength,
      submitting: submitState === 'sending',
      listening: isListening,
      requestInFlight: aiRequestInFlightRef.current,
      cooldownUntil: aiCooldownUntilRef.current,
      now
    })) return;

    setModeMenuOpen(false);
    setLastPolishMode(mode);
    setAssistantCanRetry(false);
    setVoiceNotice('');
    setVoiceNoticeIsError(false);
    stopRecognition(false);
    const original = values.message;
    setPreAiOriginal(original);
    setEditableSuggestion('');
    setAssistantStatus('Tidying your message…');
    setAssistantState('loading');
    window.requestAnimationFrame(() => tidyButtonRef.current?.focus());

    if (!AI_POLISH_ENDPOINT) {
      setAssistantState('error');
      setAssistantStatus('Writing help is unavailable. Your draft is safe.');
      setAssistantCanRetry(false);
      return;
    }

    aiRequestInFlightRef.current = true;
    aiAbortForLifecycleRef.current = false;
    const controller = new AbortController();
    aiAbortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

    try {
      const visitorId = getOrCreateVisitorId(window.localStorage, window.crypto);
      const response = await fetch(AI_POLISH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: original, mode, visitorId }),
        signal: controller.signal
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; code?: string; suggestion?: unknown } | null;
      if (!response.ok || !payload?.ok) {
        const failure = AI_FAILURE_MESSAGES[payload?.code ?? '']
          ?? { message: 'Couldn’t tidy that up. Your draft is unchanged.', retry: true };
        setAssistantState('error');
        setAssistantStatus(failure.message);
        setAssistantCanRetry(failure.retry);
        return;
      }
      if (typeof payload.suggestion !== 'string' || !payload.suggestion.trim() || payload.suggestion.length > 2_000) {
        setAssistantState('error');
        setAssistantStatus('That suggestion didn’t work. Your draft is unchanged.');
        setAssistantCanRetry(true);
        return;
      }

      setEditableSuggestion(payload.suggestion);
      setAssistantState('review');
      setAssistantStatus('Suggestion ready.');
      window.requestAnimationFrame(() => suggestionHeadingRef.current?.focus());
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError' && aiAbortForLifecycleRef.current) {
        setAssistantState('idle');
        setAssistantStatus('');
      } else {
        setAssistantState('error');
        setAssistantStatus('Couldn’t connect. Your draft is unchanged.');
        setAssistantCanRetry(true);
      }
    } finally {
      window.clearTimeout(timeout);
      aiAbortRef.current = null;
      aiRequestInFlightRef.current = false;
      aiCooldownUntilRef.current = Date.now() + AI_COOLDOWN_MS;
      setCooldownActive(true);
      if (cooldownTimerRef.current) window.clearTimeout(cooldownTimerRef.current);
      cooldownTimerRef.current = window.setTimeout(() => setCooldownActive(false), AI_COOLDOWN_MS);
    }
  };

  const applySuggestion = () => {
    if (preAiOriginal === null) return;
    const applied = applyAiSuggestion(preAiOriginal, editableSuggestion);
    updateField('message', applied.message);
    setUndoMessage(applied.undoMessage);
    setAssistantState('idle');
    setAssistantStatus('');
    setAssistantCanRetry(false);
    setEditableSuggestion('');
    setPreAiOriginal(null);
    window.requestAnimationFrame(() => messageRef.current?.focus());
  };

  const keepMyOriginal = () => {
    if (preAiOriginal !== null) keepOriginal(preAiOriginal);
    setAssistantState('idle');
    setAssistantStatus('');
    setAssistantCanRetry(false);
    setEditableSuggestion('');
    setPreAiOriginal(null);
    window.requestAnimationFrame(() => tidyButtonRef.current?.focus());
  };

  const undoAiEdit = () => {
    if (undoMessage === null) return;
    updateField('message', undoAiSuggestion(undoMessage));
    setUndoMessage(null);
    window.requestAnimationFrame(() => messageRef.current?.focus());
  };

  const completeSubmission = () => {
    stopRecognition();
    resetAssistant();
    setSubmitState('success');
  };

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    stopRecognition();
    cancelAiRequest();
    setModeMenuOpen(false);

    const trimmed: ContactValues = {
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      message: values.message.trim(),
      website: values.website
    };
    const nextErrors = validate(trimmed);
    setValues(trimmed);
    setErrors(nextErrors);
    const firstInvalid = (['firstName', 'lastName', 'email', 'message'] as ContactField[]).find((field) => nextErrors[field]);
    if (firstInvalid) {
      window.requestAnimationFrame(() => fieldRefs[firstInvalid].current?.focus());
      return;
    }

    if (trimmed.website) {
      completeSubmission();
      return;
    }

    if (!FORMSPREE_ENDPOINT) {
      if (import.meta.env.DEV) console.error('PUBLIC_FORMSPREE_FORM_ID is not configured.');
      setSubmitState('error');
      return;
    }

    submittingRef.current = true;
    setSubmitState('sending');
    try {
      const body = new FormData();
      body.append('First name', trimmed.firstName);
      body.append('Last name', trimmed.lastName);
      body.append('Email', trimmed.email);
      body.append('Message', trimmed.message);
      body.append('_replyto', trimmed.email);
      body.append('_subject', 'New message from Penuel’s portfolio');
      body.append('Source', 'Penuel Portfolio Contact');

      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error('Formspree rejected the contact submission.');
      completeSubmission();
    } catch (caught) {
      if (import.meta.env.DEV) console.error('Portfolio contact submission failed.', caught);
      setSubmitState('error');
    } finally {
      submittingRef.current = false;
    }
  };

  const sendAnother = () => {
    clearForm();
    window.requestAnimationFrame(() => firstNameRef.current?.focus());
  };

  const keepWriting = () => {
    setDiscardOpen(false);
    window.requestAnimationFrame(() => messageRef.current?.focus());
  };

  if (submitState === 'success') {
    return (
      <div className="mail-compose contact-success" aria-live="polite">
        <div className="contact-state-card">
          <span className="mail-symbol" aria-hidden="true"><CheckIcon /></span>
          <h2 ref={successHeadingRef} tabIndex={-1}>Message sent.</h2>
          <p>Thanks for reaching out. I’ll get back to you when I can.</p>
          <div className="contact-state-actions">
            <button className="primary-button compact" type="button" onClick={closeAndClear}>Done</button>
            <button className="secondary-button compact" type="button" onClick={sendAnother}>Send another</button>
          </div>
        </div>
      </div>
    );
  }

  const voiceStatus = voiceSupported === false
    ? 'Dictation isn’t supported in this browser.'
    : isListening
      ? 'Listening…'
      : voiceNotice;
  const tidyDisabled = !canOpenModeMenu;
  const reviewOpen = assistantState === 'review' && preAiOriginal !== null;

  return (
    <div className="mail-compose">
      <form ref={formRef} className="contact-form" noValidate onSubmit={submit}>
        <div className="mail-compose-intro">
          <span className="eyebrow">NEW MESSAGE</span>
          <h2>Let’s talk.</h2>
          <p>Have a question, opportunity, or thoughts on the site? Send me a note.</p>
          <small>I’ll only use your details to reply.</small>
        </div>

        {submitState === 'error' && (
          <section className="contact-error-banner" role="alert">
            <h3 ref={errorHeadingRef} tabIndex={-1}>That didn’t send.</h3>
            <p>
              {import.meta.env.DEV && !FORMSPREE_ENDPOINT
                ? 'The local form isn’t configured. Your message is still here.'
                : 'Your message is still here. Try again, or email me directly.'}
            </p>
            <div className="contact-error-actions">
              <button className="contact-quiet-action" type="button" onClick={() => formRef.current?.requestSubmit()}>Try again</button>
              <a className="contact-quiet-action" href={DIRECT_EMAIL}>Email me directly</a>
            </div>
          </section>
        )}

        <div className="contact-name-row">
          <div className="contact-field">
            <label htmlFor="contact-first-name">First name</label>
            <input
              ref={firstNameRef}
              id="contact-first-name"
              name="First name"
              type="text"
              autoComplete="given-name"
              placeholder="Jordan"
              required
              maxLength={60}
              value={values.firstName}
              aria-invalid={Boolean(errors.firstName)}
              aria-describedby={errors.firstName ? 'contact-first-name-error' : undefined}
              onChange={(event) => updateField('firstName', event.target.value)}
            />
            {errors.firstName && <span id="contact-first-name-error" className="contact-field-error">{errors.firstName}</span>}
          </div>
          <div className="contact-field">
            <label htmlFor="contact-last-name">Last name</label>
            <input
              ref={lastNameRef}
              id="contact-last-name"
              name="Last name"
              type="text"
              autoComplete="family-name"
              placeholder="Lee"
              required
              maxLength={60}
              value={values.lastName}
              aria-invalid={Boolean(errors.lastName)}
              aria-describedby={errors.lastName ? 'contact-last-name-error' : undefined}
              onChange={(event) => updateField('lastName', event.target.value)}
            />
            {errors.lastName && <span id="contact-last-name-error" className="contact-field-error">{errors.lastName}</span>}
          </div>
        </div>

        <div className="contact-field">
          <label htmlFor="contact-email">Email</label>
          <input
            ref={emailRef}
            id="contact-email"
            name="Email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="jordan@example.com"
            required
            maxLength={254}
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {errors.email && <span id="contact-email-error" className="contact-field-error">{errors.email}</span>}
        </div>

        <div className="contact-field contact-message-field">
          <label htmlFor="contact-message">Message</label>
          <div className={`contact-editor${errors.message ? ' invalid' : ''}`}>
            <textarea
              ref={messageRef}
              id="contact-message"
              name="Message"
              placeholder="What would you like to talk about?"
              required
              minLength={10}
              maxLength={2_000}
              rows={7}
              value={values.message}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={`contact-message-count contact-voice-privacy${errors.message ? ' contact-message-error' : ''}`}
              onChange={(event) => updateField('message', event.target.value)}
            />
            <div className="contact-editor-toolbar">
              <div className="contact-tool-cluster">
                <button
                  className={`contact-toolbar-button${isListening ? ' listening' : ''}`}
                  type="button"
                  aria-label={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
                  aria-describedby="contact-voice-privacy"
                  aria-pressed={isListening}
                  disabled={voiceSupported !== true}
                  title={isListening ? 'Stop voice dictation' : 'Start voice dictation'}
                  onClick={toggleRecognition}
                >
                  <MicrophoneIcon />
                  {isListening && <span className="contact-recording-dot" aria-hidden="true" />}
                  <span>{isListening ? 'Listening…' : 'Dictate'}</span>
                </button>
                <button
                  ref={tidyButtonRef}
                  className="contact-toolbar-button"
                  type="button"
                  disabled={tidyDisabled}
                  aria-expanded={modeMenuOpen}
                  aria-haspopup="menu"
                  aria-controls="contact-tidy-menu"
                  onClick={() => setModeMenuOpen((current) => !current)}
                >
                  <PencilIcon />
                  <span>Tidy message</span>
                </button>
                {undoMessage !== null && (
                  <button className="contact-quiet-action contact-undo" type="button" onClick={undoAiEdit}>Undo</button>
                )}

                {modeMenuOpen && (
                  <div
                    ref={modeMenuRef}
                    id="contact-tidy-menu"
                    className="contact-tidy-menu"
                    role="menu"
                    aria-label="Tidy message options"
                    onKeyDown={handleModeMenuKeyDown}
                  >
                    {MODE_ITEMS.map(({ mode, label }, index) => (
                      <button
                        key={mode}
                        ref={index === 0 ? modeMenuFirstRef : undefined}
                        type="button"
                        role="menuitem"
                        onClick={() => void createSuggestion(mode)}
                      >
                        {label}
                      </button>
                    ))}
                    <p>Gemma 4 rewrites only your message. Your name and email stay out of the request.</p>
                  </div>
                )}
              </div>
              <span id="contact-message-count" className="contact-character-count">{values.message.length} / 2000</span>
            </div>
          </div>

          {errors.message && <span id="contact-message-error" className="contact-field-error">{errors.message}</span>}
          <p id="contact-voice-privacy" className="contact-privacy-note">Your browser handles dictation. This site keeps only the text.</p>

          {(voiceStatus || interimTranscript) && (
            <div className="contact-dictation-feedback" aria-live="polite" aria-atomic="true">
              {voiceStatus && <span className={voiceNoticeIsError && !isListening ? 'error' : undefined}>{voiceStatus}</span>}
              {isListening && voiceNotice && <span>{voiceNotice}</span>}
              {interimTranscript && <span className="contact-interim" aria-label="Temporary dictation preview">{interimTranscript}</span>}
            </div>
          )}

          {assistantState === 'loading' && (
            <div className="contact-ai-feedback" role="status" aria-live="polite">
              <span className="contact-progress" aria-hidden="true" />
              <span>Tidying your message…</span>
            </div>
          )}

          {assistantState === 'error' && (
            <div className="contact-ai-feedback error" role="alert">
              <span>{assistantStatus}</span>
              {assistantCanRetry && (
                <button className="contact-quiet-action" type="button" disabled={cooldownActive} onClick={() => void createSuggestion(lastPolishMode)}>Try again</button>
              )}
            </div>
          )}
        </div>

        {reviewOpen && (
          <section id="contact-writing-assistant" className="contact-suggestion-review" aria-labelledby="contact-suggestion-title">
            <div className="contact-suggestion-heading">
              <h3 id="contact-suggestion-title" ref={suggestionHeadingRef} tabIndex={-1}>Suggested edit</h3>
              <p>Review it before using it.</p>
            </div>
            <div className="contact-suggestion-grid">
              <section className="contact-version" aria-labelledby="contact-original-label">
                <h4 id="contact-original-label">Original</h4>
                <div className="contact-version-copy">{preAiOriginal}</div>
              </section>
              <section className="contact-version contact-suggested-version" aria-labelledby="contact-suggested-label">
                <h4 id="contact-suggested-label">Suggested</h4>
                <textarea
                  className="contact-suggestion-editor"
                  aria-label="Suggested message"
                  maxLength={2_000}
                  rows={7}
                  value={editableSuggestion}
                  onChange={(event) => setEditableSuggestion(event.target.value)}
                />
                <span className="contact-character-count">{editableSuggestion.length} / 2000</span>
              </section>
            </div>
            <div className="contact-suggestion-actions">
              <button
                className="primary-button compact"
                type="button"
                disabled={editableSuggestion.trim().length < 10}
                onClick={applySuggestion}
              >
                Use suggestion
              </button>
              <button className="contact-quiet-action" type="button" onClick={keepMyOriginal}>Keep original</button>
            </div>
            <p className="contact-ai-disclosure">Gemma 4 rewrites only your message. Your name and email stay out of the request.</p>
            <span className="sr-only" aria-live="polite">{assistantStatus}</span>
          </section>
        )}

        <div className="contact-honeypot" role="none" aria-hidden="true" hidden>
          <label htmlFor="contact-website" aria-hidden="true">Website</label>
          <input id="contact-website" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={values.website} onChange={(event) => updateField('website', event.target.value)} />
        </div>

        <div className="contact-submit-row">
          <button
            className={`${reviewOpen ? 'secondary-button' : 'primary-button'} compact contact-submit`}
            type="submit"
            disabled={submitState === 'sending'}
          >
            {submitState === 'sending' && <span className="contact-progress" aria-hidden="true" />}
            {submitState === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          <span aria-live="polite" className="sr-only">{submitState === 'sending' ? 'Sending your message.' : ''}</span>
          <a className="contact-direct-email" href={DIRECT_EMAIL}>Prefer email? Write directly.</a>
        </div>
      </form>

      {discardOpen && (
        <div
          className="contact-discard-backdrop"
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="contact-discard-title"
          aria-describedby="contact-discard-description"
          onKeyDown={(event) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            keepWriting();
          }}
        >
          <div className="contact-discard-card">
            <h2 id="contact-discard-title">Discard this message?</h2>
            <p id="contact-discard-description">Your draft will be deleted.</p>
            <div className="contact-state-actions">
              <button ref={keepWritingRef} className="primary-button compact" type="button" onClick={keepWriting}>Keep writing</button>
              <button className="secondary-button compact contact-discard-action" type="button" onClick={closeAndClear}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
