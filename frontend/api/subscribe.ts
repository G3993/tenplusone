// Vercel serverless function: POST /api/subscribe
//
// Persists to Vercel KV if KV_REST_API_URL + KV_REST_API_TOKEN are set in
// the project's environment. Without those env vars, the function is a
// no-op that returns 200 so the client UX stays consistent (localStorage
// is the durable visitor receipt either way).
//
// To enable persistence:
//   1. Vercel dashboard → Storage → Create a KV database
//   2. Connect it to the iFC project; both env vars land automatically
//   3. Redeploy

interface SubscribeBody {
  email?: unknown;
}

const KV_URL = process.env.KV_REST_API_URL ?? '';
const KV_TOKEN = process.env.KV_REST_API_TOKEN ?? '';
const KV_AVAILABLE = KV_URL.length > 0 && KV_TOKEN.length > 0;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function kvSaveSubscriber(email: string): Promise<boolean> {
  if (!KV_AVAILABLE) return false;
  // Use SADD on a single Set so dedup is automatic.
  const res = await fetch(`${KV_URL}/sadd/ifc:subscribers/${encodeURIComponent(email)}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KV_TOKEN}` },
  });
  return res.ok;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return json(405, { ok: false, error: 'method not allowed' });
  }

  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return json(400, { ok: false, error: 'invalid json' });
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email)) {
    return json(400, { ok: false, error: 'invalid email' });
  }

  if (!KV_AVAILABLE) {
    // KV not wired yet. Return success so the client UX is unaffected;
    // visitor's email still lives in their localStorage as a fallback.
    return json(200, { ok: true, stored: 'localStorage-only' });
  }

  try {
    const saved = await kvSaveSubscriber(email);
    return json(saved ? 200 : 502, {
      ok: saved,
      stored: saved ? 'vercel-kv' : 'failed',
    });
  } catch (err) {
    console.error('subscribe failed', err);
    return json(500, { ok: false, error: 'server error' });
  }
}

export const config = { runtime: 'edge' };
