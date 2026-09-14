import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedFieldNotes } from '../src/data/fieldNotes.ts';
import { fieldNotePath, resolvePortfolioRoute } from '../src/lib/portfolioRoutes.ts';
import { submitContact } from '../src/lib/contactSubmission.ts';

test('every published note retains its direct route and index/back destination', () => {
  for (const note of publishedFieldNotes) {
    const path = fieldNotePath(note.slug);
    assert.equal(resolvePortfolioRoute(path).fieldNoteSlug, note.slug);
    assert.equal(resolvePortfolioRoute(`${path}/`).pathname, path);
  }
  assert.equal(fieldNotePath(), '/field-notes');
  assert.equal(resolvePortfolioRoute('/').appId, null);
});

const values = { firstName: 'Test', lastName: 'Visitor', email: 'test@example.invalid', message: 'Mock submission only.' };
test('Contact handles a mocked success with the unchanged Formspree payload', async () => {
  let calls = 0;
  await submitContact('https://example.invalid/contact', values, async (url, options) => {
    calls++;
    assert.equal(url, 'https://example.invalid/contact');
    assert.equal(options.method, 'POST');
    assert.deepEqual(options.headers, { Accept: 'application/json' });
    assert.deepEqual(Object.fromEntries(options.body), {
      'First name': values.firstName, 'Last name': values.lastName, Email: values.email,
      Message: values.message, _replyto: values.email,
      _subject: 'New message from Penuel’s portfolio', Source: 'Penuel Portfolio Contact'
    });
    return new Response('{}', { status: 200 });
  });
  assert.equal(calls, 1);
});

test('Contact propagates mocked rejection and network errors without mutating the draft', async () => {
  const original = { ...values };
  await assert.rejects(submitContact('https://example.invalid/contact', values,
    async () => new Response('{}', { status: 422 })), /Formspree rejected/);
  await assert.rejects(submitContact('https://example.invalid/contact', values,
    async () => { throw new Error('Offline'); }), /Offline/);
  assert.deepEqual(values, original);
});
