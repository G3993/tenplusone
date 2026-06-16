/**
 * Host a finished-match identity asset (per team).
 *
 *   POST /api/match-asset
 *   body: { matchId, team, kind: 'png' | 'mp4', dataBase64, title? }
 *
 * Stores the asset in Vercel Blob under match-identity/<matchId>/<team>.<ext>
 * and returns its public URL, so every finished match yields shareable,
 * embeddable result assets (a still PNG + an infinite-loop MP4) for each team.
 *
 * Credential-gated, like the print loop: without BLOB_READ_WRITE_TOKEN it
 * returns { configured: false } so the client just keeps the local download
 * working instead of erroring. Enable by adding a Vercel Blob store to the
 * project (sets BLOB_READ_WRITE_TOKEN automatically).
 *
 * Node runtime (not edge): @vercel/blob's uploader needs Node streams, and the
 * Node runtime also allows the larger request bodies these assets need. Very
 * large MP4s still exceed the platform body cap — the client only posts video
 * under the cap and otherwise keeps the local download (see IdentityExport).
 */
export const config = { runtime: 'nodejs' };

interface Body {
  matchId?: string;
  team?: string;
  kind?: 'png' | 'mp4';
  dataBase64?: string;
}

// minimal Vercel Node req/res shape (avoids an @vercel/node type dependency)
interface Req { method?: string; body?: unknown }
interface Res { status: (n: number) => Res; json: (b: unknown) => void }

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export default async function handler(req: Req, res: Res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'POST only' }); return; }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(200).json({ configured: false, message: 'asset hosting connects when a Vercel Blob store is added' });
    return;
  }

  const body = (typeof req.body === 'string' ? safeParse(req.body) : req.body) as Body | null;
  const matchId = body?.matchId, team = body?.team, kind = body?.kind, dataBase64 = body?.dataBase64;
  if (!matchId || !team || !dataBase64 || (kind !== 'png' && kind !== 'mp4')) {
    res.status(400).json({ error: 'matchId, team, kind (png|mp4) and dataBase64 required' });
    return;
  }

  try {
    const ext = kind === 'png' ? 'png' : 'mp4';
    const contentType = kind === 'png' ? 'image/png' : 'video/mp4';
    const bytes = Buffer.from(dataBase64, 'base64');
    const { put } = await import('@vercel/blob');
    const pathname = `match-identity/${slug(matchId)}/${slug(team)}.${ext}`;
    const result = await put(pathname, bytes, {
      access: 'public',
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    res.status(200).json({ configured: true, hosted: true, kind, team, url: result.url });
  } catch (e) {
    res.status(500).json({ configured: true, hosted: false, error: (e as Error).message });
  }
}

function safeParse(s: string): unknown { try { return JSON.parse(s); } catch { return null; } }
