import { describe, expect, it } from 'vitest';
import { validateContactPayload } from './validate-contact';

describe('validateContactPayload', () => {
  it('accepts a well-formed payload', () => {
    const result = validateContactPayload({
      name: 'Jane Doe',
      email: 'jane@example.com',
      message: 'Hello there.',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data).toEqual({
        name: 'Jane Doe',
        email: 'jane@example.com',
        message: 'Hello there.',
      });
    }
  });

  it('rejects a missing name', () => {
    const result = validateContactPayload({ email: 'jane@example.com', message: 'Hi' });
    expect(result.valid).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = validateContactPayload({
      name: 'Jane Doe',
      email: 'not-an-email',
      message: 'Hi',
    });
    expect(result.valid).toBe(false);
  });

  it('rejects a missing message', () => {
    const result = validateContactPayload({ name: 'Jane Doe', email: 'jane@example.com' });
    expect(result.valid).toBe(false);
  });

  it('rejects a non-object body', () => {
    const result = validateContactPayload('not an object');
    expect(result.valid).toBe(false);
  });

  it('trims whitespace from valid fields', () => {
    const result = validateContactPayload({
      name: '  Jane Doe  ',
      email: '  jane@example.com  ',
      message: '  Hi  ',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe('Jane Doe');
    }
  });
});
