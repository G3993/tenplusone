import { useThemeStore } from '../../stores/theme';
import styles from './Footer.module.css';

/** Copyright + theme toggle. Sits below the field banner, at the very bottom
 *  of the page. */
export function FooterBottom() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggle);

  return (
    <div className={styles.bottom}>
      <span className={styles.copy}>&copy; 2026 internet fc</span>
      <button
        className={styles.themeBtn}
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <span className={styles.themeIcon}>{theme === 'dark' ? '☀' : '☾'}</span>
        {theme === 'dark' ? 'light mode' : 'dark mode'}
      </button>
    </div>
  );
}
