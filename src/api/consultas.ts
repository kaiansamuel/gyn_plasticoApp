import { request } from './client';

type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type TelefoneCliente = {
  sequencia: number;
  ddd: string | null;
  numero: string;
  tipo: string | null;
  contato: string | null;
};

export type ClienteConsulta = {
  clienteCodigo: number;
  bloqueado: boolean;
  bloqueiaVendaPrazo: boolean;
  cnpjCpf: string | null;
  nome: string;
  razaoSocial: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  telefones: TelefoneCliente[];
};
export type ClientesResponse = PaginatedResponse<ClienteConsulta>;

export type EstoqueConsulta = {
  codigoProduto: number;
  descricao: string;
  unidade: string | null;
  precoVenda: number | null;
  precoVenda1: number | null;
  precoVenda2: number | null;
  precoVenda3: number | null;
  origemPreco: 'ESTOQUE';
  estoqueAtual: number;
  filial: number;
};
export type EstoquesResponse = PaginatedResponse<EstoqueConsulta>;

export type PedidoStatusCodigo = 'A' | 'C' | 'O' | 'D' | 'Z';

export type VendaConsulta = {
  numeroPedido: number;
  dataVenda: string;
  vendedorNome: string | null;
  clienteNome: string | null;
  valorPedido: number;
  filialNome: string;
  statusCodigo: PedidoStatusCodigo;
  statusDescricao: string;
};
export type VendasResponse = PaginatedResponse<VendaConsulta>;

export type SituacaoContaReceber = 'ABERTA' | 'PAGA' | 'VENCIDA';

export type ContaReceberConsulta = {
  numeroPedido: number;
  dataEmissao: string;
  dataVencimento: string;
  clienteNome: string | null;
  valor: number;
  situacao: SituacaoContaReceber;
  parcela: string;
};
export type ContasReceberResponse = PaginatedResponse<ContaReceberConsulta>;

export type ContaReceberDetalhe = ContaReceberConsulta & {
  vendedorNome: string | null;
  valorPago: number;
  valorRestante: number;
  filialNome: string;
};

type BaseQuery = { limit?: number; page?: number };

export type ClientesQuery = BaseQuery & { busca?: string; cidade?: string | number };
export type EstoquesQuery = BaseQuery & {
  clienteCodigo?: number;
  descricao?: string;
  produto?: number;
  somenteComEstoque?: boolean;
};
export type VendasQuery = BaseQuery & {
  cliente?: string;
  dataFinal?: string;
  dataInicial?: string;
  pedido?: number;
  status?: PedidoStatusCodigo;
  vendedor?: number;
};
export type ContasReceberQuery = BaseQuery & {
  cliente?: string;
  pedido?: number;
  situacao?: SituacaoContaReceber;
  vencimentoFinal?: string;
  vencimentoInicial?: string;
  vendedor?: number;
};

export function fetchClientes(
  token: string,
  query: ClientesQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ClienteConsulta>> {
  return request('/clientes', { params: query, signal, token });
}

export function fetchEstoques(
  token: string,
  query: EstoquesQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<EstoqueConsulta>> {
  return request('/estoques', { params: query, signal, token });
}

export type ProdutoResolvido = EstoqueConsulta;

export async function resolverProduto(token: string, identificador: string, signal?: AbortSignal): Promise<ProdutoResolvido> {
  const response = await request<{ data: ProdutoResolvido }>('/estoques/resolver', { params: { identificador }, signal, token });
  return response.data;
}

export function fetchVendas(
  token: string,
  query: VendasQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<VendaConsulta>> {
  return request('/vendas', { params: query, signal, token });
}

export function fetchContasReceber(
  token: string,
  query: ContasReceberQuery,
  signal?: AbortSignal,
): Promise<PaginatedResponse<ContaReceberConsulta>> {
  return request('/contas-receber', { params: query, signal, token });
}

export async function fetchContaReceberDetalhe(
  token: string,
  numeroPedido: number,
  parcela: string,
  signal?: AbortSignal,
): Promise<ContaReceberDetalhe> {
  const response = await request<{ data: ContaReceberDetalhe }>(
    `/contas-receber/${numeroPedido}/${encodeURIComponent(parcela)}`,
    { signal, token },
  );
  return response.data;
}
