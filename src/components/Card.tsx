import type { HTMLAttributes, ReactNode } from 'react';
import styles from './Card.module.css';

type Props = HTMLAttributes<HTMLDivElement> & { children: ReactNode };

export function Card({ children, className, ...rest }: Props) {
  return <div className={[styles.card, className].filter(Boolean).join(' ')} {...rest}>{children}</div>;
}
