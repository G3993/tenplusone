import { useState } from 'react';
import { Link } from 'react-router';
import { YouTubeIcon, InstagramIcon, TikTokIcon } from './SocialIcons';
import styles from './Footer.module.css';

const SUBS_KEY = 'tenplusone-subscribers';

function saveSubscriber(email: string) {
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    const list: string[] = raw ? JSON.parse(raw) : [];
    if (!list.includes(email)) list.push(email);
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable */
  }
}

async function postSubscriber(email: string) {
  // Best-effort POST to the serverless endpoint. Failure is silent —
  // the localStorage copy is the durable receipt for the visitor.
  try {
    await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
  } catch {
    /* network or endpoint unavailable */
  }
}

const SHOP_LINKS = [
  { to: '/merch', label: 'all merch' },
  { to: '/teams', label: 'shop by nation' },
  { to: '/wc26', label: 'world cup 2026' },
];

const HELP_LINKS = [
  { to: '/shipping', label: 'shipping & returns' },
  { to: '/faq', label: 'faq' },
  { to: '/contact', label: 'contact' },
];

const ABOUT_LINKS = [
  { to: '/about', label: 'about iFC' },
  { to: '/privacy', label: 'privacy' },
  { to: '/terms', label: 'terms' },
];

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'ok'>('idle');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) return;
    saveSubscriber(trimmed);
    void postSubscriber(trimmed);
    setStatus('ok');
    setEmail('');
  }

  return (
    <footer className={styles.footer}>
      <div className={styles.cols}>
        <section className={styles.col} aria-labelledby="ft-brand">
          <h2 id="ft-brand" className={styles.brand}>internet fc</h2>
          <p className={styles.tagline}>
            48 nations, every crest on the same pixel grid.
            browse, predict, own a tournament you actually love.
          </p>
          <div className={styles.socials} aria-label="iFC on social">
            <a
              href="https://www.youtube.com/@internetfc"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="iFC on YouTube"
            >
              <YouTubeIcon />
            </a>
            <a
              href="https://www.instagram.com/internetfc"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="iFC on Instagram"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://www.tiktok.com/@internetfc"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.social}
              aria-label="iFC on TikTok"
            >
              <TikTokIcon />
            </a>
          </div>
        </section>

        <section className={styles.col} aria-labelledby="ft-shop">
          <h2 id="ft-shop" className={styles.colHead}>shop</h2>
          <nav className={styles.colNav}>
            {SHOP_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={styles.colLink}>{l.label}</Link>
            ))}
          </nav>
        </section>

        <section className={styles.col} aria-labelledby="ft-help">
          <h2 id="ft-help" className={styles.colHead}>help</h2>
          <nav className={styles.colNav}>
            {HELP_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={styles.colLink}>{l.label}</Link>
            ))}
          </nav>
        </section>

        <section className={styles.col} aria-labelledby="ft-club">
          <h2 id="ft-club" className={styles.colHead}>the club</h2>
          <nav className={styles.colNav}>
            {ABOUT_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className={styles.colLink}>{l.label}</Link>
            ))}
            {/* Logo Lab — the brand crest system. Footer-only entry. */}
            <Link to="/logos" className={styles.colLink}>logo lab</Link>
          </nav>
        </section>

        <section className={styles.col} aria-labelledby="ft-sub">
          <h2 id="ft-sub" className={styles.colHead}>tournament updates</h2>
          <p className={styles.subCopy}>
            kickoff alerts, fixture drops, new crests in the shop. zero spam.
          </p>
          <form className={styles.subscribe} onSubmit={onSubmit}>
            {status === 'ok' ? (
              <span className={styles.subOk}>&check; you&rsquo;re in. see you at kickoff.</span>
            ) : (
              <>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className={styles.subInput}
                  aria-label="Email address"
                />
                <button type="submit" className={styles.subBtn}>subscribe</button>
              </>
            )}
          </form>
        </section>
      </div>
    </footer>
  );
}
