import type { CondicaoPagamento, Cliente, Parcela, Produto, Vendedor } from '../pre-venda/types';
import { request } from './client';

type Paginated<T> = { data: T[]; meta: { page: number; limit: number; total: number; totalPages: number } };
type ListOptions = { page?: number; limit?: number; busca?: string; descricao?: string; produto?: number; somenteComEstoque?: boolean };

function queryString(options: ListOptions) {
  const params = new URLSearchParams();
  params.set('page', String(options.page ?? 1));
  params.set('limit', String(options.limit ?? 20));
  for (const [key, value] of Object.entries(options)) {
    if (key !== 'page' && key !== 'limit' && value !== undefined && value !== '') params.set(key, String(value));
  }
  return `?${params.toString()}`;
}

export async function fetchClientes(token: string, options: ListOptions = {}, signal?: AbortSignal): Promise<Paginated<Cliente>> {
  const response = await request<Paginated<{ clienteCodigo: number; nome: string; razaoSocial: string | null; cnpjCpf: string | null; endereco: string | null; bairro: string | null; cidade: string | null }>>(`/clientes${queryString(options)}`, { token, signal });
  return { ...response, data: response.data.map((cliente) => ({ ...cliente, codigo: cliente.clienteCodigo })) };
}

export async function fetchProdutos(token: string, options: ListOptions = {}, signal?: AbortSignal): Promise<Paginated<Produto>> {
  const response = await request<Paginated<{ codigoProduto: number; descricao: string; unidade: string | null; precoVenda: number; estoqueAtual: number; filialNome: string }>>(`/estoques${queryString(options)}`, { token, signal });
  return { ...response, data: response.data.map((produto) => ({ ...produto, codigo: produto.codigoProduto, valorUnitario: produto.precoVenda })) };
}

export async function fetchFormasPagamento(token: string, options: ListOptions = {}, signal?: AbortSignal): Promise<Paginated<CondicaoPagamento>> {
  return request<Paginated<CondicaoPagamento>>(`/formas-pagamento${queryString(options)}`, { token, signal });
}

export async function fetchParcelas(token: string, options: ListOptions = {}, signal?: AbortSignal): Promise<Paginated<Parcela>> {
  return request<Paginated<Parcela>>(`/parcelas${queryString(options)}`, { token, signal });
}

export async function fetchVendedores(token: string, options: ListOptions = {}, signal?: AbortSignal): Promise<Paginated<Vendedor>> {
  return request<Paginated<Vendedor>>(`/vendedores${queryString(options)}`, { token, signal });
}

export type PreVendaItemPayload = {
  produtoCodigo: number;
  sequencia: number;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
  percentualDesconto: number;
};

export type CriarPreVendaPayload = {
  clienteCodigo: number;
  clienteDescricao: string;
  formaPagamentoCodigo: number;
  parcelaCodigo: number;
  data: string;
  hora: string;
  observacao: string;
  valorProdutos: number;
  valorDesconto: number;
  valorTotal: number;
  vendedorCodigo: number;
  itens: PreVendaItemPayload[];
};

export type CriarPreVendaResponse = { data: { numero: number; status: 'criada' } };

export async function createPreVenda(token: string, payload: CriarPreVendaPayload): Promise<CriarPreVendaResponse['data']> {
  const response = await request<CriarPreVendaResponse>('/pre-vendas', { method: 'POST', token, body: payload });
  return response.data;
}
