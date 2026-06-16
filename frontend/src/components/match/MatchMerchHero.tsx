import { useEffect, useRef, useState } from 'react';
import { useMatchLive } from '../../lib/useMatchLive';
import { getTeamByName, teamAccent } from '../../data/teams';
import { paintIdentity } from './identityPaint';
import { IdentityMerch } from './IdentityMerch';
import styles from './MatchMerchHero.module.css';

// The garment the hero leads on, plus the chest/centre print box (matches the
// store mockups used in the collect modal and on product cards).
const HERO_GARMENT = { src: '/shirt-white.png', label: 'tee', price: '$35', top: 29, w: 27 };
const SIDE_GARMENTS = [
  { src: '/crew-white.png', label: 'crewneck', price: '$50', top: 31, w: 25 },
  { src: '/shirt-white.png', label: 'long sleeve', price: '$45', top: 29, w: 27 },
];

/** The merch section opens on the thing you actually buy: the match identity
 *  printed 1:1 on the garment. The art is the winner's signature mark (the same
 *  one the identity card opens on), so the store leads with the product, not a
 *  grid of generic items. Sits above the team closets in #match-merch. */
export function MatchMerchHero({ matchId, home, away }: { matchId: string; home: string; away: string }) {
  const { stats, teams, frozen } = useMatchLive(matchId);
  const finished = frozen && stats.status === 'FINISHED';

  const winner = stats.homeGoals > stats.awayGoals ? home : stats.awayGoals > stats.homeGoals ? away : home;
  const shownTeam = getTeamByName(winner);
  const accent = shownTeam ? teamAccent(shownTeam) : '#1d6fe0';

  const [art, setArt] = useState('');
  const heroRef = useRef<HTMLCanvasElement>(null);

  // The signature mark: 3D-neon style on the team's scatter field, painted once
  // at print resolution. Shared paintIdentity keeps it identical to the card.
  const capture = (cv: HTMLCanvasElement, capCell: number) =>
    paintIdentity(cv, {
      name: winner, home, teams, variantMotif: 'team3d',
      fieldConcept: 'scatter', palette: 'team', capCell,
    });

  useEffect(() => {
    if (!finished || !heroRef.current) return;
    capture(heroRef.current, 24); // 768px print-grade preview
    setArt(heroRef.current.toDataURL('image/png'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished, winner, teams]);

  if (!finished || !shownTeam) return null;

  const homeCode = getTeamByName(home)?.code ?? home;
  const awayCode = getTeamByName(away)?.code ?? away;
  const title = `${homeCode} ${stats.homeGoals}–${stats.awayGoals} ${awayCode} · ${winner} identity`;

  return (
    <section className={styles.hero} style={{ '--team': accent } as React.CSSProperties} aria-label="wear the match">
      <canvas ref={heroRef} style={{ display: 'none' }} aria-hidden="true" />
      <div className={styles.head}>
        <span className={styles.eyebrow}>wear the match</span>
        <h2 className={styles.title}>the 1 / 1 drop</h2>
        <p className={styles.sub}>{title} — printed exactly as it stands. one of one.</p>
      </div>

      <div className={styles.stage}>
        <figure className={styles.lead}>
          <div className={styles.garment}>
            <img className={styles.base} src={HERO_GARMENT.src} alt={HERO_GARMENT.label} />
            {art && <img className={styles.print} src={art} alt="" style={{ top: `${HERO_GARMENT.top}%`, width: `${HERO_GARMENT.w}%` }} />}
          </div>
          <figcaption className={styles.cap}>
            <span>{HERO_GARMENT.label}</span>
            <span className={styles.price}>{HERO_GARMENT.price}</span>
          </figcaption>
        </figure>

        <div className={styles.side}>
          {SIDE_GARMENTS.map((g) => (
            <figure key={g.label} className={styles.sideCell}>
              <div className={styles.garment}>
                <img className={styles.base} src={g.src} alt={g.label} />
                {art && <img className={styles.print} src={art} alt="" style={{ top: `${g.top}%`, width: `${g.w}%` }} />}
              </div>
              <figcaption className={styles.cap}>
                <span>{g.label}</span>
                <span className={styles.price}>{g.price}</span>
              </figcaption>
            </figure>
          ))}
          <div className={styles.cta}>
            <IdentityMerch title={title} accent={accent} capture={capture} />
          </div>
        </div>
      </div>
    </section>
  );
}
