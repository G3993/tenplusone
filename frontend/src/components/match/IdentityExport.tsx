import { useState, type CSSProperties } from 'react';
import { recordLoopMp4, mp4Supported } from '../../lib/recordLoopMp4';
import styles from './IdentityExport.module.css';

/** Export the final match result, per team: a still PNG and an infinite-loop
 *  MP4 of the identity (current style + the real box score). Downloads locally
 *  and posts each asset to /api/match-asset for hosting (no-op until a Blob
 *  store is connected). */

const slug = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const blobToB64 = (b: Blob) =>
  new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onloadend = () => res(String(r.result).split(',')[1] ?? '');
    r.onerror = rej;
    r.readAsDataURL(b);
  });

type DrawFn = (name: string, cv: HTMLCanvasElement, cell: number, o?: { time?: number; bg?: string }) => void;

export function IdentityExport({ teams, matchId, baseName, accent, draw }: {
  teams: { name: string; code: string }[];
  matchId: string;
  baseName: string;
  accent: string;
  draw: DrawFn;
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const download = (blob: Blob, name: string) => {
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000);
  };

  const host = async (team: string, kind: 'png' | 'mp4', blob: Blob) => {
    if (kind === 'mp4' && blob.size > 3_800_000) return; // Edge body cap — skip hosting big clips
    try {
      const dataBase64 = await blobToB64(blob);
      await fetch('/api/match-asset', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ matchId, team, kind, dataBase64, title: baseName }),
      });
    } catch { /* hosting is best-effort; the local download already succeeded */ }
  };

  const run = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const canMp4 = mp4Supported();
      for (const t of teams) {
        // still PNG — hi-res, transparent background
        setMsg(`${t.code} image…`);
        const png = document.createElement('canvas');
        draw(t.name, png, 64, { bg: 'rgba(0,0,0,0)' });
        const pngBlob = await new Promise<Blob>((res) => png.toBlob((b) => res(b as Blob), 'image/png'));
        download(pngBlob, `${baseName}_${slug(t.name)}.png`);
        await host(t.name, 'png', pngBlob);

        // infinite-loop MP4 of the animated identity
        if (canMp4) {
          setMsg(`${t.code} loop video…`);
          const mp4 = await recordLoopMp4({
            size: 1024, fps: 30, forwardSeconds: 2.2,
            drawFrame: (cv, time) => draw(t.name, cv, 32, { time, bg: '#000' }),
            onProgress: (d, total) => setMsg(`${t.code} loop video… ${Math.round((d / total) * 100)}%`),
          });
          download(mp4, `${baseName}_${slug(t.name)}.mp4`);
          await host(t.name, 'mp4', mp4);
        }
      }
      setMsg(canMp4 ? 'saved — png + loop video per team' : 'saved pngs · loop video needs a chromium browser');
    } catch (e) {
      setMsg('export failed: ' + (e as Error).message);
    } finally {
      setBusy(false);
      setTimeout(() => setMsg(''), 6000);
    }
  };

  return (
    <>
      <button
        type="button"
        className={styles.exportBtn}
        style={{ '--team': accent } as CSSProperties}
        onClick={run}
        disabled={busy}
        aria-label="export results — png and loop video for each team"
        title="export results (PNG + infinite-loop video, per team)"
      >
        {busy ? (
          <span className={styles.spin} aria-hidden="true" />
        ) : (
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M12 3v11m0 0l-4-4m4 4l4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
      </button>
      {msg && <span className={styles.exportMsg}>{msg}</span>}
    </>
  );
}
