import type { SituacaoContaReceber } from '../api/consultas';
import styles from './StatusBadge.module.css';

const labels: Record<SituacaoContaReceber, string> = { ABERTA: 'Aberta', PAGA: 'Paga', VENCIDA: 'Vencida' };

export function StatusBadge({ situacao }: { situacao: SituacaoContaReceber }) {
  return <span className={`${styles.badge} ${styles[situacao.toLowerCase()]}`}>{labels[situacao]}</span>;
}
