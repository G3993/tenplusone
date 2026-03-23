import styles from './Editor.module.css';

export function Editor({ children }: { children: React.ReactNode }) {
  return <div className={styles.editor}>{children}</div>;
}
