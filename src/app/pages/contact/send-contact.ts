export type ContactKind = 'quick' | 'project' | 'beta';

export interface ContactRequest {
  name: string;
  email: string;
  message: string;
  website: string;
  kind: ContactKind;
}

/** Posts to the contact API. Throws an Error with a user-facing message on failure. */
export async function sendContact(request: ContactRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  } catch {
    throw new Error('Network error — please check your connection and try again.');
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Something went wrong.' }));
    throw new Error(body.error ?? 'Something went wrong.');
  }
}
