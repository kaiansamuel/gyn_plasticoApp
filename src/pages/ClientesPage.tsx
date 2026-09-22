import { useInfiniteQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { fetchClientes, type ClientesQuery, type ClientesResponse } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import styles from './list-page.module.css';

const PAGE_SIZE = 20;

export function ClientesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token, usuario } = useAuth();
  const busca = searchParams.get('busca') ?? '';
  const search = searchParams.toString();
  const [draft, setDraft] = useState(busca);
  const query = useInfiniteQuery<ClientesResponse>({
    enabled: Boolean(token),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: ClientesQuery = { busca: busca.trim() || undefined, limit: PAGE_SIZE, page: pageParam as number };
      return fetchClientes(token!, params, signal);
    },
    queryKey: ['clientes', token, busca],
  });
  const clientes = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  return <div className={styles.page}>
    <ScreenHeader title="Clientes" subtitle={usuario?.filial.nome} onBack={() => navigate('/')} />
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); const value = draft.trim(); setSearchParams(value ? { busca: value } : {}); }}>
      <div className={styles.field}><label htmlFor="busca">Buscar</label><input id="busca" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Nome, razão social ou CNPJ/CPF" /></div>
      <div className={styles.filterActions}><button type="submit">Filtrar</button></div>
    </form>
    {query.isPending ? <LoadingState message="Carregando clientes..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar os clientes.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess && clientes.length === 0 ? <EmptyState message="Nenhum cliente encontrado." /> : null}
    {clientes.length > 0 ? <><ul className={styles.list}>{clientes.map((cliente) => <li key={cliente.clienteCodigo}><Link className={`${styles.item} ${styles.clientLink}`} to={`/clientes/${cliente.clienteCodigo}${search ? `?${search}` : ''}`}><div className={styles.clientContent}><div className={styles.clientHeading}><span className={styles.itemPrimary}>{cliente.nome}</span>{cliente.bloqueado ? <span className={`${styles.clientBadge} ${styles.blockedBadge}`}>Bloqueado</span> : cliente.bloqueiaVendaPrazo ? <span className={`${styles.clientBadge} ${styles.termRestrictionBadge}`}>Restrição a prazo</span> : null}</div>{cliente.razaoSocial && cliente.razaoSocial !== cliente.nome ? <span className={styles.itemLine}>{cliente.razaoSocial}</span> : null}<span className={styles.itemLine}>{cliente.cnpjCpf ?? 'CNPJ/CPF não informado'}</span><div className={styles.itemMetaRow}><span>{cliente.cidade ?? 'Cidade não informada'}</span><span>{cliente.bairro ?? ''}</span></div></div><ChevronRight className={styles.clientChevron} size={20} aria-hidden="true" /></Link></li>)}</ul><LoadMoreButton loading={query.isFetchingNextPage} loadedCount={clientes.length} onLoadMore={() => void query.fetchNextPage()} totalCount={total} /></> : null}
  </div>;
}
