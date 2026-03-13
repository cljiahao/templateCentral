import https from 'https';

export interface HttpsAgentOptions {
  cert?: string | Buffer;
  key?: string | Buffer;
  ca?: string | Buffer | Array<string | Buffer>;
  rejectUnauthorized?: boolean;
  keepAlive?: boolean;
  maxSockets?: number;
  passphrase?: string;
}

export function createHttpsAgent(options?: HttpsAgentOptions): https.Agent {
  return new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production',
    keepAlive: true,
    maxSockets: 50,
    ...options,
  });
}

export function normalizePem(pem: string): string {
  if (pem.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(pem);
      if (typeof parsed === 'string')
        return parsed.replace(/\\n/g, '\n').trim();
      if (parsed.cert) return String(parsed.cert).replace(/\\n/g, '\n').trim();
    } catch {
      // fall through to string normalization
    }
  }

  return pem.replace(/\\n/g, '\n').replace(/^"|"$/g, '').trim();
}
