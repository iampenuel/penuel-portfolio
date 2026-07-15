import { useCallback, useEffect, useMemo, useRef, useState, type SyntheticEvent } from 'react';

const FORMSPREE_FORM_ID = import.meta.env.PUBLIC_FORMSPREE_FORM_ID?.trim();
const FORMSPREE_ENDPOINT = FORMSPREE_FORM_ID ? `https://formspree.io/f/${FORMSPREE_FORM_ID}` : null;
const DIRECT_EMAIL = 'mailto:stanleyzebulonp@gmail.com';

type ContactField = 'firstName' | 'lastName' | 'email' | 'message';
type ContactValues = Record<ContactField, string> & { website: string };
type ContactErrors = Partial<Record<ContactField, string>>;
type SubmitState = 'idle' | 'sending' | 'success' | 'error';

const EMPTY_FORM: ContactValues = {
  firstName: '',
  lastName: '',
  email: '',
  message: '',
  website: ''
};

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

export function ContactWindow({ closeRequest, onClose }: { closeRequest: number; onClose: () => void }) {
  const [values, setValues] = useState<ContactValues>(EMPTY_FORM);
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [discardOpen, setDiscardOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const firstNameRef = useRef<HTMLInputElement>(null);
  const lastNameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const successHeadingRef = useRef<HTMLHeadingElement>(null);
  const errorHeadingRef = useRef<HTMLHeadingElement>(null);
  const keepWritingRef = useRef<HTMLButtonElement>(null);
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

  const clearForm = useCallback(() => {
    setValues(EMPTY_FORM);
    setErrors({});
    setSubmitState('idle');
    setDiscardOpen(false);
    submittingRef.current = false;
  }, []);

  const closeAndClear = useCallback(() => {
    clearForm();
    onClose();
  }, [clearForm, onClose]);

  useEffect(() => {
    firstNameRef.current?.focus();
  }, []);

  useEffect(() => {
    if (closeRequest === observedCloseRequestRef.current) return;
    observedCloseRequestRef.current = closeRequest;
    if (!hasDraft || submitState === 'success') {
      closeAndClear();
      return;
    }
    setDiscardOpen(true);
  }, [closeAndClear, closeRequest, hasDraft, submitState]);

  useEffect(() => {
    if (discardOpen) keepWritingRef.current?.focus();
  }, [discardOpen]);

  useEffect(() => {
    if (submitState === 'success') successHeadingRef.current?.focus();
    if (submitState === 'error') errorHeadingRef.current?.focus();
  }, [submitState]);

  const updateField = (field: keyof ContactValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (field !== 'website' && errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

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
      setSubmitState('success');
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
      setSubmitState('success');
    } catch (error) {
      if (import.meta.env.DEV) console.error('Portfolio contact submission failed.', error);
      setSubmitState('error');
    } finally {
      submittingRef.current = false;
    }
  };

  const sendAnother = () => {
    clearForm();
    window.requestAnimationFrame(() => firstNameRef.current?.focus());
  };

  if (submitState === 'success') {
    return (
      <div className="mail-compose contact-success" aria-live="polite">
        <div className="contact-state-card">
          <span className="mail-symbol" aria-hidden="true">✓</span>
          <h2 ref={successHeadingRef} tabIndex={-1}>Message sent.</h2>
          <p>Thanks for reaching out. I’ll get back to you as soon as I can.</p>
          <div className="contact-state-actions">
            <button className="primary-button compact" type="button" onClick={closeAndClear}>Done</button>
            <button className="secondary-button compact" type="button" onClick={sendAnother}>Send another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mail-compose">
      <form ref={formRef} className="contact-form" noValidate onSubmit={submit}>
        <div className="mail-compose-intro">
          <span className="eyebrow">NEW MESSAGE</span>
          <h2>Let’s talk.</h2>
          <p>Have a question, an opportunity, some feedback—or thoughts about the rickroll? Send me a note.</p>
          <small>Your details will only be used to respond to your message.</small>
        </div>

        {submitState === 'error' && (
          <section className="contact-error-banner" role="alert">
            <h3 ref={errorHeadingRef} tabIndex={-1}>That didn’t send.</h3>
            <p>
              {import.meta.env.DEV && !FORMSPREE_ENDPOINT
                ? 'The local Formspree form ID is not configured. Your message is still here.'
                : 'Your message is still here. Try again, or email me directly.'}
            </p>
            <div className="contact-error-actions">
              <button className="secondary-button compact" type="button" onClick={() => formRef.current?.requestSubmit()}>Try again</button>
              <a className="secondary-button compact" href={DIRECT_EMAIL}>Email me directly</a>
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
              placeholder="Penuel"
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
              placeholder="Stanley-Zebulon"
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
            placeholder="you@example.com"
            required
            maxLength={254}
            value={values.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'contact-email-error' : undefined}
            onChange={(event) => updateField('email', event.target.value)}
          />
          {errors.email && <span id="contact-email-error" className="contact-field-error">{errors.email}</span>}
        </div>

        <div className="contact-field">
          <label htmlFor="contact-message">Message</label>
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
            aria-describedby={`contact-message-count${errors.message ? ' contact-message-error' : ''}`}
            onChange={(event) => updateField('message', event.target.value)}
          />
          <div className="contact-message-meta">
            {errors.message ? <span id="contact-message-error" className="contact-field-error">{errors.message}</span> : <span />}
            <span id="contact-message-count" className="contact-character-count">{values.message.length} / 2000</span>
          </div>
        </div>

        <div className="contact-honeypot" role="none" aria-hidden="true" hidden>
          <label htmlFor="contact-website" aria-hidden="true">Website</label>
          <input id="contact-website" name="_gotcha" type="text" tabIndex={-1} autoComplete="off" aria-hidden="true" value={values.website} onChange={(event) => updateField('website', event.target.value)} />
        </div>

        <div className="contact-submit-row">
          <button className="primary-button compact contact-submit" type="submit" disabled={submitState === 'sending'}>
            {submitState === 'sending' && <span className="contact-progress" aria-hidden="true" />}
            {submitState === 'sending' ? 'Sending…' : 'Send message'}
          </button>
          <span aria-live="polite" className="sr-only">{submitState === 'sending' ? 'Sending your message.' : ''}</span>
          <a className="contact-direct-email" href={DIRECT_EMAIL}>Prefer email? Write directly.</a>
        </div>
      </form>

      {discardOpen && (
        <div className="contact-discard-backdrop" role="alertdialog" aria-modal="true" aria-labelledby="contact-discard-title" onKeyDown={(event) => { if (event.key === 'Escape') setDiscardOpen(false); }}>
          <div className="contact-discard-card">
            <span className="mail-symbol" aria-hidden="true">✉</span>
            <h2 id="contact-discard-title">Discard this message?</h2>
            <p>Your draft will be cleared.</p>
            <div className="contact-state-actions">
              <button ref={keepWritingRef} className="primary-button compact" type="button" onClick={() => setDiscardOpen(false)}>Keep writing</button>
              <button className="secondary-button compact" type="button" onClick={closeAndClear}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
