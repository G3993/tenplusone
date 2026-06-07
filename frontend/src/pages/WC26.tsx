import { useState } from 'react';
import { Groups } from './Groups';
import { MatchList } from '../components/matches/MatchList';
import { GroupStage, KnockoutBracket, OutrightsList } from './Bracket';
import { MatchCalendar } from '../components/matches/MatchCalendar';
import { InViewport } from '../components/util/InViewport';
import styles from './WC26.module.css';

type TabId = 'groups' | 'matches' | 'bracket' | 'outrights';

const TABS: { id: TabId; label: string }[] = [
  { id: 'matches', label: 'matches' },
  { id: 'groups', label: 'groups' },
  { id: 'bracket', label: 'bracket' },
  { id: 'outrights', label: 'winner prediction' },
];

export function WC26() {
  const [active, setActive] = useState<TabId>('matches');

  return (
    <div className={styles.page}>
      {/* sticky tab bar — one section at a time, no endless scroll */}
      <nav className={styles.jump} aria-label="Tournament sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActive(t.id)}
            className={`${styles.jumpLink} ${active === t.id ? styles.jumpActive : ''}`}
            aria-current={active === t.id ? 'page' : undefined}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className={styles.section}>
        {active === 'groups' && <Groups />}
        {active === 'matches' && (
          <div className={styles.pad}>
            <MatchList />
          </div>
        )}
        {active === 'bracket' && (
          <div className={styles.pad}>
            <GroupStage />
            <KnockoutBracket />
          </div>
        )}
        {active === 'outrights' && (
          <div className={styles.pad}>
            <OutrightsList />
          </div>
        )}
      </section>

      {/* Always below the fold — defer its (all-fixtures) mount until scrolled near. */}
      <InViewport
        rootMargin="500px"
        style={{ display: 'block' }}
        fallback={<div style={{ minHeight: '70vh' }} />}
      >
        {() => <MatchCalendar />}
      </InViewport>
    </div>
  );
}
