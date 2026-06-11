import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { OUTRIGHTS, MATCHES, type Match } from '../data/matches';
import { getTeamByName } from '../data/teams';
import { TeamLogo } from '../components/team/TeamLogo';
import { MotifCrest } from '../components/logos/MotifCrest';
import { InViewport } from '../components/util/InViewport';
import { teamSeed } from '../components/logos/spectrumMotif';
import { getLogoPixels } from '../data/team-logos/index.ts';
import styles from './Bracket.module.css';

// ---- group stage (each group = a bracket column of its fixtures) -----------
const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];

/** A single group game as a bracket box — same look as the knockout matches. */
function GroupMatchBox({ m }: { m: Match }) {
  const home = getTeamByName(m.h);
  const away = getTeamByName(m.a);
  return (
    <Link to={`/match/${m.id}`} className={styles.match}>
      <span className={styles.matchId}>{m.d}</span>
      <span className={styles.slot}>
        {home && <TeamLogo team={home} variant="white" size={18} />}
        <span className={styles.code}>{home?.code ?? m.h}</span>
      </span>
      <span className={styles.slot}>
        {away && <TeamLogo team={away} variant="white" size={18} />}
        <span className={styles.code}>{away?.code ?? m.a}</span>
      </span>
    </Link>
  );
}

/** Group-stage board — every group is a column of its fixtures, in the same
 *  branch/bracket style as the knockout board below it. */
export function GroupStage() {
  const byGroup: Record<string, Match[]> = {};
  for (const m of MATCHES) {
    if (!/^[A-L]$/.test(m.grp)) continue;
    (byGroup[m.grp] ??= []).push(m);
  }
  return (
    <>
      <div className={styles.stageLabel}>group stage</div>
      <div className={`${styles.board} ${styles.groupBoard}`}>
        {GROUP_LETTERS.map((letter) => {
          const games = byGroup[letter] ?? [];
          if (!games.length) return null;
          return (
            <div key={letter} className={styles.col} aria-label={`Group ${letter}`}>
              <div className={styles.colHead}>group {letter}</div>
              <div className={styles.colBody}>
                {games.map((m) => <GroupMatchBox key={m.id} m={m} />)}
              </div>
            </div>
          );
        })}
      </div>
      <div className={styles.flow}>
        <span className="comment">winners &amp; runners-up advance to the knockout bracket ↓</span>
      </div>
      <div className={styles.stageLabel}>knockout</div>
    </>
  );
}

// ---- knockout bracket (structure only — slots, no projected teams) -----
type M = { id: string; a: string; b: string };

const R32: M[] = [
  { id: '73', a: '1A', b: '2B' }, { id: '74', a: '1C', b: '2D' },
  { id: '75', a: '1E', b: '2F' }, { id: '76', a: '1G', b: '2H' },
  { id: '77', a: '1I', b: '2J' }, { id: '78', a: '1K', b: '2L' },
  { id: '79', a: '2A', b: '2C' }, { id: '80', a: '2E', b: '2G' },
  { id: '81', a: '2I', b: '2K' }, { id: '82', a: '1B', b: '1D' },
  { id: '83', a: '1F', b: '1H' }, { id: '84', a: '1J', b: '1L' },
  { id: '85', a: '3A', b: '3B' }, { id: '86', a: '3C', b: '3D' },
  { id: '87', a: '3E', b: '3F' }, { id: '88', a: '3G', b: '3H' },
];

function nextRound(prev: M[], startId: number): M[] {
  const out: M[] = [];
  for (let i = 0; i < prev.length; i += 2) {
    out.push({ id: String(startId + i / 2), a: `W${prev[i].id}`, b: `W${prev[i + 1].id}` });
  }
  return out;
}

const R16 = nextRound(R32, 89);
const QF = nextRound(R16, 97);
const SF = nextRound(QF, 101);
const FINAL: M[] = [{ id: '104', a: `W${SF[0].id}`, b: `W${SF[1].id}` }];

const COLUMNS: { label: string; matches: M[] }[] = [
  { label: 'round of 32', matches: R32 },
  { label: 'round of 16', matches: R16 },
  { label: 'quarterfinals', matches: QF },
  { label: 'semifinals', matches: SF },
  { label: 'final', matches: FINAL },
];

// Look up each knockout slot's real date/time from the fixture list (ids are
// stored as "m73" there, "73" in the bracket structure).
const KO_BY_ID = new Map(MATCHES.map((m) => [m.id.replace(/^m/, ''), m]));
/** "14:00 PDT" → "2:00 PM" — human 12-hour clock, no timezone. */
function to12h(t: string): string {
  const mt = t.match(/^(\d{1,2}):(\d{2})/);
  if (!mt) return t;
  let h = Number(mt[1]);
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mt[2]} ${ampm}`;
}
/** "Jun 28 · 12:00 PM" — minimal day + kickoff. */
function koDate(id: string): string {
  const md = KO_BY_ID.get(id);
  if (!md) return '';
  return [md.d, md.t ? to12h(md.t) : ''].filter(Boolean).join(' · ');
}

function Match({ m }: { m: M }) {
  return (
    <div className={styles.match}>
      <span className={styles.matchId}>{koDate(m.id)}</span>
      <span className={styles.slot}><span className={styles.code}>{m.a}</span></span>
      <span className={styles.slot}><span className={styles.code}>{m.b}</span></span>
    </div>
  );
}

/** Knockout board only — reused by WC26. */
export function KnockoutBracket() {
  return (
    <>
      <div className={`${styles.board} ${styles.bracketBoard}`}>
        {COLUMNS.map((col) => (
          <div key={col.label} className={styles.col}>
            <div className={styles.colHead}>{col.label}</div>
            <div className={styles.colBody}>
              {col.matches.map((m) => <Match key={m.id} m={m} />)}
            </div>
          </div>
        ))}

        <div className={styles.col}>
          <div className={styles.colHead}>champion</div>
          <div className={styles.colBody}>
            <div className={`${styles.match} ${styles.champ}`}>
              <span className={styles.matchId}>iFC · WC 2026</span>
              <span className={styles.slot}><span className={styles.code}>W104</span></span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// --- outright "to win" race board ---

/** American moneyline → vig-free-ish implied win probability. */
function americanToProb(odds: string): number {
  const n = parseInt(odds.replace('+', ''), 10);
  if (Number.isNaN(n) || n === 0) return 0.04;
  const p = odds.trim().startsWith('-')
    ? Math.abs(n) / (Math.abs(n) + 100)
    : 100 / (n + 100);
  return Math.min(0.96, Math.max(0.02, p));
}

/** Outright (winner) odds — every nation as a floating tile (like the homepage
 *  grid: no background, no borders): animated neon-3D crest, name, and the
 *  implied win % underneath, ordered favourite → longest shot. */
export function OutrightsList() {
  // Crest size mirrors the homepage grid: 180 desktop / 100 mobile.
  const [size, setSize] = useState(180);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 560px)');
    const apply = () => setSize(mq.matches ? 100 : 180);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  return (
    <div className={styles.orWrap}>
      <div className={styles.orHero}>
        <h3 className={styles.orHeroTitle}>who wins?</h3>
        <p className={styles.orHeroSub}>
          choose your winner. everyone&rsquo;s picks aggregate into new live odds.
        </p>
      </div>

      <ol className={styles.winGrid}>
        {OUTRIGHTS.map((o) => {
          const team = getTeamByName(o.team);
          const pct = (americanToProb(o.odds) * 100).toFixed(1);
          const inner = (
            <>
              {team ? (
                <span className={styles.winCrest} style={{ width: size, height: size }}>
                  <InViewport
                    style={{ display: 'block', width: size, height: size }}
                    fallback={<TeamLogo team={team} variant="white" size={size} shape="square" />}
                  >
                    {() => (
                      <MotifCrest
                        motif="team3d"
                        teamId={team.slug}
                        seed={teamSeed(team.slug)}
                        pixels={getLogoPixels(team.slug, team.name[0])}
                        size={size}
                      />
                    )}
                  </InViewport>
                </span>
              ) : (
                <span className={styles.winCrest} style={{ width: size, height: size }} />
              )}
              <span className={styles.winName}>{o.team}</span>
              <span className={styles.winPct}>{pct}%</span>
            </>
          );
          return (
            <li key={o.team}>
              {team ? (
                <Link to={`/team/${team.slug}`} className={styles.winCell}>{inner}</Link>
              ) : (
                <span className={styles.winCell}>{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
