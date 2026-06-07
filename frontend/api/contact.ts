// Vercel serverless function: POST /api/contact
//
// Forwards the form to RESEND_API_KEY → hello@internetfc.com if the key
// is configured; otherwise logs and returns 200 so the client UX stays
// consistent. A copy is always written to the KV "ifc:contact" list when
// KV is available.

interface ContactBody {
  name?: unknown;
  email?: unknown;
  topic?: unknown;
  message?: unknown;
}

const RESEND_KEY = process.env.RESEND_API_KEY ?? '';
const KV_URL = process.env.KV_REST_API_URL ?? '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const TO = 'hello@internetfc.com';
const FROM = 'iFC contact <noreply@internetfc.com>';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function asString(v: unknown, max = 5000): string {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function kvLog(payload: object): Promise<void> {
  if (!KV_URL || !KV_TOKEN) return;
  try {
    await fetch(`${KV_URL}/lpush/ifc:contact/${encodeURIComponent(JSON.stringify(payload))}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${KV_TOKEN}` },
    });
  } catch {
    /* swallow */
  }
}

async function resendSend(payload: { name: string; email: string; topic: string; message: string }): Promise<boolean> {
  if (!RESEND_KEY) return false;
  const subject = `iFC contact: ${payload.topic} from ${payload.name || payload.email}`;
  const html = [
    `<p><strong>From:</strong> ${payload.name || '(no name)'} &lt;${payload.email}&gt;</p>`,
    `<p><strong>Topic:</strong> ${payload.topic}</p>`,
    `<p><strong>Message:</strong></p>`,
    `<pre style="white-space:pre-wrap;font-family:inherit">${payload.message}</pre>`,
  ].join('');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: TO, subject, reply_to: payload.email, html }),
  });
  return res.ok;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'method not allowed' });
  }

  let body: ContactBody;
  try {
    body = (await req.json()) as ContactBody;
  } catch {
    return json(400, { ok: false, error: 'invalid json' });
  }

  const email = asString(body.email, 200).toLowerCase();
  const message = asString(body.message);
  if (!EMAIL_RE.test(email) || !message) {
    return json(400, { ok: false, error: 'email and message required' });
  }

  const payload = {
    name: asString(body.name, 200),
    email,
    topic: asString(body.topic, 50) || 'other',
    message,
    at: new Date().toISOString(),
  };

  await kvLog(payload);
  const emailed = await resendSend(payload);
  return json(200, { ok: true, emailed });
}

export const config = { runtime: 'edge' };
