import { describe, expect, it } from 'vitest';
import { isHoneypotTriggered, validateContactPayload } from './validate-contact';

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

  it('strips control characters (including CR/LF) from the validated name', () => {
    const result = validateContactPayload({
      name: 'Jane\r\nBcc: attacker@example.com',
      email: 'jane@example.com',
      message: 'Hi',
    });

    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.data.name).toBe('JaneBcc: attacker@example.com');
      expect(result.data.name).not.toMatch(/[\r\n]/);
    }
  });
});

describe('isHoneypotTriggered', () => {
  it('returns true when website is a non-empty string', () => {
    expect(isHoneypotTriggered({ website: 'http://spam.example' })).toBe(true);
  });

  it('returns false when website is absent', () => {
    expect(isHoneypotTriggered({ name: 'Jane Doe' })).toBe(false);
  });

  it('returns false when website is an empty string', () => {
    expect(isHoneypotTriggered({ website: '' })).toBe(false);
  });

  it('returns false for a non-object body', () => {
    expect(isHoneypotTriggered('not an object')).toBe(false);
  });
});
