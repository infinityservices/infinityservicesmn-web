export interface ContactPayload {
  name: string;
  email: string;
  message: string;
}

export type ValidationResult =
  | { valid: true; data: ContactPayload }
  | { valid: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateContactPayload(body: unknown): ValidationResult {
  if (typeof body !== 'object' || body === null) {
    return { valid: false, error: 'Request body must be a JSON object.' };
  }

  const { name, email, message } = body as Record<string, unknown>;

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

  return {
    valid: true,
    data: { name: name.trim(), email: email.trim(), message: message.trim() },
  };
}
