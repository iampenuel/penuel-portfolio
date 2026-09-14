/** Existing Formspree transport, shared by every shell and mockable without sending mail. */
export async function submitContact(
  endpoint: string,
  values: { firstName: string; lastName: string; email: string; message: string },
  fetcher: typeof fetch = fetch
) {
  const body = new FormData();
  body.append('First name', values.firstName);
  body.append('Last name', values.lastName);
  body.append('Email', values.email);
  body.append('Message', values.message);
  body.append('_replyto', values.email);
  body.append('_subject', 'New message from Penuel’s portfolio');
  body.append('Source', 'Penuel Portfolio Contact');
  const response = await fetcher(endpoint, {
    method: 'POST',
    body,
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) throw new Error('Formspree rejected the contact submission.');
}
