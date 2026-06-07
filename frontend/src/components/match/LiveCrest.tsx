import { useState, useEffect, useMemo } from 'react';
import { SpectrumCrest } from '../logos/SpectrumCrest';
import { MotifCrest, type MotifId } from '../logos/MotifCrest';
import { FRAMES, drawSpectrumCrest } from '../logos/spectrumMotif';
import { setMatchStats, setMotif, setMotifDark, setMotifShape, setMotifSeed, renderMotif } from '../logos/motifEngine';
import { getLogoPixels } from '../../data/team-logos/index';
import { useThemeStore } from '../../stores/theme';
import { useMatchLive } from '../../lib/useMatchLive';
import { designForMatch, type MatchStats } from '../../lib/matchDesign';
import styles from './LiveCrest.module.css';

interface Props {
  matchId: string;
  /** Team whose crest silhouette the match treatment is applied to. */
  slug: string;
  name: string;
  homeName: string;
  awayName: string;
  size?: number;
}

type Treatment = 'team3d' | 'solid' | 'stats' | 'spectrum';
const TREATMENTS: { key: Treatment; label: string }[] = [
  { key: 'team3d', label: 'Team 3D' },
  { key: 'solid', label: 'Solid' },
  { key: 'stats', label: 'Stats' },
  { key: 'spectrum', label: 'Spectrum' },
];

/** Live match stats -> the motif engine's stat shape (the rest fall back to
 *  the engine defaults via setMatchStats' merge). */
function toEngineStats(s: MatchStats) {
  return {
    goals: s.homeGoals + s.awayGoals,
    shots: s.shots ?? 0,
    cards: s.cards ?? 0,
    possession: s.possession ?? 50,
  };
}

/**
 * The generative match crest. Starts as the muted base, morphs as the match
 * plays — the seed reshuffles with every goal/card and the live stats drive the
 * treatment (goals deepen the Team 3D extrusion, possession shifts color, etc).
 * Freezes at full-time; the frozen state is what gets printed. Switch the
 * treatment with the pills.
 */
export function LiveCrest({ matchId, slug, name, homeName, awayName, size = 300 }: Props) {
  const { stats, frozen, source, replay } = useMatchLive(matchId);
  const params = useMemo(() => designForMatch(matchId, stats), [matchId, stats]);
  const pixels = useMemo(() => getLogoPixels(slug, name[0]), [slug, name]);
  const theme = useThemeStore((s) => s.theme);

  const [treatment, setTreatment] = useState<Treatment>('team3d');

  // Feed live stats into the motif engine so the running MotifCrest reflects the
  // match every frame. Reset to defaults on unmount so other pages aren't tainted.
  useEffect(() => {
    setMatchStats(toEngineStats(stats));
  }, [stats]);
  useEffect(() => () => setMatchStats(undefined), []);

  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (frozen || treatment !== 'spectrum') return;
    const ms = Math.max(70, 220 - params.motion * 140);
    const id = setInterval(() => setFrame((f) => (f + 1) % FRAMES), ms);
    return () => clearInterval(id);
  }, [params.motion, frozen, treatment]);

  // Mint = render the frozen crest at print resolution and hand it to the print
  // loop. Returns gracefully if the Printify key isn't wired yet.
  const [mint, setMint] = useState<'idle' | 'working' | 'done' | 'pending'>('idle');
  const [mintMsg, setMintMsg] = useState('');

  const mintShirt = async () => {
    setMint('working');
    try {
      const cell = 64; // 64 * 32 = 2048px print file
      const cv = document.createElement('canvas');
      const px = cell * 32;
      cv.width = px;
      cv.height = px;
      const ctx = cv.getContext('2d');
      if (!ctx) throw new Error('no canvas ctx');

      if (treatment === 'spectrum') {
        drawSpectrumCrest(ctx, pixels, params.seed, frame, cell, 'square', params.variant);
      } else {
        // Drive the shared engine to the frozen state, then paint the motif.
        setMotif(treatment);
        setMotifDark(theme === 'dark');
        setMotifShape('square');
        setMotifSeed(params.seed);
        setMatchStats(toEngineStats(stats));
        renderMotif(cv, pixels, { cell, applyFill: true, teamId: slug, animate: false, forExport: true, bg: 'rgba(0,0,0,0)', off: 'rgba(0,0,0,0)' });
      }
      const imageBase64 = cv.toDataURL('image/png').split(',')[1];

      const r = await fetch('/api/print-design', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          matchId,
          title: `${homeName} v ${awayName} — full time (${treatment})`,
          imageBase64,
        }),
      });
      const d = await r.json();
      if (d.configured === false) {
        setMint('pending');
        setMintMsg(d.message || 'print pipeline not connected yet');
      } else if (d.configured) {
        setMint('done');
        setMintMsg('minted — shirt created');
      } else {
        setMint('idle');
        setMintMsg(d.error || 'could not mint');
      }
    } catch {
      setMint('idle');
      setMintMsg('could not render the print file');
    }
  };

  const clock = frozen ? 'FULL TIME' : stats.status === 'SCHEDULED' ? 'KICKOFF' : `${stats.minute}'`;

  return (
    <div className={styles.wrap}>
      <div className={`${styles.stage} ${frozen ? styles.frozen : ''}`}>
        {treatment === 'spectrum' ? (
          <SpectrumCrest pixels={pixels} seed={params.seed} frame={frame} size={size} variant={params.variant} />
        ) : (
          <MotifCrest pixels={pixels} seed={params.seed} size={size} motif={treatment as MotifId} teamId={slug} />
        )}
      </div>

      <div className={styles.treatments} role="group" aria-label="shirt treatment">
        {TREATMENTS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={t.key === treatment ? `${styles.pill} ${styles.pillActive}` : styles.pill}
            aria-pressed={t.key === treatment}
            onClick={() => setTreatment(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className={styles.scoreline}>
        <span className={styles.clock}>{clock}</span>
        <span className={styles.score}>
          {homeName} {stats.homeGoals}<span className={styles.dash}>–</span>{stats.awayGoals} {awayName}
        </span>
      </div>

      <div className={styles.caption}>
        {frozen ? (
          <>this design is frozen — it becomes the shirt</>
        ) : stats.status === 'SCHEDULED' ? (
          <>the base crest — it forms as the match plays</>
        ) : (
          <>forming live · driven by the match · freezes at full-time</>
        )}
      </div>

      {frozen && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.mint}
            onClick={mintShirt}
            disabled={mint === 'working' || mint === 'done'}
          >
            {mint === 'working' ? 'minting…' : mint === 'done' ? 'minted ✓' : 'mint this shirt'}
          </button>
          <button type="button" className={styles.replay} onClick={() => { setMint('idle'); setMintMsg(''); replay(); }}>
            ↻ replay
          </button>
        </div>
      )}

      {mintMsg && <div className={styles.mintMsg}>{mintMsg}</div>}

      {source === 'simulated' && (
        <div className={styles.sim}>simulated match · live feed flips on with the data key</div>
      )}
    </div>
  );
}
