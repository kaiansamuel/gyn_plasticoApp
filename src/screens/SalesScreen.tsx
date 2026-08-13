import { ArrowRight, ClipboardList, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './SalesScreen.module.css';

export function SalesScreen() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <ScreenHeader title="Vendas" onBack={() => navigate('/')} />
      <main className={styles.content}>
        <button type="button" className={styles.newSale} onClick={() => navigate('/vendas/nova-pre-venda')}>
          <span className={styles.newSaleIcon}><Plus size={24} /></span>
          <span>
            <strong>Nova pré-venda</strong>
            <small>Monte uma pré-venda para enviar à API</small>
          </span>
          <ArrowRight size={20} />
        </button>

        <section className={styles.emptyState}>
          <ClipboardList size={38} strokeWidth={1.5} />
          <h1>Pedidos e valores vendidos</h1>
          <p>A lista de vendas existentes continuará disponível aqui.</p>
        </section>
      </main>
    </div>
  );
}
