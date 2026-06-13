import { useRef, useState } from 'react';

/** Identity → merch. Captures the live game-identity art at print resolution,
 *  generates automatic tee + tote mockups (composited client-side), and offers
 *  to claim the 1-of-1 (POSTs the art to the Printify print loop). */
export function IdentityMerch({ title, accent, capture }: {
  title: string;
  accent: string;
  /** render the current identity onto `cv` at `cell` px/pixel (cv = 32*cell square) */
  capture: (cv: HTMLCanvasElement, cell: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const [claim, setClaim] = useState<'idle' | 'working' | 'done' | 'pending' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const teeRef = useRef<HTMLCanvasElement>(null);
  const toteRef = useRef<HTMLCanvasElement>(null);
  const artRef = useRef<HTMLCanvasElement>(null);

  // Paint the design + the two garment mockups when the sheet opens.
  const build = () => {
    // 1) the design itself, at a workable resolution
    const art = artRef.current ?? document.createElement('canvas');
    capture(art, 24); // 24*32 = 768px
    // 2) composite onto simple garment silhouettes
    drawTee(teeRef.current, art);
    drawTote(toteRef.current, art);
  };

  const onOpen = () => { setOpen(true); setClaim('idle'); setMsg(''); requestAnimationFrame(build); };

  const onClaim = async () => {
    setClaim('working'); setMsg('');
    try {
      const cv = document.createElement('canvas');
      capture(cv, 64); // 2048px print file
      const imageBase64 = cv.toDataURL('image/png').split(',')[1];
      const r = await fetch('/api/print-design', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, imageBase64 }),
      });
      const d = await r.json();
      if (d.configured === false) { setClaim('pending'); setMsg(d.message || 'this 1-of-1 mints the moment the print pipe is connected.'); }
      else if (d.configured) { setClaim('done'); setMsg('claimed — your 1-of-1 is being made.'); }
      else { setClaim('error'); setMsg(d.error || 'could not claim'); }
    } catch {
      setClaim('error'); setMsg('could not reach the print loop');
    }
  };

  return (
    <>
      <button type="button" className="gi-claim" style={{ '--team': accent } as React.CSSProperties} onClick={onOpen}>
        CLAIM THIS · 1 / 1
      </button>

      {open && (
        <div className="gi-merch-overlay" onClick={() => setOpen(false)}>
          <div className="gi-merch" onClick={(e) => e.stopPropagation()} style={{ '--team': accent } as React.CSSProperties}>
            <div className="gi-merch-head">
              <span className="gi-merch-title">{title}</span>
              <button className="gi-merch-x" onClick={() => setOpen(false)} aria-label="close">×</button>
            </div>
            <p className="gi-merch-sub">a one-of-one, generated from this match. no other game makes it.</p>
            <div className="gi-merch-grid">
              <figure><canvas ref={artRef} className="gi-merch-art" /><figcaption>the identity</figcaption></figure>
              <figure><canvas ref={teeRef} width={420} height={460} /><figcaption>tee · $35</figcaption></figure>
              <figure><canvas ref={toteRef} width={420} height={460} /><figcaption>tote · $25</figcaption></figure>
            </div>
            <button type="button" className="gi-merch-buy" onClick={onClaim} disabled={claim === 'working' || claim === 'done'}>
              {claim === 'working' ? 'CLAIMING…' : claim === 'done' ? 'CLAIMED ✓' : 'CLAIM YOUR 1 / 1'}
            </button>
            {msg && <p className="gi-merch-msg">{msg}</p>}
          </div>
        </div>
      )}
    </>
  );
}

/* ---- client-side garment mockups (canvas silhouettes) ---- */
function fitArt(ctx: CanvasRenderingContext2D, art: HTMLCanvasElement, cx: number, cy: number, w: number) {
  const h = w; // square art
  ctx.drawImage(art, cx - w / 2, cy - h / 2, w, h);
}

function drawTee(cv: HTMLCanvasElement | null, art: HTMLCanvasElement) {
  if (!cv) return;
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, W, H);
  // tee silhouette
  ctx.fillStyle = '#15161a';
  ctx.beginPath();
  const cx = W / 2;
  ctx.moveTo(cx - 90, 70); ctx.lineTo(cx - 150, 110); ctx.lineTo(cx - 120, 175); ctx.lineTo(cx - 78, 150);
  ctx.lineTo(cx - 78, 410); ctx.lineTo(cx + 78, 410); ctx.lineTo(cx + 78, 150);
  ctx.lineTo(cx + 120, 175); ctx.lineTo(cx + 150, 110); ctx.lineTo(cx + 90, 70);
  ctx.quadraticCurveTo(cx, 110, cx - 90, 70);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1; ctx.stroke();
  // collar
  ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.beginPath();
  ctx.moveTo(cx - 38, 78); ctx.quadraticCurveTo(cx, 118, cx + 38, 78); ctx.stroke();
  // chest print
  fitArt(ctx, art, cx, 250, 150);
}

function drawTote(cv: HTMLCanvasElement | null, art: HTMLCanvasElement) {
  if (!cv) return;
  const ctx = cv.getContext('2d'); if (!ctx) return;
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#0b0b0b'; ctx.fillRect(0, 0, W, H);
  const cx = W / 2;
  // handles
  ctx.strokeStyle = '#d9d2bf'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(cx - 70, 120); ctx.bezierCurveTo(cx - 60, 40, cx - 20, 40, cx - 12, 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + 70, 120); ctx.bezierCurveTo(cx + 60, 40, cx + 20, 40, cx + 12, 120); ctx.stroke();
  // bag body (natural canvas)
  ctx.fillStyle = '#e7dfca';
  ctx.fillRect(cx - 120, 120, 240, 290);
  ctx.fillStyle = 'rgba(0,0,0,0.04)'; ctx.fillRect(cx - 120, 120, 240, 14);
  // print
  fitArt(ctx, art, cx, 270, 150);
}
