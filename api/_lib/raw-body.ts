import type { IncomingMessage } from 'node:http';

/**
 * Reads the unparsed request body. Webhook signatures are computed over the
 * exact bytes sent, so the parsed `req.body` can't be used for verification.
 */
export async function readRawBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}
