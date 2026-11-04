import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const send = vi.fn();
vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const saveLead = vi.fn();
vi.mock('./_lib/save-lead', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./_lib/save-lead')>();
  return { ...actual, saveLead: (...args: unknown[]) => saveLead(...args) };
});

import handler from './contact';

function mockRes() {
  const res: { statusCode?: number; body?: unknown; status: any; json: any } = {
    status(code: number) {
      res.statusCode = code;
      return res;
    },
    json(body: unknown) {
      res.body = body;
      return res;
    },
  };
  return res;
}

const validBody = { name: 'Jane', email: 'jane@example.com', message: 'Hi', kind: 'project' };

async function post(body: unknown = validBody) {
  const res = mockRes();
  await handler({ method: 'POST', body } as any, res as any);
  return res;
}

describe('contact handler', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    process.env['CONTACT_TO_EMAIL'] = 'to@example.com';
    process.env['CONTACT_FROM_EMAIL'] = 'from@example.com';
    process.env['RESEND_API_KEY'] = 're_key';
    process.env['SUPABASE_URL'] = 'https://abc.supabase.co';
    process.env['SUPABASE_SERVICE_ROLE_KEY'] = 'service-key';
    send.mockResolvedValue({ data: { id: '1' }, error: null });
    saveLead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    for (const key of [
      'CONTACT_TO_EMAIL',
      'CONTACT_FROM_EMAIL',
      'RESEND_API_KEY',
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
    ]) {
      delete process.env[key];
    }
  });

  it('sends the email and saves the lead', async () => {
    const res = await post();
    expect(res.statusCode).toBe(200);
    expect(send).toHaveBeenCalledOnce();
    expect(saveLead).toHaveBeenCalledWith(
      { name: 'Jane', email: 'jane@example.com', message: 'Hi', kind: 'project' },
      { url: 'https://abc.supabase.co', serviceRoleKey: 'service-key' },
    );
  });

  it('still succeeds when the lead save fails', async () => {
    saveLead.mockRejectedValue(new Error('db down'));
    expect((await post()).statusCode).toBe(200);
  });

  it('still succeeds when the email fails but the lead is saved', async () => {
    send.mockResolvedValue({ data: null, error: { message: 'resend down' } });
    expect((await post()).statusCode).toBe(200);
  });

  it('returns 502 when both the email and the save fail', async () => {
    send.mockRejectedValue(new Error('resend down'));
    saveLead.mockRejectedValue(new Error('db down'));
    expect((await post()).statusCode).toBe(502);
  });

  it('works with only email configured', async () => {
    delete process.env['SUPABASE_URL'];
    const res = await post();
    expect(res.statusCode).toBe(200);
    expect(saveLead).not.toHaveBeenCalled();
  });

  it('returns 500 when nothing is configured', async () => {
    delete process.env['SUPABASE_URL'];
    delete process.env['RESEND_API_KEY'];
    expect((await post()).statusCode).toBe(500);
  });

  it('skips everything for honeypot submissions', async () => {
    const res = await post({ ...validBody, website: 'spam' });
    expect(res.statusCode).toBe(200);
    expect(send).not.toHaveBeenCalled();
    expect(saveLead).not.toHaveBeenCalled();
  });
});
