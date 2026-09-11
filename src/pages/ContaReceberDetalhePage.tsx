import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchContaReceberDetalhe } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { Card } from '../components/Card';
import { ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { formatCurrency, formatDate } from '../utils/format';
import styles from './ContaReceberDetalhePage.module.css';

export function ContaReceberDetalhePage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { numeroPedido, parcela } = useParams<{ numeroPedido: string; parcela: string }>();
  const pedido = Number(numeroPedido);
  const query = useQuery({
    enabled: Boolean(token && numeroPedido && parcela && !Number.isNaN(pedido)),
    queryFn: ({ signal }) => fetchContaReceberDetalhe(token!, pedido, parcela!, signal),
    queryKey: ['conta-receber-detalhe', numeroPedido, parcela],
  });

  return <div className={styles.page}>
    <ScreenHeader title="Detalhe da conta" onBack={() => navigate(-1)} />
    {query.isPending ? <LoadingState message="Carregando detalhe..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar o detalhe da conta.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess ? <div className={styles.content}><Card><div className={styles.topRow}><span className={styles.pedido}>Pedido {query.data.numeroPedido}</span><StatusBadge situacao={query.data.situacao} /></div><span className={styles.valor}>{formatCurrency(query.data.valor)}</span><dl className={styles.detailList}><Detail label="Cliente" value={query.data.clienteNome ?? 'Não informado'} /><Detail label="Vendedor" value={query.data.vendedorNome ?? 'Não informado'} /><Detail label="Filial" value={query.data.filialNome} /><Detail label="Parcela" value={query.data.parcela} /><Detail label="Emissão" value={formatDate(query.data.dataEmissao)} /><Detail label="Vencimento" value={formatDate(query.data.dataVencimento)} /><Detail label="Valor pago" value={formatCurrency(query.data.valorPago)} /><Detail label="Valor restante" value={formatCurrency(query.data.valorRestante)} /></dl></Card></div> : null}
  </div>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className={styles.detailRow}><dt>{label}</dt><dd>{value}</dd></div>;
}
