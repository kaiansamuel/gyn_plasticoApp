import type { LucideIcon } from 'lucide-react';
import styles from './ModuleCard.module.css';

type ModuleCardProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
};

export function ModuleCard({ icon: Icon, title, description, onClick }: ModuleCardProps) {
  return (
    <button type="button" className={styles.card} onClick={onClick}>
      <span className={styles.iconWrap}>
        <Icon size={22} />
      </span>
      <p className={styles.title}>{title}</p>
      <p className={styles.description}>{description}</p>
    </button>
  );
}
