import { ArrowLeft, LogOut } from 'lucide-react';
import styles from './ScreenHeader.module.css';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onLogout?: () => void;
};

export function ScreenHeader({ title, subtitle, onBack, onLogout }: ScreenHeaderProps) {
  return (
    <header className={styles.header}>
      {onBack ? (
        <button type="button" className={styles.backButton} onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={22} />
        </button>
      ) : null}
      <div className={styles.titles}>
        <p className={styles.title}>{title}</p>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
      </div>
      {onLogout ? (
        <button type="button" className={styles.logoutButton} onClick={onLogout}>
          <LogOut size={18} />
          Sair
        </button>
      ) : null}
    </header>
  );
}
