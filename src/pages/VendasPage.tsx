import { useInfiniteQuery } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVendas, type PedidoStatusCodigo, type VendasQuery, type VendasResponse } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import { currentMonthStart, today } from '../utils/date-range';
import { formatCurrency, formatDate } from '../utils/format';
import styles from './list-page.module.css';

const PAGE_SIZE = 20;
const STATUS: ReadonlyArray<{ codigo: PedidoStatusCodigo; descricao: string }> = [
  { codigo: 'A', descricao: 'Faturados' }, { codigo: 'C', descricao: 'Cancelados' },
  { codigo: 'O', descricao: 'Pedidos em digitação' }, { codigo: 'D', descricao: 'Outras Remessas' },
  { codigo: 'Z', descricao: 'Outras Remessas Canceladas' },
];
type Filters = { cliente: string; dataFinal: string; dataInicial: string; pedido: string; status: PedidoStatusCodigo[]; vendedor: string };
const defaultFilters = (): Filters => ({ cliente: '', dataFinal: today(), dataInicial: currentMonthStart(), pedido: '', status: ['A'], vendedor: '' });

export function VendasPage() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [draft, setDraft] = useState<Filters>(defaultFilters);
  const [applied, setApplied] = useState<Filters>(draft);
  const query = useInfiniteQuery<VendasResponse>({
    enabled: Boolean(token),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: VendasQuery = { cliente: applied.cliente.trim() || undefined, dataFinal: applied.dataFinal, dataInicial: applied.dataInicial, pedido: applied.pedido ? Number(applied.pedido) : undefined, status: applied.status, vendedor: applied.vendedor ? Number(applied.vendedor) : undefined, limit: PAGE_SIZE, page: pageParam as number };
      return fetchVendas(token!, params, signal);
    },
    queryKey: ['vendas', applied],
  });
  const vendas = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return <div className={styles.page}>
    <ScreenHeader title="Vendas" subtitle={usuario?.filial.nome} onBack={() => navigate('/')} />
    <button className={styles.newSale} type="button" onClick={() => navigate('/vendas/nova-pre-venda')}><Plus size={20} />Nova pré-venda</button>
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setApplied(draft); }}>
      <div className={styles.field}><label htmlFor="dataInicial">Data inicial</label><input id="dataInicial" type="date" value={draft.dataInicial} onChange={(event) => setDraft((v) => ({ ...v, dataInicial: event.target.value }))} /></div>
      <div className={styles.field}><label htmlFor="dataFinal">Data final</label><input id="dataFinal" type="date" value={draft.dataFinal} onChange={(event) => setDraft((v) => ({ ...v, dataFinal: event.target.value }))} /></div>
      <div className={styles.field}><label htmlFor="pedido">Pedido</label><input id="pedido" inputMode="numeric" value={draft.pedido} onChange={(event) => setDraft((v) => ({ ...v, pedido: event.target.value }))} placeholder="Número do pedido" /></div>
      <div className={styles.field}><label htmlFor="cliente">Cliente</label><input id="cliente" value={draft.cliente} onChange={(event) => setDraft((v) => ({ ...v, cliente: event.target.value }))} placeholder="Nome do cliente" /></div>
      {usuario?.vendedor.acessoTodos ? <div className={styles.field}><label htmlFor="vendedor">Vendedor</label><input id="vendedor" inputMode="numeric" value={draft.vendedor} onChange={(event) => setDraft((v) => ({ ...v, vendedor: event.target.value }))} placeholder="Código do vendedor" /></div> : null}
      <div className={`${styles.field} ${styles.statusField}`}><label htmlFor="status">Status do pedido</label><select id="status" multiple value={draft.status} onChange={(event) => { const status = Array.from(event.target.selectedOptions, (option) => option.value as PedidoStatusCodigo); if (status.length) setDraft((v) => ({ ...v, status })); }}>{STATUS.map((option) => <option key={option.codigo} value={option.codigo}>{option.descricao}</option>)}</select><span className={styles.fieldHelp}>Use Ctrl ou toque para selecionar mais de um status.</span></div>
      <div className={styles.filterActions}><button type="submit">Filtrar</button></div>
    </form>
    {query.isPending ? <LoadingState message="Carregando vendas..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar as vendas.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess && vendas.length === 0 ? <EmptyState message="Nenhuma venda encontrada para o período informado." /> : null}
    {vendas.length > 0 ? <><ul className={styles.list}>{vendas.map((venda) => <li className={styles.item} key={venda.numeroPedido}><div className={styles.itemTopRow}><span className={styles.itemPrimary}>Pedido {venda.numeroPedido}</span><span className={styles.itemValue}>{formatCurrency(venda.valorPedido)}</span></div><span className={styles.itemStatus}>{venda.statusDescricao}</span><span className={styles.itemLine}>{venda.clienteNome ?? 'Cliente não informado'}</span><div className={styles.itemMetaRow}><span>{venda.vendedorNome ?? 'Vendedor não informado'}</span><span>{formatDate(venda.dataVenda)}</span></div><span className={styles.itemLine}>{venda.filialNome}</span></li>)}</ul><LoadMoreButton loading={query.isFetchingNextPage} loadedCount={vendas.length} onLoadMore={() => void query.fetchNextPage()} totalCount={total} /></> : null}
  </div>;
}
