import { useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { type ClientesResponse } from '../api/consultas';
import { useAuth } from '../auth/auth-context';
import { Card } from '../components/Card';
import { EmptyState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './ClienteDetalhePage.module.css';

export function ClienteDetalhePage() {
  const { codigo } = useParams<{ codigo: string }>();
  const { token, usuario } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const cliente = queryClient.getQueriesData<InfiniteData<ClientesResponse>>({ queryKey: ['clientes', token] })
    .flatMap(([, data]) => data?.pages.flatMap((page) => page.data) ?? [])
    .find((item) => String(item.clienteCodigo) === codigo);

  return <div className={styles.page}>
    <ScreenHeader title="Detalhes do Cliente" subtitle={usuario?.filial.nome} onBack={() => navigate(`/clientes${location.search}`)} />
    {cliente ? <main className={styles.content}>
      <section aria-labelledby="dados-cliente">
        <h2 className={styles.sectionTitle} id="dados-cliente">Dados do cliente</h2>
        <Card><dl className={styles.details}>
          <Detail label="Código do cliente" value={String(cliente.clienteCodigo)} />
          <Detail label="Nome" value={cliente.nome} />
          <Detail label="Razão social" value={cliente.razaoSocial} />
          <Detail label="CPF/CNPJ" value={cliente.cnpjCpf} />
        </dl></Card>
      </section>
      <section aria-labelledby="localizacao">
        <h2 className={styles.sectionTitle} id="localizacao">Localização</h2>
        <Card><dl className={styles.details}>
          <Detail label="Endereço" value={cliente.endereco} />
          <Detail label="Bairro" value={cliente.bairro} />
          <Detail label="Cidade" value={cliente.cidade} />
        </dl></Card>
      </section>
    </main> : <EmptyState message="Dados do cliente indisponíveis nesta sessão. Volte para Clientes e abra o cliente pela listagem." />}
  </div>;
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return <div className={styles.detailRow}><dt>{label}</dt><dd>{value?.trim() || 'Não informado'}</dd></div>;
}
