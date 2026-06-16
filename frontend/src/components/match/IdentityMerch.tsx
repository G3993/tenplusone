import { useState } from 'react';
import { createPortal } from 'react-dom';

/** Identity → merch. Captures the live game-identity art at print resolution,
 *  previews it on the site's real garment photos (the same mockups the shop
 *  uses), and claims the 1-of-1 (POSTs the art to the Printify print loop). */

// Real garment photos shipped with the store (used on product cards too), with
// the chest/centre print box for each.
const GARMENTS = [
  { src: '/shirt-white.png', label: 'tee', price: '$35', top: 29, w: 27 },
  { src: '/crew-white.png', label: 'crewneck', price: '$50', top: 31, w: 25 },
  { src: '/shirt-white.png', label: 'long sleeve', price: '$45', top: 29, w: 27 },
];

export function IdentityMerch({ title, accent, capture, icon, onShop }: {
  title: string;
  accent: string;
  capture: (cv: HTMLCanvasElement, cell: number) => void;
  /** render a compact icon trigger (for the floating dock) instead of text */
  icon?: boolean;
  /** "shop the full drop ↓" — scroll the page down to the merch store */
  onShop?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [art, setArt] = useState<string>('');
  const [claim, setClaim] = useState<'idle' | 'working' | 'done' | 'pending' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const onOpen = () => {
    const cv = document.createElement('canvas');
    capture(cv, 24); // 768px preview
    setArt(cv.toDataURL('image/png'));
    setClaim('idle'); setMsg(''); setOpen(true);
  };

  const onClaim = async () => {
    setClaim('working'); setMsg('');
    try {
      const cv = document.createElement('canvas');
      capture(cv, 64); // 2048px print file
      const imageBase64 = cv.toDataURL('image/png').split(',')[1];
      const r = await fetch('/api/print-design', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ title, imageBase64 }),
      });
      const d = await r.json();
      if (d.configured === false) { setClaim('pending'); setMsg(d.message || 'this 1-of-1 mints the moment the print pipe is connected.'); }
      else if (d.configured) { setClaim('done'); setMsg('claimed — your 1-of-1 is being made.'); }
      else { setClaim('error'); setMsg(d.error || 'could not claim'); }
    } catch { setClaim('error'); setMsg('could not reach the print loop'); }
  };

  return (
    <>
      {icon ? (
        <button type="button" className="gi-collect-icon" style={{ '--team': accent } as React.CSSProperties} onClick={onOpen} aria-label="collect — open the drop" title="collect">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M8.5 3.5 4 6l1.5 4 2-0.7V20.5h9V9.3l2 0.7L20 6l-4.5-2.5a3.2 3.2 0 0 1-7 0Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </button>
      ) : (
        <button type="button" className="gi-claim" style={{ '--team': accent } as React.CSSProperties} onClick={onOpen}>
          Collect
        </button>
      )}

      {open && createPortal(
        <div className="gi-merch-overlay" onClick={() => setOpen(false)}>
          <div className="gi-merch" onClick={(e) => e.stopPropagation()} style={{ '--team': accent } as React.CSSProperties}>
            <div className="gi-merch-head">
              <span className="gi-merch-title">{title}</span>
              <button className="gi-merch-x" onClick={() => setOpen(false)} aria-label="close">×</button>
            </div>
            <p className="gi-merch-sub">a one-of-one, generated from this match. no other game makes it.</p>

            <div className="gi-merch-grid">
              <figure className="gi-merch-cell">
                <div className="gi-merch-art-box">{art && <img src={art} alt="the identity" />}</div>
                <figcaption>the identity</figcaption>
              </figure>
              {GARMENTS.map((g) => (
                <figure key={g.label} className="gi-merch-cell">
                  <div className="gi-garment">
                    <img className="gi-garment-base" src={g.src} alt={g.label} />
                    {art && (
                      <img
                        className="gi-garment-print"
                        src={art}
                        alt=""
                        style={{ top: `${g.top}%`, width: `${g.w}%` }}
                      />
                    )}
                  </div>
                  <figcaption>{g.label} · {g.price}</figcaption>
                </figure>
              ))}
            </div>

            <button type="button" className="gi-merch-buy" style={{ '--team': accent } as React.CSSProperties}
              onClick={onClaim} disabled={claim === 'working' || claim === 'done'}>
              {claim === 'working' ? 'COLLECTING…' : claim === 'done' ? 'COLLECTED ✓' : 'COLLECT YOUR 1 / 1'}
            </button>
            {msg && <p className="gi-merch-msg">{msg}</p>}
            {onShop && (
              <button type="button" className="gi-merch-shop" onClick={() => { setOpen(false); onShop(); }}>
                shop the full drop ↓
              </button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
