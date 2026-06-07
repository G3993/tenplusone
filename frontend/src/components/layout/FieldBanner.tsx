import { PitchField } from '../home/PitchField';
import styles from './FieldBanner.module.css';

/** Full-width perspective pitch that anchors the very bottom of the page,
 *  below the footer. */
export function FieldBanner() {
  return (
    <section className={styles.field} aria-hidden="true">
      <PitchField />
    </section>
  );
}
