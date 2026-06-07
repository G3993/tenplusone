import { Link } from 'react-router';
import styles from './Legal.module.css';

const FAQS: { q: string; a: string }[] = [
  {
    q: 'is internet fc an official tournament site?',
    a: 'no. we are an independent fan project. crests, club marks, and federation names belong to their respective associations. we love this tournament; we are not the tournament.',
  },
  {
    q: 'can i bet real money on these predictions?',
    a: 'no. iFC is a free game of skill. odds are synthetic, modeled from team strength so the prediction market feels real, but no money changes hands. your bracket is for bragging rights and a clean conscience.',
  },
  {
    q: 'how long does merch take to arrive?',
    a: '3 to 5 business days to print, then 5 to 8 days in the US (free over $75), 7 to 12 to Canada and Mexico, 10 to 18 to the rest of the world. printed on demand, shipped from the closest facility.',
  },
  {
    q: 'what sizes do you carry?',
    a: 'tees, jerseys, hoodies, and shorts come in S through XL. caps, scarves, and beanies are one size. our cuts run true to size; the size guide on every product page lists exact measurements.',
  },
  {
    q: 'do you ship internationally?',
    a: 'yes. global tracked shipping at checkout. duties and taxes are paid by the recipient on delivery, calculated by the destination country.',
  },
  {
    q: 'what if my crest is off center or the print is wrong?',
    a: 'send a photo to hello@internetfc.com within 60 days and we will replace it on us. printing defects are on us, full stop.',
  },
  {
    q: 'when do new fixtures and posters drop?',
    a: 'group stage runs jun 11 to jun 27, knockouts jun 28 to jul 19. match posters unlock the moment a fixture is set. winners-only posters mint after the final whistle.',
  },
  {
    q: 'do you offer custom or team bulk orders?',
    a: 'we do for orders of 25 or more units of the same item. write to hello@internetfc.com with the team, item, and quantity. we will quote within 48 hours.',
  },
];

export default function FAQ() {
  return (
    <div className={styles.page}>
      <div className={styles.title}>faq</div>
      <div className={styles.updated}>the questions, answered straight</div>

      {FAQS.map((f) => (
        <div key={f.q} className={styles.section}>
          <div className={styles.h2}>{f.q}</div>
          <p className={styles.p}>{f.a}</p>
        </div>
      ))}

      <div className={styles.section}>
        <div className={styles.h2}>didn&rsquo;t find your answer?</div>
        <p className={styles.p}>
          write us at{' '}
          <a href="mailto:hello@internetfc.com" style={{ color: 'var(--bright)' }}>hello@internetfc.com</a>.
          we reply within one business day.
        </p>
      </div>

      <Link to="/" className={styles.back}>&larr; back to home</Link>
    </div>
  );
}
