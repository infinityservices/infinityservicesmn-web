/** Which form on the site sent the message. Shown in the email subject. */
export type ContactKind = 'quick' | 'project' | 'beta';

const CONTACT_KINDS: readonly ContactKind[] = ['quick', 'project', 'beta'];

export interface ContactPayload {
  name: string;
  email: string;
  message: string;
  kind: ContactKind;
}

export interface RawContactBody {
  name?: unknown;
  email?: unknown;
  message?: unknown;
  website?: unknown;
  kind?: unknown;
}

export type ValidationResult =
  | { valid: true; data: ContactPayload }
  | { valid: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isHoneypotTriggered(body: unknown): boolean {
  if (typeof body !== 'object' || body === null) {
    return false;
  }

  const { website } = body as RawContactBody;
  return typeof website === 'string' && website.trim().length > 0;
}

export function validateContactPayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { name, email, message, kind } = body as RawContactBody;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return { valid: false, error: 'Name is required.' };
  }
  if (name.length > 120) {
    return { valid: false, error: 'Name is too long.' };
  }

  if (typeof email !== 'string' || !EMAIL_PATTERN.test(email.trim())) {
    return { valid: false, error: 'A valid email address is required.' };
  }
  if (email.length > 200) {
    return { valid: false, error: 'Email is too long.' };
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    return { valid: false, error: 'Message is required.' };
  }
  if (message.length > 4000) {
    return { valid: false, error: 'Message is too long.' };
  }

  // Unknown or missing kinds fall back to a plain message rather than failing.
  const safeKind: ContactKind = CONTACT_KINDS.includes(kind as ContactKind)
    ? (kind as ContactKind)
    : 'quick';

  return {
    valid: true,
    data: {
      name: name.trim().replace(/[\x00-\x1F\x7F]/g, ''),
      email: email.trim(),
      message: message.trim(),
      kind: safeKind,
    },
  };
}
