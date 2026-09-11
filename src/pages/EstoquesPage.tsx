import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEstoques, type EstoquesQuery, type EstoquesResponse } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatCurrency } from '../utils/format';
import styles from './list-page.module.css';

const PAGE_SIZE = 20;
type Filters = { descricao: string; produto: string; somenteComEstoque: boolean };
const initialFilters: Filters = { descricao: '', produto: '', somenteComEstoque: false };

export function EstoquesPage() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const query = useInfiniteQuery<EstoquesResponse>({
    enabled: Boolean(token),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: EstoquesQuery = { descricao: applied.descricao.trim() || undefined, produto: applied.produto ? Number(applied.produto) : undefined, somenteComEstoque: applied.somenteComEstoque, limit: PAGE_SIZE, page: pageParam as number };
      return fetchEstoques(token!, params, signal);
    },
    queryKey: ['estoques', applied],
  });
  const estoques = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return <div className={styles.page}>
    <ScreenHeader title="Estoque" subtitle={usuario?.filial.nome} onBack={() => navigate('/')} />
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setApplied(draft); }}>
      <div className={styles.field}><label htmlFor="descricao">Descrição</label><input id="descricao" value={draft.descricao} onChange={(event) => setDraft((value) => ({ ...value, descricao: event.target.value }))} placeholder="Nome do produto" /></div>
      <div className={styles.field}><label htmlFor="produto">Código</label><input id="produto" inputMode="numeric" value={draft.produto} onChange={(event) => setDraft((value) => ({ ...value, produto: event.target.value }))} placeholder="Código do produto" /></div>
      <div className={styles.checkboxField}><input id="somenteComEstoque" type="checkbox" checked={draft.somenteComEstoque} onChange={(event) => setDraft((value) => ({ ...value, somenteComEstoque: event.target.checked }))} /><label htmlFor="somenteComEstoque">Somente com estoque</label></div>
      <div className={styles.filterActions}><button type="submit">Filtrar</button></div>
    </form>
    {query.isPending ? <LoadingState message="Carregando estoque..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar o estoque.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess && estoques.length === 0 ? <EmptyState message="Nenhum produto encontrado." /> : null}
    {estoques.length > 0 ? <><ul className={styles.list}>{estoques.map((estoque) => <li className={styles.item} key={estoque.codigoProduto}><div className={styles.itemTopRow}><span className={styles.itemPrimary}>{estoque.codigoProduto} · {estoque.descricao}</span><span className={styles.itemValue}>{formatCurrency(estoque.precoVenda)}</span></div><div className={styles.itemMetaRow}><span>{estoque.unidade ?? '-'} · {estoque.filialNome}</span><span>Estoque: {estoque.estoqueAtual}</span></div></li>)}</ul><LoadMoreButton loading={query.isFetchingNextPage} loadedCount={estoques.length} onLoadMore={() => void query.fetchNextPage()} totalCount={total} /></> : null}
  </div>;
}
