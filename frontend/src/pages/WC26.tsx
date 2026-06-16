import { useState, useEffect, useRef } from 'react';
import { Groups } from './Groups';
import { UpcomingMatches } from '../components/home/UpcomingMatches';
import { KnockoutBracket, OutrightsList } from './Bracket';
import styles from './WC26.module.css';

type SectionId = 'matches' | 'groups' | 'bracket' | 'winner';

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: 'groups', label: 'groups' },
  { id: 'matches', label: 'matches' },
  { id: 'bracket', label: 'bracket' },
  { id: 'winner', label: 'predictions' },
];

/**
 * One long page: every section is stacked and rendered at once. The sticky
 * pill bar is pagination — it scroll-jumps to a section and highlights the one
 * currently in view (scroll-spy). Winner prediction lives at the very bottom,
 * below the bracket, as its own section.
 */
export function WC26() {
  const [active, setActive] = useState<SectionId>('groups');
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id as SectionId);
      },
      // Active when a section's top crosses the upper third of the viewport.
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );
    SECTIONS.forEach((s) => { const el = refs.current[s.id]; if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, []);

  const jump = (id: SectionId) => refs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className={styles.page}>
      {/* sticky pagination — jumps to + tracks the section in view */}
      <nav className={styles.jump} aria-label="Tournament sections">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(s.id)}
            className={`${styles.jumpLink} ${active === s.id ? styles.jumpActive : ''}`}
            aria-current={active === s.id ? 'true' : undefined}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <section id="groups" ref={(el) => { refs.current.groups = el; }} className={styles.section}>
        <Groups />
      </section>

      <section id="matches" ref={(el) => { refs.current.matches = el; }} className={styles.section}>
        <UpcomingMatches showOdds showCta={false} heading="World Cup Matches" />
      </section>

      <section id="bracket" ref={(el) => { refs.current.bracket = el; }} className={styles.section}>
        <div className={styles.pad}>
          <KnockoutBracket />
        </div>
      </section>

      {/* winner prediction — its own section at the very bottom, below the
          bracket. Fully centered: its centered hero is the title (no left
          section header), so it reads as the eventful finale of the page. */}
      <section id="winner" ref={(el) => { refs.current.winner = el; }} className={styles.section}>
        <OutrightsList />
      </section>
    </div>
  );
}
