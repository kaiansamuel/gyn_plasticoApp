import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchContasReceber, type ContasReceberQuery, type ContasReceberResponse, type SituacaoContaReceber } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import { StatusBadge } from '../components/StatusBadge';
import { currentMonthEnd, currentMonthStart } from '../utils/date-range';
import { formatCurrency, formatDate } from '../utils/format';
import styles from './list-page.module.css';

const PAGE_SIZE = 20;
type Filters = { cliente: string; pedido: string; situacao: SituacaoContaReceber | ''; vencimentoFinal: string; vencimentoInicial: string; vendedor: string };
const defaultFilters = (): Filters => ({ cliente: '', pedido: '', situacao: '', vencimentoFinal: currentMonthEnd(), vencimentoInicial: currentMonthStart(), vendedor: '' });

export function ContasReceberPage() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(draft);
  const query = useInfiniteQuery<ContasReceberResponse>({
    enabled: Boolean(token),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: ContasReceberQuery = { cliente: applied.cliente.trim() || undefined, pedido: applied.pedido ? Number(applied.pedido) : undefined, situacao: applied.situacao || undefined, vencimentoFinal: applied.vencimentoFinal, vencimentoInicial: applied.vencimentoInicial, vendedor: applied.vendedor ? Number(applied.vendedor) : undefined, limit: PAGE_SIZE, page: pageParam as number };
      return fetchContasReceber(token!, params, signal);
    },
    queryKey: ['contas-receber', applied],
  });
  const contas = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return <div className={styles.page}>
    <ScreenHeader title="Contas a receber" subtitle={usuario?.filial.nome} onBack={() => navigate('/')} />
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setApplied(draft); }}>
      <div className={styles.field}><label htmlFor="vencimentoInicial">Vencimento inicial</label><input id="vencimentoInicial" type="date" value={draft.vencimentoInicial} onChange={(event) => setDraft((v) => ({ ...v, vencimentoInicial: event.target.value }))} /></div>
      <div className={styles.field}><label htmlFor="vencimentoFinal">Vencimento final</label><input id="vencimentoFinal" type="date" value={draft.vencimentoFinal} onChange={(event) => setDraft((v) => ({ ...v, vencimentoFinal: event.target.value }))} /></div>
      <div className={styles.field}><label htmlFor="pedido">Pedido</label><input id="pedido" inputMode="numeric" value={draft.pedido} onChange={(event) => setDraft((v) => ({ ...v, pedido: event.target.value }))} placeholder="Número do pedido" /></div>
      <div className={styles.field}><label htmlFor="cliente">Cliente</label><input id="cliente" value={draft.cliente} onChange={(event) => setDraft((v) => ({ ...v, cliente: event.target.value }))} placeholder="Nome do cliente" /></div>
      <div className={styles.field}><label htmlFor="situacao">Situação</label><select id="situacao" value={draft.situacao} onChange={(event) => setDraft((v) => ({ ...v, situacao: event.target.value as Filters['situacao'] }))}><option value="">Todas</option><option value="ABERTA">Aberta</option><option value="VENCIDA">Vencida</option><option value="PAGA">Paga</option></select></div>
      {usuario?.vendedor.acessoTodos ? <div className={styles.field}><label htmlFor="vendedor">Vendedor</label><input id="vendedor" inputMode="numeric" value={draft.vendedor} onChange={(event) => setDraft((v) => ({ ...v, vendedor: event.target.value }))} placeholder="Código do vendedor" /></div> : null}
      <div className={styles.filterActions}><button type="submit">Filtrar</button></div>
    </form>
    {query.isPending ? <LoadingState message="Carregando contas a receber..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar as contas a receber.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess && contas.length === 0 ? <EmptyState message="Nenhuma conta a receber encontrada para o período informado." /> : null}
    {contas.length > 0 ? <><div className={styles.list}>{contas.map((conta) => <Link className={styles.item} key={`${conta.numeroPedido}-${conta.parcela}`} to={`/contas-receber/${conta.numeroPedido}/${encodeURIComponent(conta.parcela)}`}><div className={styles.itemTopRow}><span className={styles.itemPrimary}>Pedido {conta.numeroPedido}</span><span className={styles.itemValue}>{formatCurrency(conta.valor)}</span></div><div className={styles.itemMetaRow}><span>Emissão: {formatDate(conta.dataEmissao)}</span><span>Vencimento: {formatDate(conta.dataVencimento)}</span></div><StatusBadge situacao={conta.situacao} /><span className={styles.itemLine}>{conta.clienteNome ?? 'Cliente não informado'}</span></Link>)}</div><LoadMoreButton loading={query.isFetchingNextPage} loadedCount={contas.length} onLoadMore={() => void query.fetchNextPage()} totalCount={total} /></> : null}
  </div>;
}
