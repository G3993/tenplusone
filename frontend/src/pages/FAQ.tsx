import { Link } from 'react-router';
import styles from './Legal.module.css';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'Is internet FC an official tournament site?',
    a: 'No. We are an independent fan project. Crests, club marks, and federation names belong to their respective associations. We love this tournament; we are not the tournament.',
  },
  {
    q: 'How is every logo unique?',
    a: 'Every crest is generated from the real stats of its match: passes, goals, shots, possession. The numbers drive the pixels, so no two games ever produce the same symbol. The final artwork is unlocked at the final whistle, and you can purchase before or after the game. Order before full time and your piece is printed with the artwork the match locks in.',
  },
  {
    q: 'How long does merch take to arrive?',
    a: '3 to 5 business days to print, then 5 to 8 days in the US (free over $75), 7 to 12 to Canada and Mexico, 10 to 18 to the rest of the world. Printed on demand, shipped from the closest facility.',
  },
  {
    q: 'What sizes do you carry?',
    a: 'Tees, jerseys, hoodies, and shorts come in S through XL. Caps, scarves, and beanies are one size. Our cuts run true to size; the size guide on every product page lists exact measurements.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'Yes. Global tracked shipping at checkout. Duties and taxes are paid by the recipient on delivery, calculated by the destination country.',
  },
  {
    q: 'What if my crest is off center or the print is wrong?',
    a: 'Send a photo to team.internetfc@gmail.com within 60 days and we will replace it on us. Printing defects are on us, full stop.',
  },
  {
    q: 'When do new match pieces drop?',
    a: 'Group stage runs Jun 11 to Jun 27, knockouts Jun 28 to Jul 19. Every fixture gets its own piece, and the final artwork unlocks at the final whistle of each game.',
  },
  {
    q: 'Do you offer custom or team bulk orders?',
    a: 'We do for orders of 25 or more units of the same item. Write to team.internetfc@gmail.com with the team, item, and quantity. We will quote within 48 hours.',
  },
];

export default function FAQ() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>FAQ</div>
      <div className={styles.updated}>The questions, answered straight.</div>

      {FAQS.map((f) => (
        <div key={f.q} className={styles.section}>
          <div className={styles.h2}>{f.q}</div>
          <p className={styles.p}>{f.a}</p>
        </div>
      ))}

      <div className={styles.section}>
        <div className={styles.h2}>Didn&rsquo;t find your answer?</div>
        <p className={styles.p}>
          Write us at{' '}
          <a href="mailto:team.internetfc@gmail.com" style={{ color: 'var(--bright)' }}>team.internetfc@gmail.com</a>.
          We reply within one business day.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; Back to home</Link>
    </div>
  );
}
