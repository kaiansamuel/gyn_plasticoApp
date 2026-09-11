import { AlertTriangle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';
import styles from './QueryState.module.css';

export function LoadingState({ message = 'Carregando...' }: { message?: string }) {
  return <div className={styles.state} role="status"><Loader2 className={styles.spinner} size={32} /><p className={styles.message}>{message}</p></div>;
}

export function EmptyState({ message = 'Nenhum registro encontrado.' }: { message?: string }) {
  return <div className={styles.state}><Inbox size={32} /><p className={styles.message}>{message}</p></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className={styles.state} role="alert"><AlertTriangle className={styles.errorIcon} size={32} /><p className={styles.errorMessage}>{message}</p><Button onClick={onRetry} type="button" variant="outline">Tentar novamente</Button></div>;
}
