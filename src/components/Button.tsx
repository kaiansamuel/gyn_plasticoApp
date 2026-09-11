import { Loader2 } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'outline';
};

export function Button({
  children,
  className,
  disabled,
  loading = false,
  variant = 'primary',
  ...rest
}: ButtonProps) {
  const classes = [styles.button, styles[variant], className].filter(Boolean).join(' ');

  return (
    <button className={classes} disabled={disabled ?? loading} aria-busy={loading} {...rest}>
      {loading ? <Loader2 className={styles.spinner} size={20} /> : children}
    </button>
  );
}
