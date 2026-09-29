import { useInfiniteQuery } from '@tanstack/react-query';
import { useMutation } from '@tanstack/react-query';
import { Camera } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchEstoques, resolverProduto, type EstoquesQuery, type EstoquesResponse, type ProdutoResolvido } from '../api/consultas';
import { ApiError } from '../api/client';
import { useAuth } from '../auth/auth-context';
import { LoadMoreButton } from '../components/LoadMoreButton';
import { EmptyState, ErrorState, LoadingState } from '../components/QueryState';
import { ScreenHeader } from '../components/ScreenHeader';
import { formatCurrency } from '../utils/format';
import { scanProductIdentifier } from '../utils/barcode-scanner';
import styles from './list-page.module.css';

const PAGE_SIZE = 20;
type Filters = { clienteCodigo: string; descricao: string; produto: string; somenteComEstoque: boolean };
const initialFilters: Filters = { clienteCodigo: '', descricao: '', produto: '', somenteComEstoque: false };

export function EstoquesPage() {
  const navigate = useNavigate();
  const { token, usuario } = useAuth();
  const [produtoResolvido, setProdutoResolvido] = useState<ProdutoResolvido | null>(null);
  const resolverMutation = useMutation({ mutationFn: (identificador: string) => resolverProduto(token!, identificador) });
  const [draft, setDraft] = useState(initialFilters);
  const [applied, setApplied] = useState(initialFilters);
  const query = useInfiniteQuery<EstoquesResponse>({
    enabled: Boolean(token),
    getNextPageParam: (lastPage) => lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) => {
      const params: EstoquesQuery = { clienteCodigo: applied.clienteCodigo ? Number(applied.clienteCodigo) : undefined, descricao: applied.descricao.trim() || undefined, produto: applied.produto ? Number(applied.produto) : undefined, somenteComEstoque: applied.somenteComEstoque, limit: PAGE_SIZE, page: pageParam as number };
      return fetchEstoques(token!, params, signal);
    },
    queryKey: ['estoques', applied],
  });
  const estoques = query.data?.pages.flatMap((page) => page.data) ?? [];
  const total = query.data?.pages[0]?.meta.total ?? 0;

  async function scanProduct() {
    try {
      const identificador = await scanProductIdentifier();
      if (identificador && token) resolverMutation.mutate(identificador, { onSuccess: setProdutoResolvido });
    } catch {
      resolverMutation.reset();
    }
  }

  return <div className={styles.page}>
    <ScreenHeader title="Estoque" subtitle={usuario?.filial.nome} onBack={() => navigate('/')} />
    <form className={styles.filters} onSubmit={(event) => { event.preventDefault(); setApplied(draft); }}>
      <div className={styles.field}><label htmlFor="descricao">Descrição</label><input id="descricao" value={draft.descricao} onChange={(event) => setDraft((value) => ({ ...value, descricao: event.target.value }))} placeholder="Nome do produto" /></div>
      <div className={styles.field}><label htmlFor="clienteCodigo">Código do cliente (opcional)</label><input id="clienteCodigo" inputMode="numeric" value={draft.clienteCodigo} onChange={(event) => setDraft((value) => ({ ...value, clienteCodigo: event.target.value }))} placeholder="Código" /></div>
      <div className={styles.field}><label htmlFor="produto">Código ou identificador</label><div className={styles.scanField}><input id="produto" value={draft.produto} onChange={(event) => { setDraft((value) => ({ ...value, produto: event.target.value })); setProdutoResolvido(null); }} placeholder="Código ou código de barras" /><button type="button" aria-label="Ler código do produto com a câmera" title="Ler com a câmera" onClick={() => void scanProduct()} disabled={resolverMutation.isPending}><Camera size={21} /></button></div></div>
      <div className={styles.checkboxField}><input id="somenteComEstoque" type="checkbox" checked={draft.somenteComEstoque} onChange={(event) => setDraft((value) => ({ ...value, somenteComEstoque: event.target.checked }))} /><label htmlFor="somenteComEstoque">Somente com estoque</label></div>
      <div className={styles.filterActions}><button type="submit">Filtrar</button></div>
    </form>
    {resolverMutation.isPending ? <LoadingState message="Localizando produto..." /> : null}
    {resolverMutation.isError ? <ErrorState message={resolverMutation.error instanceof ApiError ? resolverMutation.error.message : 'Não foi possível localizar o produto.'} onRetry={() => { if (draft.produto.trim()) resolverMutation.mutate(draft.produto.trim(), { onSuccess: setProdutoResolvido }); }} /> : null}
    {produtoResolvido ? <ProductCard produto={produtoResolvido} /> : null}
    {query.isPending ? <LoadingState message="Carregando estoque..." /> : null}
    {query.isError ? <ErrorState message={query.error instanceof ApiError ? query.error.message : 'Não foi possível carregar o estoque.'} onRetry={() => void query.refetch()} /> : null}
    {query.isSuccess && estoques.length === 0 ? <EmptyState message="Nenhum produto encontrado." /> : null}
    {estoques.length > 0 ? <><ul className={styles.list}>{estoques.map((estoque) => <li className={styles.item} key={estoque.codigoProduto}><div className={styles.itemTopRow}><span className={styles.itemPrimary}>{estoque.codigoProduto} · {estoque.descricao}</span></div><div className={styles.itemMetaRow}><span>Unidade: {estoque.unidade ?? '—'} · Filial {estoque.filial}</span><span>Estoque: {estoque.estoqueAtual}</span></div><Prices prices={[estoque.precoVenda, estoque.precoVenda1, estoque.precoVenda2, estoque.precoVenda3]} /></li>)}</ul><LoadMoreButton loading={query.isFetchingNextPage} loadedCount={estoques.length} onLoadMore={() => void query.fetchNextPage()} totalCount={total} /></> : null}
  </div>;
}

function Prices({ prices }: { prices: Array<number | null> }) { return <div className={styles.priceGrid}>{prices.map((price, index) => <span key={index}>Preço {index + 1}<strong>{price === null ? '—' : formatCurrency(price)}</strong></span>)}</div>; }
function ProductCard({ produto }: { produto: ProdutoResolvido }) { return <article className={styles.resolvedProduct}><strong>{produto.descricao}</strong><span>Código {produto.codigoProduto} · {produto.unidade ?? '—'} · Estoque {produto.estoqueAtual}</span><Prices prices={[produto.precoVenda, produto.precoVenda1, produto.precoVenda2, produto.precoVenda3]} /></article>; }
